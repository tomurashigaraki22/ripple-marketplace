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

// GET - Fetch specific role
export async function GET(request, { params }) {
  try {
    const authResult = await verifyAdminAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const [roles] = await db.query('SELECT * FROM roles WHERE id = ?', [params.id]);
    
    if (roles.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ role: roles[0] });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update role
export async function PUT(request, { params }) {
  try {
    const authResult = await verifyAdminAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { description } = await request.json();

    await db.query(
      'UPDATE roles SET description = ? WHERE id = ?',
      [description, params.id]
    );

    return NextResponse.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete role
export async function DELETE(request, { params }) {
  try {
    const authResult = await verifyAdminAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Check if role is being used
    const [users] = await db.query('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [params.id]);
    
    if (users[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role that is assigned to users' },
        { status: 400 }
      );
    }

    await db.query('DELETE FROM roles WHERE id = ?', [params.id]);

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}