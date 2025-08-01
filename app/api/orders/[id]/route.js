import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'

// PATCH - Update order status (for buyer delivery confirmation)
export async function PATCH(request, { params }) {
  try {
    // Fix: Await the entire params object first
    const resolvedParams = await params
    const orderId = resolvedParams.id
    console.log("Order ID: ", orderId)
    const { status, buyer_id } = await request.json()

    console.log("Updating order:", { orderId, status, buyer_id })

    // Check if order exists
    const [orderExists] = await db.query(
      'SELECT id, status as current_status, buyer_id FROM orders WHERE id = ?',
      [orderId]
    )

    if (orderExists.length === 0) {
      console.log("Order not found:", orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log("Found order:", orderExists[0])

    // Allow marking as delivered without buyer_id verification
    if (status === 'delivered') {
      await db.query(
        'UPDATE orders SET status = ?, delivered_at = ?, updated_at = ? WHERE id = ?',
        [status, new Date(), new Date(), orderId]
      )

      return NextResponse.json({ success: true, message: 'Order marked as delivered' })
    }

    // For other status updates, verify buyer access
    if (buyer_id) {
      const [orderCheck] = await db.query(
        'SELECT id FROM orders WHERE id = ? AND buyer_id = ?',
        [orderId, buyer_id]
      )

      if (orderCheck.length === 0) {
        console.log("Access denied - buyer_id mismatch:", { orderId, buyer_id, actual_buyer: orderExists[0].buyer_id })
        return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
      }
    }

    return NextResponse.json({ error: 'Invalid status update' }, { status: 400 })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}