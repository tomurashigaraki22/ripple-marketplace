import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { sendPromotionalEmail, sendBulkEmails, validateEmail } from '../../../lib/emailHelper.js'
import { verifyAdminAccess } from '../../../utils/auth.js'

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
      subject, 
      message, 
      recipients, // 'all' or 'selected'
      selectedUserIds = [],
      includeImages = false,
      scheduledFor = null 
    } = await request.json()

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    let emailList = []

    if (recipients === 'all') {
      // Get all registered users with email notifications enabled
      const [users] = await db.query(`
        SELECT id, email, username, settings 
        FROM users 
        WHERE email IS NOT NULL 
        AND email != ''
      `)

      emailList = users
        .filter(user => {
          try {
            const settings = JSON.parse(user.settings || '{}')
            const emailNotifications = settings.emailNotifications || {}
            return emailNotifications.promotions !== false // Default to true
          } catch {
            return true // Default to true if settings parsing fails
          }
        })
        .map(user => ({
          userId: user.id,
          userEmail: user.email,
          username: user.username,
          subject,
          message,
          includeImages
        }))
    } else if (recipients === 'selected' && selectedUserIds.length > 0) {
      // Get selected users
      const placeholders = selectedUserIds.map(() => '?').join(',')
      const [users] = await db.query(`
        SELECT id, email, username, settings 
        FROM users 
        WHERE id IN (${placeholders})
        AND email IS NOT NULL 
        AND email != ''
      `, selectedUserIds)

      emailList = users
        .filter(user => {
          try {
            const settings = JSON.parse(user.settings || '{}')
            const emailNotifications = settings.emailNotifications || {}
            return emailNotifications.promotions !== false
          } catch {
            return true
          }
        })
        .map(user => ({
          userId: user.id,
          userEmail: user.email,
          username: user.username,
          subject,
          message,
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

    // Log the email campaign
    const [campaignResult] = await db.query(`
      INSERT INTO email_campaigns (subject, message, recipient_count, created_by, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [subject, message, emailList.length, authResult.user.id])

    const campaignId = campaignResult.insertId

    // Send emails
    const emailPromises = emailList.map(emailData => 
      sendPromotionalEmail({
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

    return NextResponse.json({
      success: true,
      campaignId,
      totalRecipients: emailList.length,
      sentCount: successCount,
      failedCount: failureCount,
      message: `Email campaign sent to ${successCount} recipients`
    })

  } catch (error) {
    console.error('Error sending promotional emails:', error)
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

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const limit = parseInt(url.searchParams.get('limit')) || 10
    const offset = (page - 1) * limit

    const [campaigns] = await db.query(`
      SELECT 
        ec.*,
        u.username as created_by_username
      FROM email_campaigns ec
      LEFT JOIN users u ON ec.created_by = u.id
      ORDER BY ec.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset])

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM email_campaigns'
    )
    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Error fetching email campaigns:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}