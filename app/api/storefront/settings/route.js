import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '../../../lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const userId = decoded.userId

    // Get user settings from database
    const settingsResult = await db.query(
      'SELECT settings FROM users WHERE id = ?',
      [userId]
    )

    if (settingsResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse settings JSON or return default settings
    let settings = {}
    if (settingsResult[0].settings) {
      try {
        settings = JSON.parse(settingsResult[0].settings)
      } catch (e) {
        console.error('Error parsing settings JSON:', e)
      }
    }

    // Merge with default settings
    const defaultSettings = {
      language: 'en',
      timezone: 'UTC',
      currency: 'USD',
      theme: 'dark',
      emailNotifications: {
        newOrders: true,
        orderUpdates: true,
        paymentReceived: true,
        lowStock: true,
        promotions: false,
        newsletter: false
      },
      pushNotifications: {
        newOrders: true,
        orderUpdates: true,
        paymentReceived: true,
        lowStock: false
      },
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      twoFactorAuth: false,
      loginAlerts: true,
      autoAcceptOrders: false,
      showInventoryCount: true,
      allowOffers: true,
      requireBuyerMessage: false,
      businessHours: {
        enabled: false,
        start: '09:00',
        end: '17:00',
        timezone: 'UTC'
      }
    }

    const mergedSettings = { ...defaultSettings, ...settings }

    return NextResponse.json({
      success: true,
      settings: mergedSettings
    })

  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const userId = decoded.userId
    const settings = await request.json()

    // Validate settings structure
    const allowedKeys = [
      'language', 'timezone', 'currency', 'theme',
      'emailNotifications', 'pushNotifications',
      'profileVisibility', 'showEmail', 'showPhone',
      'twoFactorAuth', 'loginAlerts',
      'autoAcceptOrders', 'showInventoryCount',
      'allowOffers', 'requireBuyerMessage', 'businessHours'
    ]

    const filteredSettings = {}
    for (const key of allowedKeys) {
      if (settings.hasOwnProperty(key)) {
        filteredSettings[key] = settings[key]
      }
    }

    // Update settings in database
    await db.query(
      'UPDATE users SET settings = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(filteredSettings), userId]
    )

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}