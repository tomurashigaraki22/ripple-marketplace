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

// GET - Fetch user's escrows (as seller)
export async function GET(request) {
  try {
    const authResult = await verifyStorefrontAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit')) || 50
    const offset = parseInt(url.searchParams.get('offset')) || 0
    const status = url.searchParams.get('status')

    // First, get the storefront's orders that have escrow_id
    let orderQuery = `
      SELECT o.*, 
             l.title as listing_title,
             l.price as listing_price,
             l.images as listing_images
      FROM orders o
      JOIN listings l ON o.listing_id = l.id
      WHERE o.seller_id = ? AND o.escrow_id IS NOT NULL
    `
    let orderParams = [authResult.user.id]

    orderQuery += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?'
    orderParams.push(limit, offset)

    const [orders] = await db.query(orderQuery, orderParams)

    if (orders.length === 0) {
      return NextResponse.json({ 
        escrows: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      })
    }

    // Get escrow_ids from orders
    const escrowIds = orders.map(order => order.escrow_id)
    const escrowPlaceholders = escrowIds.map(() => '?').join(',')

    // Now get escrow details for these escrow_ids
    let escrowQuery = `
      SELECT e.*
      FROM escrows e
      WHERE e.id IN (${escrowPlaceholders})
    `
    let escrowParams = [...escrowIds]

    if (status) {
      escrowQuery += ' AND e.status = ?'
      escrowParams.push(status)
    }

    escrowQuery += ' ORDER BY e.created_at DESC'

    const [escrows] = await db.query(escrowQuery, escrowParams)

    // Combine escrow data with order data
    const combinedData = escrows.map(escrow => {
      const relatedOrder = orders.find(order => order.escrow_id === escrow.id)
      return {
        ...escrow,
        order_id: relatedOrder?.id,
        listing_title: relatedOrder?.listing_title,
        listing_price: relatedOrder?.listing_price,
        listing_images: relatedOrder?.listing_images,
        order_amount: relatedOrder?.amount,
        transaction_hash: relatedOrder?.transaction_hash,
        payment_chain: relatedOrder?.payment_chain
      }
    })

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM orders o 
      WHERE o.seller_id = ? AND o.escrow_id IS NOT NULL
    `
    let countParams = [authResult.user.id]
    
    if (status) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM escrows e 
        WHERE e.id = o.escrow_id AND e.status = ?
      )`
      countParams.push(status)
    }

    const [countResult] = await db.query(countQuery, countParams)
    const total = countResult[0].total

    return NextResponse.json({
      escrows: combinedData,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching storefront escrows:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}