import { NextResponse } from 'next/server';
import { db } from '../../lib/db';
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

// GET - Fetch all membership tiers (public)
export async function GET(request) {
  try {
    const [tiers] = await db.query('SELECT * FROM membership_tiers ORDER BY price ASC');
    
    return NextResponse.json({ membershipTiers: tiers });
  } catch (error) {
    console.error('Error fetching membership tiers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new membership tier (admin only)
export async function POST(request) {
  try {
    const authResult = await verifyAdminAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { name, price, features } = await request.json();

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    await db.query(
      'INSERT INTO membership_tiers (name, price, features) VALUES (?, ?, ?)',
      [name, price, JSON.stringify(features)]
    );

    return NextResponse.json(
      { message: 'Membership tier created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating membership tier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}