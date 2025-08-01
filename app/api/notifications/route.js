import { NextResponse } from 'next/server';
import { db } from '../../lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import { verifyUserAccess } from '@/app/utils/auth.js';

export async function GET(request) {
  try {
    const user = await verifyUserAccess(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;
    
    if (unreadOnly) {
      query += ` AND is_read = FALSE`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT 50`;
    
    const [notifications] = await db.query(query, [user.id]);

    return NextResponse.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await verifyUserAccess(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, type, title, message, data } = await request.json();

    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notificationId = uuidv4();

    await db.query(
      `INSERT INTO notifications (id, user_id, type, title, message, data, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [notificationId, userId, type, title, message, JSON.stringify(data || {})]
    );

    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await verifyUserAccess(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, isRead } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    await db.query(
      `UPDATE notifications SET is_read = ?, updated_at = NOW() 
       WHERE id = ? AND user_id = ?`,
      [isRead, notificationId, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}