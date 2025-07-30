import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import jwt from 'jsonwebtoken';

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

// PUT - Update wallet address
export async function PUT(request, { params }) {
  try {
    const authResult = await verifyUserAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { is_primary } = await request.json();

    // Verify wallet belongs to user
    const [wallets] = await db.query(
      'SELECT * FROM wallet_addresses WHERE id = ? AND user_id = ?',
      [params.id, authResult.user.id]
    );

    if (wallets.length === 0) {
      return NextResponse.json({ error: 'Wallet address not found' }, { status: 404 });
    }

    const wallet = wallets[0];

    // If setting as primary, remove primary status from other addresses of same chain
    if (is_primary) {
      await db.query(
        'UPDATE wallet_addresses SET is_primary = FALSE WHERE user_id = ? AND chain = ? AND id != ?',
        [authResult.user.id, wallet.chain, params.id]
      );
    }

    await db.query(
      'UPDATE wallet_addresses SET is_primary = ? WHERE id = ?',
      [is_primary, params.id]
    );

    return NextResponse.json({ message: 'Wallet address updated successfully' });
  } catch (error) {
    console.error('Error updating wallet address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove wallet address
export async function DELETE(request, { params }) {
  try {
    const authResult = await verifyUserAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Verify wallet belongs to user
    const [wallets] = await db.query(
      'SELECT * FROM wallet_addresses WHERE id = ? AND user_id = ?',
      [params.id, authResult.user.id]
    );

    if (wallets.length === 0) {
      return NextResponse.json({ error: 'Wallet address not found' }, { status: 404 });
    }

    await db.query('DELETE FROM wallet_addresses WHERE id = ?', [params.id]);

    return NextResponse.json({ message: 'Wallet address deleted successfully' });
  } catch (error) {
    console.error('Error deleting wallet address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}