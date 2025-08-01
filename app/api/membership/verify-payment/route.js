import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyUserAccess } from '../../../utils/auth.js'
import { v4 as uuidv4 } from 'uuid'
import { generateRandomPassword } from '../../../lib/schema.js'
import nodemailer from 'nodemailer'

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  })
}

const sendStorefrontCredentialsEmail = async (email, credentials) => {
  const transporter = createEmailTransporter()
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Your Ripple Marketplace Storefront Access',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #39FF14;">Welcome to Ripple Marketplace Storefront!</h2>
        <p>Congratulations on your membership upgrade! You now have access to the storefront dashboard.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Storefront Login Credentials:</h3>
          <p><strong>Email:</strong> ${credentials.email}</p>
          <p><strong>Password:</strong> ${credentials.password}</p>
          <p><strong>Access URL:</strong> ${process.env.NEXT_PUBLIC_BASE_URL}/storefront</p>
          <p><strong>Expires:</strong> ${new Date(credentials.expires_at).toLocaleDateString()}</p>
        </div>
        
        <p style="color: #666;">Please keep these credentials secure and change your password after first login.</p>
        <p style="color: #666;">If you have any questions, please contact our support team.</p>
      </div>
    `
  }
  
  await transporter.sendMail(mailOptions)
}

// POST - Verify payment and activate membership
export async function POST(request) {
  try {
    const authResult = await verifyUserAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { 
      tierName, 
      transactionHash, 
      paymentMethod, 
      amount, 
      currency,
      paymentUrl,
      verified = false,
      xummUuid 
    } = await request.json()

    if (!tierName || !transactionHash || !paymentMethod) {
      return NextResponse.json(
        { error: 'Tier name, transaction hash, and payment method are required' },
        { status: 400 }
      )
    }

    // Get membership tier by name
    const [tiers] = await db.query(
      'SELECT * FROM membership_tiers WHERE name = ?',
      [tierName.toLowerCase()]
    )

    if (tiers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid membership tier' },
        { status: 400 }
      )
    }

    const tier = tiers[0]

    // Check for existing active membership
    const [existingMemberships] = await db.query(
      'SELECT * FROM user_memberships WHERE user_id = ? AND is_active = TRUE',
      [authResult.user.id]
    )

    let expiresAt
    let isFirstTimeMember = existingMemberships.length === 0

    if (existingMemberships.length > 0) {
      // User has existing membership - extend by 1 month
      const currentExpiry = new Date(existingMemberships[0].expires_at)
      const now = new Date()
      
      // If current membership hasn't expired, extend from current expiry
      // Otherwise, extend from now
      const baseDate = currentExpiry > now ? currentExpiry : now
      expiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000) // Add 30 days
    } else {
      // New membership - 30 days from now
      expiresAt = tierName.toLowerCase() === 'basic' ? null : 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }

    // Start database transaction
    await db.query('START TRANSACTION')

    try {
      if (existingMemberships.length > 0) {
        // Update existing membership expiry
        await db.query(
          'UPDATE user_memberships SET expires_at = ?, membership_tier_id = ? WHERE user_id = ? AND is_active = TRUE',
          [expiresAt, tier.id, authResult.user.id]
        )
      } else {
        // Deactivate any old memberships and create new one
        await db.query(
          'UPDATE user_memberships SET is_active = FALSE WHERE user_id = ?',
          [authResult.user.id]
        )

        const membershipId = uuidv4()
        await db.query(
          `INSERT INTO user_memberships 
           (id, user_id, membership_tier_id, price, transaction_hash, expires_at, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
          [membershipId, authResult.user.id, tier.id, amount || tier.price, transactionHash, expiresAt]
        )
      }

      // Update user's current membership tier
      await db.query(
        'UPDATE users SET membership_tier_id = ? WHERE id = ?',
        [tier.id, authResult.user.id]
      )

      // Handle storefront credentials for paid tiers
      let storefrontCredentials = null
      let emailSent = false
      
      if (tierName.toLowerCase() !== 'basic') {
        const [users] = await db.query(
          'SELECT email FROM users WHERE id = ?',
          [authResult.user.id]
        )

        if (users.length > 0) {
          const userEmail = users[0].email

          // Check if storefront login already exists
          const [existingStorefront] = await db.query(
            'SELECT id, email, generated_password FROM storefront_logins WHERE user_id = ?',
            [authResult.user.id]
          )

          if (existingStorefront.length === 0) {
            // Generate new storefront credentials for first-time member
            const storefrontId = uuidv4()
            const generatedPassword = generateRandomPassword(16)

            await db.query(
              `INSERT INTO storefront_logins 
               (id, user_id, email, generated_password, expires_at, expired) 
               VALUES (?, ?, ?, ?, ?, FALSE)`,
              [storefrontId, authResult.user.id, userEmail, generatedPassword, expiresAt]
            )

            storefrontCredentials = {
              email: userEmail,
              password: generatedPassword,
              expires_at: expiresAt
            }

            // Send email for first-time members
            if (isFirstTimeMember) {
              try {
                await sendStorefrontCredentialsEmail(userEmail, storefrontCredentials)
                emailSent = true
              } catch (emailError) {
                console.error('Failed to send storefront credentials email:', emailError)
                // Don't fail the entire transaction for email errors
              }
            }
          } else {
            // Update existing storefront login expiry
            await db.query(
              'UPDATE storefront_logins SET expires_at = ?, expired = FALSE WHERE user_id = ?',
              [expiresAt, authResult.user.id]
            )

            storefrontCredentials = {
              email: existingStorefront[0].email,
              password: existingStorefront[0].generated_password,
              expires_at: expiresAt
            }
          }
        }
      }

      // Commit transaction
      await db.query('COMMIT')

      return NextResponse.json({
        success: true,
        message: existingMemberships.length > 0 ? 
          'Membership extended successfully' : 
          'Payment verified and membership activated successfully',
        membership: {
          tier: tier.name,
          expiresAt: expiresAt,
          isExtension: existingMemberships.length > 0
        },
        storefrontCredentials,
        emailSent,
        isFirstTimeMember,
        paymentDetails: {
          transactionHash,
          paymentMethod,
          amount,
          currency,
          paymentUrl,
          verified,
          xummUuid
        }
      }, { status: 201 })

    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}