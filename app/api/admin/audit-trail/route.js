import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { verifyUserAccess } from '../../../utils/auth.js'

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
    const offset = (page - 1) * limit

    const [logs] = await db.query(
      `SELECT 
        at.*,
        u.username as admin_username
       FROM audit_trail at
       JOIN users u ON at.admin_id = u.id
       ORDER BY at.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    // Parse details JSON
    const formattedLogs = logs.map(log => ({
      ...log,
      details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details
    }))

    return NextResponse.json({
      logs: formattedLogs
    })

  } catch (error) {
    console.error('Error fetching audit trail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}