import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import jwt from 'jsonwebtoken'

export async function GET(request) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const status = searchParams.get('status')
    const chain = searchParams.get('chain')
    const offset = (page - 1) * limit

    // Build WHERE clause for filtering
    let whereClause = ''
    const queryParams = []
    
    if (status && status !== 'all') {
      whereClause += ' AND o.status = ?'
      queryParams.push(status)
    }
    
    if (chain && chain !== 'all') {
      whereClause += ' AND l.chain = ?'
      queryParams.push(chain)
    }

    // Fetch orders with related data
    const ordersQuery = `
      SELECT 
        o.id,
        o.buyer_id,
        o.seller_id,
        o.listing_id,
        o.amount,
        o.transaction_hash,
        o.status,
        o.shipping_address,
        o.created_at,
        o.updated_at,
        buyer.username as buyer_username,
        buyer.email as buyer_email,
        seller.username as seller_username,
        seller.email as seller_email,
        l.title as listing_title,
        l.description as listing_description,
        l.chain,
        l.category
      FROM orders o
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      JOIN listings l ON o.listing_id = l.id
      WHERE 1=1 ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `

    queryParams.push(limit, offset)
    const [orders] = await db.query(ordersQuery, queryParams)

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      JOIN listings l ON o.listing_id = l.id
      WHERE 1=1 ${whereClause}
    `
    
    const countParams = queryParams.slice(0, -2) // Remove limit and offset
    const [countResult] = await db.query(countQuery, countParams)
    const total = countResult[0].total

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        ...order,
        shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}