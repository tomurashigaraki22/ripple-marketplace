export const escrowReleasedTemplate = (data) => {
  const {
    sellerName,
    buyerName,
    orderId,
    listingTitle,
    listingImage,
    amount,
    currency = 'XRPB',
    releaseDate,
    transactionHash,
    walletAddress,
    dashboardUrl = process.env.NEXT_PUBLIC_APP_URL + '/storefront/orders'
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Escrow Funds Released</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f8f9fa;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #39FF14 0%, #32CD32 100%);
                color: #000;
                padding: 30px 20px;
                text-align: center;
            }
            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
                font-weight: 700;
            }
            .header p {
                font-size: 16px;
                opacity: 0.8;
            }
            .content {
                padding: 30px 20px;
            }
            .success-banner {
                background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                border: 2px solid #39FF14;
                border-radius: 12px;
                padding: 25px;
                text-align: center;
                margin: 20px 0;
            }
            .success-banner h2 {
                color: #155724;
                font-size: 24px;
                margin-bottom: 10px;
            }
            .success-banner .amount {
                font-size: 36px;
                font-weight: 700;
                color: #39FF14;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            }
            .transaction-card {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 25px;
                margin: 20px 0;
                border-left: 5px solid #39FF14;
            }
            .transaction-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            .transaction-image {
                width: 80px;
                height: 80px;
                border-radius: 8px;
                object-fit: cover;
                margin-right: 20px;
                border: 2px solid #e9ecef;
            }
            .transaction-info h3 {
                color: #2c3e50;
                font-size: 20px;
                margin-bottom: 5px;
            }
            .order-id {
                color: #6c757d;
                font-size: 14px;
                font-family: monospace;
                background: #e9ecef;
                padding: 4px 8px;
                border-radius: 4px;
                display: inline-block;
            }
            .details-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            .detail-item {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }
            .detail-label {
                font-weight: 600;
                color: #495057;
                font-size: 14px;
                margin-bottom: 5px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .detail-value {
                color: #2c3e50;
                font-size: 16px;
                font-weight: 500;
                word-break: break-all;
            }
            .hash-display {
                background: #f1f3f4;
                padding: 10px;
                border-radius: 6px;
                font-family: monospace;
                font-size: 12px;
                word-break: break-all;
                border: 1px solid #e9ecef;
            }
            .wallet-info {
                background: #e8f5e8;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #39FF14;
            }
            .wallet-info h4 {
                color: #155724;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .action-buttons {
                text-align: center;
                margin: 30px 0;
            }
            .btn {
                display: inline-block;
                padding: 15px 30px;
                margin: 10px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                transition: all 0.3s ease;
            }
            .btn-primary {
                background: linear-gradient(135deg, #39FF14 0%, #32CD32 100%);
                color: #000;
            }
            .btn-secondary {
                background: #6c757d;
                color: white;
            }
            .timeline {
                margin: 30px 0;
            }
            .timeline-item {
                display: flex;
                align-items: center;
                margin: 15px 0;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .timeline-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #39FF14;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                font-size: 18px;
            }
            .timeline-content h4 {
                color: #2c3e50;
                margin-bottom: 5px;
            }
            .timeline-content p {
                color: #6c757d;
                font-size: 14px;
            }
            .footer {
                background: #2c3e50;
                color: white;
                padding: 25px 20px;
                text-align: center;
            }
            .footer-links {
                margin: 15px 0;
            }
            .footer-links a {
                color: #39FF14;
                text-decoration: none;
                margin: 0 15px;
                font-weight: 500;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 8px;
                }
                .transaction-header {
                    flex-direction: column;
                    text-align: center;
                }
                .transaction-image {
                    margin: 0 0 15px 0;
                }
                .details-grid {
                    grid-template-columns: 1fr;
                }
                .btn {
                    display: block;
                    margin: 10px 0;
                }
                .success-banner .amount {
                    font-size: 28px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 Funds Released!</h1>
                <p>Your escrow payment has been successfully released.</p>
            </div>
            
            <div class="content">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi <strong>${sellerName}</strong>,</p>
                
                <div class="success-banner">
                    <h2>🎉 Payment Received!</h2>
                    <div class="amount">${amount} ${currency}</div>
                    <p style="margin-top: 10px; color: #155724;">The funds have been transferred to your wallet</p>
                </div>
                
                <div class="transaction-card">
                    <div class="transaction-header">
                        ${listingImage ? `<img src="${listingImage}" alt="${listingTitle}" class="transaction-image">` : ''}
                        <div class="transaction-info">
                            <h3>${listingTitle}</h3>
                            <div class="order-id">Order ID: ${orderId}</div>
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Customer</div>
                            <div class="detail-value">${buyerName}</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">Amount Released</div>
                            <div class="detail-value" style="color: #39FF14; font-weight: 700;">${amount} ${currency}</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">Release Date</div>
                            <div class="detail-value">${new Date(releaseDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">Status</div>
                            <div class="detail-value">
                                <span style="background: #d4edda; color: #155724; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">COMPLETED</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${transactionHash ? `
                <div class="wallet-info">
                    <h4>🔗 Transaction Details</h4>
                    <div class="detail-label">Transaction Hash</div>
                    <div class="hash-display">${transactionHash}</div>
                    ${walletAddress ? `
                        <div style="margin-top: 15px;">
                            <div class="detail-label">Recipient Wallet</div>
                            <div class="hash-display">${walletAddress}</div>
                        </div>
                    ` : ''}
                </div>
                ` : ''}
                
                <div class="timeline">
                    <h3 style="margin-bottom: 20px; color: #2c3e50;">📋 Transaction Timeline</h3>
                    
                    <div class="timeline-item">
                        <div class="timeline-icon">📦</div>
                        <div class="timeline-content">
                            <h4>Order Placed</h4>
                            <p>Customer placed the order and funds were escrowed</p>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-icon">🚚</div>
                        <div class="timeline-content">
                            <h4>Item Shipped</h4>
                            <p>You marked the item as shipped</p>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-icon">✅</div>
                        <div class="timeline-content">
                            <h4>Order Confirmed</h4>
                            <p>Customer confirmed receipt of the item</p>
                        </div>
                    </div>
                    
                    <div class="timeline-item" style="background: #e8f5e8; border: 2px solid #39FF14;">
                        <div class="timeline-icon">💰</div>
                        <div class="timeline-content">
                            <h4>Funds Released</h4>
                            <p>Payment has been transferred to your wallet</p>
                        </div>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <a href="${dashboardUrl}" class="btn btn-primary">View Transaction</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/dashboard" class="btn btn-secondary">Dashboard</a>
                </div>
                
                <div style="background: #d1ecf1; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #17a2b8;">
                    <h4 style="color: #0c5460; margin-bottom: 10px;">💡 What's Next?</h4>
                    <ul style="color: #0c5460; margin-left: 20px;">
                        <li>Check your wallet for the received funds</li>
                        <li>Leave feedback for the buyer (optional)</li>
                        <li>Continue selling on RippleBids</li>
                        <li>Withdraw funds to your preferred exchange</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>RippleBids Marketplace</strong></p>
                <p style="margin: 10px 0; opacity: 0.8;">Secure. Decentralized. Trusted.</p>
                
                <div class="footer-links">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/dashboard">Dashboard</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/orders">Orders</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/wallet">Wallet</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/legal/terms">Terms</a>
                </div>
                
                <p style="font-size: 12px; opacity: 0.7; margin-top: 20px;">
                    This email confirms the successful release of escrowed funds.<br>
                    Transaction details are recorded on the blockchain for transparency.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};