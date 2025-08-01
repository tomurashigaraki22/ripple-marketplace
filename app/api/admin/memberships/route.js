import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyAdminToken } from '../middleware.js'
import { v4 as uuidv4 } from 'uuid'
import { generateRandomPassword } from '../../../lib/schema.js'
import nodemailer from 'nodemailer'

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    family: 4, // Force IPv4
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

const sendMembershipGrantedEmail = async (email, membershipData) => {
  const transporter = createEmailTransporter()
  
  const { username, tierName, months, expiresAt, storefrontCredentials, isFirstTimeMember } = membershipData
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `🎉 Congratulations! You've been granted ${tierName.toUpperCase()} membership access`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #39FF14 0%, #00d4aa 100%); padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #000000; text-shadow: none;">🎉 Welcome to RippleBids ${tierName.toUpperCase()}!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; color: #000000; opacity: 0.8;">Your premium membership has been activated</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #39FF14; font-size: 24px; margin: 0 0 10px 0;">Hello ${username}! 👋</h2>
            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0;">Great news! An administrator has granted you <strong style="color: #39FF14;">${months} months</strong> of <strong style="color: #39FF14;">${tierName.toUpperCase()} membership</strong> access to RippleBids.</p>
          </div>
          
          <!-- Membership Details -->
          <div style="background: rgba(57, 255, 20, 0.1); border: 2px solid #39FF14; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <h3 style="color: #39FF14; margin: 0 0 20px 0; font-size: 20px;">📋 Membership Details</h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #cccccc;">Membership Tier:</span>
                <span style="color: #39FF14; font-weight: bold;">${tierName.toUpperCase()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #cccccc;">Duration:</span>
                <span style="color: #ffffff; font-weight: bold;">${months} months</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #cccccc;">Expires On:</span>
                <span style="color: #ffffff; font-weight: bold;">${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #cccccc;">Status:</span>
                <span style="color: #39FF14; font-weight: bold;">✅ ACTIVE</span>
              </div>
            </div>
          </div>
          
          ${storefrontCredentials ? `
          <!-- Storefront Access -->
          <div style="background: rgba(138, 43, 226, 0.1); border: 2px solid #8a2be2; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <h3 style="color: #8a2be2; margin: 0 0 20px 0; font-size: 20px;">🏪 Storefront Access ${isFirstTimeMember ? '(NEW!)' : ''}</h3>
            <p style="color: #cccccc; margin: 0 0 20px 0; line-height: 1.6;">Your ${tierName.toUpperCase()} membership includes access to our exclusive storefront dashboard where you can manage your listings, track sales, and access premium features.</p>
            
            <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #8a2be2; margin: 0 0 15px 0; font-size: 16px;">🔐 Your Login Credentials:</h4>
              <div style="font-family: 'Courier New', monospace; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 6px; margin: 10px 0;">
                <div style="margin: 8px 0;"><strong style="color: #8a2be2;">Email:</strong> <span style="color: #ffffff;">${storefrontCredentials.email}</span></div>
                <div style="margin: 8px 0;"><strong style="color: #8a2be2;">Password:</strong> <span style="color: #39FF14;">${storefrontCredentials.password}</span></div>
                <div style="margin: 8px 0;"><strong style="color: #8a2be2;">Login URL:</strong> <a href="https://ripplebids.com/storefront/login" style="color: #39FF14; text-decoration: none;">https://ripplebids.com/storefront/login</a></div>
              </div>
            </div>
            
            <div style="background: rgba(255, 193, 7, 0.1); border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #ffc107; font-size: 14px;">🔒 <strong>Security Note:</strong> Please keep these credentials secure and consider changing your password after your first login for enhanced security.</p>
            </div>
          </div>
          ` : ''}
          
          <!-- Benefits Section -->
          <div style="margin: 30px 0;">
            <h3 style="color: #39FF14; margin: 0 0 20px 0; font-size: 20px;">🚀 Your ${tierName.toUpperCase()} Benefits Include:</h3>
            <div style="display: grid; gap: 12px;">
              ${tierName.toLowerCase() === 'pro' ? `
              <div style="display: flex; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <span style="color: #39FF14; margin-right: 12px; font-size: 18px;">📊</span>
                <span style="color: #ffffff;">Advanced Analytics & Insights</span>
              </div>
              <div style="display: flex; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <span style="color: #39FF14; margin-right: 12px; font-size: 18px;">💰</span>
                <span style="color: #ffffff;">Reduced Transaction Fees</span>
              </div>
              <div style="display: flex; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <span style="color: #39FF14; margin-right: 12px; font-size: 18px;">⭐</span>
                <span style="color: #ffffff;">Up to 25 Listings with 3 Featured Spots</span>
              </div>
              <div style="display: flex; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <span style="color: #39FF14; margin-right: 12px; font-size: 18px;">🎯</span>
                <span style="color: #ffffff;">Priority Customer Support</span>
              </div>
              ` : `
              <div style="display: flex; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <span style="color: #39FF14; margin-right: 12px; font-size: 18px;">🏆</span>
                <span style="color: #ffffff;">Unlimited Listings with 10 Featured Spots</span>
              </div>
              <div style="display: flex; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <span style="color: #39FF14; margin-right: 12px; font-size: 18px;">📈</span>
                <span style="color: #ffffff;">Premium Analytics & Market Insights</span>
              </div>
              <div style="display: flex; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <span style="color: #39FF14; margin-right: 12px; font-size: 18px;">💎</span>
                <span style="color: #ffffff;">Lowest Transaction Fees</span>
              </div>
              <div style="display: flex; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <span style="color: #39FF14; margin-right: 12px; font-size: 18px;">🎯</span>
                <span style="color: #ffffff;">VIP Priority Support</span>
              </div>
              <div style="display: flex; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <span style="color: #39FF14; margin-right: 12px; font-size: 18px;">🔥</span>
                <span style="color: #ffffff;">Exclusive Premium Features</span>
              </div>
              `}
            </div>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://ripplebids.com${storefrontCredentials ? '/storefront/login' : '/marketplace'}" style="display: inline-block; background: linear-gradient(135deg, #39FF14 0%, #00d4aa 100%); color: #000000; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 8px 20px rgba(57, 255, 20, 0.3); transition: all 0.3s ease;">
              ${storefrontCredentials ? '🏪 Access Your Storefront' : '🛍️ Start Shopping'}
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: rgba(0,0,0,0.3); padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="color: #888888; margin: 0 0 15px 0; font-size: 14px;">Need help? We're here for you!</p>
          <div style="margin: 20px 0;">
            <a href="mailto:support@ripplebids.com" style="color: #39FF14; text-decoration: none; margin: 0 15px; font-size: 14px;">📧 support@ripplebids.com</a>
            <a href="https://ripplebids.com" style="color: #39FF14; text-decoration: none; margin: 0 15px; font-size: 14px;">🌐 ripplebids.com</a>
          </div>
          <p style="color: #666666; margin: 20px 0 0 0; font-size: 12px;">© 2024 RippleBids. All rights reserved.</p>
        </div>
      </div>
    `
  }
  
  try {
    await transporter.sendMail(mailOptions)
    console.log('Membership granted email sent successfully')
    return { success: true }
  } catch (error) {
    console.error('Failed to send membership granted email:', error)
    return { success: false, error: error.message }
  }
}

// GET - Fetch all memberships for admin management
export async function GET(request) {
  try {
    const authResult = await verifyAdminToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit')) || 50
    const offset = parseInt(url.searchParams.get('offset')) || 0
    const tier = url.searchParams.get('tier')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')

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

    const [memberships] = await db.query(
      `SELECT 
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
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    // Get total count for pagination
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total
       FROM user_memberships um
       JOIN users u ON um.user_id = u.id
       JOIN membership_tiers mt ON um.membership_tier_id = mt.id
       ${whereClause}`,
      queryParams
    )

    const total = countResult[0].total

    return NextResponse.json({
      memberships,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching memberships:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Grant membership to user (admin only)
export async function POST(request) {
  try {
    const authResult = await verifyAdminToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { userId, tierName, months } = await request.json()

    if (!userId || !tierName || !months) {
      return NextResponse.json(
        { error: 'User ID, tier name, and months are required' },
        { status: 400 }
      )
    }

    // Validate tier name
    if (!['pro', 'premium'].includes(tierName.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid tier name. Must be pro or premium' },
        { status: 400 }
      )
    }

    // Validate months
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
      // Deactivate current active memberships
      await db.query(
        'UPDATE user_memberships SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE',
        [userId]
      )

      // Create new membership record
      const membershipId = uuidv4()
      await db.query(
        `INSERT INTO user_memberships 
         (id, user_id, membership_tier_id, price, transaction_hash, expires_at, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [membershipId, userId, tier.id, 0, 'ADMIN_GRANTED', expiresAt]
      )

      // Update user's current membership tier
      await db.query(
        'UPDATE users SET membership_tier_id = ? WHERE id = ?',
        [tier.id, userId]
      )

      // Check if storefront login already exists
      const [existingStorefront] = await db.query(
        'SELECT id FROM storefront_logins WHERE user_id = ?',
        [userId]
      )

      let storefrontCredentials = null
      let isFirstTimeMember = false

      if (existingStorefront.length === 0) {
        // Generate new storefront credentials
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
        // Update existing storefront login expiration
        await db.query(
          'UPDATE storefront_logins SET expires_at = ?, expired = FALSE WHERE user_id = ?',
          [expiresAt, userId]
        )
        
        // Get existing credentials for email
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

      // Send comprehensive email
      let emailSent = false
      // In the POST method, after granting membership:
      try {
  const emailResult = await sendMembershipGrantedEmail(user.email, {
    username: user.username,
    tierName: tier.name,
    months: months,
    expiresAt: expiresAt,
    storefrontCredentials: storefrontCredentials,
    isFirstTimeMember: isFirstTimeMember
  })
  console.log("Enauk Result: ", emailResult)
  
  if (emailResult.success) {
    return NextResponse.json({ 
      message: 'Membership granted successfully and email sent',
      emailSent: true 
    }, { status: 200 })
  } else {
    return NextResponse.json({ 
      message: 'Membership granted successfully but email failed to send',
      emailSent: false,
      emailError: emailResult.error
    }, { status: 200 })
  }
} catch (error) {
  console.error('Error granting membership:', error)
  return NextResponse.json({ 
    message: 'Error granting membership', 
    error: error.message 
  }, { status: 500 })
}

      return NextResponse.json({
        success: true,
        message: `Successfully granted ${months} months of ${tierName} membership to ${user.username}`,
        membership: {
          id: membershipId,
          userId: userId,
          username: user.username,
          email: user.email,
          tierName: tier.name,
          months: months,
          expiresAt: expiresAt,
          storefrontCredentials,
          isFirstTimeMember,
          emailSent
        }
      })

    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Error granting membership:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
