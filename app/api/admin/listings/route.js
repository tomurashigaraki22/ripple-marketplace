import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyAdminToken } from '../middleware.js'

// GET - Fetch all listings for admin management
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
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')
    const search = url.searchParams.get('search')

    let whereClause = 'WHERE 1=1'
    const queryParams = []

    if (status && status !== 'all') {
      whereClause += ' AND l.status = ?'
      queryParams.push(status)
    }

    if (category && category !== 'all') {
      whereClause += ' AND l.category = ?'
      queryParams.push(category)
    }

    if (search) {
      whereClause += ' AND (l.title LIKE ? OR l.description LIKE ?)'
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    const [listings] = await db.query(
      `SELECT 
        l.id,
        l.title,
        l.description,
        l.price,
        l.category,
        l.chain,
        l.is_physical,
        l.images,
        l.tags,
        l.status,
        l.views,
        l.created_at,
        l.updated_at,
        u.username as seller,
        u.email as seller_email
       FROM listings l
       JOIN users u ON l.user_id = u.id
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    // Parse JSON fields and format data
    const formattedListings = listings.map(listing => ({
      ...listing,
      images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
      tags: typeof listing.tags === 'string' ? JSON.parse(listing.tags) : listing.tags,
      image: listing.images && listing.images.length > 0 ? listing.images[0] : null,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at
    }))

    // Get total count for pagination
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total
       FROM listings l
       JOIN users u ON l.user_id = u.id
       ${whereClause}`,
      queryParams
    )

    return NextResponse.json({
      listings: formattedListings,
      total: countResult[0].total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching admin listings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}