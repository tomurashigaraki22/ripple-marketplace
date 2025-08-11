import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { sendAuctionEndedSellerEmail, sendAuctionWinnerEmail } from '../../../lib/emailHelper.js'

export async function POST(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find auctions that have ended but haven't been processed
    const [endedAuctions] = await db.query(`
      SELECT 
        l.id as auction_id,
        l.title,
        l.current_bid,
        l.starting_bid,
        l.auction_end_date,
        l.user_id as seller_id,
        l.chain,
        seller.email as seller_email,
        seller.username as seller_username,
        winner_bid.id as winning_bid_id,
        winner_bid.bidder_id as winner_id,
        winner_bid.bid_amount as winning_amount,
        winner_bid.wallet_address as winner_wallet,
        winner.email as winner_email,
        winner.username as winner_username
      FROM listings l
      JOIN users seller ON l.user_id = seller.id
      LEFT JOIN bids winner_bid ON l.id = winner_bid.listing_id 
        AND winner_bid.bid_amount = l.current_bid 
        AND winner_bid.status = 'active'
      LEFT JOIN users winner ON winner_bid.bidder_id = winner.id
      WHERE l.is_auction = TRUE 
        AND l.auction_status = 'active'
        AND l.auction_end_date <= NOW()
    `)

    let processedCount = 0
    const results = []

    for (const auction of endedAuctions) {
      try {
        // Update auction status to ended
        await db.query(
          'UPDATE listings SET auction_status = "ended", auction_winner_id = ? WHERE id = ?',
          [auction.winner_id, auction.auction_id]
        )

        // Update all bids for this auction
        if (auction.winner_id) {
          // Mark winning bid
          await db.query(
            'UPDATE bids SET status = "won" WHERE id = ?',
            [auction.winning_bid_id]
          )
          
          // Mark other bids as outbid
          await db.query(
            'UPDATE bids SET status = "outbid" WHERE listing_id = ? AND id != ?',
            [auction.auction_id, auction.winning_bid_id]
          )

          // Create auction payment record with 24-hour deadline
          const paymentDeadline = new Date()
          paymentDeadline.setHours(paymentDeadline.getHours() + 24)

          const [paymentResult] = await db.query(`
            INSERT INTO auction_payments (
              id, auction_id, winning_bid_id, winner_id, seller_id, 
              amount, payment_deadline, status, created_at
            ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, 'pending', NOW())
          `, [
            auction.auction_id,
            auction.winning_bid_id,
            auction.winner_id,
            auction.seller_id,
            auction.winning_amount,
            paymentDeadline
          ])

          // Send email to winner
          await sendAuctionWinnerEmail({
            userId: auction.winner_id,
            userEmail: auction.winner_email,
            username: auction.winner_username,
            auctionId: auction.auction_id,
            auctionTitle: auction.title,
            winningAmount: auction.winning_amount,
            paymentDeadline: paymentDeadline.toISOString(),
            chain: auction.chain,
            walletAddress: auction.winner_wallet
          })

          // Send email to seller
          await sendAuctionEndedSellerEmail({
            userId: auction.seller_id,
            userEmail: auction.seller_email,
            username: auction.seller_username,
            auctionId: auction.auction_id,
            auctionTitle: auction.title,
            winningAmount: auction.winning_amount,
            winnerUsername: auction.winner_username,
            winnerEmail: auction.winner_email
          })

          results.push({
            auctionId: auction.auction_id,
            status: 'completed_with_winner',
            winningAmount: auction.winning_amount,
            winner: auction.winner_username
          })
        } else {
          // No bids - auction ended without winner
          await db.query(
            'UPDATE bids SET status = "cancelled" WHERE listing_id = ?',
            [auction.auction_id]
          )

          // Send email to seller about no winner
          await sendAuctionEndedSellerEmail({
            userId: auction.seller_id,
            userEmail: auction.seller_email,
            username: auction.seller_username,
            auctionId: auction.auction_id,
            auctionTitle: auction.title,
            winningAmount: null,
            winnerUsername: null,
            winnerEmail: null
          })

          results.push({
            auctionId: auction.auction_id,
            status: 'ended_no_winner'
          })
        }

        processedCount++
      } catch (error) {
        console.error(`Error processing auction ${auction.auction_id}:`, error)
        results.push({
          auctionId: auction.auction_id,
          status: 'error',
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} ended auctions`,
      processedCount,
      results
    })

  } catch (error) {
    console.error('Error in auction processing cron:', error)
    return NextResponse.json(
      { error: 'Failed to process auctions' },
      { status: 500 }
    )
  }
}