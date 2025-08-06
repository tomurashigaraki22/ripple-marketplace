import { NextResponse } from 'next/server';
import { db } from '../../lib/db.js';
import { verifyUserAccess } from '../../utils/auth.js';

// GET - Fetch messages for an order
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');
    const user_id = searchParams.get('user_id');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = (page - 1) * limit;

    if (!order_id || !user_id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify user has access to this order
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
      [order_id, user_id, user_id]
    );

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    // Fetch messages with user info
    const [messages] = await db.query(
      `SELECT m.*, 
              CASE 
                WHEN m.sent_by = 'buyer' THEN bu.username 
                ELSE su.username 
              END as username,
       FROM messages m
       JOIN users bu ON m.buyer_id = bu.id
       JOIN users su ON m.seller_id = su.id
       WHERE m.order_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [order_id, limit, offset]
    );

    // Get total count
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM messages WHERE order_id = ?',
      [order_id]
    );

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      total: countResult[0].total,
      page,
      hasMore: offset + messages.length < countResult[0].total
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}