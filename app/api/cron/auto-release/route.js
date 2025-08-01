import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'

export async function POST(request) {
  try {
    // Find orders that are 20+ days old and still in escrow_funded status
    const [orders] = await db.query(`
      SELECT o.*, e.id as escrow_id 
      FROM orders o 
      LEFT JOIN escrows e ON o.escrow_id = e.id
      WHERE o.status = 'escrow_funded' 
      AND o.created_at <= DATE_SUB(NOW(), INTERVAL 20 DAY)
    `)

    let releasedCount = 0

    for (const order of orders) {
      // Update order status
      await db.query(
        'UPDATE orders SET status = "auto_completed", updated_at = NOW() WHERE id = ?',
        [order.id]
      )

      // Release escrow
      if (order.escrow_id) {
        await db.query(
          'UPDATE escrows SET status = "auto_released", updated_at = NOW() WHERE id = ?',
          [order.escrow_id]
        )
      }

      // Create notification for buyer
      await db.query(
        'INSERT INTO notifications (user_id, type, message, created_at) VALUES (?, ?, ?, NOW())',
        [order.buyer_id, 'auto_release', `Order ${order.id.slice(0, 8)} was automatically completed after 20 days. Funds released to seller.`]
      )

      releasedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Auto-released ${releasedCount} orders`
    })

  } catch (error) {
    console.error('Error in auto-release:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}