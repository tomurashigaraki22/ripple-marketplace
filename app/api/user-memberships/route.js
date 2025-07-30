import { NextResponse } from 'next/server';
import { db } from '../../lib/db.js';
import { verifyUserAccess } from '../../utils/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { generateRandomPassword } from '../../lib/schema.js';

// Helper function to verify user access
// async function verifyUserAccess(request) {
//   try {
//     const token = request.headers.get('authorization')?.replace('Bearer ', '');
//     if (!token) {
//       return { error: 'No token provided', status: 401 };
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const [users] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);

//     if (users.length === 0) {
//       return { error: 'User not found', status: 404 };
//     }

//     return { user: users[0] };
//   } catch (error) {
//     return { error: 'Invalid token', status: 401 };
//   }
// }

// GET - Fetch user's membership history
export async function GET(request) {
  try {
    const authResult = await verifyUserAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const [memberships] = await db.query(
      `SELECT um.*, mt.name as tier_name, mt.features 
       FROM user_memberships um 
       JOIN membership_tiers mt ON um.membership_tier_id = mt.id 
       WHERE um.user_id = ? 
       ORDER BY um.created_at DESC`,
      [authResult.user.id]
    );
    
    return NextResponse.json({ userMemberships: memberships });
  } catch (error) {
    console.error('Error fetching user memberships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Purchase new membership
export async function POST(request) {
  try {
    const authResult = await verifyUserAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { membership_tier_id, transaction_hash, expires_at } = await request.json();

    if (!membership_tier_id || !transaction_hash) {
      return NextResponse.json(
        { error: 'Membership tier ID and transaction hash are required' },
        { status: 400 }
      );
    }

    // Get membership tier details
    const [tiers] = await db.query(
      'SELECT * FROM membership_tiers WHERE id = ?',
      [membership_tier_id]
    );

    if (tiers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid membership tier' },
        { status: 400 }
      );
    }

    const tier = tiers[0];

    // Get user details for storefront login
    const [users] = await db.query(
      'SELECT email FROM users WHERE id = ?',
      [authResult.user.id]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userEmail = users[0].email;

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Deactivate current active memberships
      await db.query(
        'UPDATE user_memberships SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE',
        [authResult.user.id]
      );

      // Create new membership record
      const membershipId = uuidv4();
      await db.query(
        `INSERT INTO user_memberships 
         (id, user_id, membership_tier_id, price, transaction_hash, expires_at, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [membershipId, authResult.user.id, membership_tier_id, tier.price, transaction_hash, expires_at]
      );

      // Update user's current membership tier
      await db.query(
        'UPDATE users SET membership_tier_id = ? WHERE id = ?',
        [membership_tier_id, authResult.user.id]
      );

      // Check if storefront login already exists
      const [existingStorefront] = await db.query(
        'SELECT id FROM storefront_logins WHERE user_id = ?',
        [authResult.user.id]
      );

      let storefrontCredentials = null;

      if (existingStorefront.length === 0) {
        // Generate new storefront credentials
        const storefrontId = uuidv4();
        const generatedPassword = generateRandomPassword(16);
        const storefrontExpiresAt = expires_at || null;

        await db.query(
          `INSERT INTO storefront_logins 
           (id, user_id, email, generated_password, expires_at, expired) 
           VALUES (?, ?, ?, ?, ?, FALSE)`,
          [storefrontId, authResult.user.id, userEmail, generatedPassword, storefrontExpiresAt]
        );

        storefrontCredentials = {
          email: userEmail,
          password: generatedPassword,
          expires_at: storefrontExpiresAt
        };
      } else {
        // Update existing storefront login expiry
        await db.query(
          'UPDATE storefront_logins SET expires_at = ?, expired = FALSE WHERE user_id = ?',
          [expires_at || null, authResult.user.id]
        );

        // Get existing credentials
        const [storefrontData] = await db.query(
          'SELECT email, generated_password, expires_at FROM storefront_logins WHERE user_id = ?',
          [authResult.user.id]
        );

        storefrontCredentials = {
          email: storefrontData[0].email,
          password: storefrontData[0].generated_password,
          expires_at: storefrontData[0].expires_at
        };
      }

      // Commit transaction
      await db.query('COMMIT');

      return NextResponse.json(
        { 
          message: 'Membership purchased successfully', 
          membershipId,
          storefrontCredentials
        },
        { status: 201 }
      );
    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error purchasing membership:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}