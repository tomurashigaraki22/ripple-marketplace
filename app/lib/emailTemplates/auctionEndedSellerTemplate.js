export const auctionEndedSellerTemplate = ({
  username,
  auctionTitle,
  winningAmount,
  winnerUsername,
  auctionId
}) => {
  const hasWinner = winningAmount && winnerUsername
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${hasWinner ? '🎉 Your Auction Has Ended - Winner Found!' : '📋 Your Auction Has Ended'}</title>
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
                background: ${hasWinner ? 'linear-gradient(135deg, #39FF14 0%, #32CD32 100%)' : 'linear-gradient(135deg, #666 0%, #444 100%)'};
                color: ${hasWinner ? '#000000' : '#ffffff'};
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
            .result-banner {
                background: ${hasWinner ? 'linear-gradient(135deg, #39FF14 0%, #32CD32 100%)' : 'linear-gradient(135deg, #ff9500 0%, #ff7700 100%)'};
                color: ${hasWinner ? '#000000' : '#ffffff'};
                padding: 25px;
                border-radius: 12px;
                text-align: center;
                margin: 20px 0;
            }
            .result-banner .amount {
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
            .next-steps {
                background: #1a1a1a;
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
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
                <h1>${hasWinner ? '🎉 Auction Completed!' : '📋 Auction Ended'}</h1>
                <p>${hasWinner ? 'Your item has been sold!' : 'Your auction has concluded'}</p>
            </div>
            
            <div class="content">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi <strong>${username}</strong>,</p>
                
                ${hasWinner ? `
                <div class="result-banner">
                    <h2>💰 Congratulations!</h2>
                    <div class="amount">$${winningAmount}</div>
                    <p style="margin-top: 10px;">Final sale price</p>
                </div>
                ` : `
                <div class="result-banner">
                    <h2>📋 Auction Concluded</h2>
                    <p style="margin-top: 10px; font-size: 18px;">No bids were received</p>
                </div>
                `}
                
                <div class="auction-card">
                    <div class="auction-title">${auctionTitle}</div>
                    
                    <div class="details-grid">
                        ${hasWinner ? `
                        <div class="detail-item">
                            <div class="detail-label">Final Sale Price</div>
                            <div class="detail-value" style="color: #39FF14;">$${winningAmount}</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">Winner</div>
                            <div class="detail-value">${winnerUsername}</div>
                        </div>
                        ` : `
                        <div class="detail-item">
                            <div class="detail-label">Status</div>
                            <div class="detail-value" style="color: #ff9500;">No Winner</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">Total Bids</div>
                            <div class="detail-value">0</div>
                        </div>
                        `}
                        
                        <div class="detail-item">
                            <div class="detail-label">Auction ID</div>
                            <div class="detail-value">${auctionId.slice(0, 8)}...</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">End Date</div>
                            <div class="detail-value">${new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
                
                ${hasWinner ? `
                <div class="next-steps">
                    <h4 style="color: #39FF14; margin-top: 0;">📋 What Happens Next:</h4>
                    <ol style="color: #ccc; line-height: 1.8;">
                        <li>The winner has 24 hours to complete payment</li>
                        <li>Once payment is confirmed, you'll receive the funds</li>
                        <li>You'll be notified to ship the item (if physical)</li>
                        <li>Funds will be released after delivery confirmation</li>
                    </ol>
                    
                    <p style="color: #888; font-size: 14px; margin-top: 20px;">
                        <strong>Note:</strong> If the winner doesn't pay within 24 hours, the auction will be cancelled and you can relist the item.
                    </p>
                </div>
                ` : `
                <div class="next-steps">
                    <h4 style="color: #ff9500; margin-top: 0;">📋 What You Can Do:</h4>
                    <ul style="color: #ccc; line-height: 1.8;">
                        <li>Review your auction settings and pricing</li>
                        <li>Consider relisting with adjusted starting bid</li>
                        <li>Try promoting your listing to reach more buyers</li>
                        <li>Switch to a "Buy It Now" listing instead</li>
                    </ul>
                </div>
                `}
                
                <div style="text-align: center; margin: 30px 0;">
                    ${hasWinner ? `
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/orders" class="btn">
                        📋 View Orders
                    </a>
                    ` : `
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/listings/new" class="btn">
                        📝 Create New Listing
                    </a>
                    `}
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/dashboard" class="btn btn-secondary">
                        📊 Dashboard
                    </a>
                </div>
            </div>
            
            <div class="footer">
                <div style="margin-bottom: 15px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/dashboard">Dashboard</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/orders">Orders</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/listings">Listings</a>
                </div>
                
                <p style="margin-top: 20px;">
                    ${hasWinner ? 'Thank you for using RippleBids! Your auction was successful.' : 'Thank you for using RippleBids. Better luck with your next auction!'}<br>
                    If you have any questions, please contact our support team.
                </p>
            </div>
        </div>
    </body>
    </html>
  `
}