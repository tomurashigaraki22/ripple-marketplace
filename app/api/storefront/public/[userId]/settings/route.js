import { NextResponse } from 'next/server'
import { db } from '@/app/lib/db'

export async function GET(request, { params }) {
  try {
    const { userId } = params

    // Fetch user's storefront customization settings
    const [users] = await db.query(
      'SELECT settings FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Handle both valid JSON and invalid "[object Object]" cases
    let userSettings = users[0].settings

    
    // MIGRATION: Handle old 'storefrontCustomization' key
    let storefrontDesign = userSettings.storefrontDesign
    
    // If storefrontDesign doesn't exist but storefrontCustomization does, migrate it
    if (!storefrontDesign && userSettings.storefrontCustomization) {
      storefrontDesign = userSettings.storefrontCustomization
      console.log('Migrating old storefrontCustomization to storefrontDesign')
    }
    
    // Default settings if none exist
    if (!storefrontDesign) {
      storefrontDesign = {
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
    
    // Return properly structured settings
    return NextResponse.json({
      success: true,
      settings: {
        storefrontDesign: storefrontDesign
      }
    })

  } catch (error) {
    console.error('Error fetching public storefront settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}