import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Verify storefront user access
async function verifyStorefrontAccess(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided', status: 401 }
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET)

    // Verify user exists and has storefront access
    const [users] = await db.query(
      `SELECT u.id, u.username, u.email, u.status, u.membership_tier_id,
              mt.name as membership_tier, mt.features
       FROM users u
       JOIN membership_tiers mt ON u.membership_tier_id = mt.id
       WHERE u.id = ? AND u.status = 'active'`,
      [decoded.userId]
    )

    if (users.length === 0) {
      return { error: 'User not found or inactive', status: 404 }
    }

    return { user: users[0] }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}

// GET - Fetch user's orders (as seller)
export async function GET(request) {
  try {
    const authResult = await verifyStorefrontAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit')) || 20
    const offset = parseInt(url.searchParams.get('offset')) || 0
    const status = url.searchParams.get('status')

    const userId = authResult.user.id

    // Build query conditions
    let whereClause = 'WHERE l.user_id = ?'
    const queryParams = [userId]

    if (status && status !== 'all') {
      whereClause += ' AND o.status = ?'
      queryParams.push(status)
    }

    // Get orders for user's listings
    const [orders] = await db.query(
      `SELECT 
        o.id,
        o.amount,
        o.status,
        o.transaction_hash,
        o.shipping_address,
        o.created_at,
        o.updated_at,
        l.id as listing_id,
        l.title as listing_title,
        l.price as listing_price,
        l.images as listing_images,
        buyer.username as buyer_username,
        buyer.email as buyer_email
       FROM orders o
       JOIN listings l ON o.listing_id = l.id
       JOIN users buyer ON o.buyer_id = buyer.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    // Get total count for pagination
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total
       FROM orders o
       JOIN listings l ON o.listing_id = l.id
       ${whereClause}`,
      queryParams
    )

    const total = countResult[0].total

    // Format orders
    const formattedOrders = orders.map(order => ({
      ...order,
      amount: parseFloat(order.amount),
      listing_price: parseFloat(order.listing_price),
      listing_images: order.listing_images ? JSON.parse(order.listing_images) : [],
      shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null
    }))

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching storefront orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}