import { NextResponse } from 'next/server'
import { db } from '../../lib/db.js'

// GET - Fetch all approved listings for marketplace
export async function GET(request) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit')) || 8 // Changed from 10 to 8
    const page = parseInt(url.searchParams.get('page')) || 1
    const offset = (page - 1) * limit
    const category = url.searchParams.get('category')
    const chain = url.searchParams.get('chain')
    const isPhysical = url.searchParams.get('isPhysical')
    const search = url.searchParams.get('search')
    const sortBy = url.searchParams.get('sortBy') || 'recent'

    let whereClause = 'WHERE l.status = "approved" AND l.status != "sold"'
    const queryParams = []

    if (category && category !== 'all') {
      whereClause += ' AND l.category = ?'
      queryParams.push(category)
    }

    if (chain && chain !== 'all') {
      whereClause += ' AND l.chain = ?'
      queryParams.push(chain)
    }

    if (isPhysical && isPhysical !== 'all') {
      whereClause += ' AND l.is_physical = ?'
      queryParams.push(isPhysical === 'physical')
    }

    if (search) {
      whereClause += ' AND (l.title LIKE ? OR l.description LIKE ?)'
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    // Determine sort order
    let orderClause = 'ORDER BY l.created_at DESC'
    switch (sortBy) {
      case 'price_low':
        orderClause = 'ORDER BY l.price ASC'
        break
      case 'price_high':
        orderClause = 'ORDER BY l.price DESC'
        break
      case 'popular':
        orderClause = 'ORDER BY l.views DESC'
        break
      case 'recent':
      default:
        orderClause = 'ORDER BY l.created_at DESC'
        break
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
        l.views,
        l.created_at,
        l.updated_at,
        u.username as seller_username,
        u.id as seller_id
       FROM listings l
       JOIN users u ON l.user_id = u.id
       ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    // Get total count for pagination
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total
       FROM listings l
       JOIN users u ON l.user_id = u.id
       ${whereClause}`,
      queryParams
    )

    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    // Format listings
    const formattedListings = listings.map(listing => ({
      ...listing,
      images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
      tags: typeof listing.tags === 'string' ? JSON.parse(listing.tags) : listing.tags
    }))

    return NextResponse.json({
      listings: formattedListings,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasMore: page < totalPages,
        hasPrevious: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching marketplace listings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}