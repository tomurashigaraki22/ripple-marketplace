import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '../../../lib/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is admin
    const [users] = await db.query(
      'SELECT role, role_name FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || (users[0].role !== 'admin' && users[0].role_name !== 'admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get admin settings from database or return defaults
    const [settingsResult] = await db.query(
      'SELECT value FROM admin_settings WHERE key = "system_settings"'
    );

    let settings = {
      general: {
        siteName: 'RippleBids',
        siteDescription: 'Decentralized Marketplace',
        maintenanceMode: false,
        registrationEnabled: true
      },
      security: {
        twoFactorRequired: false,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        passwordMinLength: 8
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        adminAlerts: true
      },
      blockchain: {
        xrpNetwork: 'mainnet',
        evmNetwork: 'ethereum',
        solanaNetwork: 'mainnet-beta',
        gasLimits: {
          xrp: 1000000,
          evm: 21000,
          solana: 200000
        }
      }
    };

    if (settingsResult.length > 0) {
      try {
        const savedSettings = JSON.parse(settingsResult[0].value);
        settings = { ...settings, ...savedSettings };
      } catch (e) {
        console.error('Error parsing admin settings:', e);
      }
    }

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Admin settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is admin
    const [users] = await db.query(
      'SELECT role, role_name FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || (users[0].role !== 'admin' && users[0].role_name !== 'admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const settings = await request.json();

    // Validate settings structure
    const allowedSections = ['general', 'security', 'notifications', 'blockchain'];
    const filteredSettings = {};
    
    for (const section of allowedSections) {
      if (settings[section]) {
        filteredSettings[section] = settings[section];
      }
    }

    // Save settings to database
    await db.query(
      `INSERT INTO admin_settings (\`key\`, value, updated_at) 
       VALUES ("system_settings", ?, NOW()) 
       ON DUPLICATE KEY UPDATE value = ?, updated_at = NOW()`,
      [JSON.stringify(filteredSettings), JSON.stringify(filteredSettings)]
    );

    return NextResponse.json({
      success: true,
      message: 'Admin settings updated successfully'
    });

  } catch (error) {
    console.error('Admin settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update admin settings' },
      { status: 500 }
    );
  }
}