import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyAdminToken } from '../middleware.js'

// GET - Fetch admin dashboard data
export async function GET(request) {
  try {
    const authResult = await verifyAdminToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Get total users count
    const [totalUsersResult] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE status = "active"'
    )
    const totalUsers = totalUsersResult[0].count

    // Get total listings count
    const [totalListingsResult] = await db.query(
      'SELECT COUNT(*) as count FROM listings'
    )
    const totalListings = totalListingsResult[0].count

    // Get pending listings count
    const [pendingListingsResult] = await db.query(
      'SELECT COUNT(*) as count FROM listings WHERE status = "pending"'
    )
    const pendingListings = pendingListingsResult[0].count

    // Get total orders count
    const [totalOrdersResult] = await db.query(
      'SELECT COUNT(*) as count FROM orders'
    )
    const totalOrders = totalOrdersResult[0].count

    // Get total revenue (sum of all order amounts)
    const [totalRevenueResult] = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = "completed"'
    )
    const totalRevenue = parseFloat(totalRevenueResult[0].total) || 0

    // Get active memberships count
    const [activeMembershipsResult] = await db.query(
      'SELECT COUNT(*) as count FROM user_memberships WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())'
    )
    const activeMemberships = activeMembershipsResult[0].count

    // Get recent activity (last 10 activities)
    const [recentUsers] = await db.query(
      'SELECT username, created_at FROM users ORDER BY created_at DESC LIMIT 3'
    )

    const [recentListings] = await db.query(
      `SELECT l.title, l.created_at, u.username 
       FROM listings l 
       JOIN users u ON l.user_id = u.id 
       ORDER BY l.created_at DESC LIMIT 3`
    )

    const [recentOrders] = await db.query(
      `SELECT o.id, o.created_at, o.amount, u.username as buyer_name
       FROM orders o 
       JOIN users u ON o.buyer_id = u.id 
       ORDER BY o.created_at DESC LIMIT 3`
    )

    // Format recent activity
    const recentActivity = []

    // Add recent users
    recentUsers.forEach(user => {
      recentActivity.push({
        type: 'user',
        description: `New user ${user.username} joined`,
        timestamp: formatTimeAgo(user.created_at)
      })
    })

    // Add recent listings
    recentListings.forEach(listing => {
      recentActivity.push({
        type: 'listing',
        description: `${listing.username} created listing "${listing.title}"`,
        timestamp: formatTimeAgo(listing.created_at)
      })
    })

    // Add recent orders
    recentOrders.forEach(order => {
      recentActivity.push({
        type: 'order',
        description: `${order.buyer_name} placed order #${order.id} ($${parseFloat(order.amount).toFixed(2)})`,
        timestamp: formatTimeAgo(order.created_at)
      })
    })

    // Sort by timestamp and limit to 10 most recent
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    const limitedActivity = recentActivity.slice(0, 10)

    const stats = {
      totalUsers,
      totalListings,
      totalOrders,
      totalRevenue,
      pendingListings,
      activeMemberships
    }

    return NextResponse.json({
      stats,
      recentActivity: limitedActivity
    })
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now - past) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}