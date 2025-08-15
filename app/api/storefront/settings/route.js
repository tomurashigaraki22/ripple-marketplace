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
      },
      // FIXED: Changed from 'storefrontCustomization' to 'storefrontDesign'
      storefrontDesign: {
        colorScheme: "neon-dark",
        customColors: {
          primary: "#39FF14",
          secondary: "#10b981",
          accent: "#3b82f6",
          background: "#000000",
          surface: "#1a1a1a",
          text: "#ffffff",
          textSecondary: "#d1d5db",
          border: "#4b5563"
        },
        backgroundType: "gradient",
        backgroundColor: "#000000",
        gradientColors: {
          from: "#1a1a1a",
          to: "#000000",
          direction: "to-br"
        },
        backgroundImage: {
          url: "",
          opacity: 0.3,
          blur: 0
        },
        typography: {
          fontFamily: "inter",
          headingFont: "inter",
          fontSize: {
            heading: 48,
            subheading: 24,
            body: 16,
            small: 14
          },
          fontWeight: {
            heading: "bold",
            body: "normal"
          }
        },
        layout: {
          containerWidth: "full",
          spacing: "normal",
          borderRadius: "xl",
          gridColumns: {
            mobile: 1,
            tablet: 2,
            desktop: 4
          }
        },
        effects: {
          glassmorphism: {
            enabled: true,
            intensity: "medium",
            blur: "md"
          },
          animations: {
            enabled: true,
            cardHover: "scale",
            pageTransition: "fade"
          },
          shadows: {
            cards: "lg",
            buttons: "md"
          }
        },
        header: {
          style: "floating",
          showAvatar: true,
          showStats: true,
          height: "normal"
        },
        branding: {
          logo: {
            url: "",
            size: "medium",
            position: "header"
          },
          favicon: "",
          socialLinks: {
            twitter: "",
            instagram: "",
            discord: "",
            website: ""
          }
        }
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
      'allowOffers', 'requireBuyerMessage', 'businessHours',
      'storefrontDesign' // FIXED: Changed from 'storefrontCustomization' to 'storefrontDesign'
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