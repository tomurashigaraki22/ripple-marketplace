import { NextResponse } from 'next/server';
import { db } from '../../../lib/db.js';
import { verifyUserAccess } from '@/app/utils/auth.js';

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await verifyUserAccess(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { escrowId, reason, evidence } = await request.json();

    if (!escrowId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user is buyer or seller
    const [escrows] = await db.query(
      'SELECT * FROM escrows WHERE id = ? AND (buyer = ? OR seller = ?)',
      [escrowId, user.walletAddress, user.walletAddress]
    );
    
    if (escrows.length === 0) {
      return NextResponse.json({ error: 'Unauthorized or escrow not found' }, { status: 403 });
    }

    const escrow = escrows[0];
    
    if (escrow.status !== 'funded') {
      return NextResponse.json({ error: 'Can only dispute funded escrows' }, { status: 400 });
    }

    // Update escrow status to disputed
    await db.query(
      'UPDATE escrows SET status = "disputed", dispute_reason = ?, updated_at = NOW() WHERE id = ?',
      [reason, escrowId]
    );

    // Create dispute record (you might want a separate disputes table)
    const disputeData = {
      escrowId,
      initiator: user.walletAddress,
      reason,
      evidence: evidence || null,
      createdAt: new Date().toISOString()
    };

    // Store dispute details in escrow conditions
    const currentConditions = JSON.parse(escrow.conditions || '{}');
    currentConditions.dispute = disputeData;
    
    await db.query(
      'UPDATE escrows SET conditions = ? WHERE id = ?',
      [JSON.stringify(currentConditions), escrowId]
    );

    return NextResponse.json({
      success: true,
      message: 'Dispute initiated successfully'
    });

  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}