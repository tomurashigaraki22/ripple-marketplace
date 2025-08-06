export const newOrderTemplate = (data) => {
  const {
    sellerName,
    buyerName,
    buyerEmail,
    orderId,
    listingTitle,
    listingImage,
    amount,
    currency = 'XRPB',
    orderDate,
    shippingAddress,
    orderStatus,
    dashboardUrl = process.env.NEXT_PUBLIC_APP_URL + '/storefront/orders'
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Received</title>
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
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
                opacity: 0.9;
            }
            .content {
                padding: 30px 20px;
            }
            .order-card {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 25px;
                margin: 20px 0;
                border-left: 5px solid #39FF14;
            }
            .order-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            .order-image {
                width: 80px;
                height: 80px;
                border-radius: 8px;
                object-fit: cover;
                margin-right: 20px;
                border: 2px solid #e9ecef;
            }
            .order-info h3 {
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
            }
            .amount {
                color: #39FF14;
                font-size: 24px;
                font-weight: 700;
            }
            .status {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .status.pending {
                background: #fff3cd;
                color: #856404;
            }
            .status.paid {
                background: #d4edda;
                color: #155724;
            }
            .shipping-address {
                background: #e3f2fd;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #2196f3;
            }
            .shipping-address h4 {
                color: #1976d2;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .address-text {
                color: #424242;
                line-height: 1.5;
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .btn-secondary {
                background: #6c757d;
                color: white;
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
            .social-links {
                margin: 20px 0;
            }
            .social-links a {
                display: inline-block;
                margin: 0 10px;
                color: #bdc3c7;
                font-size: 20px;
                text-decoration: none;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 8px;
                }
                .order-header {
                    flex-direction: column;
                    text-align: center;
                }
                .order-image {
                    margin: 0 0 15px 0;
                }
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
                <h1>🎉 New Order Received!</h1>
                <p>Congratulations! You have a new customer waiting.</p>
            </div>
            
            <div class="content">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi <strong>${sellerName}</strong>,</p>
                <p style="margin-bottom: 20px;">Great news! You've received a new order on RippleBids Marketplace. Here are the details:</p>
                
                <div class="order-card">
                    <div class="order-header">
                        ${listingImage ? `<img src="${listingImage}" alt="${listingTitle}" class="order-image">` : ''}
                        <div class="order-info">
                            <h3>${listingTitle}</h3>
                            <div class="order-id">Order ID: ${orderId}</div>
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Customer</div>
                            <div class="detail-value">${buyerName}</div>
                            <div style="font-size: 14px; color: #6c757d; margin-top: 5px;">${buyerEmail}</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">Amount</div>
                            <div class="detail-value amount">${amount} ${currency}</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">Order Date</div>
                            <div class="detail-value">${new Date(orderDate).toLocaleDateString('en-US', {
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
                                <span class="status ${orderStatus}">${orderStatus}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${shippingAddress ? `
                <div class="shipping-address">
                    <h4>📦 Shipping Address</h4>
                    <div class="address-text">
                        ${typeof shippingAddress === 'string' ? shippingAddress : `
                            ${shippingAddress.name || buyerName}<br>
                            ${shippingAddress.address}<br>
                            ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
                            ${shippingAddress.country}
                            ${shippingAddress.phone ? `<br>Phone: ${shippingAddress.phone}` : ''}
                        `}
                    </div>
                </div>
                ` : ''}
                
                <div class="action-buttons">
                    <a href="${dashboardUrl}" class="btn btn-primary">View Order Details</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/dashboard" class="btn btn-secondary">Go to Dashboard</a>
                </div>
                
                <div style="background: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <h4 style="color: #856404; margin-bottom: 10px;">⚡ Next Steps:</h4>
                    <ul style="color: #856404; margin-left: 20px;">
                        <li>Review the order details carefully</li>
                        <li>Prepare the item for shipping</li>
                        <li>Update the order status when shipped</li>
                        <li>Communicate with the buyer if needed</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>RippleBids Marketplace</strong></p>
                <p style="margin: 10px 0; opacity: 0.8;">Your trusted decentralized marketplace</p>
                
                <div class="footer-links">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/dashboard">Dashboard</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/orders">Orders</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/settings">Settings</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/legal/terms">Terms</a>
                </div>
                
                <div class="social-links">
                    <a href="#">📧</a>
                    <a href="#">🐦</a>
                    <a href="#">💬</a>
                </div>
                
                <p style="font-size: 12px; opacity: 0.7; margin-top: 20px;">
                    This email was sent to you because you have an active seller account on RippleBids.<br>
                    If you have any questions, please contact our support team.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};