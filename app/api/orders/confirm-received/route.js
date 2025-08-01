import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'

export async function POST(request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Get order details
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId])
    
    if (orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orders[0]
    
    if (order.status !== 'escrow_funded') {
      return NextResponse.json({ error: 'Order cannot be confirmed' }, { status: 400 })
    }

    // Update order status
    await db.query(
      'UPDATE orders SET status = "completed", updated_at = NOW() WHERE id = ?',
      [orderId]
    )

    // Release escrow if exists
    if (order.escrow_id) {
      await db.query(
        'UPDATE escrows SET status = "released", updated_at = NOW() WHERE id = ?',
        [order.escrow_id]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order confirmed and funds released'
    })

  } catch (error) {
    console.error('Error confirming order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}