import jwt from 'jsonwebtoken';
import { db } from '../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify user access token
export async function verifyUserAccess(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'No authorization token provided',
        status: 401
      };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database with role information
    const [users] = await db.query(
      `SELECT u.id, u.username, u.email, u.role_id, r.name as role 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return {
        success: false,
        error: 'User not found',
        status: 404
      };
    }
    console.log("Users: ", users[0])

    return {
      success: true,
      user: users[0]
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      error: 'Invalid or expired token',
      status: 401
    };
  }
}

// Verify admin access
export async function verifyAdminAccess(request) {
  const authResult = await verifyUserAccess(request);
  
  if (!authResult.success) {
    return authResult;
  }

  if (authResult.user.role !== 'admin' && authResult.user.role !== 'super_admin') {
    return {
      success: false,
      error: 'Admin access required',
      status: 403
    };
  }

  return authResult;
}

// Verify super admin access
export async function verifySuperAdminAccess(request) {
  const authResult = await verifyUserAccess(request);
  
  if (!authResult.success) {
    return authResult;
  }

  if (authResult.user.role !== 'super_admin') {
    return {
      success: false,
      error: 'Super admin access required',
      status: 403
    };
  }

  return authResult;
}

// Generate JWT token
export function generateToken(userId) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}