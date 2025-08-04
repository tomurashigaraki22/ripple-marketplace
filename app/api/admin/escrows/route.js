import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyUserAccess } from '../../../utils/auth.js'

export async function GET(request) {
  try {
    const user = await verifyUserAccess(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (user?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all escrows with pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const offset = (page - 1) * limit

    const [escrows] = await db.query(
      `SELECT 
        e.*,
        o.id as order_id,
        o.status as order_status,
        l.title as listing_title
       FROM escrows e
       LEFT JOIN orders o ON e.id = o.escrow_id
       LEFT JOIN listings l ON o.listing_id = l.id
       ORDER BY e.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    // Get total count
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM escrows')
    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      escrows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Error fetching admin escrows:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}