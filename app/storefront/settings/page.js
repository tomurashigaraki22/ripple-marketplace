"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import StorefrontLayout from "../components/StorefrontLayout"
import { uploadToCloudinary } from "../../utils/cloudinary"
import {
  Settings,
  Palette,
  Eye,
  Save,
  Upload,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Type,
  Image as ImageIcon,
  Layout,
  Sparkles,
  Store,
  Grid,
  Sliders
} from "lucide-react"

export default function StorefrontSettings() {
  // State Management
  const { user, token, getValidToken } = useAuth()
  const [settings, setSettings] = useState({})
  const [originalSettings, setOriginalSettings] = useState({})
  const [userChanges, setUserChanges] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("account")
  const [activeDesignSection, setActiveDesignSection] = useState("colors")
  const [previewDevice, setPreviewDevice] = useState("desktop")
  const [isUploading, setIsUploading] = useState(false)

  // Default Settings Structure
  const defaultSettings = {
    // Account Settings
    language: "en",
    timezone: "UTC",
    theme: "dark",
    emailNotifications: {
      newOrders: true,
      paymentReceived: true,
      lowStock: true,
      promotions: false,
    },
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    twoFactorAuth: false,
    autoAcceptOrders: false,
    showInventoryCount: true,
    allowOffers: true,
    
    // Storefront Design Settings
    storefrontDesign: {
      // Color Schemes
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
      
      // Background
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
      
      // Typography
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
      
      // Layout & Effects
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
      
      // Glass & Effects
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
      
      // Header & Branding
      header: {
        style: "floating",
        showAvatar: true,
        showStats: true,
        height: "normal"
      },
      
      // Logo & Branding
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

  // Predefined Color Schemes
  const colorSchemes = {
    "neon-dark": {
      name: "Neon Dark",
      primary: "#39FF14",
      secondary: "#10b981",
      accent: "#3b82f6",
      background: "#000000",
      surface: "#1a1a1a",
      text: "#ffffff",
      textSecondary: "#d1d5db",
      border: "#4b5563"
    },
    "cyber-blue": {
      name: "Cyber Blue",
      primary: "#00d4ff",
      secondary: "#0099cc",
      accent: "#ff6b35",
      background: "#0a0a0a",
      surface: "#1a1a2e",
      text: "#ffffff",
      textSecondary: "#b3b3b3",
      border: "#16213e"
    },
    "purple-haze": {
      name: "Purple Haze",
      primary: "#8b5cf6",
      secondary: "#a855f7",
      accent: "#ec4899",
      background: "#0f0f23",
      surface: "#1e1b4b",
      text: "#ffffff",
      textSecondary: "#c4b5fd",
      border: "#4c1d95"
    },
    "forest-green": {
      name: "Forest Green",
      primary: "#10b981",
      secondary: "#059669",
      accent: "#f59e0b",
      background: "#064e3b",
      surface: "#065f46",
      text: "#ffffff",
      textSecondary: "#d1fae5",
      border: "#047857"
    },
    "sunset-orange": {
      name: "Sunset Orange",
      primary: "#ff6b35",
      secondary: "#f59e0b",
      accent: "#8b5cf6",
      background: "#1a0f0a",
      surface: "#2d1b14",
      text: "#ffffff",
      textSecondary: "#fed7aa",
      border: "#c2410c"
    }
  }
  
  // Predefined Background Themes
  const backgroundThemes = {
    "dark-gradient": {
      name: "Dark Gradient",
      type: "gradient",
      from: "#1a1a1a",
      to: "#000000",
      direction: "to-br"
    },
    "neon-gradient": {
      name: "Neon Gradient",
      type: "gradient",
      from: "#39FF14",
      to: "#000000",
      direction: "to-br"
    },
    "cyber-gradient": {
      name: "Cyber Gradient",
      type: "gradient",
      from: "#00d4ff",
      to: "#0a0a0a",
      direction: "to-br"
    },
    "purple-gradient": {
      name: "Purple Gradient",
      type: "gradient",
      from: "#8b5cf6",
      to: "#0f0f23",
      direction: "to-br"
    },
    "solid-black": {
      name: "Solid Black",
      type: "solid",
      color: "#000000"
    },
    "solid-dark": {
      name: "Solid Dark",
      type: "solid",
      color: "#1a1a1a"
    }
  }

  // Predefined Gradient Themes
  const gradientThemes = {
    "neon-cyber": {
      name: "Neon Cyber",
      from: "#39FF14",
      to: "#00d4ff",
      direction: "to-br"
    },
    "purple-dream": {
      name: "Purple Dream",
      from: "#8b5cf6",
      to: "#ec4899",
      direction: "to-r"
    },
    "ocean-blue": {
      name: "Ocean Blue",
      from: "#0ea5e9",
      to: "#1e40af",
      direction: "to-b"
    },
    "sunset-glow": {
      name: "Sunset Glow",
      from: "#f59e0b",
      to: "#dc2626",
      direction: "to-bl"
    },
    "forest-mist": {
      name: "Forest Mist",
      from: "#10b981",
      to: "#065f46",
      direction: "to-t"
    },
    "dark-matter": {
      name: "Dark Matter",
      from: "#1f2937",
      to: "#000000",
      direction: "to-br"
    }
  }

  // Core Functions
  const deepMerge = (target, source) => {
    const result = { ...target }
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    return result
  }

  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.')
    const lastKey = keys.pop()
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  const trackChange = (path, value) => {
    setUserChanges(prev => {
      const newChanges = { ...prev }
      setNestedValue(newChanges, path, value)
      return newChanges
    })
  }

  const handleChange = (path, value) => {
    // Update display settings
    setSettings(prev => {
      const newSettings = { ...prev }
      setNestedValue(newSettings, path, value)
      return newSettings
    })
    
    // Track change
    trackChange(path, value)
  }

  const applyColorScheme = (schemeKey) => {
    const scheme = colorSchemes[schemeKey]
    if (!scheme) return
    
    const colorPaths = {
      'storefrontDesign.colorScheme': schemeKey,
      'storefrontDesign.customColors.primary': scheme.primary,
      'storefrontDesign.customColors.secondary': scheme.secondary,
      'storefrontDesign.customColors.accent': scheme.accent,
      'storefrontDesign.customColors.background': scheme.background,
      'storefrontDesign.customColors.surface': scheme.surface,
      'storefrontDesign.customColors.text': scheme.text,
      'storefrontDesign.customColors.textSecondary': scheme.textSecondary,
      'storefrontDesign.customColors.border': scheme.border
    }
    
    Object.entries(colorPaths).forEach(([path, value]) => {
      handleChange(path, value)
    })
  }

  const applyGradientTheme = (themeKey) => {
    const theme = gradientThemes[themeKey]
    if (!theme) return
    
    handleChange('storefrontDesign.backgroundType', 'gradient')
    handleChange('storefrontDesign.gradientColors.from', theme.from)
    handleChange('storefrontDesign.gradientColors.to', theme.to)
    handleChange('storefrontDesign.gradientColors.direction', theme.direction)
  }

  const applyBackgroundTheme = (themeKey) => {
    const theme = backgroundThemes[themeKey]
    if (!theme) return
    
    if (theme.type === 'gradient') {
      handleChange('storefrontDesign.backgroundType', 'gradient')
      handleChange('storefrontDesign.gradientColors.from', theme.from)
      handleChange('storefrontDesign.gradientColors.to', theme.to)
      handleChange('storefrontDesign.gradientColors.direction', theme.direction)
    } else if (theme.type === 'solid') {
      handleChange('storefrontDesign.backgroundType', 'solid')
      handleChange('storefrontDesign.backgroundColor', theme.color)
    }
  }

  const handleImageUpload = async (event, path) => {
    const file = event.target.files[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file (JPG, PNG, or WebP)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB")
      return
    }

    try {
      setIsUploading(true)
      const result = await uploadToCloudinary(file)
      handleChange(path, result.url)
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const authToken = token || getValidToken()
      const response = await fetch("/api/storefront/settings", {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const serverSettings = data.settings || {}
        setOriginalSettings(serverSettings)
        const mergedSettings = deepMerge(defaultSettings, serverSettings)
        setSettings(mergedSettings)
        setUserChanges({})
      } else {
        setOriginalSettings({})
        setSettings(defaultSettings)
        setUserChanges({})
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
      setOriginalSettings({})
      setSettings(defaultSettings)
      setUserChanges({})
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage("")

    try {
      if (Object.keys(userChanges).length === 0) {
        setMessage("No changes to save")
        setSaving(false)
        return
      }

      const authToken = token || getValidToken()
      const settingsToSave = deepMerge(originalSettings, userChanges)
      
      const response = await fetch("/api/storefront/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(settingsToSave)
      })

      console.log("Response: ", response)

      if (response.ok) {
        setMessage("Settings saved successfully!")
        setOriginalSettings(settingsToSave)
        setUserChanges({})
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Failed to save settings")
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      setMessage("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39FF14]"></div>
        </div>
      </StorefrontLayout>
    )
  }

const LivePreview = () => {
  const storefrontDesign = settings.storefrontDesign || {}
  const colors = storefrontDesign.customColors || {}
  const effects = storefrontDesign.effects || {}
  const typography = storefrontDesign.typography || {}
  const layout = storefrontDesign.layout || {}
  
  // Add logo size mapping
  const getLogoSize = (size) => {
    switch(size) {
      case 'small': return 'w-6 h-6'
      case 'medium': return 'w-8 h-8'
      case 'large': return 'w-12 h-12'
      default: return 'w-8 h-8'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Enhanced Preview Header */}
      <div className="bg-gradient-to-r from-[#39FF14]/10 via-transparent to-[#39FF14]/10 backdrop-blur-xl rounded-2xl border border-[#39FF14]/20 p-6 shadow-2xl shadow-[#39FF14]/10 hover:shadow-[#39FF14]/20 transition-all duration-500 hover:scale-[1.02] hover:border-[#39FF14]/40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <Eye className="w-6 h-6 text-[#39FF14] animate-pulse" />
            <span className="bg-gradient-to-r from-white to-[#39FF14] bg-clip-text text-transparent">Live Preview</span>
          </h3>
          
          {/* Enhanced Device Selector */}
          <div className="flex space-x-2 bg-black/30 backdrop-blur-sm rounded-xl p-1 border border-white/10">
            {[
              { device: 'desktop', icon: Monitor, size: 'w-5 h-5' },
              { device: 'tablet', icon: Tablet, size: 'w-4 h-4' },
              { device: 'mobile', icon: Smartphone, size: 'w-4 h-4' }
            ].map(({ device, icon: Icon, size }) => (
              <button
                key={device}
                onClick={() => setPreviewDevice(device)}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                  previewDevice === device
                    ? 'bg-[#39FF14]/20 text-[#39FF14] shadow-lg shadow-[#39FF14]/30 border border-[#39FF14]/40'
                    : 'text-gray-400 hover:text-white hover:bg-white/10 hover:shadow-lg'
                }`}
              >
                <Icon className={size} />
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Preview Container */}
        <div className={`mx-auto bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl hover:shadow-[#39FF14]/20 transition-all duration-500 ${
          previewDevice === 'mobile' ? 'w-80 h-96' :
          previewDevice === 'tablet' ? 'w-96 h-80' :
          'w-full h-96'
        }`}>
          {/* Dynamic Background */}
          <div className="relative w-full h-full">
            {storefrontDesign.backgroundType === 'gradient' && (
              <div 
                className={`absolute inset-0`}
                style={{
                  backgroundImage: `linear-gradient(${
                    storefrontDesign.gradientColors?.direction === 'to-r' ? 'to right' : 
                    storefrontDesign.gradientColors?.direction === 'to-l' ? 'to left' :
                    storefrontDesign.gradientColors?.direction === 'to-b' ? 'to bottom' :
                    storefrontDesign.gradientColors?.direction === 'to-t' ? 'to top' :
                    storefrontDesign.gradientColors?.direction === 'to-br' ? 'to bottom right' :
                    'to bottom left'
                  }, ${storefrontDesign.gradientColors?.from || colors.background || '#1a1a1a'}, ${storefrontDesign.gradientColors?.to || colors.surface || '#000000'})`
                }}
              />
            )}
            
            {storefrontDesign.backgroundType === 'solid' && (
              <div 
                className="absolute inset-0"
                style={{
                  backgroundColor: storefrontDesign.backgroundColor || colors.background || '#000000'
                }}
              />
            )}
            
            {storefrontDesign.backgroundType === 'image' && storefrontDesign.backgroundImage?.url && (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${storefrontDesign.backgroundImage.url})`,
                  opacity: storefrontDesign.backgroundImage.opacity || 0.3,
                  filter: `blur(${storefrontDesign.backgroundImage.blur || 0}px)`
                }}
              />
            )}
            
            {/* Glassmorphism Overlay */}
            {effects.glassmorphism?.enabled && (
              <div className={`absolute inset-0 backdrop-blur-${effects.glassmorphism?.blur || 'md'} bg-white/5 border border-white/10`} />
            )}

            {/* Enhanced Preview Content */}
            <div className="relative z-10 p-6 h-full flex flex-col">
              {/* Enhanced Header */}
              <div 
                className="bg-gradient-to-r from-black/40 via-black/20 to-black/40 backdrop-blur-xl rounded-2xl border border-[#39FF14]/20 p-4 mb-6 shadow-xl hover:shadow-[#39FF14]/30 transition-all duration-500 hover:scale-[1.02]"
                style={{
                  backgroundColor: `${colors.surface || '#1a1a1a'}20`,
                  borderColor: `${colors.primary || '#39FF14'}40`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {storefrontDesign.branding?.logo?.url ? (
                      <img 
                        src={storefrontDesign.branding.logo.url} 
                        alt="Logo" 
                        className={`${getLogoSize(storefrontDesign.branding.logo.size)} rounded-lg shadow-lg hover:scale-110 transition-transform duration-300 object-contain`}
                      />
                    ) : (
                      <div className={`${getLogoSize('medium')} bg-gradient-to-br from-[${colors.primary || '#39FF14'}] to-[${colors.primary || '#39FF14'}]/60 rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300`}>
                        <Store className="w-4 h-4 text-black" />
                      </div>
                    )}
                    <span 
                      className="font-bold bg-gradient-to-r from-white to-[#39FF14] bg-clip-text text-transparent"
                      style={{ 
                        fontFamily: typography.headingFont || 'inter',
                        fontSize: `${(typography.fontSize?.heading || 48) / 3}px`,
                        color: colors.text || '#ffffff'
                      }}
                    >
                      My Storefront
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Social Links */}
                    {storefrontDesign.branding?.socialLinks && (
                      <div className="flex space-x-2">
                        {storefrontDesign.branding.socialLinks.twitter && (
                          <a href={storefrontDesign.branding.socialLinks.twitter} className="text-blue-400 hover:text-blue-300 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                          </a>
                        )}
                        {storefrontDesign.branding.socialLinks.instagram && (
                          <a href={storefrontDesign.branding.socialLinks.instagram} className="text-pink-400 hover:text-pink-300 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323C5.902 8.198 7.053 7.708 8.35 7.708s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387zm7.718 0c-1.297 0-2.448-.49-3.323-1.297-.897-.875-1.387-2.026-1.387-3.323s.49-2.448 1.297-3.323c.875-.897 2.026-1.387 3.323-1.387s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387z"/></svg>
                          </a>
                        )}
                        {storefrontDesign.branding.socialLinks.discord && (
                          <a href={storefrontDesign.branding.socialLinks.discord} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/></svg>
                          </a>
                        )}
                        {storefrontDesign.branding.socialLinks.website && (
                          <a href={storefrontDesign.branding.socialLinks.website} className="text-gray-400 hover:text-gray-300 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                          </a>
                        )}
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium border shadow-lg hover:shadow-[#39FF14]/40 transition-all duration-300 hover:scale-105"
                        style={{
                          backgroundColor: `${colors.primary || '#39FF14'}20`,
                          color: colors.primary || '#39FF14',
                          borderColor: `${colors.primary || '#39FF14'}30`
                        }}
                      >
                        24 Items
                      </span>
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/30 shadow-lg hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105">1.2k Views</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Product Grid */}
              <div className={`grid gap-4 flex-1 ${
                previewDevice === 'mobile' ? `grid-cols-${layout.gridColumns?.mobile || 1}` :
                previewDevice === 'tablet' ? `grid-cols-${layout.gridColumns?.tablet || 2}` :
                `grid-cols-${layout.gridColumns?.desktop || 4}`
              }`}>
                {[1, 2, 3, 4].slice(0, previewDevice === 'mobile' ? (layout.gridColumns?.mobile || 1) * 2 : previewDevice === 'tablet' ? (layout.gridColumns?.tablet || 2) * 2 : 4).map(i => (
                  <div 
                    key={i}
                    className={`group bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer ${
                      effects.glassmorphism?.enabled ? 'backdrop-blur-xl bg-white/5' : ''
                    }`}
                    style={{
                      borderRadius: `${
                        storefrontDesign.layout?.borderRadius === 'none' ? '0' :
                        storefrontDesign.layout?.borderRadius === 'sm' ? '0.375rem' :
                        storefrontDesign.layout?.borderRadius === 'md' ? '0.5rem' :
                        storefrontDesign.layout?.borderRadius === 'lg' ? '0.75rem' :
                        storefrontDesign.layout?.borderRadius === 'xl' ? '1rem' :
                        storefrontDesign.layout?.borderRadius === '2xl' ? '1.5rem' :
                        storefrontDesign.layout?.borderRadius === 'full' ? '9999px' : '1rem'
                      }`,
                      borderColor: `${colors.border || '#4b5563'}`,
                      backgroundColor: `${colors.surface || '#1a1a1a'}20`
                    }}
                  >
                    <div 
                      className="rounded-xl h-24 mb-3 flex items-center justify-center group-hover:from-[#39FF14]/20 group-hover:to-[#39FF14]/10 transition-all duration-500"
                      style={{
                        background: `linear-gradient(to bottom right, ${colors.surface || '#374151'}50, ${colors.background || '#1f2937'}50)`
                      }}
                    >
                      <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-[#39FF14] transition-colors duration-300" />
                    </div>
                    <h4 
                      className="font-medium text-sm mb-2 group-hover:text-[#39FF14] transition-colors duration-300"
                      style={{ color: colors.text || '#ffffff' }}
                    >
                      NFT Item #{i}
                    </h4>
                    <p 
                      className="text-xs mb-3 group-hover:text-gray-300 transition-colors duration-300"
                      style={{ color: colors.textSecondary || '#9ca3af' }}
                    >
                      Digital collectible artwork
                    </p>
                    <div className="flex items-center justify-between">
                      <span 
                        className="font-bold text-sm group-hover:scale-110 transition-transform duration-300"
                        style={{ color: colors.primary || '#39FF14' }}
                      >
                        0.{i}5 ETH
                      </span>
                      <button 
                        className="px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        style={{
                          backgroundColor: `${colors.primary || '#39FF14'}20`,
                          color: colors.primary || '#39FF14',
                          borderColor: `${colors.primary || '#39FF14'}30`
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = colors.primary || '#39FF14'
                          e.target.style.color = '#000000'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = `${colors.primary || '#39FF14'}20`
                          e.target.style.color = colors.primary || '#39FF14'
                        }}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

  // Account Settings Tab
  const AccountSettingsTab = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Account Settings</h2>
        <p className="text-gray-400">Manage your account preferences and business settings</p>
      </div>

      {/* Basic Preferences */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
            <select
              value={settings.language || 'en'}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]/50"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
            <select
              value={settings.timezone || 'UTC'}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]/50"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
        <div className="space-y-4">
          {[
            { key: 'newOrders', label: 'New Orders', desc: 'Get notified when you receive new orders' },
            { key: 'paymentReceived', label: 'Payment Received', desc: 'Get notified when payments are received' },
            { key: 'lowStock', label: 'Low Stock', desc: 'Get notified when items are running low' },
            { key: 'promotions', label: 'Promotions', desc: 'Receive promotional emails and updates' }
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="text-white font-medium">{item.label}</h4>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
              <button
                onClick={() => handleChange(`emailNotifications.${item.key}`, !settings.emailNotifications?.[item.key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotifications?.[item.key] ? 'bg-[#39FF14]' : 'bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications?.[item.key] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Business Settings */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Business Settings</h3>
        <div className="space-y-4">
          {[
            { key: 'autoAcceptOrders', label: 'Auto Accept Orders', desc: 'Automatically accept incoming orders' },
            { key: 'showInventoryCount', label: 'Show Inventory Count', desc: 'Display remaining stock to customers' },
            { key: 'allowOffers', label: 'Allow Offers', desc: 'Let customers make offers on your items' }
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="text-white font-medium">{item.label}</h4>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
              <button
                onClick={() => handleChange(item.key, !settings[item.key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[item.key] ? 'bg-[#39FF14]' : 'bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const StorefrontDesignTab = () => {
    const designSections = [
      { id: 'colors', name: 'Colors & Themes', icon: Palette },
      { id: 'background', name: 'Background', icon: ImageIcon },
      { id: 'typography', name: 'Typography', icon: Type },
      { id: 'layout', name: 'Layout & Effects', icon: Layout },
      { id: 'branding', name: 'Logo & Branding', icon: Store }
    ]

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Design Controls */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Storefront Design</h2>
            <p className="text-gray-400">Customize your storefront appearance with live preview</p>
          </div>

          {/* Design Section Tabs */}
          <div className="flex flex-wrap gap-2">
            {designSections.map(section => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveDesignSection(section.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeDesignSection === section.id
                      ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{section.name}</span>
                </button>
              )
            })}
          </div>

          {/* Design Controls Content */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            {activeDesignSection === 'colors' && <ColorsSection />}
            {activeDesignSection === 'background' && <BackgroundSection />}
            {activeDesignSection === 'typography' && <TypographySection />}
            {activeDesignSection === 'layout' && <LayoutSection />}
            {activeDesignSection === 'branding' && <BrandingSection />}
          </div>
        </div>

        {/* Live Preview */}
        <div className="xl:sticky xl:top-6">
          <LivePreview />
        </div>
      </div>
    )
  }

  // Colors Section Component
  const ColorsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Colors & Themes</h3>
      
      {/* Predefined Color Schemes */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Color Schemes</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(colorSchemes).map(([key, scheme]) => (
            <button
              key={key}
              onClick={() => applyColorScheme(key)}
              className={`p-3 rounded-lg border transition-all text-left ${
                settings.storefrontDesign?.colorScheme === key
                  ? 'border-[#39FF14] bg-[#39FF14]/10'
                  : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex space-x-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: scheme.primary }}></div>
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: scheme.secondary }}></div>
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: scheme.accent }}></div>
                </div>
                <span className="text-white font-medium text-sm">{scheme.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Custom Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Custom Colors</label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'primary', label: 'Primary' },
            { key: 'secondary', label: 'Secondary' },
            { key: 'accent', label: 'Accent' },
            { key: 'background', label: 'Background' },
            { key: 'surface', label: 'Surface' },
            { key: 'text', label: 'Text' }
          ].map(color => (
            <div key={color.key}>
              <label className="block text-xs text-gray-400 mb-1">{color.label}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.storefrontDesign?.customColors?.[color.key] || '#000000'}
                  onChange={(e) => handleChange(`storefrontDesign.customColors.${color.key}`, e.target.value)}
                  className="w-8 h-8 rounded border border-gray-600 bg-transparent"
                />
                <input
                  type="text"
                  value={settings.storefrontDesign?.customColors?.[color.key] || '#000000'}
                  onChange={(e) => handleChange(`storefrontDesign.customColors.${color.key}`, e.target.value)}
                  className="flex-1 bg-black/50 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Enhanced Background Section Component
  const BackgroundSection = () => (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
          <ImageIcon className="w-4 h-4 text-white" />
        </div>
        <span className="bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">Background</span>
      </h3>

      <div>
      <label className="block text-sm font-medium text-gray-300 mb-3">Background Themes</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(backgroundThemes).map(([key, theme]) => (
          <button
            key={key}
            onClick={() => applyBackgroundTheme(key)}
            className="p-3 rounded-lg border transition-all text-left hover:scale-105 border-gray-600 bg-gray-800/50 hover:border-gray-500"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div 
                className="w-8 h-6 rounded"
                style={{
                  background: theme.type === 'gradient' 
                    ? `linear-gradient(${theme.direction === 'to-br' ? 'to bottom right' : theme.direction}, ${theme.from}, ${theme.to})`
                    : theme.color
                }}
              ></div>
              <span className="text-white font-medium text-sm">{theme.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
      
      {/* Background Type */}
      <div>
        <label className="block text-lg font-semibold text-gray-300 mb-4">Background Type</label>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 'solid', label: 'Solid Color', icon: '🎨' },
            { value: 'gradient', label: 'Gradient', icon: '🌈' },
            { value: 'image', label: 'Image', icon: '🖼️' }
          ].map(type => (
            <button
              key={type.value}
              onClick={() => handleChange('storefrontDesign.backgroundType', type.value)}
              className={`group p-4 rounded-2xl border text-sm transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 shadow-lg ${
                settings.storefrontDesign?.backgroundType === type.value
                  ? 'border-[#39FF14] bg-gradient-to-br from-[#39FF14]/20 to-[#39FF14]/10 text-[#39FF14] shadow-[#39FF14]/30'
                  : 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-900/50 text-gray-300 hover:border-gray-500 hover:shadow-xl hover:text-white'
              }`}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">{type.icon}</div>
              <div className="font-medium">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Solid Color Settings */}
      {settings.storefrontDesign?.backgroundType === 'solid' && (
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <label className="block text-lg font-semibold text-gray-300 mb-4">Background Color</label>
          <div className="flex items-center space-x-4">
            <input
              type="color"
              value={settings.storefrontDesign?.backgroundColor || '#000000'}
              onChange={(e) => handleChange('storefrontDesign.backgroundColor', e.target.value)}
              className="w-16 h-16 rounded-xl border-2 border-gray-600 bg-transparent shadow-lg hover:shadow-[#39FF14]/30 hover:border-[#39FF14]/50 transition-all duration-300 hover:scale-110"
            />
            <input
              type="text"
              value={settings.storefrontDesign?.backgroundColor || '#000000'}
              onChange={(e) => handleChange('storefrontDesign.backgroundColor', e.target.value)}
              className="flex-1 bg-black/50 backdrop-blur-sm border border-gray-600 rounded-xl px-4 py-3 text-white shadow-lg hover:shadow-[#39FF14]/20 hover:border-[#39FF14]/50 focus:border-[#39FF14] focus:ring-2 focus:ring-[#39FF14]/20 transition-all duration-300"
              placeholder="#000000"
            />
          </div>
        </div>
      )}
      
      {/* Gradient Settings */}
      {settings.storefrontDesign?.backgroundType === 'gradient' && (
        <div className="space-y-6">
          {/* Gradient Themes */}
          <div>
            <label className="block text-lg font-semibold text-gray-300 mb-4">Gradient Themes</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(gradientThemes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => applyGradientTheme(key)}
                  className="group p-4 rounded-2xl border transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl text-left"
                  style={{
                    background: `linear-gradient(${
                      theme.direction === 'to-r' ? 'to right' : 
                      theme.direction === 'to-l' ? 'to left' :
                      theme.direction === 'to-b' ? 'to bottom' :
                      theme.direction === 'to-t' ? 'to top' :
                      theme.direction === 'to-br' ? 'to bottom right' :
                      theme.direction === 'to-bl' ? 'to bottom left' :
                      'to bottom right'
                    }, ${theme.from}, ${theme.to})`,
                    borderColor: '#4b5563'
                  }}
                >
                  <div className="text-white font-bold text-sm group-hover:scale-110 transition-transform duration-300">
                    {theme.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom Gradient */}
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
            <h4 className="text-lg font-semibold text-white">Custom Gradient</h4>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">From Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={settings.storefrontDesign?.gradientColors?.from || '#1a1a1a'}
                    onChange={(e) => handleChange('storefrontDesign.gradientColors.from', e.target.value)}
                    className="w-12 h-12 rounded-xl border-2 border-gray-600 shadow-lg hover:shadow-[#39FF14]/30 hover:border-[#39FF14]/50 transition-all duration-300 hover:scale-110"
                  />
                  <input
                    type="text"
                    value={settings.storefrontDesign?.gradientColors?.from || '#1a1a1a'}
                    onChange={(e) => handleChange('storefrontDesign.gradientColors.from', e.target.value)}
                    className="flex-1 bg-black/50 backdrop-blur-sm border border-gray-600 rounded-xl px-3 py-2 text-white shadow-lg hover:shadow-[#39FF14]/20 hover:border-[#39FF14]/50 focus:border-[#39FF14] focus:ring-2 focus:ring-[#39FF14]/20 transition-all duration-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">To Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={settings.storefrontDesign?.gradientColors?.to || '#000000'}
                    onChange={(e) => handleChange('storefrontDesign.gradientColors.to', e.target.value)}
                    className="w-12 h-12 rounded-xl border-2 border-gray-600 shadow-lg hover:shadow-[#39FF14]/30 hover:border-[#39FF14]/50 transition-all duration-300 hover:scale-110"
                  />
                  <input
                    type="text"
                    value={settings.storefrontDesign?.gradientColors?.to || '#000000'}
                    onChange={(e) => handleChange('storefrontDesign.gradientColors.to', e.target.value)}
                    className="flex-1 bg-black/50 backdrop-blur-sm border border-gray-600 rounded-xl px-3 py-2 text-white shadow-lg hover:shadow-[#39FF14]/20 hover:border-[#39FF14]/50 focus:border-[#39FF14] focus:ring-2 focus:ring-[#39FF14]/20 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Direction</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'to-r', label: 'Left → Right', icon: '→' },
                  { value: 'to-l', label: 'Right → Left', icon: '←' },
                  { value: 'to-b', label: 'Top → Bottom', icon: '↓' },
                  { value: 'to-t', label: 'Bottom → Top', icon: '↑' },
                  { value: 'to-br', label: 'Top-Left → Bottom-Right', icon: '↘' },
                  { value: 'to-bl', label: 'Top-Right → Bottom-Left', icon: '↙' }
                ].map(direction => (
                  <button
                    key={direction.value}
                    onClick={() => handleChange('storefrontDesign.gradientColors.direction', direction.value)}
                    className={`p-3 rounded-xl border text-sm transition-all duration-300 transform hover:scale-105 ${
                      settings.storefrontDesign?.gradientColors?.direction === direction.value
                        ? 'border-[#39FF14] bg-[#39FF14]/20 text-[#39FF14]'
                        : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    <div className="text-lg mb-1">{direction.icon}</div>
                    <div className="text-xs">{direction.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Upload */}
      {settings.storefrontDesign?.backgroundType === 'image' && (
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-300 mb-4">Background Image</label>
            <div className="border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center hover:border-[#39FF14]/50 transition-all duration-300">
              {settings.storefrontDesign?.backgroundImage?.url ? (
                <div className="space-y-4">
                  <img 
                    src={settings.storefrontDesign.backgroundImage.url} 
                    alt="Background" 
                    className="w-full h-40 object-cover rounded-xl shadow-lg"
                  />
                  <button
                    onClick={() => handleChange('storefrontDesign.backgroundImage.url', '')}
                    className="text-red-400 hover:text-red-300 text-sm font-medium px-4 py-2 rounded-lg border border-red-400/30 hover:bg-red-400/10 transition-all duration-300"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-4">Upload background image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'storefrontDesign.backgroundImage.url')}
                    className="hidden"
                    id="bg-upload"
                  />
                  <label
                    htmlFor="bg-upload"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#39FF14]/80 text-black rounded-xl cursor-pointer hover:from-[#39FF14]/90 hover:to-[#39FF14]/70 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[#39FF14]/40 font-medium"
                  >
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>
          
          {settings.storefrontDesign?.backgroundImage?.url && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Opacity</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.storefrontDesign?.backgroundImage?.opacity || 0.3}
                    onChange={(e) => handleChange('storefrontDesign.backgroundImage.opacity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-center text-sm text-gray-400">
                    {Math.round((settings.storefrontDesign?.backgroundImage?.opacity || 0.3) * 100)}%
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Blur</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={settings.storefrontDesign?.backgroundImage?.blur || 0}
                    onChange={(e) => handleChange('storefrontDesign.backgroundImage.blur', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-center text-sm text-gray-400">
                    {settings.storefrontDesign?.backgroundImage?.blur || 0}px
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // Typography Section Component
  const TypographySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Typography</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Font Family</label>
          <select
            value={settings.storefrontDesign?.typography?.fontFamily || 'inter'}
            onChange={(e) => handleChange('storefrontDesign.typography.fontFamily', e.target.value)}
            className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="inter">Inter</option>
            <option value="roboto">Roboto</option>
            <option value="poppins">Poppins</option>
            <option value="montserrat">Montserrat</option>
            <option value="playfair">Playfair Display</option>
            <option value="oswald">Oswald</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Heading Font</label>
          <select
            value={settings.storefrontDesign?.typography?.headingFont || 'inter'}
            onChange={(e) => handleChange('storefrontDesign.typography.headingFont', e.target.value)}
            className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="inter">Inter</option>
            <option value="roboto">Roboto</option>
            <option value="poppins">Poppins</option>
            <option value="montserrat">Montserrat</option>
            <option value="playfair">Playfair Display</option>
            <option value="oswald">Oswald</option>
          </select>
        </div>
      </div>
      
      {/* Font Sizes */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Font Sizes</label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'heading', label: 'Heading', min: 24, max: 72, default: 48 },
            { key: 'subheading', label: 'Subheading', min: 16, max: 36, default: 24 },
            { key: 'body', label: 'Body', min: 12, max: 24, default: 16 },
            { key: 'small', label: 'Small', min: 10, max: 18, default: 14 }
          ].map(size => (
            <div key={size.key}>
              <label className="block text-xs text-gray-400 mb-1">{size.label}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min={size.min}
                  max={size.max}
                  value={settings.storefrontDesign?.typography?.fontSize?.[size.key] || size.default}
                  onChange={(e) => handleChange(`storefrontDesign.typography.fontSize.${size.key}`, parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white text-sm w-8">
                  {settings.storefrontDesign?.typography?.fontSize?.[size.key] || size.default}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Layout Section Component
  const LayoutSection = () => (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
          <Layout className="w-4 h-4 text-white" />
        </div>
        <span className="bg-gradient-to-r from-white to-orange-400 bg-clip-text text-transparent">Layout & Effects</span>
      </h3>
      
      {/* Border Radius */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="block text-lg font-semibold text-gray-300 mb-4">Border Radius</label>
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: 'none', label: 'None', preview: '⬜' },
            { value: 'sm', label: 'Small', preview: '▢' },
            { value: 'md', label: 'Medium', preview: '◻️' },
            { value: 'lg', label: 'Large', preview: '🔲' },
            { value: 'xl', label: 'X-Large', preview: '🔳' },
            { value: '2xl', label: '2X-Large', preview: '⬛' },
            { value: 'full', label: 'Full', preview: '⚫' }
          ].map(radius => (
            <button
              key={radius.value}
              onClick={() => handleChange('storefrontDesign.layout.borderRadius', radius.value)}
              className={`p-4 rounded-xl border text-sm transition-all duration-300 transform hover:scale-105 ${
                settings.storefrontDesign?.layout?.borderRadius === radius.value
                  ? 'border-[#39FF14] bg-[#39FF14]/20 text-[#39FF14]'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:text-white'
              }`}
              style={{
                borderRadius: radius.value === 'none' ? '0' :
                  radius.value === 'sm' ? '0.375rem' :
                  radius.value === 'md' ? '0.5rem' :
                  radius.value === 'lg' ? '0.75rem' :
                  radius.value === 'xl' ? '1rem' :
                  radius.value === '2xl' ? '1.5rem' :
                  radius.value === 'full' ? '9999px' : '1rem'
              }}
            >
              <div className="text-2xl mb-2">{radius.preview}</div>
              <div className="font-medium">{radius.label}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Glassmorphism */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
              <span>✨</span>
              <span>Glassmorphism Effect</span>
            </h4>
            <p className="text-gray-400 text-sm mt-1">Add glass-like transparency effects</p>
          </div>
          <button
            onClick={() => handleChange('storefrontDesign.effects.glassmorphism.enabled', !settings.storefrontDesign?.effects?.glassmorphism?.enabled)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg ${
              settings.storefrontDesign?.effects?.glassmorphism?.enabled 
                ? 'bg-gradient-to-r from-[#39FF14] to-[#39FF14]/80 shadow-[#39FF14]/40' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
              settings.storefrontDesign?.effects?.glassmorphism?.enabled ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
        
        {settings.storefrontDesign?.effects?.glassmorphism?.enabled && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Intensity</label>
              <div className="space-y-3">
                {[
                  { value: 'low', label: 'Low', opacity: '5%' },
                  { value: 'medium', label: 'Medium', opacity: '10%' },
                  { value: 'high', label: 'High', opacity: '15%' }
                ].map(intensity => (
                  <button
                    key={intensity.value}
                    onClick={() => handleChange('storefrontDesign.effects.glassmorphism.intensity', intensity.value)}
                    className={`w-full p-3 rounded-xl border text-left transition-all duration-300 transform hover:scale-105 ${
                      settings.storefrontDesign?.effects?.glassmorphism?.intensity === intensity.value
                        ? 'border-[#39FF14] bg-[#39FF14]/20 text-[#39FF14]'
                        : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    <div className="font-medium">{intensity.label}</div>
                    <div className="text-xs text-gray-400">{intensity.opacity} opacity</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Blur</label>
              <div className="space-y-3">
                {[
                  { value: 'sm', label: 'Small', blur: '4px' },
                  { value: 'md', label: 'Medium', blur: '8px' },
                  { value: 'lg', label: 'Large', blur: '12px' },
                  { value: 'xl', label: 'Extra Large', blur: '16px' }
                ].map(blur => (
                  <button
                    key={blur.value}
                    onClick={() => handleChange('storefrontDesign.effects.glassmorphism.blur', blur.value)}
                    className={`w-full p-3 rounded-xl border text-left transition-all duration-300 transform hover:scale-105 ${
                      settings.storefrontDesign?.effects?.glassmorphism?.blur === blur.value
                        ? 'border-[#39FF14] bg-[#39FF14]/20 text-[#39FF14]'
                        : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    <div className="font-medium">{blur.label}</div>
                    <div className="text-xs text-gray-400">{blur.blur} blur</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced Grid Columns */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <label className="block text-lg font-semibold text-gray-300 mb-6">Grid Layout</label>
        <div className="space-y-6">
          {[
            { key: 'mobile', label: 'Mobile', icon: '📱', min: 1, max: 2, default: 1 },
            { key: 'tablet', label: 'Tablet', icon: '📟', min: 1, max: 3, default: 2 },
            { key: 'desktop', label: 'Desktop', icon: '🖥️', min: 2, max: 6, default: 4 }
          ].map(device => {
            const currentValue = settings.storefrontDesign?.layout?.gridColumns?.[device.key] || device.default
            
            return (
              <div key={device.key} className="space-y-3">
                <label className="flex items-center space-x-3 text-sm font-medium text-gray-400">
                  <span className="text-lg">{device.icon}</span>
                  <span>{device.label}</span>
                  <span className="text-[#39FF14] font-bold">{currentValue} Column{currentValue > 1 ? 's' : ''}</span>
                </label>
                
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${device.max - device.min + 1}, 1fr)` }}>
                  {Array.from({ length: device.max - device.min + 1 }, (_, i) => device.min + i).map(num => (
                    <button
                      key={num}
                      onClick={() => handleChange(`storefrontDesign.layout.gridColumns.${device.key}`, num)}
                      className={`p-4 rounded-xl border text-center transition-all duration-300 transform hover:scale-105 ${
                        currentValue === num
                          ? 'border-[#39FF14] bg-[#39FF14]/20 text-[#39FF14] shadow-lg shadow-[#39FF14]/30'
                          : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:text-white hover:shadow-lg'
                      }`}
                    >
                      <div className="font-bold text-lg">{num}</div>
                      <div className="text-xs">Column{num > 1 ? 's' : ''}</div>
                      
                      {/* Visual Grid Preview */}
                      <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${num}, 1fr)` }}>
                        {Array.from({ length: num }).map((_, index) => (
                          <div 
                            key={index} 
                            className={`h-2 rounded ${
                              currentValue === num ? 'bg-[#39FF14]/60' : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // Branding Section Component
  const BrandingSection = () => {
    const validateUrl = (url, platform) => {
      if (!url) return true
      
      const patterns = {
        twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/,
        instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/,
        discord: /^https?:\/\/(www\.)?(discord\.gg|discord\.com\/invite)\/.+/,
        website: /^https?:\/\/.+/
      }
      
      return patterns[platform]?.test(url) || patterns.website.test(url)
    }
    
    const formatUrl = (url, platform) => {
      if (!url) return ''
      
      // Add https:// if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
      
      return url
    }
    
    return (
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">Logo & Branding</span>
        </h3>
        
        {/* Logo Upload */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <label className="block text-lg font-semibold text-gray-300 mb-4">Storefront Logo</label>
          <div className="border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center hover:border-[#39FF14]/50 transition-all duration-300">
            {settings.storefrontDesign?.branding?.logo?.url ? (
              <div className="space-y-4">
                <img 
                  src={settings.storefrontDesign.branding.logo.url} 
                  alt="Logo" 
                  className={`object-contain mx-auto rounded-xl shadow-lg ${
                    settings.storefrontDesign?.branding?.logo?.size === 'small' ? 'w-16 h-16' :
                    settings.storefrontDesign?.branding?.logo?.size === 'medium' ? 'w-24 h-24' :
                    settings.storefrontDesign?.branding?.logo?.size === 'large' ? 'w-32 h-32' : 'w-24 h-24'
                  }`}
                />
                <button
                  onClick={() => handleChange('storefrontDesign.branding.logo.url', '')}
                  className="text-red-400 hover:text-red-300 text-sm font-medium px-4 py-2 rounded-lg border border-red-400/30 hover:bg-red-400/10 transition-all duration-300"
                >
                  Remove Logo
                </button>
              </div>
            ) : (
              <div>
                <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-4">Upload your logo</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'storefrontDesign.branding.logo.url')}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#39FF14]/80 text-black rounded-xl cursor-pointer hover:from-[#39FF14]/90 hover:to-[#39FF14]/70 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[#39FF14]/40 font-medium"
                >
                  Choose Logo
                </label>
              </div>
            )}
          </div>
        </div>
        
        {/* Logo Settings */}
        {settings.storefrontDesign?.branding?.logo?.url && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold text-gray-300 mb-4">Logo Size</label>
              <div className="space-y-3">
                {[
                  { value: 'small', label: 'Small', size: 'w-8 h-8' },
                  { value: 'medium', label: 'Medium', size: 'w-12 h-12' },
                  { value: 'large', label: 'Large', size: 'w-16 h-16' }
                ].map(size => (
                  <button
                    key={size.value}
                    onClick={() => handleChange('storefrontDesign.branding.logo.size', size.value)}
                    className={`w-full p-4 rounded-xl border text-left transition-all duration-300 transform hover:scale-105 ${
                      settings.storefrontDesign?.branding?.logo?.size === size.value
                        ? 'border-[#39FF14] bg-[#39FF14]/20 text-[#39FF14]'
                        : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`${size.size} bg-gradient-to-br from-[#39FF14] to-[#39FF14]/60 rounded-lg flex items-center justify-center`}>
                        <Store className="w-1/2 h-1/2 text-black" />
                      </div>
                      <span className="font-medium">{size.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-lg font-semibold text-gray-300 mb-4">Position</label>
              <div className="space-y-3">
                {[
                  { value: 'header', label: 'Header Only', icon: '🔝' },
                  { value: 'footer', label: 'Footer Only', icon: '🔻' },
                  { value: 'both', label: 'Header & Footer', icon: '🔄' }
                ].map(position => (
                  <button
                    key={position.value}
                    onClick={() => handleChange('storefrontDesign.branding.logo.position', position.value)}
                    className={`w-full p-4 rounded-xl border text-left transition-all duration-300 transform hover:scale-105 ${
                      settings.storefrontDesign?.branding?.logo?.position === position.value
                        ? 'border-[#39FF14] bg-[#39FF14]/20 text-[#39FF14]'
                        : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{position.icon}</span>
                      <span className="font-medium">{position.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Social Links */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <label className="block text-lg font-semibold text-gray-300 mb-6">Social Links</label>
          <div className="space-y-6">
            {[
              { 
                key: 'twitter', 
                label: 'Twitter / X', 
                placeholder: 'https://twitter.com/username or https://x.com/username',
                icon: '🐦',
                color: '#1DA1F2'
              },
              { 
                key: 'instagram', 
                label: 'Instagram', 
                placeholder: 'https://instagram.com/username',
                icon: '📷',
                color: '#E4405F'
              },
              { 
                key: 'discord', 
                label: 'Discord', 
                placeholder: 'https://discord.gg/invite or https://discord.com/invite/code',
                icon: '🎮',
                color: '#5865F2'
              },
              { 
                key: 'website', 
                label: 'Website', 
                placeholder: 'https://yourwebsite.com',
                icon: '🌐',
                color: '#39FF14'
              }
            ].map(social => {
              const currentValue = settings.storefrontDesign?.branding?.socialLinks?.[social.key] || ''
              const isValid = validateUrl(currentValue, social.key)
              
              return (
                <div key={social.key} className="group">
                  <label className="block text-sm font-medium text-gray-400 mb-3 flex items-center space-x-2">
                    <span className="text-lg">{social.icon}</span>
                    <span>{social.label}</span>
                    {currentValue && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isValid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {isValid ? '✓ Valid' : '✗ Invalid'}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={currentValue}
                      onChange={(e) => {
                        const formattedUrl = formatUrl(e.target.value, social.key)
                        handleChange(`storefrontDesign.branding.socialLinks.${social.key}`, formattedUrl)
                      }}
                      placeholder={social.placeholder}
                      className={`w-full bg-black/50 backdrop-blur-sm border rounded-xl px-4 py-3 text-white shadow-lg transition-all duration-300 focus:ring-2 focus:ring-opacity-20 ${
                        !currentValue ? 'border-gray-600 hover:border-gray-500 focus:border-[#39FF14] focus:ring-[#39FF14]' :
                        isValid ? 'border-green-500/50 hover:border-green-500 focus:border-green-500 focus:ring-green-500' :
                        'border-red-500/50 hover:border-red-500 focus:border-red-500 focus:ring-red-500'
                      }`}
                    />
                    {currentValue && isValid && (
                      <a
                        href={currentValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#39FF14] transition-colors duration-300"
                        title="Open link"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                  {currentValue && !isValid && (
                    <p className="text-red-400 text-xs mt-2 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>Please enter a valid {social.label.toLowerCase()} URL</span>
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and customize your storefront</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("success")
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        {/* Main Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-white/10 w-fit">
            {[
              { id: 'account', name: 'Account Settings', icon: Settings },
              { id: 'design', name: 'Storefront Design', icon: Palette }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#39FF14]/20 text-[#39FF14]'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'account' && <AccountSettingsTab />}
          {activeTab === 'design' && <StorefrontDesignTab />}
        </div>

        {/* Save Button */}
        <div className="sticky bottom-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(userChanges).length === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${Object.keys(userChanges).length === 0
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-[#39FF14] text-black hover:bg-[#39FF14]/90'
              }`}
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </StorefrontLayout>
  )
}