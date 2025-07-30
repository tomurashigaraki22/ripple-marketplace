import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import jwt from 'jsonwebtoken';

// Helper function to verify admin access
async function verifyAdminAccess(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return { error: 'No token provided', status: 401 };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || users[0].role_name !== 'admin') {
      return { error: 'Admin access required', status: 403 };
    }

    return { user: users[0] };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}

// GET - Fetch specific membership tier
export async function GET(request, { params }) {
  try {
    const [tiers] = await db.query('SELECT * FROM membership_tiers WHERE id = ?', [params.id]);
    
    if (tiers.length === 0) {
      return NextResponse.json({ error: 'Membership tier not found' }, { status: 404 });
    }

    return NextResponse.json({ membershipTier: tiers[0] });
  } catch (error) {
    console.error('Error fetching membership tier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update membership tier
export async function PUT(request, { params }) {
  try {
    const authResult = await verifyAdminAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { price, features } = await request.json();

    await db.query(
      'UPDATE membership_tiers SET price = ?, features = ? WHERE id = ?',
      [price, JSON.stringify(features), params.id]
    );

    return NextResponse.json({ message: 'Membership tier updated successfully' });
  } catch (error) {
    console.error('Error updating membership tier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}