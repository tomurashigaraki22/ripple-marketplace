import jwt from 'jsonwebtoken';
import { db } from '../../lib/db';

export async function verifyAdminToken(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided',
        status: 401
      };
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user with role information
    const [users] = await db.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND u.status = 'active'`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return {
        success: false,
        error: 'User not found or inactive',
        status: 404
      };
    }

    const user = users[0];

    // Check if user has admin role
    if (user.role_name !== 'admin') {
      return {
        success: false,
        error: 'Admin access required',
        status: 403
      };
    }

    return {
      success: true,
      user: user
    };

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return {
        success: false,
        error: 'Invalid authentication token',
        status: 401
      };
    }
    
    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        error: 'Authentication token expired',
        status: 401
      };
    }

    return {
      success: false,
      error: 'Authentication error',
      status: 500
    };
  }
}