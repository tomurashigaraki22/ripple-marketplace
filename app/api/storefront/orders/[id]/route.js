import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db.js'
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

// PATCH - Update order status and shipping information
export async function PATCH(request, { params }) {
  try {
    const authResult = await verifyStorefrontAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const orderId = await params?.id
    const body = await request.json()
    const { status, tracking_number, shipping_carrier, shipping_notes } = body

    // Verify the order belongs to the user's listings
    const [orderCheck] = await db.query(
      `SELECT o.id, o.status as current_status, l.user_id
       FROM orders o
       JOIN listings l ON o.listing_id = l.id
       WHERE o.id = ? AND l.user_id = ?`,
      [orderId, authResult.user.id]
    )

    if (orderCheck.length === 0) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
    }

    // Build update query dynamically
    const updateFields = []
    const updateValues = []

    if (status) {
      updateFields.push('status = ?')
      updateValues.push(status)
      
      // Add timestamps for status changes
      if (status === 'shipped') {
        updateFields.push('shipped_at = ?')
        updateValues.push(new Date())
      } else if (status === 'delivered') {
        updateFields.push('delivered_at = ?')
        updateValues.push(new Date())
      }
    }

    if (tracking_number !== undefined) {
      updateFields.push('tracking_number = ?')
      updateValues.push(tracking_number)
    }

    if (shipping_carrier !== undefined) {
      updateFields.push('shipping_carrier = ?')
      updateValues.push(shipping_carrier)
    }

    if (shipping_notes !== undefined) {
      updateFields.push('shipping_notes = ?')
      updateValues.push(shipping_notes)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Add updated_at
    updateFields.push('updated_at = ?')
    updateValues.push(new Date())
    updateValues.push(orderId)

    await db.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    return NextResponse.json({ success: true, message: 'Order updated successfully' })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get specific order details
export async function GET(request, { params }) {
  try {
    const authResult = await verifyStorefrontAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const orderId = params.id

    // Get order details
    const [order] = await db.query(
      `SELECT 
        o.id,
        o.amount,
        o.status,
        o.tracking_number,
        o.shipping_carrier,
        o.shipping_notes,
        o.transaction_hash,
        o.shipping_address,
        o.created_at,
        o.updated_at,
        l.id as listing_id,
        l.title as listing_title,
        l.price as listing_price,
        l.images as listing_images,
        l.description as listing_description,
        buyer.username as buyer_username,
        buyer.email as buyer_email
       FROM orders o
       JOIN listings l ON o.listing_id = l.id
       JOIN users buyer ON o.buyer_id = buyer.id
       WHERE o.id = ? AND l.user_id = ?`,
      [orderId, authResult.user.id]
    )

    if (order.length === 0) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
    }

    const formattedOrder = {
      ...order[0],
      amount: parseFloat(order[0].amount),
      listing_price: parseFloat(order[0].listing_price),
      listing_images: order[0].listing_images ? JSON.parse(order[0].listing_images) : [],
      shipping_address: order[0].shipping_address ? JSON.parse(order[0].shipping_address) : null
    }

    return NextResponse.json({
      success: true,
      order: formattedOrder
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}