export const paymentReceivedTemplate = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Received - RippleBids</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #39FF14 0%, #00ff88 100%); padding: 30px; text-align: center;">
          <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: bold;">💰 Payment Received</h1>
          <p style="margin: 10px 0 0 0; color: #000000; font-size: 16px; opacity: 0.8;">Your payment has been successfully received</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="background: rgba(57, 255, 20, 0.1); border: 1px solid rgba(57, 255, 20, 0.2); border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0; color: #39FF14; font-size: 20px;">Payment Details</h2>
            <p style="margin: 0; color: #cccccc; font-size: 16px; line-height: 1.6;">
              <strong>Amount:</strong> ${data.amount || 'N/A'} ${data.currency || 'USD'}<br>
              <strong>Order:</strong> #${data.orderId?.slice(0, 8) || 'N/A'}<br>
              <strong>Payment Method:</strong> ${data.paymentMethod || 'Crypto'}<br>
              <strong>Transaction ID:</strong> ${data.transactionId || 'N/A'}<br>
              <strong>Date:</strong> ${data.paymentDate || new Date().toLocaleDateString()}
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.orderUrl || '#'}" style="display: inline-block; background: linear-gradient(135deg, #39FF14 0%, #00ff88 100%); color: #000000; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">View Order</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: rgba(255, 255, 255, 0.05); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <p style="margin: 0; color: #888888; font-size: 12px;">© 2025 RippleBids. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};