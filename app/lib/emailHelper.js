import nodemailer from 'nodemailer';
import { db } from './db.js';

// Email templates
import { newOrderTemplate } from './emailTemplates/newOrderTemplate.js';
import { escrowReleasedTemplate } from './emailTemplates/escrowReleasedTemplate.js';
import { storefrontViewTemplate } from './emailTemplates/storefrontViewTemplate.js';
import { orderUpdateTemplate } from './emailTemplates/orderUpdateTemplate.js';
import { newsletterTemplate } from './emailTemplates/newsletterTemplate.js';
import { loginAlertTemplate } from './emailTemplates/loginAlertTemplate.js';
import { lowStockTemplate } from './emailTemplates/lowStockTemplate.js';
import { paymentReceivedTemplate } from './emailTemplates/paymentReceivedTemplate.js';
import { promotionalTemplate } from './emailTemplates/promotionalTemplate.js';

// Create nodemailer transporter
const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    secure: true,
    port: 465,
  });

// Check if user has enabled email notifications for a type
export const checkNotificationPreferences = async (userId, type) => {
  try {
    const [users] = await db.query('SELECT settings FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return false;

    const settings = JSON.parse(users[0].settings || '{}');
    const { emailNotifications = {} } = settings;
    return emailNotifications[type] !== false; // Default to true
  } catch (err) {
    console.error('Notification preference check failed:', err.message);
    return true;
  }
};

// Send email (with optional user preferences check)
export const sendEmail = async ({
  to,
  subject,
  template,
  data,
  attachments = [],
  userId,
  notificationType,
  templateName,
}) => {
  try {
    if (!to || !subject || typeof template !== 'function') {
      throw new Error(`Invalid email parameters`);
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials missing');
    }

    if (userId && notificationType) {
      const allowed = await checkNotificationPreferences(userId, notificationType);
      if (!allowed) {
        console.log(`Skipping email to ${to} — ${notificationType} disabled`);
        return { success: true, skipped: true, reason: 'User preferences' };
      }
    }

    const transporter = createTransporter();
    await transporter.verify();

    const result = await transporter.sendMail({
      from: {
        name: 'RippleBids Marketplace',
        address: process.env.GMAIL_USER,
      },
      to,
      subject,
      html: template(data),
      attachments,
    });

    console.log(`Email sent to ${to}: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (err) {
    console.error(`Email failed to ${to || 'unknown'}:`, err.message);
    return { success: false, error: err.message };
  }
};

// Template map
const templateMap = {
  newOrder: newOrderTemplate,
  orderUpdate: orderUpdateTemplate,
  paymentReceived: paymentReceivedTemplate,
  lowStock: lowStockTemplate,
  promotional: promotionalTemplate,
  newsletter: newsletterTemplate,
  loginAlert: loginAlertTemplate,
  escrowReleased: escrowReleasedTemplate,
  storefrontView: storefrontViewTemplate,
};

// Email sender wrappers
const emailWrapper = async (type, subject, template, userKey, emailKey) => async (data) =>
  await sendEmail({
    to: data[emailKey],
    subject,
    template,
    data,
    userId: data[userKey],
    notificationType: type,
    templateName: template.name,
  });

export const sendNewOrderEmail = emailWrapper(
  'newOrders',
  (data) => `🎉 New Order Received - Order #${data.orderId.slice(0, 8)}`,
  newOrderTemplate,
  'sellerId',
  'sellerEmail'
);

export const sendOrderUpdateEmail = emailWrapper(
  'orderUpdates',
  (data) => `📦 Order Update - Order #${data.orderId.slice(0, 8)}`,
  orderUpdateTemplate,
  'buyerId',
  'buyerEmail'
);

export const sendPaymentReceivedEmail = emailWrapper(
  'paymentReceived',
  (data) => `💰 Payment Received - Order #${data.orderId.slice(0, 8)}`,
  paymentReceivedTemplate,
  'sellerId',
  'sellerEmail'
);

export const sendLowStockEmail = emailWrapper(
  'lowStock',
  (data) => `⚠️ Low Stock Alert - ${data.productName}`,
  lowStockTemplate,
  'sellerId',
  'sellerEmail'
);

export const sendPromotionalEmail = emailWrapper(
  'promotions',
  (data) => data.subject || '🎉 Special Offer from RippleBids',
  promotionalTemplate,
  'userId',
  'userEmail'
);

export const sendNewsletterEmail = emailWrapper(
  'newsletter',
  (data) => `📰 RippleBids Newsletter - ${data.date || new Date().toLocaleDateString()}`,
  newsletterTemplate,
  'userId',
  'userEmail'
);

export const sendLoginAlertEmail = emailWrapper(
  'loginAlerts',
  () => '🔐 New Login Detected - RippleBids',
  loginAlertTemplate,
  'userId',
  'userEmail'
);

export const sendEscrowReleasedEmail = emailWrapper(
  'paymentReceived',
  (data) => `💰 Escrow Funds Released - Order #${data.orderId.slice(0, 8)}`,
  escrowReleasedTemplate,
  'sellerId',
  'sellerEmail'
);

export const sendStorefrontViewEmail = emailWrapper(
  'promotions',
  (data) => `👀 Your Storefront Was Viewed - ${data.viewerCount} New Views`,
  storefrontViewTemplate,
  'sellerId',
  'sellerEmail'
);

// Bulk email with delay
export const sendBulkEmails = async (emailList) => {
  const results = [];

  for (const data of emailList) {
    try {
      const result = await sendEmail(data);
      results.push({ ...data, result });
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      results.push({ ...data, result: { success: false, error: err.message } });
    }
  }

  return results;
};

// Email validation
export const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Queue email to DB
export const queueEmail = async ({ to, subject, templateName, data }) => {
  try {
    await db.query(
      `INSERT INTO email_queue (recipient, subject, template_name, data, created_at, status) 
       VALUES (?, ?, ?, ?, NOW(), 'pending')`,
      [to, subject, templateName || 'generic', JSON.stringify(data || {})]
    );
    return { success: true };
  } catch (err) {
    console.error('Queue email error:', err.message);
    return { success: false, error: err.message };
  }
};

// Process queued emails
export const processEmailQueue = async (limit = 10) => {
  try {
    const [emails] = await db.query(
      `SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
      [limit]
    );

    const results = [];

    for (const email of emails) {
      try {
        await db.query(`UPDATE email_queue SET status = 'processing' WHERE id = ?`, [email.id]);

        const parsedData = JSON.parse(email.data);
        const template = templateMap[email.template_name] || promotionalTemplate;

        const result = await sendEmail({
          to: email.recipient,
          subject: email.subject,
          template,
          data: parsedData,
          templateName: email.template_name,
        });

        const status = result.success ? 'sent' : 'failed';

        await db.query(
          `UPDATE email_queue SET status = ?, processed_at = NOW(), result = ? WHERE id = ?`,
          [status, JSON.stringify(result), email.id]
        );

        results.push({ id: email.id, status, result });
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        await db.query(
          `UPDATE email_queue SET status = 'failed', processed_at = NOW(), result = ? WHERE id = ?`,
          [JSON.stringify({ error: err.message }), email.id]
        );
        results.push({ id: email.id, status: 'failed', error: err.message });
      }
    }

    return { success: true, processed: results.length, results };
  } catch (err) {
    console.error('Failed to process email queue:', err.message);
    return { success: false, error: err.message };
  }
};

// Ensure `settings` column exists in users table
export const ensureUserSettingsColumn = async () => {
  try {
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS settings JSON DEFAULT NULL
    `);
  } catch (err) {
    console.log('Settings column may already exist:', err.message);
  }
};
