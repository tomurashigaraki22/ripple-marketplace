import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyUserAccess } from '../../../utils/auth.js'

// GET - Get current user's active membership
export async function GET(request) {
  try {
    const authResult = await verifyUserAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Get user's current membership tier and active membership
    const [userMembership] = await db.query(
      `SELECT 
        u.id as user_id,
        u.username,
        u.email,
        mt.id as tier_id,
        mt.name as tier_name,
        mt.price as tier_price,
        mt.features as tier_features,
        um.id as membership_id,
        um.expires_at,
        um.is_active,
        um.created_at as membership_start_date
       FROM users u
       JOIN membership_tiers mt ON u.membership_tier_id = mt.id
       LEFT JOIN user_memberships um ON u.id = um.user_id AND um.is_active = TRUE
       WHERE u.id = ?`,
      [authResult.user.id]
    )

    if (userMembership.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const membership = userMembership[0]
    
    // Parse features if it's a string
    let features = membership.tier_features
    if (typeof features === 'string') {
      try {
        features = JSON.parse(features)
      } catch (e) {
        features = {}
      }
    }

    return NextResponse.json({
      currentMembership: {
        user: {
          id: membership.user_id,
          username: membership.username,
          email: membership.email
        },
        tier: {
          id: membership.tier_id,
          name: membership.tier_name,
          price: parseFloat(membership.tier_price),
          features: features
        },
        membership: {
          id: membership.membership_id,
          isActive: membership.is_active,
          expiresAt: membership.expires_at,
          startDate: membership.membership_start_date
        }
      }
    })

  } catch (error) {
    console.error('Error fetching current membership:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}