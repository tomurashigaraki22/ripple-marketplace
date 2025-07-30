import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyUserAccess } from '../../../utils/auth.js'
import { v4 as uuidv4 } from 'uuid'
import { generateRandomPassword } from '../../../lib/schema.js'

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

    // Calculate expiry date (30 days from now for paid tiers)
    const expiresAt = tierName.toLowerCase() === 'basic' ? null : 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Start database transaction
    await db.query('START TRANSACTION')

    try {
      // Deactivate current active memberships
      await db.query(
        'UPDATE user_memberships SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE',
        [authResult.user.id]
      )

      // Create new membership record
      const membershipId = uuidv4()
      await db.query(
        `INSERT INTO user_memberships 
         (id, user_id, membership_tier_id, price, transaction_hash, expires_at, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [membershipId, authResult.user.id, tier.id, amount || tier.price, transactionHash, expiresAt]
      )

      // Update user's current membership tier
      await db.query(
        'UPDATE users SET membership_tier_id = ? WHERE id = ?',
        [tier.id, authResult.user.id]
      )

      // Handle storefront credentials for paid tiers
      let storefrontCredentials = null
      if (tierName.toLowerCase() !== 'basic') {
        const [users] = await db.query(
          'SELECT email FROM users WHERE id = ?',
          [authResult.user.id]
        )

        if (users.length > 0) {
          const userEmail = users[0].email

          // Check if storefront login already exists
          const [existingStorefront] = await db.query(
            'SELECT id FROM storefront_logins WHERE user_id = ?',
            [authResult.user.id]
          )

          if (existingStorefront.length === 0) {
            // Generate new storefront credentials
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
          } else {
            // Update existing storefront login expiry
            await db.query(
              'UPDATE storefront_logins SET expires_at = ?, expired = FALSE WHERE user_id = ?',
              [expiresAt, authResult.user.id]
            )

            // Get existing credentials
            const [storefrontData] = await db.query(
              'SELECT email, generated_password, expires_at FROM storefront_logins WHERE user_id = ?',
              [authResult.user.id]
            )

            storefrontCredentials = {
              email: storefrontData[0].email,
              password: storefrontData[0].generated_password,
              expires_at: storefrontData[0].expires_at
            }
          }
        }
      }

      // Commit transaction
      await db.query('COMMIT')

      return NextResponse.json({
        success: true,
        message: 'Payment verified and membership activated successfully',
        membership: {
          id: membershipId,
          tier: tier.name,
          expiresAt: expiresAt
        },
        storefrontCredentials,
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