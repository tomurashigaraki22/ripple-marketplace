import { NextResponse } from 'next/server'
import { db } from '../../lib/db.js'
import { v4 as uuidv4 } from 'uuid'

// POST - Create a new order (purchase) - Fixed schema compatibility
export async function POST(request) {
  try {
    const { listing_id, amount, wallet_address, shipping_info } = await request.json()

    // Validate required fields (removed order_type since it's not in schema)
    if (!listing_id || !amount || !wallet_address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify listing exists and is approved
    const [listings] = await db.query(
      'SELECT * FROM listings WHERE id = ? AND status = "approved"',
      [listing_id]
    )

    if (listings.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found or not available' },
        { status: 404 }
      )
    }

    const listing = listings[0]

    // Validate purchase amount
    if (parseFloat(amount) !== parseFloat(listing.price)) {
      return NextResponse.json(
        { error: 'Purchase amount must match listing price' },
        { status: 400 }
      )
    }

    // Create a default buyer for anonymous orders
    let buyer_id = null
    
    // Try to find user by wallet address
    const [walletUsers] = await db.query(
      'SELECT user_id FROM wallet_addresses WHERE address = ?',
      [wallet_address]
    )
    
    if (walletUsers.length > 0) {
      buyer_id = walletUsers[0].user_id
    } else {
      // Create anonymous buyer entry
      buyer_id = uuidv4()
      
      // Create a temporary user for anonymous orders
      const anonymousUsername = `anonymous_${Date.now()}`
      const anonymousEmail = `${buyer_id}@anonymous.local`
      
      await db.query(
        `INSERT INTO users (id, username, email, password, role_id, status) 
         VALUES (?, ?, ?, ?, 1, 'active')`,
        [buyer_id, anonymousUsername, anonymousEmail, 'anonymous']
      )
      
      // Add wallet address for this anonymous user
      await db.query(
        `INSERT INTO wallet_addresses (id, user_id, chain, address, is_primary) 
         VALUES (?, ?, 'evm', ?, true)`,
        [uuidv4(), buyer_id, wallet_address]
      )
    }

    // Create order using actual schema columns
    const orderId = uuidv4()
    const [result] = await db.query(
      `INSERT INTO orders (
        id,
        listing_id, 
        buyer_id, 
        seller_id, 
        amount, 
        status, 
        shipping_address,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        orderId,
        listing_id,
        buyer_id,
        listing.user_id,
        amount,
        'paid', // Set to paid since we're skipping payment
        shipping_info ? JSON.stringify(shipping_info) : null
      ]
    )

    // Update listing status to sold
    await db.query(
      'UPDATE listings SET status = "sold" WHERE id = ?',
      [listing_id]
    )

    // Get the created order
    const [orders] = await db.query(
      `SELECT o.*, l.title as listing_title
       FROM orders o
       JOIN listings l ON o.listing_id = l.id
       WHERE o.id = ?`,
      [orderId]
    )

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: orders[0]
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}

// GET - Fetch orders for a user
export async function GET(request) {
  try {
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get('wallet')
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page')) || 1
    const limit = parseInt(url.searchParams.get('limit')) || 10
    const offset = (page - 1) * limit

    let query = `
      SELECT 
        o.*,
        l.title as listing_title,
        l.images as listing_images,
        l.price as listing_price,
        seller.username as seller_username
      FROM orders o
      JOIN listings l ON o.listing_id = l.id
      JOIN users seller ON o.seller_id = seller.id
    `
    
    const queryParams = []
    const conditions = []

    if (walletAddress) {
      // Find user by wallet address
      const [walletUsers] = await db.query(
        'SELECT user_id FROM wallet_addresses WHERE address = ?',
        [walletAddress]
      )
      
      if (walletUsers.length > 0) {
        conditions.push('o.buyer_id = ?')
        queryParams.push(walletUsers[0].user_id)
      } else {
        // No orders for this wallet
        return NextResponse.json({
          orders: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        })
      }
    }

    if (status) {
      conditions.push('o.status = ?')
      queryParams.push(status)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?'
    queryParams.push(limit, offset)

    const [orders] = await db.query(query, queryParams)

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM orders o'
    const countParams = []
    
    if (walletAddress) {
      const [walletUsers] = await db.query(
        'SELECT user_id FROM wallet_addresses WHERE address = ?',
        [walletAddress]
      )
      
      if (walletUsers.length > 0) {
        countQuery += ' WHERE o.buyer_id = ?'
        countParams.push(walletUsers[0].user_id)
      }
    }
    
    if (status && countParams.length > 0) {
      countQuery += ' AND o.status = ?'
      countParams.push(status)
    } else if (status) {
      countQuery += ' WHERE o.status = ?'
      countParams.push(status)
    }

    const [countResult] = await db.query(countQuery, countParams)
    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    // Format orders
    const formattedOrders = orders.map(order => ({
      ...order,
      listing_images: typeof order.listing_images === 'string' 
        ? JSON.parse(order.listing_images) 
        : order.listing_images,
      shipping_address: typeof order.shipping_address === 'string'
        ? JSON.parse(order.shipping_address)
        : order.shipping_address
    }))

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}