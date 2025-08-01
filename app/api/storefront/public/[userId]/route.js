import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db.js'

// GET - Fetch public storefront data for a user by userId
export async function GET(request, { params }) {
  try {
    // Await params to fix Next.js 15 async issue
    const { userId } = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user info by userId instead of username
   const [users] = await db.query(
  `SELECT u.id, u.username, u.email, u.created_at
   FROM users u
   WHERE u.id = ? AND u.status = 'active'`,
  [userId]
);
console.log("users: ", users);


    if (users.length === 0) {
      return NextResponse.json({ error: 'Storefront not found' }, { status: 404 })
    }

    const user = users[0]
    
    // Get user's listings
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit')) || 20
    const offset = parseInt(url.searchParams.get('offset')) || 0
    const category = url.searchParams.get('category')
    const search = url.searchParams.get('search')

    let listingsQuery = `
      SELECT id, title, description, price, category, chain, is_physical, 
             images, tags, views, created_at, updated_at
      FROM listings 
      WHERE user_id = ? AND status = 'approved'
    `
    let listingsParams = [user.id]

    if (category) {
      listingsQuery += ' AND category = ?'
      listingsParams.push(category)
    }

    if (search) {
      listingsQuery += ' AND (title LIKE ? OR description LIKE ?)'
      listingsParams.push(`%${search}%`, `%${search}%`)
    }

    listingsQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    listingsParams.push(limit, offset)

    const [listings] = await db.query(listingsQuery, listingsParams)

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM listings WHERE user_id = ? AND status = "approved"'
    let countParams = [userId]
    
    if (category) {
      countQuery += ' AND category = ?'
      countParams.push(category)
    }
    
    if (search) {
      countQuery += ' AND (title LIKE ? OR description LIKE ?)'
      countParams.push(`%${search}%`, `%${search}%`)
    }

    const [countResult] = await db.query(countQuery, countParams)
    const total = countResult[0].total

    // Get storefront stats
    const [statsResult] = await db.query(
      `SELECT 
         COUNT(*) as total_listings,
         SUM(views) as total_views,
         AVG(price) as avg_price
       FROM listings 
       WHERE user_id = ? AND status = 'approved'`,
      [user.id]
    )

    const stats = statsResult[0]

    return NextResponse.json({
      storefront: {
        userId: user.id,
        username: user.username,
        memberSince: user.created_at,
        stats: {
          totalListings: stats.total_listings || 0,
          totalViews: stats.total_views || 0,
          averagePrice: parseFloat(stats.avg_price || 0)
        }
      },
      listings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching public storefront:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}