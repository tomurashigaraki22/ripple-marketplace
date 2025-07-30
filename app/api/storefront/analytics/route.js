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

// Helper function to get date range based on time period
function getDateRange(range) {
  const now = new Date()
  const startDate = new Date()
  
  switch (range) {
    case '7d':
      startDate.setDate(now.getDate() - 7)
      break
    case '30d':
      startDate.setDate(now.getDate() - 30)
      break
    case '90d':
      startDate.setDate(now.getDate() - 90)
      break
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1)
      break
    default:
      startDate.setDate(now.getDate() - 30)
  }
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  }
}

// GET - Fetch comprehensive analytics data
export async function GET(request) {
  try {
    const authResult = await verifyStorefrontAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const userId = authResult.user.id
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    const { start, end } = getDateRange(range)

    // Overview Statistics
    // Total views
    const [totalViewsResult] = await db.query(
      'SELECT COALESCE(SUM(views), 0) as total FROM listings WHERE user_id = ?',
      [userId]
    )
    const totalViews = totalViewsResult[0].total

    // Total earnings from completed orders
    const [totalEarningsResult] = await db.query(
      `SELECT COALESCE(SUM(o.amount), 0) as total 
       FROM orders o 
       JOIN listings l ON o.listing_id = l.id 
       WHERE l.user_id = ? AND o.status IN ('delivered', 'completed')
       AND DATE(o.created_at) BETWEEN ? AND ?`,
      [userId, start, end]
    )
    const totalEarnings = parseFloat(totalEarningsResult[0].total) || 0

    // Active listings count
    const [activeListingsResult] = await db.query(
      'SELECT COUNT(*) as count FROM listings WHERE user_id = ? AND status = "approved"',
      [userId]
    )
    const totalListings = activeListingsResult[0].count

    // Conversion rate (orders / total views)
    const [ordersCountResult] = await db.query(
      `SELECT COUNT(*) as count 
       FROM orders o 
       JOIN listings l ON o.listing_id = l.id 
       WHERE l.user_id = ? AND DATE(o.created_at) BETWEEN ? AND ?`,
      [userId, start, end]
    )
    const ordersCount = ordersCountResult[0].count
    const conversionRate = totalViews > 0 ? (ordersCount / totalViews) * 100 : 0

    // Monthly Performance Data
    const [monthlyDataResult] = await db.query(
      `SELECT 
         DATE_FORMAT(o.created_at, '%Y-%m') as month,
         DATE_FORMAT(o.created_at, '%b') as month_name,
         COALESCE(SUM(o.amount), 0) as earnings,
         COUNT(*) as orders
       FROM orders o 
       JOIN listings l ON o.listing_id = l.id 
       WHERE l.user_id = ? AND o.status IN ('delivered', 'completed')
       AND DATE(o.created_at) BETWEEN ? AND ?
       GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
       ORDER BY month ASC
       LIMIT 12`,
      [userId, start, end]
    )

    const monthlyData = monthlyDataResult.map(row => ({
      month: row.month_name,
      earnings: parseFloat(row.earnings) || 0,
      orders: row.orders
    }))

    // Top Performing Listings
    const [topListingsResult] = await db.query(
      `SELECT 
         l.id,
         l.title,
         l.views,
         COALESCE(SUM(o.amount), 0) as earnings,
         COUNT(o.id) as orders
       FROM listings l
       LEFT JOIN orders o ON l.id = o.listing_id 
         AND o.status IN ('delivered', 'completed')
         AND DATE(o.created_at) BETWEEN ? AND ?
       WHERE l.user_id = ? AND l.status = 'approved'
       GROUP BY l.id, l.title, l.views
       ORDER BY earnings DESC, l.views DESC
       LIMIT 5`,
      [start, end, userId]
    )

    const topListings = topListingsResult.map(row => ({
      id: row.id,
      title: row.title,
      views: row.views,
      earnings: parseFloat(row.earnings) || 0,
      orders: row.orders
    }))

    // Category Performance
    const [categoryPerformanceResult] = await db.query(
      `SELECT 
         l.category,
         COUNT(DISTINCT l.id) as listings,
         COALESCE(SUM(l.views), 0) as views,
         COALESCE(SUM(o.amount), 0) as earnings
       FROM listings l
       LEFT JOIN orders o ON l.id = o.listing_id 
         AND o.status IN ('delivered', 'completed')
         AND DATE(o.created_at) BETWEEN ? AND ?
       WHERE l.user_id = ? AND l.status = 'approved'
       GROUP BY l.category
       ORDER BY earnings DESC`,
      [start, end, userId]
    )

    const categoryPerformance = categoryPerformanceResult.map(row => ({
      name: row.category || 'uncategorized',
      listings: row.listings,
      views: row.views,
      earnings: parseFloat(row.earnings) || 0
    }))

    const analytics = {
      overview: {
        totalViews,
        totalEarnings,
        totalListings,
        conversionRate
      },
      monthlyData,
      topListings,
      categoryPerformance
    }

    return NextResponse.json({
      success: true,
      analytics,
      timeRange: range
    })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}