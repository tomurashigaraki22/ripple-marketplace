import { db } from '../lib/db.js'
import { v4 as uuidv4 } from 'uuid'

/**
 * Log an admin action to the audit trail
 * @param {Object} params - Audit log parameters
 * @param {string} params.adminId - ID of the admin performing the action
 * @param {string} params.action - Action being performed
 * @param {string} params.targetType - Type of target (listing, user, order, etc.)
 * @param {string} params.targetId - ID of the target (optional)
 * @param {Object} params.details - Additional details about the action
 * @param {string} params.ipAddress - IP address of the admin
 * @param {string} params.userAgent - User agent string
 */
export async function logAuditAction({
  adminId,
  action,
  targetType,
  targetId = null,
  details = {},
  ipAddress = 'unknown',
  userAgent = null
}) {
  try {
    const auditId = uuidv4()
    
    await db.query(
      `INSERT INTO audit_trail (id, admin_id, action, target_type, target_id, details, ip_address, user_agent, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        auditId,
        adminId,
        action,
        targetType,
        targetId,
        JSON.stringify(details),
        ipAddress,
        userAgent
      ]
    )
    
    console.log(`Audit log created: ${action} on ${targetType} by admin ${adminId}`)
    return { success: true, auditId }
  } catch (error) {
    console.error('Error logging audit action:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Helper function to extract IP address from request
 * @param {Request} request - The request object
 * @returns {string} IP address
 */
export function getClientIP(request) {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         request.headers.get('cf-connecting-ip') || 
         'unknown'
}

/**
 * Helper function to extract user agent from request
 * @param {Request} request - The request object
 * @returns {string} User agent
 */
export function getUserAgent(request) {
  return request.headers.get('user-agent') || 'unknown'
}

// Predefined action types for consistency
export const AUDIT_ACTIONS = {
  // Listing actions
  LISTING_APPROVED: 'listing_approved',
  LISTING_REJECTED: 'listing_rejected',
  LISTING_DELETED: 'listing_deleted',
  LISTING_VIEWED: 'listing_viewed',
  
  // User actions
  USER_SUSPENDED: 'user_suspended',
  USER_UNSUSPENDED: 'user_unsuspended',
  USER_DELETED: 'user_deleted',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_MEMBERSHIP_GRANTED: 'user_membership_granted',
  USER_MEMBERSHIP_REVOKED: 'user_membership_revoked',
  
  // Email actions
  EMAIL_SENT: 'admin_email_sent',
  BULK_EMAIL_SENT: 'bulk_email_sent',
  
  // Escrow actions
  ESCROW_RELEASED: 'admin_escrow_release',
  ESCROW_DISPUTED: 'escrow_disputed',
  
  // System actions
  SETTINGS_UPDATED: 'settings_updated',
  ADMIN_LOGIN: 'admin_login'
}

// Target types
export const TARGET_TYPES = {
  LISTING: 'listing',
  USER: 'user',
  ORDER: 'order',
  ESCROW: 'escrow',
  EMAIL: 'email',
  SYSTEM: 'system'
}