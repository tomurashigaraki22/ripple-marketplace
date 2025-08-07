import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '../../../lib/db.js';
import {
  sendNewOrderEmail,
  sendOrderUpdateEmail,
  sendPaymentReceivedEmail,
  sendLowStockEmail,
  sendPromotionalEmail,
  sendNewsletterEmail,
  sendLoginAlertEmail,
  queueEmail,
  processEmailQueue
} from '../../../lib/emailHelper.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { type, data, queue = false } = await request.json();

    if (!type || !data) {
      return NextResponse.json({ error: 'Type and data are required' }, { status: 400 });
    }

    let result;

    if (queue) {
      // Queue email for later processing
      result = await queueEmail({
        to: data.email,
        subject: data.subject,
        templateName: type,
        data
      });
    } else {
      // Send email immediately
      switch (type) {
        case 'newOrder':
          result = await sendNewOrderEmail(data);
          break;
        case 'orderUpdate':
          result = await sendOrderUpdateEmail(data);
          break;
        case 'paymentReceived':
          result = await sendPaymentReceivedEmail(data);
          break;
        case 'lowStock':
          result = await sendLowStockEmail(data);
          break;
        case 'promotional':
          result = await sendPromotionalEmail(data);
          break;
        case 'newsletter':
          result = await sendNewsletterEmail(data);
          break;
        case 'loginAlert':
          result = await sendLoginAlertEmail(data);
          break;
        default:
          return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      result,
      queued: queue
    });

  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}

// Process email queue endpoint
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit')) || 10;

    if (action === 'process-queue') {
      const result = await processEmailQueue(limit);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Email queue processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process email queue' },
      { status: 500 }
    );
  }
}