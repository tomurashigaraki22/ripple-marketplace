import { NextResponse } from 'next/server';
import { db } from '../../lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import { verifyUserAccess } from '@/app/utils/auth.js';

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await verifyUserAccess(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { seller, buyer, amount, chain, conditions, listingId } = await request.json();

    if (!buyer || !amount || !chain || !conditions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const escrowId = uuidv4();
    const fee = amount * 0.025; // 2.5% escrow fee
    
    // Use seller ID if seller wallet is empty
    const sellerAddress = seller || 'pending_wallet_setup';

    // Create escrow record
    await db.query(
      'INSERT INTO escrows (id, seller, buyer, amount, chain, conditions, status, created_at) VALUES (?, ?, ?, ?, ?, ?, "pending", NOW())',
      [escrowId, seller, buyer, amount, chain, JSON.stringify(conditions)]
    );
    
    // Get seller user ID from listing
    const [listings] = await db.query(
      'SELECT user_id FROM listings WHERE id = ?',
      [listingId]
    );
    
    if (listings.length > 0) {
      const sellerId = listings[0].user_id;
      
      // Create notification for seller if wallet setup is needed
      if (!seller || seller === '') {
        const notificationId = uuidv4();
        await db.query(
          `INSERT INTO notifications (id, user_id, type, title, message, data, created_at) 
           VALUES (?, ?, 'wallet_setup', 'Set Up Your Wallet Address', 
           'You have received an order but need to set up your wallet address to receive payments. Please update your wallet settings.', 
           ?, NOW())`,
          [notificationId, sellerId, JSON.stringify({ escrowId, listingId, chain })]
        );
      }
      
      // Create order notification
      const orderNotificationId = uuidv4();
      await db.query(
        `INSERT INTO notifications (id, user_id, type, title, message, data, created_at) 
         VALUES (?, ?, 'order_received', 'New Order Received', 
         'You have received a new order. The payment is held in escrow until delivery is confirmed.', 
         ?, NOW())`,
        [orderNotificationId, sellerId, JSON.stringify({ escrowId, listingId, amount, chain })]
      );
    }

    return NextResponse.json({
      success: true,
      escrowId,
      message: 'Escrow created successfully',
      escrowWallet: getEscrowWallet(chain)
    });

  } catch (error) {
    console.error('Error creating escrow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await verifyUserAccess(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');
    const status = searchParams.get('status');

    let query = 'SELECT * FROM escrows WHERE (seller = ? OR buyer = ?)';
    let params = [userAddress, userAddress];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [escrows] = await db.query(query, params);

    return NextResponse.json({ escrows });

  } catch (error) {
    console.error('Error fetching escrows:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getEscrowWallet(chain) {
  const escrowWallets = {
    solana: process.env.ESCROW_SOLANA_WALLET,
    xrpl: process.env.ESCROW_XRPL_WALLET,
    xrpl_evm: process.env.ESCROW_XRPL_EVM_WALLET
  };
  return escrowWallets[chain];
}