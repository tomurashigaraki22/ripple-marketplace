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
    const role = url.searchParams.get('role')
    const membership = url.searchParams.get('membership')
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status')
    const getAllUsers = url.searchParams.get('all') === 'true' // New parameter to get all users

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
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.id LIKE ?)'
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    let limitClause = ''
    if (!getAllUsers) {
      // Only apply pagination if not requesting all users
      const limit = parseInt(url.searchParams.get('limit')) || 50
      const offset = parseInt(url.searchParams.get('offset')) || 0
      limitClause = 'LIMIT ? OFFSET ?'
      queryParams.push(limit, offset)
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
       ${limitClause}`,
      queryParams
    )

    // Get total count for pagination (only if not getting all users)
    if (!getAllUsers) {
      const [countResult] = await db.query(
        `SELECT COUNT(*) as total
         FROM users u
         JOIN roles r ON u.role_id = r.id
         JOIN membership_tiers mt ON u.membership_tier_id = mt.id
         ${whereClause}`,
        queryParams.slice(0, -2) // Remove limit and offset from count query
      )

      const limit = parseInt(url.searchParams.get('limit')) || 50
      const offset = parseInt(url.searchParams.get('offset')) || 0

      return NextResponse.json({
        users,
        total: countResult[0].total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(countResult[0].total / limit)
      })
    }

    // Return all users without pagination info
    return NextResponse.json({
      users,
      total: users.length
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}