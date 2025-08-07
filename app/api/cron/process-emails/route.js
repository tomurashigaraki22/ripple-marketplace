import { NextResponse } from 'next/server';
import { processEmailQueue } from '../../../lib/emailHelper.js';

export async function GET(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processEmailQueue(50); // Process up to 50 emails
    
    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} emails`,
      details: result
    });

  } catch (error) {
    console.error('Cron email processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process emails' },
      { status: 500 }
    );
  }
}