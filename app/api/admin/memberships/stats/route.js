import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db.js'
import { verifyAdminToken } from '../../middleware.js'

// GET - Fetch membership statistics
export async function GET(request) {
  try {
    const authResult = await verifyAdminToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Get total memberships count
    const [totalMembershipsResult] = await db.query(
      'SELECT COUNT(*) as count FROM user_memberships'
    )
    const totalMemberships = totalMembershipsResult[0].count

    // Get active memberships count
    const [activeMembershipsResult] = await db.query(
      `SELECT COUNT(*) as count FROM user_memberships 
       WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())`
    )
    const activeMemberships = activeMembershipsResult[0].count

    // Get total revenue from memberships
    const [revenueResult] = await db.query(
      'SELECT COALESCE(SUM(price), 0) as total FROM user_memberships WHERE is_active = TRUE'
    )
    const revenue = parseFloat(revenueResult[0].total) || 0

    // Calculate conversion rate (active memberships vs total users)
    const [totalUsersResult] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE status = "active"'
    )
    const totalUsers = totalUsersResult[0].count
    const conversionRate = totalUsers > 0 ? ((activeMemberships / totalUsers) * 100).toFixed(2) : 0

    // Get membership tier distribution
    const [tierDistribution] = await db.query(
      `SELECT 
        mt.name as tier_name,
        COUNT(um.id) as count,
        SUM(um.price) as revenue
       FROM membership_tiers mt
       LEFT JOIN user_memberships um ON mt.id = um.membership_tier_id AND um.is_active = TRUE
       GROUP BY mt.id, mt.name
       ORDER BY mt.id`
    )

    // Get recent membership activity (last 30 days)
    const [recentActivity] = await db.query(
      `SELECT 
        DATE(um.created_at) as date,
        COUNT(*) as new_memberships,
        SUM(um.price) as daily_revenue
       FROM user_memberships um
       WHERE um.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(um.created_at)
       ORDER BY date DESC
       LIMIT 30`
    )

    return NextResponse.json({
      stats: {
        totalMemberships,
        activeMemberships,
        revenue,
        conversionRate: parseFloat(conversionRate)
      },
      tierDistribution,
      recentActivity
    })

  } catch (error) {
    console.error('Error fetching membership stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}