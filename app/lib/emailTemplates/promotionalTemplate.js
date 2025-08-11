export const promotionalTemplate = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.subject || 'Special Offer'} - RippleBids</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #39FF14 0%, #00ff88 100%); padding: 30px; text-align: center;">
          <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: bold;">${data.title || '🎉 Special Offer'}</h1>
          <p style="margin: 10px 0 0 0; color: #000000; font-size: 16px; opacity: 0.8;">${data.subtitle || 'Don\'t miss out on this amazing deal!'}</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          ${data.content || `
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0; color: #39FF14; font-size: 24px;">Limited Time Offer!</h2>
            <p style="margin: 0; color: #cccccc; font-size: 16px; line-height: 1.6;">Take advantage of our special promotion and save big on your next purchase.</p>
          </div>
          `}

          ${data.ctaText ? `
          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.ctaUrl || '#'}" style="display: inline-block; background: linear-gradient(135deg, #39FF14 0%, #00ff88 100%); color: #000000; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">${data.ctaText}</a>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: rgba(255, 255, 255, 0.05); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <p style="margin: 0 0 10px 0; color: #888888; font-size: 12px;">© 2025 RippleBids. All rights reserved.</p>
          <p style="margin: 0; color: #666666; font-size: 11px;">
            <a href="${data.unsubscribeUrl || '#'}" style="color: #666666; text-decoration: underline;">Unsubscribe</a> from promotional emails
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};