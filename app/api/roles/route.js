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

// GET - Fetch all roles
export async function GET(request) {
  try {
    const authResult = await verifyAdminAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const [roles] = await db.query('SELECT * FROM roles ORDER BY id');
    
    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new role
export async function POST(request) {
  try {
    const authResult = await verifyAdminAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    await db.query(
      'INSERT INTO roles (name, description) VALUES (?, ?)',
      [name, description]
    );

    return NextResponse.json(
      { message: 'Role created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}