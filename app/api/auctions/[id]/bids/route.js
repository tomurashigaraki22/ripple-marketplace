import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db.js'

export async function GET(request, { params }) {
  try {
    const { id: listingId } = params
    
    const [bids] = await db.query(
      `SELECT b.*, u.username as bidder_username 
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.listing_id = ?
       ORDER BY b.bid_amount DESC, b.created_at ASC`,
      [listingId]
    )
    
    return NextResponse.json({ bids })
  } catch (error) {
    console.error('Error fetching bids:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    )
  }
}