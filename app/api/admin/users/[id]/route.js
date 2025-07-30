import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db.js'
import { verifyAdminToken } from '../../middleware.js'

// GET - Fetch specific user details
export async function GET(request, { params }) {
  try {
    const authResult = await verifyAdminToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const [users] = await db.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.status,
        u.created_at,
        u.updated_at,
        r.name as role,
        mt.name as membershipTier
       FROM users u
       JOIN roles r ON u.role_id = r.id
       JOIN membership_tiers mt ON u.membership_tier_id = mt.id
       WHERE u.id = ?`,
      [params.id]
    )

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: users[0] })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update user (suspend, activate, delete, edit)
export async function PATCH(request, { params }) {
  try {
    const authResult = await verifyAdminToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { action, ...updateData } = await request.json()

    switch (action) {
      case 'suspend':
        await db.query(
          'UPDATE users SET status = "suspended" WHERE id = ?',
          [params.id]
        )
        return NextResponse.json({ message: 'User suspended successfully' })

      case 'activate':
        await db.query(
          'UPDATE users SET status = "active" WHERE id = ?',
          [params.id]
        )
        return NextResponse.json({ message: 'User activated successfully' })

      case 'delete':
        // Check if user has any active listings or orders
        const [listings] = await db.query(
          'SELECT COUNT(*) as count FROM listings WHERE user_id = ? AND status IN ("pending", "approved")',
          [params.id]
        )
        
        const [orders] = await db.query(
          'SELECT COUNT(*) as count FROM orders WHERE (buyer_id = ? OR seller_id = ?) AND status IN ("pending", "paid", "shipped")',
          [params.id, params.id]
        )

        if (listings[0].count > 0 || orders[0].count > 0) {
          return NextResponse.json(
            { error: 'Cannot delete user with active listings or orders' },
            { status: 400 }
          )
        }

        await db.query('DELETE FROM users WHERE id = ?', [params.id])
        return NextResponse.json({ message: 'User deleted successfully' })

      case 'edit':
        const { username, email, role, membershipTier } = updateData
        
        // Get role and membership tier IDs
        let roleId, membershipTierId
        
        if (role) {
          const [roleResult] = await db.query('SELECT id FROM roles WHERE name = ?', [role])
          if (roleResult.length === 0) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
          }
          roleId = roleResult[0].id
        }
        
        if (membershipTier) {
          const [membershipResult] = await db.query('SELECT id FROM membership_tiers WHERE name = ?', [membershipTier])
          if (membershipResult.length === 0) {
            return NextResponse.json({ error: 'Invalid membership tier' }, { status: 400 })
          }
          membershipTierId = membershipResult[0].id
        }

        // Build update query dynamically
        const updateFields = []
        const updateValues = []
        
        if (username) {
          updateFields.push('username = ?')
          updateValues.push(username)
        }
        
        if (email) {
          updateFields.push('email = ?')
          updateValues.push(email)
        }
        
        if (roleId) {
          updateFields.push('role_id = ?')
          updateValues.push(roleId)
        }
        
        if (membershipTierId) {
          updateFields.push('membership_tier_id = ?')
          updateValues.push(membershipTierId)
        }

        if (updateFields.length > 0) {
          updateValues.push(params.id)
          await db.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
          )
        }
        
        return NextResponse.json({ message: 'User updated successfully' })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}