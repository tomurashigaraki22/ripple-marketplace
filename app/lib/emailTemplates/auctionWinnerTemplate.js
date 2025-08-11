export const auctionWinnerTemplate = ({
  username,
  auctionTitle,
  winningAmount,
  paymentDeadline,
  auctionId,
  chain
}) => {
  const deadlineDate = new Date(paymentDeadline)
  const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🎉 Congratulations! You Won the Auction</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                color: #ffffff;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: #111111;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }
            .header {
                background: linear-gradient(135deg, #39FF14 0%, #32CD32 100%);
                color: #000000;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }
            .content {
                padding: 30px;
            }
            .winner-banner {
                background: linear-gradient(135deg, #39FF14 0%, #32CD32 100%);
                color: #000000;
                padding: 25px;
                border-radius: 12px;
                text-align: center;
                margin: 20px 0;
            }
            .winner-banner .amount {
                font-size: 36px;
                font-weight: 800;
                margin: 10px 0;
            }
            .auction-card {
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            }
            .auction-title {
                font-size: 20px;
                font-weight: 600;
                color: #39FF14;
                margin-bottom: 15px;
            }
            .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin: 20px 0;
            }
            .detail-item {
                background: #222;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #39FF14;
            }
            .detail-label {
                font-size: 12px;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
            }
            .detail-value {
                font-size: 16px;
                font-weight: 600;
                color: #ffffff;
            }
            .urgent-notice {
                background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
                color: #ffffff;
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
                text-align: center;
            }
            .urgent-notice h3 {
                margin: 0 0 10px 0;
                font-size: 18px;
            }
            .btn {
                display: inline-block;
                background: linear-gradient(135deg, #39FF14 0%, #32CD32 100%);
                color: #000000;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 10px 5px;
                transition: transform 0.2s;
            }
            .btn:hover {
                transform: translateY(-2px);
            }
            .btn-secondary {
                background: #333;
                color: #ffffff;
            }
            .footer {
                background: #0a0a0a;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #888;
            }
            .footer a {
                color: #39FF14;
                text-decoration: none;
                margin: 0 10px;
            }
            @media (max-width: 600px) {
                .details-grid {
                    grid-template-columns: 1fr;
                }
                .btn {
                    display: block;
                    margin: 10px 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Congratulations!</h1>
                <p>You won the auction!</p>
            </div>
            
            <div class="content">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi <strong>${username}</strong>,</p>
                
                <div class="winner-banner">
                    <h2>🏆 You're the Winner!</h2>
                    <div class="amount">$${winningAmount}</div>
                    <p style="margin-top: 10px;">Winning bid amount</p>
                </div>
                
                <div class="auction-card">
                    <div class="auction-title">${auctionTitle}</div>
                    
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Your Winning Bid</div>
                            <div class="detail-value" style="color: #39FF14;">$${winningAmount}</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">Auction ID</div>
                            <div class="detail-value">${auctionId.slice(0, 8)}...</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">Payment Chain</div>
                            <div class="detail-value">${chain.toUpperCase()}</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">Payment Deadline</div>
                            <div class="detail-value" style="color: #ff4444;">${formattedDeadline}</div>
                        </div>
                    </div>
                </div>
                
                <div class="urgent-notice">
                    <h3>⏰ Payment Required Within 24 Hours</h3>
                    <p>You must complete payment by <strong>${formattedDeadline}</strong> to secure your purchase. Failure to pay within this timeframe will result in forfeiture of the item.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${auctionId}" class="btn">
                        💳 Complete Payment Now
                    </a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace/orders" class="btn btn-secondary">
                        📋 View My Orders
                    </a>
                </div>
                
                <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #39FF14; margin-top: 0;">📋 Next Steps:</h4>
                    <ol style="color: #ccc; line-height: 1.8;">
                        <li>Click "Complete Payment Now" to proceed with payment</li>
                        <li>Connect your ${chain.toUpperCase()} wallet</li>
                        <li>Confirm the transaction for $${winningAmount}</li>
                        <li>Receive confirmation and tracking information</li>
                    </ol>
                </div>
                
                <p style="color: #888; font-size: 14px; margin-top: 30px;">
                    <strong>Important:</strong> This auction win is binding. Please ensure you complete payment within the specified timeframe to avoid losing the item and potential account restrictions.
                </p>
            </div>
            
            <div class="footer">
                <div style="margin-bottom: 15px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace">Marketplace</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/wallet">Wallet</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/legal/terms">Terms</a>
                </div>
                
                <p style="margin-top: 20px;">
                    Congratulations on your auction win! Complete payment promptly to secure your purchase.<br>
                    If you have any questions, please contact our support team.
                </p>
            </div>
        </div>
    </body>
    </html>
  `
}