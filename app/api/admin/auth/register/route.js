import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Helper function to verify super admin access
async function verifySuperAdminAccess(request) {
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
      return { error: 'Super admin access required', status: 403 };
    }

    return { user: users[0] };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}

export async function POST(request) {
  try {
    // Check if this is the first admin (allow without auth) or require super admin
    const [adminCount] = await db.query(
      'SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = "admin"'
    );

    // If there are existing admins, require super admin authentication
    if (adminCount[0].count > 0) {
      const authResult = await verifySuperAdminAccess(request);
      if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
      }
    }

    const { username, email, password } = await request.json();

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Get admin role ID
    const [adminRole] = await db.query(
      'SELECT id FROM roles WHERE name = "admin"'
    );

    if (adminRole.length === 0) {
      return NextResponse.json(
        { error: 'Admin role not found' },
        { status: 500 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Create admin user
    await db.query(
      'INSERT INTO users (id, username, email, password, role_id, status) VALUES (?, ?, ?, ?, ?, "active")',
      [userId, username, email, hashedPassword, adminRole[0].id]
    );

    // Get created user
    const [newUser] = await db.query(
      `SELECT u.id, u.username, u.email, u.created_at, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    );

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: newUser[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Admin registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}