import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyUserAccess } from '../../../utils/auth.js'

// GET - Fetch membership tiers with user's current status
export async function GET(request) {
  try {
    const authResult = await verifyUserAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Get all membership tiers
    const [tiers] = await db.query('SELECT * FROM membership_tiers ORDER BY price ASC')
    
    // Get user's current membership tier
    const [userTier] = await db.query(
      `SELECT mt.name as current_tier 
       FROM users u 
       JOIN membership_tiers mt ON u.membership_tier_id = mt.id 
       WHERE u.id = ?`,
      [authResult.user.id]
    )

    const currentTierName = userTier.length > 0 ? userTier[0].current_tier : 'basic'

    // Add status to each tier
    const tiersWithStatus = tiers.map(tier => {
      let features = tier.features
      if (typeof features === 'string') {
        try {
          features = JSON.parse(features)
        } catch (e) {
          features = {}
        }
      }

      return {
        id: tier.id,
        name: tier.name,
        price: parseFloat(tier.price),
        features: features,
        isCurrent: tier.name === currentTierName,
        isUpgrade: tier.price > 0 && (currentTierName === 'basic' || 
          (currentTierName === 'pro' && tier.name === 'premium')),
        isDowngrade: (currentTierName === 'premium' && tier.name !== 'premium') ||
          (currentTierName === 'pro' && tier.name === 'basic'),
        created_at: tier.created_at
      }
    })

    return NextResponse.json({
      membershipTiers: tiersWithStatus,
      currentTier: currentTierName
    })

  } catch (error) {
    console.error('Error fetching membership tiers with status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}