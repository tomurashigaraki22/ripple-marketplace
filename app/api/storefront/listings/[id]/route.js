import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db.js'
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

// GET - Fetch specific listing
export async function GET(request, { params }) {
  try {
    const authResult = await verifyStorefrontAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = params

    const [listings] = await db.query(
      `SELECT id, title, description, price, category, chain, is_physical, 
              images, tags, status, views, created_at, updated_at
       FROM listings 
       WHERE id = ? AND user_id = ?`,
      [id, authResult.user.id]
    )

    if (listings.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    const listing = listings[0]
    const formattedListing = {
      ...listing,
      images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
      tags: typeof listing.tags === 'string' ? JSON.parse(listing.tags) : listing.tags
    }

    return NextResponse.json({ listing: formattedListing })
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update listing
export async function PUT(request, { params }) {
  try {
    const authResult = await verifyStorefrontAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = params
    const { title, description, price, category, chain, isPhysical, images, tags } = await request.json()

    // Check if listing exists and belongs to user
    const [existingListings] = await db.query(
      'SELECT status FROM listings WHERE id = ? AND user_id = ?',
      [id, authResult.user.id]
    )

    if (existingListings.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Don't allow editing sold listings
    if (existingListings[0].status === 'sold') {
      return NextResponse.json(
        { error: 'Cannot edit sold listings' },
        { status: 400 }
      )
    }

    // Validation
    if (!title || !description || !price || !category || !chain) {
      return NextResponse.json(
        { error: 'Title, description, price, category, and chain are required' },
        { status: 400 }
      )
    }

    if (price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }

    // Process tags
    let processedTags = []
    if (tags) {
      if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      } else if (Array.isArray(tags)) {
        processedTags = tags
      }
    }

    // Update listing (reset status to pending if it was rejected)
    const newStatus = existingListings[0].status === 'rejected' ? 'pending' : existingListings[0].status

    await db.query(
      `UPDATE listings 
       SET title = ?, description = ?, price = ?, category = ?, chain = ?, 
           is_physical = ?, images = ?, tags = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        title,
        description,
        parseFloat(price),
        category,
        chain,
        Boolean(isPhysical),
        JSON.stringify(images),
        JSON.stringify(processedTags),
        newStatus,
        id,
        authResult.user.id
      ]
    )

    return NextResponse.json({ message: 'Listing updated successfully' })
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete listing
export async function DELETE(request, { params }) {
  try {
    const authResult = await verifyStorefrontAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = params

    // Check if listing exists and belongs to user
    const [existingListings] = await db.query(
      'SELECT status FROM listings WHERE id = ? AND user_id = ?',
      [id, authResult.user.id]
    )

    if (existingListings.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Don't allow deleting sold listings (for record keeping)
    if (existingListings[0].status === 'sold') {
      return NextResponse.json(
        { error: 'Cannot delete sold listings' },
        { status: 400 }
      )
    }

    // Delete the listing
    await db.query(
      'DELETE FROM listings WHERE id = ? AND user_id = ?',
      [id, authResult.user.id]
    )

    return NextResponse.json({ message: 'Listing deleted successfully' })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}