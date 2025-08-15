import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyUserAccess } from '../../../utils/auth.js'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request) {
  try {
    const authResult = await verifyUserAccess(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check if user is admin (role_id = 1)
    if (authResult.user.role_id !== 1) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 100
    const action = searchParams.get('action')
    const targetType = searchParams.get('target_type')
    const adminId = searchParams.get('admin_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const offset = (page - 1) * limit

    // Build dynamic WHERE clause
    let whereConditions = []
    let queryParams = []

    if (action) {
      whereConditions.push('at.action = ?')
      queryParams.push(action)
    }

    if (targetType) {
      whereConditions.push('at.target_type = ?')
      queryParams.push(targetType)
    }

    if (adminId) {
      whereConditions.push('at.admin_id = ?')
      queryParams.push(adminId)
    }

    if (startDate) {
      whereConditions.push('at.created_at >= ?')
      queryParams.push(startDate)
    }

    if (endDate) {
      whereConditions.push('at.created_at <= ?')
      queryParams.push(endDate)
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

    // Get total count for pagination
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM audit_trail at ${whereClause}`,
      queryParams
    )

    // Get logs with pagination
    const [logs] = await db.query(
      `SELECT 
        at.*,
        u.username as admin_username,
        u.email as admin_email
       FROM audit_trail at
       JOIN users u ON at.admin_id = u.id
       ${whereClause}
       ORDER BY at.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    // Parse details JSON
    const formattedLogs = logs.map(log => ({
      ...log,
      details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details
    }))

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching audit trail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const authResult = await verifyUserAccess(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check if user is admin (role_id = 1)
    if (authResult.user.role_id !== 1) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, target_type, target_id, details, ip_address } = await request.json()

    // Validate required fields
    if (!action || !target_type) {
      return NextResponse.json({ error: 'Action and target_type are required' }, { status: 400 })
    }

    const auditId = uuidv4()
    const clientIp = ip_address || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    await db.query(
      `INSERT INTO audit_trail (id, admin_id, action, target_type, target_id, details, ip_address, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        auditId,
        authResult.user.id,
        action,
        target_type,
        target_id || null,
        JSON.stringify(details || {}),
        clientIp
      ]
    )

    return NextResponse.json({ 
      success: true, 
      audit_id: auditId,
      message: 'Audit log created successfully' 
    })

  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}