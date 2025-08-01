import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase } from '@/app/lib/schema';

export async function POST(request) {
  try {
    // await initializeDatabase()
    const { username, email, password } = await request.json();

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    try {
      // Check if user exists
      const [existingUsers] = await db.query(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [email, username]
      );
      console.log("Exisstingn: ", existingUsers)

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      // Create user
      await db.query(
        'INSERT INTO users (id, username, email, password, role_id) VALUES (?, ?, ?, ?, ?)',
        [userId, username, email, hashedPassword, 3]
      );

      // Get created user
      const users = await db.query(
        'SELECT id, username, email, created_at FROM users WHERE id = ?',
        [userId]
      );

      return NextResponse.json(users[0]);
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database operation failed. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}