import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db.js'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request, { params }) {
  try {
    const { id: listingId } = params
    const { bidAmount, walletAddress, chain } = await request.json()
    
    // Verify JWT token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId
    
    // Verify listing exists and is an active auction
    const [listings] = await db.query(
      'SELECT * FROM listings WHERE id = ? AND is_auction = TRUE AND auction_status = "active" AND auction_end_date > NOW()',
      [listingId]
    )
    
    if (listings.length === 0) {
      return NextResponse.json({ error: 'Auction not found or has ended' }, { status: 404 })
    }
    
    const listing = listings[0]
    
    // Prevent seller from bidding on their own auction
    if (listing.user_id === userId) {
      return NextResponse.json({ error: 'Cannot bid on your own auction' }, { status: 400 })
    }
    
    // Verify bid amount meets minimum requirements
    const currentHighestBid = listing.current_bid || listing.starting_bid
    const minimumBid = parseFloat(currentHighestBid) + parseFloat(listing.bid_increment)
    
    if (parseFloat(bidAmount) < minimumBid) {
      return NextResponse.json({ 
        error: `Bid must be at least $${minimumBid.toFixed(2)} USD` 
      }, { status: 400 })
    }
    
    // TODO: Verify wallet balance (integrate with your wallet verification logic)
    
    // Start transaction
    await db.query('START TRANSACTION')
    
    try {
      // Create new bid
      const bidId = uuidv4()
      await db.query(
        `INSERT INTO bids (id, listing_id, bidder_id, bid_amount, wallet_address, chain, wallet_balance_verified, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        [bidId, listingId, userId, bidAmount, walletAddress, chain, true]
      )
      
      // Update previous bids to 'outbid' status
      await db.query(
        'UPDATE bids SET status = "outbid" WHERE listing_id = ? AND id != ? AND status = "active"',
        [listingId, bidId]
      )
      
      // Update listing with new current bid
      await db.query(
        'UPDATE listings SET current_bid = ? WHERE id = ?',
        [bidAmount, listingId]
      )
      
      await db.query('COMMIT')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Bid placed successfully',
        bidId 
      })
      
    } catch (error) {
      await db.query('ROLLBACK')
      throw error
    }
    
  } catch (error) {
    console.error('Bidding error:', error)
    return NextResponse.json(
      { error: 'Failed to place bid' },
      { status: 500 }
    )
  }
}