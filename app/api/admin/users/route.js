import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyAdminToken } from '../middleware.js'

// GET - Fetch all users for admin management
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
    const role = url.searchParams.get('role')
    const membership = url.searchParams.get('membership')
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status')

    let whereClause = 'WHERE 1=1'
    const queryParams = []

    if (role && role !== 'all') {
      whereClause += ' AND r.name = ?'
      queryParams.push(role)
    }

    if (membership && membership !== 'all') {
      whereClause += ' AND mt.name = ?'
      queryParams.push(membership)
    }

    if (status && status !== 'all') {
      whereClause += ' AND u.status = ?'
      queryParams.push(status)
    }

    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)'
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    const [users] = await db.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.status,
        u.created_at,
        u.updated_at,
        r.name as role,
        mt.name as membershipTier
       FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN membership_tiers mt ON u.membership_tier_id = mt.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    // Get total count for pagination
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total
       FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN membership_tiers mt ON u.membership_tier_id = mt.id
       ${whereClause}`,
      queryParams
    )

    return NextResponse.json({
      users,
      total: countResult[0].total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(countResult[0].total / limit)
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}