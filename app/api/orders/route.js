import { NextResponse } from 'next/server'
import { db } from '../../lib/db.js'
import { v4 as uuidv4 } from 'uuid'
import { verifyUserAccess } from '../../utils/auth.js'

// POST - Create a new order (purchase) - Fixed schema compatibility
export async function POST(request) {
  try {
    const { listing_id, amount, order_type, buyer_id, shipping_info, escrow_id, transaction_hash, payment_chain } = await request.json();

    if (!listing_id || !amount || !order_type || !buyer_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get listing details
    const [listings] = await db.query('SELECT * FROM listings WHERE id = ?', [listing_id]);
    if (listings.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const listing = listings[0];
    const orderId = uuidv4();
    
    // Create order with escrow information
    const orderData = {
      id: orderId,
      listing_id,
      buyer_id: buyer_id, // Use buyer_id from frontend
      seller_id: listing.user_id, // Seller from listing
      amount: parseFloat(amount),
      transaction_hash: transaction_hash || null,
      status: escrow_id ? 'escrow_funded' : 'pending',
      shipping_address: shipping_info ? JSON.stringify(shipping_info) : null,
      escrow_id: escrow_id || null, // Store escrow_id
      payment_chain: payment_chain || null, // Store payment_chain
      order_type: order_type || 'purchase', // Store order_type
      created_at: new Date()
    };

    await db.query(
      `INSERT INTO orders (id, listing_id, buyer_id, seller_id, amount, transaction_hash, status, shipping_address, escrow_id, payment_chain, order_type, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderData.id, orderData.listing_id, orderData.buyer_id, orderData.seller_id, 
       orderData.amount, orderData.transaction_hash, orderData.status, orderData.shipping_address, 
       orderData.escrow_id, orderData.payment_chain, orderData.order_type, orderData.created_at]
    );

    // Mark listing as sold when order is created with escrow
    if (escrow_id) {
      await db.query(
        'UPDATE listings SET status = ? WHERE id = ?',
        ['sold', listing_id]
      );
      
      await db.query(
        'UPDATE escrows SET status = ? WHERE id = ?',
        ['funded', escrow_id]
      );
      console.log(`📧 Seller notification: New escrow order ${orderId} for listing ${listing_id}`);
    }

    return NextResponse.json({ 
      success: true, 
      order: orderData,
      message: escrow_id ? 'Escrow order created successfully' : 'Order created successfully'
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch orders for a user
export async function GET(request) {
  try {
    // Verify user authentication and get user ID from token
    const authResult = await verifyUserAccess(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.id;
    const url = new URL(request.url)
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
      WHERE o.buyer_id = ?
    `
    
    const queryParams = [userId]

    if (status) {
      query += ' AND o.status = ?'
      queryParams.push(status)
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?'
    queryParams.push(limit, offset)

    const [orders] = await db.query(query, queryParams)

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM orders o WHERE o.buyer_id = ?'
    const countParams = [userId]
    
    if (status) {
      countQuery += ' AND o.status = ?'
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