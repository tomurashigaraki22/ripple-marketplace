import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db.js'
import jwt from 'jsonwebtoken'
// Import your existing payment logic
import { processPayment } from '@/app/constructs/payments/buyThings.js'
export async function POST(request, { params }) {
  try {
    const { id: auctionId } = params
    const { paymentMethod, walletAddress } = await request.json()
    
    // Verify JWT token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId
    
    // Get auction payment details
    const [payments] = await db.query(
      `SELECT ap.*, l.title, l.user_id as seller_id, u.username as seller_username
       FROM auction_payments ap
       JOIN listings l ON ap.auction_id = l.id
       JOIN users u ON l.user_id = u.id
       WHERE ap.auction_id = ? AND ap.winner_id = ? AND ap.status = 'pending'`,
      [auctionId, userId]
    )
    
    if (payments.length === 0) {
      return NextResponse.json({ error: 'Payment not found or already processed' }, { status: 404 })
    }
    
    const payment = payments[0]
    
    // Check if payment deadline has passed
    if (new Date() > new Date(payment.payment_deadline)) {
      await db.query(
        'UPDATE auction_payments SET status = "expired" WHERE id = ?',
        [payment.id]
      )
      return NextResponse.json({ error: 'Payment deadline has passed' }, { status: 400 })
    }
    
    // Process payment using existing buyThings logic
    const paymentResult = await processPayment({
      amount: payment.amount,
      sellerWallet: payment.seller_wallet, // You'll need to get this
      buyerWallet: walletAddress,
      chain: payment.chain,
      listingId: auctionId
    })
    
    if (paymentResult.success) {
      // Update payment status
      await db.query(
        'UPDATE auction_payments SET status = "paid", transaction_hash = ? WHERE id = ?',
        [paymentResult.transactionHash, payment.id]
      )
      
      // Update listing status
      await db.query(
        'UPDATE listings SET status = "sold" WHERE id = ?',
        [auctionId]
      )
      
      // Create order record
      // ... create order logic similar to regular purchases
      
      return NextResponse.json({ 
        success: true, 
        transactionHash: paymentResult.transactionHash 
      })
    } else {
      return NextResponse.json({ error: 'Payment failed' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Auction payment error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}