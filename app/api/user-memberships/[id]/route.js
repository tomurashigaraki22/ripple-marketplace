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

// GET - Fetch specific membership
export async function GET(request, { params }) {
  try {
    const authResult = await verifyUserAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const [memberships] = await db.query(
      `SELECT um.*, mt.name as tier_name, mt.features 
       FROM user_memberships um 
       JOIN membership_tiers mt ON um.membership_tier_id = mt.id 
       WHERE um.id = ? AND um.user_id = ?`,
      [params.id, authResult.user.id]
    );
    
    if (memberships.length === 0) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    return NextResponse.json({ userMembership: memberships[0] });
  } catch (error) {
    console.error('Error fetching user membership:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update membership status (admin only)
export async function PUT(request, { params }) {
  try {
    const authResult = await verifyUserAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Check if user is admin
    const [userRole] = await db.query(
      'SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [authResult.user.id]
    );

    if (userRole.length === 0 || userRole[0].name !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { is_active, expires_at } = await request.json();

    await db.query(
      'UPDATE user_memberships SET is_active = ?, expires_at = ? WHERE id = ?',
      [is_active, expires_at, params.id]
    );

    return NextResponse.json({ message: 'Membership updated successfully' });
  } catch (error) {
    console.error('Error updating membership:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}