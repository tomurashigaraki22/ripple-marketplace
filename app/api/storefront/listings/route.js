import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

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

// GET - Fetch user's listings
export async function GET(request) {
  try {
    const authResult = await verifyStorefrontAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit')) || 20
    const offset = parseInt(url.searchParams.get('offset')) || 0
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')

    let whereClause = 'WHERE user_id = ?'
    const queryParams = [authResult.user.id]

    if (status && status !== 'all') {
      whereClause += ' AND status = ?'
      queryParams.push(status)
    }

    if (category && category !== 'all') {
      whereClause += ' AND category = ?'
      queryParams.push(category)
    }

    const [listings] = await db.query(
      `SELECT id, title, description, price, category, chain, is_physical, 
              images, tags, status, views, created_at, updated_at
       FROM listings 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    // Parse JSON fields
    const formattedListings = listings.map(listing => ({
      ...listing,
      images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
      tags: typeof listing.tags === 'string' ? JSON.parse(listing.tags) : listing.tags
    }))

    return NextResponse.json({ listings: formattedListings })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new listing
export async function POST(request) {
  try {
    const authResult = await verifyStorefrontAccess(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { title, description, price, category, chain, isPhysical, images, tags } = await request.json()

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

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      )
    }

    // Check membership tier limits
    const membershipFeatures = typeof authResult.user.features === 'string' 
      ? JSON.parse(authResult.user.features) 
      : authResult.user.features

    if (membershipFeatures.listings_limit !== -1) {
      // Check current listing count
      const [countResult] = await db.query(
        'SELECT COUNT(*) as count FROM listings WHERE user_id = ? AND status != "sold"',
        [authResult.user.id]
      )

      if (countResult[0].count >= membershipFeatures.listings_limit) {
        return NextResponse.json(
          { error: `You have reached your listing limit of ${membershipFeatures.listings_limit}. Upgrade your membership to create more listings.` },
          { status: 403 }
        )
      }
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

    // Create listing with default status 'pending'
    const listingId = uuidv4()
    await db.query(
      `INSERT INTO listings 
       (id, user_id, title, description, price, category, chain, is_physical, images, tags, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        listingId,
        authResult.user.id,
        title,
        description,
        parseFloat(price),
        category,
        chain,
        Boolean(isPhysical),
        JSON.stringify(images),
        JSON.stringify(processedTags)
      ]
    )

    // Fetch the created listing
    const [newListing] = await db.query(
      `SELECT id, title, description, price, category, chain, is_physical, 
              images, tags, status, views, created_at, updated_at
       FROM listings WHERE id = ?`,
      [listingId]
    )

    const listing = newListing[0]
    const formattedListing = {
      ...listing,
      images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
      tags: typeof listing.tags === 'string' ? JSON.parse(listing.tags) : listing.tags
    }

    return NextResponse.json(
      { 
        message: 'Listing created successfully and is pending approval',
        listing: formattedListing 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}