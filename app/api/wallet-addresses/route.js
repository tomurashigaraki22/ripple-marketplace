import { NextResponse } from 'next/server';
import { db } from '../../lib/db';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Helper function to verify user access
async function verifyUserAccess(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return { error: 'No token provided', status: 401 };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);

    if (users.length === 0) {
      return { error: 'User not found', status: 404 };
    }

    return { user: users[0] };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}

// GET - Fetch user's wallet addresses
export async function GET(request) {
  try {
    const authResult = await verifyUserAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const [wallets] = await db.query(
      'SELECT * FROM wallet_addresses WHERE user_id = ? ORDER BY chain, is_primary DESC',
      [authResult.user.id]
    );
    
    return NextResponse.json({ walletAddresses: wallets });
  } catch (error) {
    console.error('Error fetching wallet addresses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add new wallet address
export async function POST(request) {
  try {
    const authResult = await verifyUserAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { chain, address, is_primary } = await request.json();

    if (!chain || !address) {
      return NextResponse.json(
        { error: 'Chain and address are required' },
        { status: 400 }
      );
    }

    // Check if address already exists for this user and chain
    const [existing] = await db.query(
      'SELECT * FROM wallet_addresses WHERE user_id = ? AND chain = ? AND address = ?',
      [authResult.user.id, chain, address]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Wallet address already exists' },
        { status: 400 }
      );
    }

    // If setting as primary, remove primary status from other addresses of same chain
    if (is_primary) {
      await db.query(
        'UPDATE wallet_addresses SET is_primary = FALSE WHERE user_id = ? AND chain = ?',
        [authResult.user.id, chain]
      );
    }

    const walletId = uuidv4();
    await db.query(
      'INSERT INTO wallet_addresses (id, user_id, chain, address, is_primary) VALUES (?, ?, ?, ?, ?)',
      [walletId, authResult.user.id, chain, address, is_primary || false]
    );

    return NextResponse.json(
      { message: 'Wallet address added successfully', walletId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding wallet address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}