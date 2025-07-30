import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db.js'
import jwt from 'jsonwebtoken'

export async function GET(request) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get order statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status IN ('paid', 'shipped', 'delivered') THEN amount ELSE 0 END) as totalRevenue
      FROM orders
    `

    const [statsResult] = await db.query(statsQuery)
    const stats = statsResult[0]

    // Get monthly revenue trend (last 12 months)
    const monthlyRevenueQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(CASE WHEN status IN ('paid', 'shipped', 'delivered') THEN amount ELSE 0 END) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `

    const [monthlyRevenue] = await db.query(monthlyRevenueQuery)

    // Get top selling categories
    const topCategoriesQuery = `
      SELECT 
        l.category,
        COUNT(o.id) as order_count,
        SUM(CASE WHEN o.status IN ('paid', 'shipped', 'delivered') THEN o.amount ELSE 0 END) as revenue
      FROM orders o
      JOIN listings l ON o.listing_id = l.id
      WHERE o.status IN ('paid', 'shipped', 'delivered')
      GROUP BY l.category
      ORDER BY revenue DESC
      LIMIT 10
    `

    const [topCategories] = await db.query(topCategoriesQuery)

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        totalRevenue: parseFloat(stats.totalRevenue) || 0
      },
      monthlyRevenue,
      topCategories
    })
  } catch (error) {
    console.error('Error fetching order statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order statistics' },
      { status: 500 }
    )
  }
}