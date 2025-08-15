import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { sendPromotionalEmail, sendBulkEmails, validateEmail } from '../../../lib/emailHelper.js'
import { verifyAdminAccess } from '../../../utils/auth.js'
import { promotionalTemplate } from '../../../lib/emailTemplates/promotionalTemplate.js'
import { newsletterTemplate } from '../../../lib/emailTemplates/newsletterTemplate.js'
import { logAuditAction, getClientIP, getUserAgent, AUDIT_ACTIONS, TARGET_TYPES } from '../../../utils/auditLogger.js'

// POST - Send promotional emails
export async function POST(request) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { 
      templateType = 'promotional',
      subject, 
      message, // Keep for backward compatibility
      recipients, // 'all' or 'selected'
      selectedUserIds = [],
      includeImages = false,
      scheduledFor = null,
      // Promotional template fields
      title,
      subtitle,
      content,
      ctaText,
      ctaUrl,
      // Newsletter template fields
      date,
      newsletterContent
    } = await request.json()

    // Validate required fields based on template type
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      )
    }

    let templateData = {}
    let emailFunction = null

    if (templateType === 'promotional') {
      if (!title || !content) {
        return NextResponse.json(
          { error: 'Title and content are required for promotional emails' },
          { status: 400 }
        )
      }
      
      templateData = {
        subject,
        title,
        subtitle,
        content,
        ctaText,
        ctaUrl,
        unsubscribeUrl: '#' // You can implement this later
      }
      
      emailFunction = sendPromotionalEmail
    } else if (templateType === 'newsletter') {
      if (!newsletterContent) {
        return NextResponse.json(
          { error: 'Newsletter content is required' },
          { status: 400 }
        )
      }
      
      templateData = {
        subject,
        date: date || new Date().toLocaleDateString(),
        content: newsletterContent,
        unsubscribeUrl: '#' // You can implement this later
      }
      
      emailFunction = sendNewsletterEmail
    } else {
      // Fallback to old message system for backward compatibility
      if (!message) {
        return NextResponse.json(
          { error: 'Message is required' },
          { status: 400 }
        )
      }
      templateData = { subject, message }
      emailFunction = sendPromotionalEmail
    }

    let emailList = []

    if (recipients === 'all') {
      // Get all registered users
      const [users] = await db.query(`
        SELECT id, email, username
        FROM users 
        WHERE email IS NOT NULL 
        AND email != ''
      `)

      emailList = users
        .map(user => ({
          userId: user.id,
          userEmail: user.email,
          username: user.username,
          ...templateData, // Spread the template data directly
          templateType,
          includeImages
        }))
    } else if (recipients === 'selected' && selectedUserIds.length > 0) {
      // Get selected users
      const placeholders = selectedUserIds.map(() => '?').join(',')
      const [users] = await db.query(`
        SELECT id, email, username 
        FROM users 
        WHERE id IN (${placeholders})
        AND email IS NOT NULL 
        AND email != ''
      `, selectedUserIds)

      emailList = users
        .map(user => ({
          userId: user.id,
          userEmail: user.email,
          username: user.username,
          ...templateData, // Spread the template data directly
          templateType,
          includeImages
        }))
    } else {
      return NextResponse.json(
        { error: 'Invalid recipients selection' },
        { status: 400 }
      )
    }

    if (emailList.length === 0) {
      return NextResponse.json(
        { error: 'No eligible recipients found' },
        { status: 400 }
      )
    }

    // Log the email campaign with template info
    const campaignMessage = templateType === 'promotional' ? 
      `${title}: ${content.substring(0, 100)}...` : 
      templateType === 'newsletter' ? 
        `Newsletter: ${newsletterContent.substring(0, 100)}...` : 
        message

    const [campaignResult] = await db.query(`
      INSERT INTO email_campaigns (subject, message, recipient_count, created_by, created_at, template_type)
      VALUES (?, ?, ?, ?, NOW(), ?)
    `, [subject, campaignMessage, emailList.length, authResult.user.id, templateType])

    const campaignId = campaignResult.insertId

    // Send emails using the appropriate email function
    const emailPromises = emailList.map(emailData => 
      emailFunction({
        ...emailData,
        campaignId
      })
    )

    const results = await Promise.allSettled(emailPromises)
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length
    const failureCount = results.length - successCount

    // Update campaign with results
    await db.query(`
      UPDATE email_campaigns 
      SET sent_count = ?, failed_count = ?, completed_at = NOW()
      WHERE id = ?
    `, [successCount, failureCount, campaignId])

    // After successful email sending, add audit logging
    const emailResult = await sendBulkEmails({
      recipients: emailList,
      subject,
      htmlContent: emailHtml,
      templateType,
      scheduledFor
    })

    // Log audit action
    await logAuditAction({
      adminId: authResult.user.id,
      action: recipients === 'all' ? AUDIT_ACTIONS.BULK_EMAIL_SENT : AUDIT_ACTIONS.EMAIL_SENT,
      targetType: TARGET_TYPES.EMAIL,
      targetId: null,
      details: {
        templateType,
        subject,
        recipientType: recipients,
        recipientCount: emailList.length,
        selectedUserIds: recipients === 'selected' ? selectedUserIds : null,
        scheduledFor,
        emailResult
      },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request)
    })

    return NextResponse.json({
      message: scheduledFor ? 'Email scheduled successfully' : 'Emails sent successfully',
      result: emailResult
    })

  } catch (error) {
    console.error('Error sending emails:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get email campaign history
export async function GET(request) {
  try {
    const authResult = await verifyAdminAccess(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const [campaigns] = await db.query(`
      SELECT 
        ec.*,
        u.username as created_by_username
      FROM email_campaigns ec
      LEFT JOIN users u ON ec.created_by = u.id
      ORDER BY ec.created_at DESC
    `)

    return NextResponse.json({
      campaigns,
    })

  } catch (error) {
    console.error('Error fetching email campaigns:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}