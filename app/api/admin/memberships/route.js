import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyAdminToken } from '../middleware.js'

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