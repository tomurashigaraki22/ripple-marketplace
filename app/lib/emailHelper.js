import nodemailer from 'nodemailer';
import { newOrderTemplate } from './emailTemplates/newOrderTemplate.js';
import { escrowReleasedTemplate } from './emailTemplates/escrowReleasedTemplate.js';
import { storefrontViewTemplate } from './emailTemplates/storefrontViewTemplate.js';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD // Use App Password, not regular password
    },
    secure: true,
    port: 465
  });
};

// Main email sending function
export const sendEmail = async ({
  to,
  subject,
  template,
  data,
  attachments = []
}) => {
  try {
    const transporter = createTransporter();
    
    // Verify transporter
    await transporter.verify();
    
    const mailOptions = {
      from: {
        name: 'RippleBids Marketplace',
        address: process.env.GMAIL_USER
      },
      to,
      subject,
      html: template(data),
      attachments
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Specific email functions
export const sendNewOrderEmail = async (orderData) => {
  return await sendEmail({
    to: orderData.sellerEmail,
    subject: `🎉 New Order Received - Order #${orderData.orderId.slice(0, 8)}`,
    template: newOrderTemplate,
    data: orderData
  });
};

export const sendEscrowReleasedEmail = async (escrowData) => {
  return await sendEmail({
    to: escrowData.sellerEmail,
    subject: `💰 Escrow Funds Released - Order #${escrowData.orderId.slice(0, 8)}`,
    template: escrowReleasedTemplate,
    data: escrowData
  });
};

export const sendStorefrontViewEmail = async (viewData) => {
  return await sendEmail({
    to: viewData.sellerEmail,
    subject: `👀 Your Storefront Was Viewed - ${viewData.viewerCount} New Views`,
    template: storefrontViewTemplate,
    data: viewData
  });
};

// Bulk email function
export const sendBulkEmails = async (emailList) => {
  const results = [];
  
  for (const emailData of emailList) {
    try {
      const result = await sendEmail(emailData);
      results.push({ ...emailData, result });
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({ ...emailData, result: { success: false, error: error.message } });
    }
  }
  
  return results;
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};