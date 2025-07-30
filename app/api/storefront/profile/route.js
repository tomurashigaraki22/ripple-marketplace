import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import jwt from 'jsonwebtoken'

export async function GET(request) {
  try {
    // Get token from cookies or authorization header
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId

    // Fetch user profile
    const [users] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.phone,
        u.bio,
        u.location,
        u.website,
        u.avatar,
        u.created_at,
        r.name as role,
        mt.name as membership_tier
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN membership_tiers mt ON u.membership_tier_id = mt.id
      WHERE u.id = ?
    `, [userId])

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = users[0]
    
    return NextResponse.json({
      success: true,
      profile: {
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        avatar: user.avatar || '',
        role: user.role,
        membershipTier: user.membership_tier,
        joinedDate: user.created_at
      }
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    // Get token from cookies or authorization header
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId

    const { username, email, phone, bio, location, website, avatar } = await request.json()

    // Validate required fields
    if (!username || !email) {
      return NextResponse.json(
        { error: 'Username and email are required' },
        { status: 400 }
      )
    }

    // Check if username or email already exists (excluding current user)
    const [existingUsers] = await db.query(`
      SELECT id FROM users 
      WHERE (username = ? OR email = ?) AND id != ?
    `, [username, email, userId])

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      )
    }

    // Update user profile
    await db.query(`
      UPDATE users 
      SET username = ?, email = ?, phone = ?, bio = ?, location = ?, website = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [username, email, phone, bio, location, website, avatar, userId])

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}