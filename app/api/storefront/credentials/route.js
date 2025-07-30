import { NextResponse } from 'next/server';
import { db } from '../../lib/db.js';
import { verifyUserAccess } from '../../utils/auth.js';

export async function GET(request) {
  try {
    const authResult = await verifyUserAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get storefront credentials
    const [storefrontLogins] = await db.query(
      `SELECT sl.email, sl.generated_password, sl.expires_at, sl.expired, sl.created_at
       FROM storefront_logins sl
       WHERE sl.user_id = ?`,
      [authResult.user.id]
    );

    if (storefrontLogins.length === 0) {
      return NextResponse.json(
        { error: 'No storefront credentials found. Please purchase a membership first.' },
        { status: 404 }
      );
    }

    const credentials = storefrontLogins[0];

    return NextResponse.json({
      credentials: {
        email: credentials.email,
        password: credentials.generated_password,
        expires_at: credentials.expires_at,
        expired: credentials.expired,
        created_at: credentials.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching storefront credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}