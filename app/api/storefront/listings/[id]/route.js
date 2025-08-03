import { NextResponse } from 'next/server'
import { db } from '@/app/lib/db'
import jwt from 'jsonwebtoken'

// GET - Fetch single listing
export async function GET(request, { params }) {
  try {
    const { id } = params
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Fetch listing belonging to the authenticated user using MySQL
    const [rows] = await db.execute(
      'SELECT * FROM listings WHERE id = ? AND user_id = ?',
      [id, decoded.userId]
    )
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    
    const listing = rows[0]
    // Parse JSON fields
    if (listing.images) {
      listing.images = JSON.parse(listing.images)
    }
    if (listing.tags) {
      listing.tags = JSON.parse(listing.tags)
    }
    
    return NextResponse.json({ success: true, listing })
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update listing
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    const body = await request.json()
    const { title, description, price, category, is_physical, images, tags, imagesToDelete } = body
    
    // Validation
    if (!title || !description || price === undefined || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Check if listing exists and belongs to user
    const [existingRows] = await db.execute(
      'SELECT id FROM listings WHERE id = ? AND user_id = ?',
      [id, decoded.userId]
    )
    
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Listing not found or unauthorized' }, { status: 404 })
    }
    
    // Update listing using MySQL
    const [result] = await db.execute(
      `UPDATE listings 
       SET title = ?, description = ?, price = ?, category = ?, is_physical = ?, 
           images = ?, tags = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`,
      [
        title,
        description,
        parseFloat(price),
        category,
        is_physical || false,
        JSON.stringify(images || []),
        JSON.stringify(tags || []),
        id,
        decoded.userId
      ]
    )
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
    }
    
    // TODO: Handle image deletion from cloud storage if needed
    // if (imagesToDelete && imagesToDelete.length > 0) {
    //   // Delete images from Cloudinary
    // }
    
    return NextResponse.json({ success: true, message: 'Listing updated successfully' })
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete listing
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Check if listing exists and belongs to user
    const [existingRows] = await db.execute(
      'SELECT id FROM listings WHERE id = ? AND user_id = ?',
      [id, decoded.userId]
    )
    
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Listing not found or unauthorized' }, { status: 404 })
    }
    
    // Delete listing
    const [result] = await db.execute(
      'DELETE FROM listings WHERE id = ? AND user_id = ?',
      [id, decoded.userId]
    )
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: 'Listing deleted successfully' })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}