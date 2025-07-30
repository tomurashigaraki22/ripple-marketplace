import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db.js'
import jwt from 'jsonwebtoken'

export async function GET(request, { params }) {
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

    const orderId = params.id

    // Fetch specific order with all related data
    const orderQuery = `
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
        l.category,
        l.images
      FROM orders o
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      JOIN listings l ON o.listing_id = l.id
      WHERE o.id = ?
    `

    const [orders] = await db.query(orderQuery, [orderId])
    
    if (orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orders[0]
    
    return NextResponse.json({
      success: true,
      order: {
        ...order,
        shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null,
        images: order.images ? JSON.parse(order.images) : []
      }
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
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

    const orderId = params.id
    const { status, transaction_hash, shipping_address } = await request.json()

    // Validate status
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Build update query dynamically
    const updateFields = []
    const updateValues = []
    
    if (status) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }
    
    if (transaction_hash) {
      updateFields.push('transaction_hash = ?')
      updateValues.push(transaction_hash)
    }
    
    if (shipping_address) {
      updateFields.push('shipping_address = ?')
      updateValues.push(JSON.stringify(shipping_address))
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(orderId)

    const updateQuery = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `

    const [result] = await db.query(updateQuery, updateValues)
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Fetch updated order
    const [updatedOrder] = await db.query(`
      SELECT 
        o.*,
        buyer.username as buyer_username,
        seller.username as seller_username,
        l.title as listing_title
      FROM orders o
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      JOIN listings l ON o.listing_id = l.id
      WHERE o.id = ?
    `, [orderId])

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: {
        ...updatedOrder[0],
        shipping_address: updatedOrder[0].shipping_address ? JSON.parse(updatedOrder[0].shipping_address) : null
      }
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
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

    const orderId = params.id

    // Check if order exists
    const [existingOrder] = await db.query('SELECT id FROM orders WHERE id = ?', [orderId])
    
    if (existingOrder.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Delete the order
    await db.query('DELETE FROM orders WHERE id = ?', [orderId])

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}