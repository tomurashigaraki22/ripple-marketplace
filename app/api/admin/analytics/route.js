import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyAdminToken } from '../middleware.js'

// GET - Fetch admin analytics data
export async function GET(request) {
  try {
    const authResult = await verifyAdminToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Get time range from query params (default: 30d)
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    
    // Calculate date range
    const dateCondition = getDateCondition(range)

    // Overview Statistics
    const [totalUsersResult] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE status = "active"'
    )
    const totalUsers = totalUsersResult[0].count

    const [totalListingsResult] = await db.query(
      'SELECT COUNT(*) as count FROM listings'
    )
    const totalListings = totalListingsResult[0].count

    const [totalOrdersResult] = await db.query(
      `SELECT COUNT(*) as count FROM orders ${dateCondition ? `WHERE ${dateCondition}` : ''}`
    )
    const totalOrders = totalOrdersResult[0].count

    const [totalRevenueResult] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM orders 
       WHERE status IN ('paid', 'shipped', 'delivered') 
       ${dateCondition ? `AND ${dateCondition}` : ''}`
    )
    const totalRevenue = parseFloat(totalRevenueResult[0].total) || 0

    // Revenue Trends (daily data for the selected period)
    const revenueQuery = getRevenueQuery(range)
    const [revenueData] = await db.query(revenueQuery)

    // User Growth (daily registrations for the selected period)
    const userGrowthQuery = getUserGrowthQuery(range)
    const [userGrowth] = await db.query(userGrowthQuery)

    // Top Categories
    const [topCategories] = await db.query(`
      SELECT 
        l.category,
        COUNT(o.id) as order_count,
        SUM(CASE WHEN o.status IN ('paid', 'shipped', 'delivered') THEN o.amount ELSE 0 END) as revenue,
        ROUND((COUNT(o.id) * 100.0 / (SELECT COUNT(*) FROM orders WHERE ${dateCondition || '1=1'})), 2) as percentage
      FROM orders o
      JOIN listings l ON o.listing_id = l.id
      WHERE o.status IN ('paid', 'shipped', 'delivered')
      ${dateCondition ? `AND o.${dateCondition}` : ''}
      GROUP BY l.category
      ORDER BY revenue DESC
      LIMIT 10
    `)

    // Membership Distribution
    const [membershipDistribution] = await db.query(`
      SELECT 
        COALESCE(mt.name, 'Free') as tier,
        COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN user_memberships um ON u.id = um.user_id 
        AND um.is_active = true 
        AND (um.expires_at IS NULL OR um.expires_at > NOW())
      LEFT JOIN membership_tiers mt ON um.membership_tier_id = mt.id
      WHERE u.status = 'active'
      GROUP BY COALESCE(mt.name, 'Free')
      ORDER BY count DESC
    `)

    // Format the response
    const analytics = {
      overview: {
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
        totalUsers,
        totalListings,
        totalOrders
      },
      charts: {
        revenueData: revenueData.map(item => ({
          date: item.date,
          revenue: parseFloat(item.revenue) || 0,
          orders: item.orders || 0
        })),
        userGrowth: userGrowth.map(item => ({
          date: item.date,
          users: item.users || 0,
          cumulative: item.cumulative || 0
        })),
        topCategories: topCategories.map(item => ({
          category: item.category || 'Uncategorized',
          orderCount: item.order_count || 0,
          revenue: parseFloat(item.revenue) || 0,
          percentage: parseFloat(item.percentage) || 0
        })),
        membershipDistribution: membershipDistribution.map(item => ({
          tier: item.tier,
          count: item.count || 0
        }))
      }
    }

    return NextResponse.json({
      success: true,
      analytics
    })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get date condition based on range
function getDateCondition(range) {
  switch (range) {
    case '7d':
      return 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    case '30d':
      return 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    case '90d':
      return 'created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)'
    case '1y':
      return 'created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)'
    default:
      return 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
  }
}

// Helper function to get revenue query based on range
function getRevenueQuery(range) {
  const dateCondition = getDateCondition(range)
  const dateFormat = range === '1y' ? '%Y-%m' : '%Y-%m-%d'
  
  return `
    SELECT 
      DATE_FORMAT(created_at, '${dateFormat}') as date,
      SUM(CASE WHEN status IN ('paid', 'shipped', 'delivered') THEN amount ELSE 0 END) as revenue,
      COUNT(*) as orders
    FROM orders
    WHERE ${dateCondition}
    GROUP BY DATE_FORMAT(created_at, '${dateFormat}')
    ORDER BY date ASC
  `
}

// Helper function to get user growth query based on range
function getUserGrowthQuery(range) {
  const dateCondition = getDateCondition(range)
  const dateFormat = range === '1y' ? '%Y-%m' : '%Y-%m-%d'
  
  return `
    SELECT 
      DATE_FORMAT(created_at, '${dateFormat}') as date,
      COUNT(*) as users,
      (SELECT COUNT(*) FROM users WHERE created_at <= CONCAT(DATE_FORMAT(u.created_at, '${dateFormat}'), ' 23:59:59')) as cumulative
    FROM users u
    WHERE ${dateCondition} AND status = 'active'
    GROUP BY DATE_FORMAT(created_at, '${dateFormat}')
    ORDER BY date ASC
  `
}