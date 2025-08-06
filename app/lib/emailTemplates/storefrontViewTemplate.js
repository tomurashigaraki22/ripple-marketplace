export const storefrontViewTemplate = (data) => {
  const {
    sellerName,
    storefrontName,
    viewerCount,
    totalViews,
    topViewedItems = [],
    recentViewers = [],
    viewDate,
    analyticsUrl = process.env.NEXT_PUBLIC_APP_URL + '/storefront/analytics',
    storefrontUrl
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Storefront Activity Report</title>
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
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
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
            .stats-banner {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
                padding: 25px;
                text-align: center;
                margin: 20px 0;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            .stat-item {
                text-align: center;
            }
            .stat-number {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 5px;
            }
            .stat-label {
                font-size: 14px;
                opacity: 0.9;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .activity-card {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 25px;
                margin: 20px 0;
                border-left: 5px solid #ff6b6b;
            }
            .activity-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
            }
            .activity-icon {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                font-size: 24px;
                color: white;
            }
            .activity-info h3 {
                color: #2c3e50;
                font-size: 20px;
                margin-bottom: 5px;
            }
            .activity-time {
                color: #6c757d;
                font-size: 14px;
            }
            .items-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            .item-card {
                background: white;
                border-radius: 8px;
                padding: 15px;
                border: 1px solid #e9ecef;
                transition: transform 0.2s ease;
            }
            .item-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .item-image {
                width: 100%;
                height: 120px;
                border-radius: 6px;
                object-fit: cover;
                margin-bottom: 10px;
            }
            .item-title {
                font-weight: 600;
                color: #2c3e50;
                font-size: 14px;
                margin-bottom: 5px;
                line-height: 1.3;
            }
            .item-views {
                color: #6c757d;
                font-size: 12px;
            }
            .viewers-list {
                background: #e3f2fd;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .viewers-list h4 {
                color: #1976d2;
                margin-bottom: 15px;
                font-size: 16px;
            }
            .viewer-item {
                display: flex;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #bbdefb;
            }
            .viewer-item:last-child {
                border-bottom: none;
            }
            .viewer-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                color: white;
                font-weight: 600;
            }
            .viewer-info {
                flex: 1;
            }
            .viewer-name {
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 2px;
            }
            .viewer-time {
                color: #6c757d;
                font-size: 12px;
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
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                color: white;
            }
            .btn-secondary {
                background: #6c757d;
                color: white;
            }
            .tips-section {
                background: #fff3cd;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #ffc107;
            }
            .tips-section h4 {
                color: #856404;
                margin-bottom: 15px;
                font-size: 16px;
            }
            .tip-item {
                display: flex;
                align-items: flex-start;
                margin: 10px 0;
                color: #856404;
            }
            .tip-icon {
                margin-right: 10px;
                margin-top: 2px;
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
                color: #ff6b6b;
                text-decoration: none;
                margin: 0 15px;
                font-weight: 500;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 8px;
                }
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                .items-grid {
                    grid-template-columns: 1fr;
                }
                .btn {
                    display: block;
                    margin: 10px 0;
                }
                .stat-number {
                    font-size: 24px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>👀 Storefront Activity</h1>
                <p>Your store is getting attention!</p>
            </div>
            
            <div class="content">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi <strong>${sellerName}</strong>,</p>
                <p style="margin-bottom: 20px;">Great news! Your storefront <strong>${storefrontName}</strong> has been getting some attention. Here's your activity summary:</p>
                
                <div class="stats-banner">
                    <h2 style="margin-bottom: 20px;">📊 View Statistics</h2>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-number">${viewerCount}</div>
                            <div class="stat-label">New Views</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${totalViews}</div>
                            <div class="stat-label">Total Views</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${topViewedItems.length}</div>
                            <div class="stat-label">Popular Items</div>
                        </div>
                    </div>
                </div>
                
                <div class="activity-card">
                    <div class="activity-header">
                        <div class="activity-icon">📈</div>
                        <div class="activity-info">
                            <h3>Recent Activity</h3>
                            <div class="activity-time">${new Date(viewDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</div>
                        </div>
                    </div>
                    
                    <p style="color: #6c757d; margin-bottom: 20px;">
                        Your storefront received <strong>${viewerCount} new views</strong> in the last 24 hours. 
                        This brings your total views to <strong>${totalViews}</strong>!
                    </p>
                </div>
                
                ${topViewedItems.length > 0 ? `
                <div style="margin: 30px 0;">
                    <h3 style="color: #2c3e50; margin-bottom: 20px;">🔥 Most Viewed Items</h3>
                    <div class="items-grid">
                        ${topViewedItems.map(item => `
                            <div class="item-card">
                                ${item.image ? `<img src="${item.image}" alt="${item.title}" class="item-image">` : ''}
                                <div class="item-title">${item.title}</div>
                                <div class="item-views">${item.views} views</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${recentViewers.length > 0 ? `
                <div class="viewers-list">
                    <h4>👥 Recent Viewers</h4>
                    ${recentViewers.map(viewer => `
                        <div class="viewer-item">
                            <div class="viewer-avatar">
                                ${viewer.name ? viewer.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div class="viewer-info">
                                <div class="viewer-name">${viewer.name || 'Anonymous Visitor'}</div>
                                <div class="viewer-time">${new Date(viewer.viewTime).toLocaleString()}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                <div class="action-buttons">
                    <a href="${analyticsUrl}" class="btn btn-primary">View Full Analytics</a>
                    <a href="${storefrontUrl}" class="btn btn-secondary">Visit Storefront</a>
                </div>
                
                <div class="tips-section">
                    <h4>💡 Tips to Increase Views</h4>
                    
                    <div class="tip-item">
                        <span class="tip-icon">📸</span>
                        <div>Add high-quality images to your listings</div>
                    </div>
                    
                    <div class="tip-item">
                        <span class="tip-icon">📝</span>
                        <div>Write detailed, keyword-rich descriptions</div>
                    </div>
                    
                    <div class="tip-item">
                        <span class="tip-icon">💰</span>
                        <div>Price competitively within your category</div>
                    </div>
                    
                    <div class="tip-item">
                        <span class="tip-icon">⭐</span>
                        <div>Maintain excellent seller ratings</div>
                    </div>
                    
                    <div class="tip-item">
                        <span class="tip-icon">🚀</span>
                        <div>Consider promoting your best items</div>
                    </div>
                </div>
                
                <div style="background: #d1ecf1; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #17a2b8;">
                    <h4 style="color: #0c5460; margin-bottom: 10px;">📊 Want More Insights?</h4>
                    <p style="color: #0c5460; margin-bottom: 15px;">
                        Get detailed analytics including visitor demographics, peak viewing times, 
                        conversion rates, and more in your seller dashboard.
                    </p>
                    <a href="${analyticsUrl}" style="color: #17a2b8; font-weight: 600; text-decoration: none;">
                        View Advanced Analytics →
                    </a>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>RippleBids Marketplace</strong></p>
                <p style="margin: 10px 0; opacity: 0.8;">Growing your business, one view at a time</p>
                
                <div class="footer-links">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/dashboard">Dashboard</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/analytics">Analytics</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/listings">Listings</a>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/storefront/settings">Settings</a>
                </div>
                
                <p style="font-size: 12px; opacity: 0.7; margin-top: 20px;">
                    You're receiving this because you have email notifications enabled for storefront activity.<br>
                    You can manage your notification preferences in your account settings.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};