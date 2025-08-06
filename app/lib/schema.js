import { db } from './db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

function generateRandomPassword(length = 12) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function initializeDatabase() {
  try {
    // Roles table
    const createRolesTable = `
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name ENUM('user', 'admin', 'moderator') UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Membership tiers table
    const createMembershipTiersTable = `
      CREATE TABLE IF NOT EXISTS membership_tiers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name ENUM('basic', 'pro', 'premium') UNIQUE NOT NULL,
        price DECIMAL(20, 8) DEFAULT 0,
        features JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Users table (normalized)
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role_id INT DEFAULT 1,
        membership_tier_id INT DEFAULT 1,
        status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (membership_tier_id) REFERENCES membership_tiers(id)
      )
    `;

    // Wallet addresses table
    const createWalletAddressesTable = `
      CREATE TABLE IF NOT EXISTS wallet_addresses (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        chain ENUM('xrp', 'evm', 'solana') NOT NULL,
        address VARCHAR(255) NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_chain (user_id, chain, address)
      )
    `;

    // Listings table
    const createListingsTable = `
      CREATE TABLE IF NOT EXISTS listings (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(20, 8) NOT NULL,
        category VARCHAR(100) NOT NULL,
        chain ENUM('xrp', 'evm', 'solana') NOT NULL,
        is_physical BOOLEAN DEFAULT FALSE,
        images JSON,
        tags JSON,
        status ENUM('draft', 'pending', 'approved', 'rejected', 'sold') DEFAULT 'pending',
        views INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    // Orders table
    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        buyer_id VARCHAR(36) NOT NULL,
        seller_id VARCHAR(36) NOT NULL,
        listing_id VARCHAR(36) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        transaction_hash VARCHAR(255),
        status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        shipping_address JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id),
        FOREIGN KEY (seller_id) REFERENCES users(id),
        FOREIGN KEY (listing_id) REFERENCES listings(id)
      )
    `;

    // User memberships table (for tracking membership history)
    const createUserMembershipsTable = `
      CREATE TABLE IF NOT EXISTS user_memberships (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        membership_tier_id INT NOT NULL,
        price DECIMAL(20, 8) NOT NULL,
        transaction_hash VARCHAR(255),
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (membership_tier_id) REFERENCES membership_tiers(id)
      )
    `;

    // Escrows table with dynamic conditions
    const createEscrowsTable = `
      CREATE TABLE IF NOT EXISTS escrows (
        id VARCHAR(36) PRIMARY KEY,
        seller VARCHAR(255) NOT NULL,
        buyer VARCHAR(255) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        fee DECIMAL(20, 8) DEFAULT 0,
        conditions JSON NOT NULL COMMENT 'Dynamic conditions stored as JSON object',
        status ENUM('pending', 'funded', 'conditions_met', 'released', 'disputed', 'cancelled') DEFAULT 'pending',
        transaction_hash VARCHAR(255),
        release_hash VARCHAR(255),
        dispute_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_seller (seller),
        INDEX idx_buyer (buyer),
        INDEX idx_status (status)
      )
    `;

    // Notifications table for seller wallet setup
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        type ENUM('wallet_setup', 'escrow_funded', 'order_received', 'payment_released') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSON COMMENT 'Additional notification data',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_unread (user_id, is_read),
        INDEX idx_type (type)
      )
    `;

    // Messages table for buyer-seller communication
    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        room_id VARCHAR(36) NOT NULL COMMENT 'Same as order_id',
        order_id VARCHAR(36) NOT NULL,
        buyer_id VARCHAR(36) NOT NULL,
        seller_id VARCHAR(36) NOT NULL,
        message TEXT,
        image_url VARCHAR(500),
        sent_by ENUM('buyer', 'seller') NOT NULL,
        reported BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_room_id (room_id),
        INDEX idx_order_id (order_id),
        INDEX idx_created_at (created_at),
        INDEX idx_sent_by (sent_by)
      )
    `;

    // Create tables in order (dependencies first)
    await db.query(createRolesTable);
    await db.query(createMembershipTiersTable);
    await db.query(createUsersTable);
    await db.query(createWalletAddressesTable);
    await db.query(createListingsTable);
    await db.query(createOrdersTable);
    await db.query(createUserMembershipsTable);
    await db.query(createEscrowsTable);
    await db.query(createNotificationsTable);
    await db.query(createMessagesTable);

    // Insert default roles (admin first - highest role)
    const insertDefaultRoles = `
      INSERT IGNORE INTO roles (name, description) VALUES 
      ('admin', 'Administrator with full system access'),
      ('moderator', 'Moderator with content management permissions'),
      ('user', 'Regular user with basic permissions')
    `;

    // Insert default membership tiers
    const insertDefaultMembershipTiers = `
      INSERT IGNORE INTO membership_tiers (name, price, features) VALUES 
      ('basic', 0.00, JSON_OBJECT('listings_limit', 5, 'featured_listings', 0, 'analytics', false)),
      ('pro', 50.00, JSON_OBJECT('listings_limit', 25, 'featured_listings', 3, 'analytics', true)),
      ('premium', 100.00, JSON_OBJECT('listings_limit', -1, 'featured_listings', 10, 'analytics', true, 'priority_support', true))
    `;

    await db.query(insertDefaultRoles);
    await db.query(insertDefaultMembershipTiers);

    // Create demo admin user
    const demoAdminEmail = 'ripplebids@outlook.com';
    const demoAdminPassword = 'Ripplebids87991!';
    
    // Check if demo admin already exists
    const [existingAdmin] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [demoAdminEmail]
    );

    if (existingAdmin.length === 0) {
      // Get admin role ID (should be 1 since it's inserted first)
      const [adminRole] = await db.query(
        'SELECT id FROM roles WHERE name = "admin"'
      );

      if (adminRole.length > 0) {
        const hashedPassword = await bcrypt.hash(demoAdminPassword, 12);
        const adminUserId = uuidv4();

        await db.query(
          'INSERT INTO users (id, username, email, password, role_id, status) VALUES (?, ?, ?, ?, ?, "active")',
          [adminUserId, 'ripplebids_admin', demoAdminEmail, hashedPassword, adminRole[0].id]
        );

        console.log('Demo admin user created successfully');
        console.log('Email: ripplebids@outlook.com');
        console.log('Password: Ripplebids87991!');
      }
    }
    
    console.log('Database initialized successfully with normalized schema including escrows table');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export the password generation function
export { generateRandomPassword };