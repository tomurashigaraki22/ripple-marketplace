import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find storefront login
    const [storefrontLogins] = await db.query(
      `SELECT sl.*, u.id as user_id, u.username, u.status as user_status, 
              mt.name as membership_tier, mt.features
       FROM storefront_logins sl
       JOIN users u ON sl.user_id = u.id
       JOIN membership_tiers mt ON u.membership_tier_id = mt.id
       WHERE sl.email = ? AND sl.generated_password = ?`,
      [email, password]
    );

    if (storefrontLogins.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const storefrontLogin = storefrontLogins[0];

    // Check if account is expired
    if (storefrontLogin.expired) {
      return NextResponse.json(
        { error: 'Storefront account has expired' },
        { status: 401 }
      );
    }

    // Check if account has expiry date and is past expiry
    if (storefrontLogin.expires_at && new Date() > new Date(storefrontLogin.expires_at)) {
      // Mark as expired
      await db.query(
        'UPDATE storefront_logins SET expired = TRUE WHERE id = ?',
        [storefrontLogin.id]
      );
      
      return NextResponse.json(
        { error: 'Storefront account has expired' },
        { status: 401 }
      );
    }

    // Check if user account is active
    if (storefrontLogin.user_status !== 'active') {
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: storefrontLogin.user_id,
        email: storefrontLogin.email,
        username: storefrontLogin.username,
        membershipTier: storefrontLogin.membership_tier,
        type: 'storefront'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: storefrontLogin.user_id,
        username: storefrontLogin.username,
        email: storefrontLogin.email,
        membershipTier: storefrontLogin.membership_tier,
        features: storefrontLogin.features
      }
    });
  } catch (error) {
    console.error('Storefront login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}