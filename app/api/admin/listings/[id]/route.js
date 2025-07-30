import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db.js'
import { verifyAdminToken } from '../../middleware.js'

// GET - Fetch specific listing details
export async function GET(request, { params }) {
  try {
    const authResult = await verifyAdminToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = params

    const [listings] = await db.query(
      `SELECT 
        l.*,
        u.username as seller,
        u.email as seller_email,
        u.id as seller_id
       FROM listings l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = ?`,
      [id]
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

// PATCH - Update listing status
export async function PATCH(request, { params }) {
  try {
    const authResult = await verifyAdminToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = params
    const { action } = await request.json()

    // Validate action
    const validActions = ['approve', 'reject', 'view']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Handle view action (just return listing details)
    if (action === 'view') {
      const [listings] = await db.query(
        `SELECT 
          l.*,
          u.username as seller,
          u.email as seller_email
         FROM listings l
         JOIN users u ON l.user_id = u.id
         WHERE l.id = ?`,
        [id]
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
    }

    // Handle approve/reject actions
    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Check if listing exists
    const [existingListings] = await db.query(
      'SELECT status FROM listings WHERE id = ?',
      [id]
    )

    if (existingListings.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Update listing status
    await db.query(
      'UPDATE listings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, id]
    )

    return NextResponse.json({
      message: `Listing ${action}d successfully`,
      status: newStatus
    })
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}