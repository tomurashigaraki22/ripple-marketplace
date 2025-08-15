import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyAdminToken } from '../middleware.js'
import { v4 as uuidv4 } from 'uuid'
import { generateRandomPassword } from '../../../lib/schema.js'
import nodemailer from 'nodemailer'
import { logAuditAction, getClientIP, getUserAgent, AUDIT_ACTIONS, TARGET_TYPES } from '../../../utils/auditLogger.js'

// Email configuration
const createEmailTransporter = () => {
  try {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    })
  } catch (error) {
    console.error('Error creating email transporter:', error)
    throw error
  }
}

// Simplified email function
const sendMembershipGrantedEmail = async (email, membershipData) => {
  try {
    const transporter = createEmailTransporter()
    const { username, tierName, months, expiresAt, storefrontCredentials, isFirstTimeMember } = membershipData
    
    // Create storefront credentials section
    const storefrontSection = storefrontCredentials ? `
      <div style="background: #2a2a2a; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="color: #8a2be2; margin: 0 0 15px 0;">🏪 Storefront Access ${isFirstTimeMember ? '(NEW!)' : ''}</h3>
        <p style="color: #cccccc; margin: 0 0 15px 0;">Your ${tierName.toUpperCase()} membership includes storefront access.</p>
        <div style="background: #1a1a1a; padding: 15px; border-radius: 6px;">
          <p style="margin: 5px 0; color: #ffffff;"><strong>Email:</strong> ${storefrontCredentials.email}</p>
          <p style="margin: 5px 0; color: #ffffff;"><strong>Password:</strong> ${storefrontCredentials.password}</p>
          <p style="margin: 5px 0; color: #ffffff;"><strong>Login:</strong> <a href="https://ripplebids.com/storefront/login" style="color: #39FF14;">https://ripplebids.com/storefront/login</a></p>
        </div>
      </div>
    ` : ''
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `🎉 ${tierName.toUpperCase()} Membership Granted - RippleBids`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #39FF14 0%, #00d4aa 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #000000; font-size: 28px;">🎉 Welcome to RippleBids ${tierName.toUpperCase()}!</h1>
            <p style="margin: 10px 0 0 0; color: #000000; opacity: 0.8;">Your premium membership is now active</p>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #39FF14; margin: 0 0 15px 0;">Hello ${username}! 👋</h2>
            <p style="color: #cccccc; line-height: 1.6;">Great news! An administrator has granted you <strong style="color: #39FF14;">${months} months</strong> of <strong style="color: #39FF14;">${tierName.toUpperCase()} membership</strong> access.</p>
            
            <div style="background: rgba(57, 255, 20, 0.1); border: 2px solid #39FF14; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #39FF14; margin: 0 0 15px 0;">📋 Membership Details</h3>
              <p style="margin: 5px 0; color: #ffffff;"><strong>Tier:</strong> ${tierName.toUpperCase()}</p>
              <p style="margin: 5px 0; color: #ffffff;"><strong>Duration:</strong> ${months} months</p>
              <p style="margin: 5px 0; color: #ffffff;"><strong>Expires:</strong> ${new Date(expiresAt).toLocaleDateString()}</p>
              <p style="margin: 5px 0; color: #ffffff;"><strong>Status:</strong> ✅ ACTIVE</p>
            </div>
            
            ${storefrontSection}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://ripplebids.com/marketplace" style="display: inline-block; background: linear-gradient(135deg, #39FF14 0%, #00d4aa 100%); color: #000000; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 5px;">🛍️ Explore Marketplace</a>
              ${storefrontCredentials ? '<a href="https://ripplebids.com/storefront/login" style="display: inline-block; background: linear-gradient(135deg, #8a2be2 0%, #4b0082 100%); color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 5px;">🏪 Access Storefront</a>' : ''}
            </div>
          </div>
          
          <div style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
            <p style="margin: 0; color: #cccccc; font-size: 14px;">Thank you for being part of RippleBids!</p>
          </div>
        </div>
      `
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', result.messageId)
    return result
  } catch (error) {
    console.error('Error sending membership email:', error)
    throw error
  }
}

// GET - Fetch memberships
export async function GET(request) {
  try {
    console.log('GET /api/admin/memberships - Starting')
    
    // Verify admin token
    const authResult = await verifyAdminToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit')) || 50
    const offset = parseInt(url.searchParams.get('offset')) || 0
    const tier = url.searchParams.get('tier')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')

    // Build WHERE clause
    let whereClause = 'WHERE 1=1'
    const queryParams = []

    if (tier && tier !== 'all') {
      whereClause += ' AND mt.name = ?'
      queryParams.push(tier)
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        whereClause += ' AND um.is_active = TRUE AND (um.expires_at IS NULL OR um.expires_at > NOW())'
      } else if (status === 'expired') {
        whereClause += ' AND (um.is_active = FALSE OR um.expires_at < NOW())'
      }
    }

    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)'
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    // Main query
    const mainQuery = `
      SELECT 
        um.id,
        um.user_id,
        um.price,
        um.transaction_hash,
        um.expires_at,
        um.is_active,
        um.created_at,
        u.username,
        u.email as user_email,
        mt.name as tier_name,
        mt.features
      FROM user_memberships um
      JOIN users u ON um.user_id = u.id
      JOIN membership_tiers mt ON um.membership_tier_id = mt.id
      ${whereClause}
      ORDER BY um.created_at DESC
      LIMIT ? OFFSET ?
    `
    
    const [memberships] = await db.query(mainQuery, [...queryParams, limit, offset])

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM user_memberships um
      JOIN users u ON um.user_id = u.id
      JOIN membership_tiers mt ON um.membership_tier_id = mt.id
      ${whereClause}
    `
    
    const [countResult] = await db.query(countQuery, queryParams)
    const total = countResult[0].total

    const response = {
      memberships,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
    
    console.log('GET /api/admin/memberships - Success')
    return NextResponse.json(response)

  } catch (error) {
    console.error('GET /api/admin/memberships - Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memberships', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Grant membership
export async function POST(request) {
  try {
    console.log('POST /api/admin/memberships - Starting')
    
    // Verify admin token
    const authResult = await verifyAdminToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Parse request body
    const body = await request.json()
    const { userId, tierName, months } = body

    // Validate input
    if (!userId || !tierName || !months) {
      return NextResponse.json(
        { error: 'User ID, tier name, and months are required' },
        { status: 400 }
      )
    }

    if (!['pro', 'premium'].includes(tierName.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid tier name. Must be pro or premium' },
        { status: 400 }
      )
    }

    if (months < 1 || months > 120) {
      return NextResponse.json(
        { error: 'Months must be between 1 and 120' },
        { status: 400 }
      )
    }

    // Get user details
    const [users] = await db.query(
      'SELECT id, email, username FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]

    // Get membership tier
    const [tiers] = await db.query(
      'SELECT id, name, price FROM membership_tiers WHERE name = ?',
      [tierName.toLowerCase()]
    )

    if (tiers.length === 0) {
      return NextResponse.json(
        { error: 'Membership tier not found' },
        { status: 404 }
      )
    }

    const tier = tiers[0]

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + parseInt(months))

    // Start transaction
    await db.query('START TRANSACTION')

    try {
      // Deactivate current memberships
      await db.query(
        'UPDATE user_memberships SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE',
        [userId]
      )

      // Create new membership
      const membershipId = uuidv4()
      await db.query(
        `INSERT INTO user_memberships 
         (id, user_id, membership_tier_id, price, transaction_hash, expires_at, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [membershipId, userId, tier.id, 0, 'ADMIN_GRANTED', expiresAt]
      )

      // Update user membership tier
      await db.query(
        'UPDATE users SET membership_tier_id = ? WHERE id = ?',
        [tier.id, userId]
      )

      // Handle storefront login
      const [existingStorefront] = await db.query(
        'SELECT id FROM storefront_logins WHERE user_id = ?',
        [userId]
      )

      let storefrontCredentials = null
      let isFirstTimeMember = false

      if (existingStorefront.length === 0) {
        // Create new storefront credentials
        const storefrontId = uuidv4()
        const generatedPassword = generateRandomPassword(16)

        await db.query(
          `INSERT INTO storefront_logins 
           (id, user_id, email, generated_password, expires_at, expired) 
           VALUES (?, ?, ?, ?, ?, FALSE)`,
          [storefrontId, userId, user.email, generatedPassword, expiresAt]
        )

        storefrontCredentials = {
          email: user.email,
          password: generatedPassword,
          expiresAt: expiresAt
        }
        isFirstTimeMember = true
      } else {
        // Update existing storefront login
        await db.query(
          'UPDATE storefront_logins SET expires_at = ?, expired = FALSE WHERE user_id = ?',
          [expiresAt, userId]
        )
        
        const [existingCreds] = await db.query(
          'SELECT email, generated_password FROM storefront_logins WHERE user_id = ?',
          [userId]
        )
        
        if (existingCreds.length > 0) {
          storefrontCredentials = {
            email: existingCreds[0].email,
            password: existingCreds[0].generated_password,
            expiresAt: expiresAt
          }
        }
      }

      // Commit transaction
      await db.query('COMMIT')

      // Prepare membership data for email
      const membershipData = {
        username: user.username,
        tierName: tier.name,
        months: months,
        expiresAt: expiresAt,
        storefrontCredentials,
        isFirstTimeMember
      }

      // Send email
      let emailSent = false
      try {
        await sendMembershipGrantedEmail(user.email, membershipData)
        emailSent = true
      } catch (emailError) {
        console.error('Failed to send membership email:', emailError)
        // Continue even if email fails
      }

      // Log audit action
      try {
        await logAuditAction({
          adminId: authResult.user.id,
          action: AUDIT_ACTIONS.USER_MEMBERSHIP_GRANTED,
          targetType: TARGET_TYPES.USER,
          targetId: userId,
          details: {
            username: user.username,
            email: user.email,
            tierName: tier.name,
            months,
            expiresAt,
            isFirstTimeMember,
            emailSent
          },
          ipAddress: getClientIP(request),
          userAgent: getUserAgent(request)
        })
      } catch (auditError) {
        console.error('Failed to log audit action:', auditError)
        // Continue even if audit logging fails
      }

      const response = {
        message: 'Membership granted successfully',
        membership: {
          id: membershipId,
          tier: tier.name,
          expiresAt,
          isFirstTimeMember,
          emailSent
        }
      }
      
      console.log('POST /api/admin/memberships - Success')
      return NextResponse.json(response)

    } catch (transactionError) {
      console.error('Transaction error, rolling back:', transactionError)
      await db.query('ROLLBACK')
      throw transactionError
    }

  } catch (error) {
    console.error('POST /api/admin/memberships - Error:', error)
    return NextResponse.json(
      { error: 'Failed to grant membership', details: error.message },
      { status: 500 }
    )
  }
}