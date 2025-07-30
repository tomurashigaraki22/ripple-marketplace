import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Verify storefront user access
async function verifyStorefrontAccess(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided', status: 401 }
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET)

    // Verify user exists and has storefront access
    const [users] = await db.query(
      `SELECT u.id, u.username, u.email, u.status, u.membership_tier_id,
              mt.name as membership_tier, mt.features
       FROM users u
       JOIN membership_tiers mt ON u.membership_tier_id = mt.id
       WHERE u.id = ? AND u.status = 'active'`,
      [decoded.userId]
    )

    if (users.length === 0) {
      return { error: 'User not found or inactive', status: 404 }
    }

    return { user: users[0] }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}

// GET - Fetch storefront dashboard statistics
export async function GET(request) {
  try {
    const authResult = await verifyStorefrontAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const userId = authResult.user.id

    // Get total listings count
    const [totalListingsResult] = await db.query(
      'SELECT COUNT(*) as count FROM listings WHERE user_id = ?',
      [userId]
    )
    const totalListings = totalListingsResult[0].count

    // Get active listings count
    const [activeListingsResult] = await db.query(
      'SELECT COUNT(*) as count FROM listings WHERE user_id = ? AND status = "approved"',
      [userId]
    )
    const activeListings = activeListingsResult[0].count

    // Get total views
    const [totalViewsResult] = await db.query(
      'SELECT COALESCE(SUM(views), 0) as total FROM listings WHERE user_id = ?',
      [userId]
    )
    const totalViews = totalViewsResult[0].total

    // Get total earnings from completed orders
    const [totalEarningsResult] = await db.query(
      `SELECT COALESCE(SUM(o.amount), 0) as total 
       FROM orders o 
       JOIN listings l ON o.listing_id = l.id 
       WHERE l.user_id = ? AND o.status IN ('delivered', 'completed')`,
      [userId]
    )
    const totalEarnings = parseFloat(totalEarningsResult[0].total) || 0

    // Get pending orders count
    const [pendingOrdersResult] = await db.query(
      `SELECT COUNT(*) as count 
       FROM orders o 
       JOIN listings l ON o.listing_id = l.id 
       WHERE l.user_id = ? AND o.status IN ('pending', 'paid', 'shipped')`,
      [userId]
    )
    const pendingOrders = pendingOrdersResult[0].count

    // Get completed orders count
    const [completedOrdersResult] = await db.query(
      `SELECT COUNT(*) as count 
       FROM orders o 
       JOIN listings l ON o.listing_id = l.id 
       WHERE l.user_id = ? AND o.status IN ('delivered', 'completed')`,
      [userId]
    )
    const completedOrders = completedOrdersResult[0].count

    const stats = {
      totalListings,
      activeListings,
      totalViews,
      totalEarnings,
      pendingOrders,
      completedOrders
    }

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error fetching storefront stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}