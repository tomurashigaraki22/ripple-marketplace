"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Search,
  Store,
  Calendar,
  Eye,
  Package,
  Star,
  Award,
  TrendingUp,
  Heart,
  Share2,
  ExternalLink,
} from "lucide-react"

export default function PublicStorefront() {
  const params = useParams()
  const { userId } = params

  const [storefront, setStorefront] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [pagination, setPagination] = useState({ total: 0, hasMore: false })
  const [loadingMore, setLoadingMore] = useState(false)
  const [viewMode, setViewMode] = useState("grid")
  const [sortBy, setSortBy] = useState("newest")
  const [storefrontSettings, setStorefrontSettings] = useState(null)

  useEffect(() => {
    if (userId) {
      fetchStorefront()
      fetchStorefrontSettings()
    }
  }, [userId, searchTerm, selectedCategory, sortBy])

  // Fetch storefront customization settings
  const fetchStorefrontSettings = async () => {
    try {
      const response = await fetch(`/api/storefront/public/${userId}/settings`)
      if (response.ok) {
        const data = await response.json()
        setStorefrontSettings(data.settings)
      }
    } catch (error) {
      console.error("Failed to fetch storefront settings:", error)
    }
  }

  const fetchStorefront = async (offset = 0, append = false) => {
    try {
      if (!append) setLoading(true)
      else setLoadingMore(true)

      const params = new URLSearchParams({
        limit: "20",
        offset: offset.toString(),
        sort: sortBy,
      })

      if (searchTerm) params.append("search", searchTerm)
      if (selectedCategory) params.append("category", selectedCategory)

      const response = await fetch(`/api/storefront/public/${userId}?${params}`)

      if (response.ok) {
        const data = await response.json()
        setStorefront(data.storefront)

        if (append) {
          setListings((prev) => [...prev, ...data.listings])
        } else {
          setListings(data.listings)
        }

        setPagination(data.pagination)
      } else if (response.status === 404) {
        setStorefront(null)
      }
    } catch (error) {
      console.error("Failed to fetch storefront:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchStorefront(listings.length, true)
    }
  }

  const shareStorefront = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${storefront.username}'s Storefront`,
          text: `Check out ${storefront.username}'s amazing listings!`,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const categories = [...new Set(listings.map((listing) => listing.category))]

  const getCustomStyles = () => {
    // Updated to use storefrontDesign structure from StorefrontSettings
    const storefrontDesign = storefrontSettings?.storefrontDesign

    const defaultStyles = {
      typography: {
        fontFamily: "Inter, sans-serif",
        headingFont: "Inter, sans-serif",
        bodyFont: "Inter, sans-serif",
        fontSize: { base: 16, heading: 48, subheading: 24, body: 16, small: 14 },
        fontWeight: {
          heading: "700",
          subheading: "600",
          body: "400",
          button: "600",
        },
      },
      colors: {
        primary: "#39FF14",
        secondary: "#10b981",
        accent: "#3b82f6",
        text: {
          primary: "#ffffff",
          secondary: "#d1d5db",
          muted: "#9ca3af",
          inverse: "#000000",
        },
        background: {
          primary: "#000000",
          secondary: "#1f2937",
          card: "#374151",
          overlay: "rgba(0, 0, 0, 0.5)",
        },
        border: { primary: "#4b5563", secondary: "#6b7280", accent: "#39FF14" },
      },
      layout: {
        containerWidth: "full",
        spacing: { section: "normal", card: "normal", element: "normal" },
        borderRadius: { cards: "1.5rem", buttons: "1.5rem", images: "1rem" },
        gridColumns: { mobile: 1, tablet: 2, desktop: 4, wide: 5 },
      },
      cardStyles: {
        style: "glass",
        shadow: "lg",
        hover: { transform: "scale", intensity: "subtle" },
      },
      effects: { glassmorphism: { enabled: true, intensity: "medium" } },
    }

    if (!storefrontDesign) return defaultStyles

    return {
      typography: {
        fontFamily: storefrontDesign.typography?.fontFamily || defaultStyles.typography.fontFamily,
        headingFont: storefrontDesign.typography?.headingFont || defaultStyles.typography.headingFont,
        bodyFont: storefrontDesign.typography?.fontFamily || defaultStyles.typography.bodyFont,
        fontSize: storefrontDesign.typography?.fontSize || defaultStyles.typography.fontSize,
        fontWeight: storefrontDesign.typography?.fontWeight || defaultStyles.typography.fontWeight,
      },
      colors: {
        primary: storefrontDesign.customColors?.primary || defaultStyles.colors.primary,
        secondary: storefrontDesign.customColors?.secondary || defaultStyles.colors.secondary,
        accent: storefrontDesign.customColors?.accent || defaultStyles.colors.accent,
        text: {
          primary: storefrontDesign.customColors?.text || defaultStyles.colors.text.primary,
          secondary: storefrontDesign.customColors?.textSecondary || defaultStyles.colors.text.secondary,
          muted: storefrontDesign.customColors?.textSecondary || defaultStyles.colors.text.muted,
          inverse: "#000000",
        },
        background: {
          primary: storefrontDesign.customColors?.background || defaultStyles.colors.background.primary,
          secondary: storefrontDesign.customColors?.surface || defaultStyles.colors.background.secondary,
          card: storefrontDesign.customColors?.surface || defaultStyles.colors.background.card,
          overlay: "rgba(0, 0, 0, 0.5)",
        },
        border: {
          primary: storefrontDesign.customColors?.border || defaultStyles.colors.border.primary,
          secondary: storefrontDesign.customColors?.border || defaultStyles.colors.border.secondary,
          accent: storefrontDesign.customColors?.primary || defaultStyles.colors.border.accent,
        },
      },
      layout: {
        containerWidth: storefrontDesign.layout?.containerWidth || defaultStyles.layout.containerWidth,
        spacing: defaultStyles.layout.spacing,
        borderRadius: {
          cards: storefrontDesign.layout?.borderRadius === "xl" ? "1.5rem" : "1rem",
          buttons: storefrontDesign.layout?.borderRadius === "xl" ? "1.5rem" : "1rem",
          images: "1rem"
        },
        gridColumns: storefrontDesign.layout?.gridColumns || defaultStyles.layout.gridColumns,
      },
      cardStyles: {
        style: "glass",
        shadow: "lg",
        hover: { transform: "scale", intensity: "subtle" },
      },
      effects: {
        glassmorphism: storefrontDesign.effects?.glassmorphism || defaultStyles.effects.glassmorphism
      },
      branding: storefrontDesign.branding || defaultStyles.branding
    }
  }

  const customStyles = getCustomStyles()

  // CSS Variables for dynamic styling
  const cssVariables = {
    '--primary-color': customStyles.colors.primary,
    '--secondary-color': customStyles.colors.secondary,
    '--accent-color': customStyles.colors.accent,
    '--text-primary': customStyles.colors.text.primary,
    '--text-secondary': customStyles.colors.text.secondary,
    '--text-muted': customStyles.colors.text.muted,
    '--text-inverse': customStyles.colors.text.inverse,
    '--bg-primary': customStyles.colors.background.primary,
    '--bg-secondary': customStyles.colors.background.secondary,
    '--bg-card': customStyles.colors.background.card,
    '--bg-overlay': customStyles.colors.background.overlay,
    '--border-primary': customStyles.colors.border.primary,
    '--border-secondary': customStyles.colors.border.secondary,
    '--border-accent': customStyles.colors.border.accent,
    '--font-family': customStyles.typography.fontFamily,
    '--heading-font': customStyles.typography.headingFont,
    '--body-font': customStyles.typography.bodyFont,
    '--border-radius-cards': customStyles.layout.borderRadius.cards,
    '--border-radius-buttons': customStyles.layout.borderRadius.buttons,
    '--border-radius-images': customStyles.layout.borderRadius.images,
  }

  // Update the getBackgroundStyle function around line 250
  const getBackgroundStyle = () => {
    const storefrontDesign = storefrontSettings?.storefrontDesign
    
    if (!storefrontDesign) {
      return { background: "linear-gradient(to right, #1a1a1a, #000000)" }
    }
  
    const { backgroundType, backgroundColor, gradientColors, backgroundImage } = storefrontDesign
  
    switch (backgroundType) {
      case "solid":
        return { backgroundColor: backgroundColor || customStyles.colors.background.primary }
      case "gradient":
        const direction = gradientColors?.direction || "to-br"
        const from = gradientColors?.from || customStyles.colors.background.primary
        const to = gradientColors?.to || customStyles.colors.background.secondary
        
        // Convert direction format to match LivePreview
        const cssDirection = direction === 'to-r' ? 'to right' : 
                        direction === 'to-l' ? 'to left' :
                        direction === 'to-b' ? 'to bottom' :
                        direction === 'to-t' ? 'to top' :
                        direction === 'to-br' ? 'to bottom right' :
                        direction === 'to-bl' ? 'to bottom left' :
                        direction === 'to-tr' ? 'to top right' :
                        direction === 'to-tl' ? 'to top left' : 'to bottom right'
        
        return { background: `linear-gradient(${cssDirection}, ${from}, ${to})` }
      case "image":
        if (backgroundImage?.url) {
          return {
            backgroundImage: `url(${backgroundImage.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: backgroundImage.opacity || 0.3,
            filter: backgroundImage.blur ? `blur(${backgroundImage.blur}px)` : "none",
          }
        }
        return { background: "linear-gradient(to right, #1a1a1a, #000000)" }
      default:
        return { background: "linear-gradient(to right, #1a1a1a, #000000)" }
    }
  }

  // Enhanced glassmorphism function
  const getGlassmorphismClasses = (intensity = 'medium', blur = 'md') => {
    const intensityMap = {
      'low': 'bg-white/5',
      'medium': 'bg-white/10', 
      'high': 'bg-white/15'
    }
    
    const blurMap = {
      'sm': 'backdrop-blur-sm',
      'md': 'backdrop-blur-md',
      'lg': 'backdrop-blur-lg',
      'xl': 'backdrop-blur-xl'
    }
    
    return `${intensityMap[intensity] || intensityMap.medium} ${blurMap[blur] || blurMap.md} border border-white/10`
  }

  const getCardClasses = () => {
    const settings = storefrontSettings?.storefrontDesign
    const cardStyle = customStyles.cardStyles.style
    const glassmorphism = customStyles.effects.glassmorphism
    const roundedCorners = settings?.roundedCorners !== false
    const cardShadows = settings?.cardShadows !== false
    const hoverEffects = settings?.hoverEffects !== false

    console.log("CarD tyle: ", cardStyle, glassmorphism)

    let classes = "group border overflow-hidden transition-all duration-500 transform"

    // Border radius
    if (roundedCorners) {
      classes += " rounded-3xl"
    }

    // Enhanced glassmorphism effects
    if (glassmorphism?.enabled) {
      const intensity = glassmorphism.intensity || 'medium'
      const blur = glassmorphism.blur || 'md'
      classes += ` ${getGlassmorphismClasses(intensity, blur)}`
      
      // Add liquid glass effect with subtle animations
      classes += " hover:bg-white/20 hover:backdrop-blur-xl hover:border-white/30"
      classes += " shadow-lg shadow-black/20 hover:shadow-2xl hover:shadow-[var(--primary-color)]/20"
    } else {
      // Fallback for non-glass styles
      switch (cardStyle) {
        case "solid":
          classes += " bg-opacity-100"
          break
        case "outlined":
          classes += " bg-transparent border-2"
          break
        case "elevated":
          if (cardShadows) {
            classes += " shadow-2xl"
          }
          break
        case "minimal":
          classes += " border-transparent"
          break
      }
    }

    // Enhanced hover effects for glassmorphism
    if (hoverEffects) {
      const hoverTransform = customStyles.cardStyles.hover?.transform
      if (hoverTransform === "scale") {
        classes += " hover:scale-105"
      } else if (hoverTransform === "lift") {
        classes += " hover:-translate-y-2"
      }
      
      if (glassmorphism?.enabled) {
        classes += " hover:shadow-2xl hover:shadow-[var(--primary-color)]/30"
      } else {
        classes += " hover:shadow-2xl"
      }
    }

    return classes
  }

  const getButtonClasses = (type = "primary") => {
    const settings = storefrontSettings?.storefrontDesign
    let classes = "inline-flex items-center gap-2 font-semibold transition-all duration-300 px-6 py-3 text-base rounded-xl"

    if (type === "primary") {
      classes += " hover:scale-105"
    } else {
      classes += " backdrop-blur-sm border hover:scale-105"
    }

    return classes
  }

  // Update the getGridColumns function around line 380
  const getGridColumns = () => {
    const gridConfig = customStyles.layout.gridColumns
    return {
      mobile: `grid-cols-${gridConfig.mobile}`,
      tablet: `md:grid-cols-${gridConfig.tablet}`, 
      desktop: `lg:grid-cols-${gridConfig.desktop}`,
      wide: `xl:grid-cols-${gridConfig.wide || gridConfig.desktop}`
    }
  }
  
  // Update the listings grid around line 750

  // Spotify Widget Component
  const SpotifyWidget = () => {
    const spotifySettings = storefrontSettings?.storefrontDesign?.spotifyPlaylist
    
    if (!spotifySettings?.enabled || !spotifySettings?.playlistId) {
      return null
    }

    const { playlistId, position, autoPlay, showCoverArt } = spotifySettings

    const positionClasses = {
      "top-left": "top-4 left-4",
      "top-right": "top-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "bottom-right": "bottom-4 right-4",
    }

    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <div className="bg-black/80 backdrop-blur-lg border border-gray-700 rounded-2xl p-4 shadow-2xl">
          <iframe
            src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0${autoPlay ? "&autoplay=1" : ""}`}
            width="300"
            height={showCoverArt ? "380" : "152"}
            frameBorder="0"
            allowfullscreen=""
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl"
          ></iframe>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-gray-800 mx-auto"
                 style={{ borderTopColor: customStyles.colors.primary }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="w-8 h-8" style={{ color: customStyles.colors.primary }} />
            </div>
          </div>
          <p className="mt-4 text-lg font-medium" style={{ color: customStyles.colors.text.secondary }}>
            Loading storefront...
          </p>
        </div>
      </div>
    )
  }

  const getLogoSize = (size) => {
  switch(size) {
    case 'small': return 'w-6 h-6'
    case 'medium': return 'w-8 h-8'
    case 'large': return 'w-12 h-12'
    default: return 'w-8 h-8'
  }
}

  if (!storefront) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className={`${getCardClasses()} p-8`} 
               style={{ 
                 backgroundColor: customStyles.colors.background.card,
                 borderColor: customStyles.colors.border.primary 
               }}>
            <Store className="w-20 h-20 mx-auto mb-6" style={{ color: customStyles.colors.primary }} />
            <h1 className="text-3xl font-bold mb-4" 
                style={{ 
                  color: customStyles.colors.text.primary,
                  fontFamily: customStyles.typography.headingFont,
                  fontWeight: customStyles.typography.fontWeight.heading 
                }}>
              Storefront Not Found
            </h1>
            <p className="mb-6 leading-relaxed" style={{ color: customStyles.colors.text.muted }}>
              The storefront you're looking for doesn't exist or is not active.
            </p>
            <Link href="/marketplace" 
                  className={getButtonClasses("primary")}
                  style={{
                    backgroundColor: customStyles.colors.primary,
                    color: customStyles.colors.text.inverse
                  }}>
              <ExternalLink className="w-5 h-5" />
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ ...getBackgroundStyle(), ...cssVariables }}>
      {/* Spotify Widget */}
      <SpotifyWidget />

      {/* Hero Section with Enhanced Glassmorphism */}
      <div className="relative overflow-hidden">
        {/* Enhanced background pattern with glassmorphism overlay */}
        <div className="absolute inset-0 bg-black/30"></div>
        
        {/* Glassmorphism overlay for the entire background */}
        {customStyles.effects.glassmorphism?.enabled && (
          <div className={`absolute inset-0 ${getGlassmorphismClasses(
            customStyles.effects.glassmorphism.intensity,
            customStyles.effects.glassmorphism.blur
          )}`}></div>
        )}
        
        <div className="absolute inset-0 opacity-20"
             style={{
               backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="${encodeURIComponent(customStyles.colors.primary)}" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`
             }}></div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Enhanced Header Card with Liquid Glass Effect */}
          <div 
            className={`${getGlassmorphismClasses(
              customStyles.effects.glassmorphism?.intensity || 'medium',
              customStyles.effects.glassmorphism?.blur || 'xl'
            )} rounded-2xl p-6 mb-8 shadow-xl hover:shadow-[var(--primary-color)]/30 transition-all duration-500 hover:scale-[1.02] hover:bg-white/20 hover:backdrop-blur-2xl`}
            style={{
              borderColor: `${customStyles.colors.primary}40`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Logo */}
                {storefrontSettings?.storefrontDesign?.branding?.logo?.url ? (
                  <img 
                    src={storefrontSettings.storefrontDesign.branding.logo.url} 
                    alt="Logo" 
                    className={`${getLogoSize(storefrontSettings.storefrontDesign.branding.logo.size)} rounded-lg shadow-lg hover:scale-110 transition-transform duration-300 object-contain`}
                  />
                ) : (
                  <div className={`${getLogoSize('medium')} bg-gradient-to-br rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300`}
                       style={{
                         background: `linear-gradient(to bottom right, ${customStyles.colors.primary}, ${customStyles.colors.secondary})`
                       }}>
                    <Store className="w-4 h-4" style={{ color: customStyles.colors.text.inverse }} />
                  </div>
                )}
                
                {/* Store Name */}
                <span 
                  className="font-bold bg-gradient-to-r from-white to-[#39FF14] bg-clip-text text-transparent"
                  style={{ 
                    fontFamily: customStyles.typography.headingFont,
                    fontSize: `${(customStyles.typography.fontSize.heading || 48) / 2}px`,
                    color: customStyles.colors.text.primary
                  }}
                >
                  {storefrontSettings?.storefrontDesign?.branding?.storeName || `${storefront.username}'s Storefront`}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Social Links */}
                {storefrontSettings?.storefrontDesign?.branding?.socialLinks && (
                  <div className="flex space-x-2">
                    {storefrontSettings.storefrontDesign.branding.socialLinks.twitter && (
                      <a href={storefrontSettings.storefrontDesign.branding.socialLinks.twitter} className="text-blue-400 hover:text-blue-300 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                      </a>
                    )}
                    {storefrontSettings.storefrontDesign.branding.socialLinks.instagram && (
                      <a href={storefrontSettings.storefrontDesign.branding.socialLinks.instagram} className="text-pink-400 hover:text-pink-300 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323C5.902 8.198 7.053 7.708 8.35 7.708s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387zm7.718 0c-1.297 0-2.448-.49-3.323-1.297-.897-.875-1.387-2.026-1.387-3.323s.49-2.448 1.297-3.323c.875-.897 2.026-1.387 3.323-1.387s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387z"/></svg>
                      </a>
                    )}
                    {storefrontSettings.storefrontDesign.branding.socialLinks.discord && (
                      <a href={storefrontSettings.storefrontDesign.branding.socialLinks.discord} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/></svg>
                      </a>
                    )}
                    {storefrontSettings.storefrontDesign.branding.socialLinks.website && (
                      <a href={storefrontSettings.storefrontDesign.branding.socialLinks.website} className="text-gray-400 hover:text-gray-300 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                      </a>
                    )}
                  </div>
                )}
                
                {/* Stats Badges */}
                <div className="flex space-x-2">
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium border shadow-lg hover:shadow-[#39FF14]/40 transition-all duration-300 hover:scale-105"
                    style={{
                      backgroundColor: `${customStyles.colors.primary}20`,
                      color: customStyles.colors.primary,
                      borderColor: `${customStyles.colors.primary}30`
                    }}
                  >
                    {storefront.stats.totalListings} Items
                  </span>
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/30 shadow-lg hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105">
                    {storefront.stats.totalViews.toLocaleString()} Views
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          {storefrontSettings?.storefrontDesign?.welcomeMessage && (
            <p className="text-lg mb-8 max-w-2xl mx-auto text-center" 
               style={{ 
                 color: customStyles.colors.text.secondary,
                 fontFamily: customStyles.typography.bodyFont 
               }}>
              {storefrontSettings.storefrontDesign.welcomeMessage}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button onClick={shareStorefront} 
                    className={getButtonClasses("secondary")}
                    style={{
                      backgroundColor: `${customStyles.colors.background.card}80`,
                      borderColor: customStyles.colors.border.primary,
                      color: customStyles.colors.text.primary
                    }}>
              <Share2 className="w-5 h-5" />
              Share
            </button>
            <Link href="/marketplace" 
                  className={getButtonClasses("primary")}
                  style={{
                    backgroundColor: customStyles.colors.primary,
                    color: customStyles.colors.text.inverse
                  }}>
              <ExternalLink className="w-5 h-5" />
              Browse All
            </Link>
          </div>
        </div>
      </div>

      {/* Compact Stats Cards - Matching LivePreview
      <div className="max-w-4xl mx-auto px-6 -mt-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${getCardClasses()} p-4 text-center`}
               style={{ 
                 backgroundColor: customStyles.colors.background.card,
                 borderColor: customStyles.colors.border.primary 
               }}>
            <div className="rounded-xl p-3 w-fit mx-auto mb-3"
                 style={{
                   background: `linear-gradient(to bottom right, ${customStyles.colors.primary}, ${customStyles.colors.secondary})`
                 }}>
              <Package className="w-6 h-6" style={{ color: customStyles.colors.text.inverse }} />
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: customStyles.colors.text.primary }}>
              {storefront.stats.totalListings}
            </p>
            <p className="text-sm" style={{ color: customStyles.colors.text.muted }}>Active Listings</p>
          </div>

          <div className={`${getCardClasses()} p-4 text-center`}
               style={{ 
                 backgroundColor: customStyles.colors.background.card,
                 borderColor: customStyles.colors.border.primary 
               }}>
            <div className="rounded-xl p-3 w-fit mx-auto mb-3"
                 style={{ background: `linear-gradient(to bottom right, ${customStyles.colors.accent}, #1e40af)` }}>
              <Eye className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: customStyles.colors.text.primary }}>
              {storefront.stats.totalViews.toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: customStyles.colors.text.muted }}>Total Views</p>
          </div>

          <div className={`${getCardClasses()} p-4 text-center`}
               style={{ 
                 backgroundColor: customStyles.colors.background.card,
                 borderColor: customStyles.colors.border.primary 
               }}>
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-3 w-fit mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: customStyles.colors.text.primary }}>
              {storefront.stats.averagePrice.toFixed(2)}
            </p>
            <p className="text-sm" style={{ color: customStyles.colors.text.muted }}>Avg Price (USD)</p>
          </div>
        </div>
      </div> */}

      {/* Listings Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search and Filter Bar with Enhanced Glassmorphism */}
        <div className={`${getGlassmorphismClasses(
          customStyles.effects.glassmorphism?.intensity || 'medium',
          customStyles.effects.glassmorphism?.blur || 'lg'
        )} p-6 mb-8 shadow-xl hover:shadow-[var(--primary-color)]/30 transition-all duration-500 hover:scale-[1.01] hover:bg-white/20 hover:backdrop-blur-2xl`}
             style={{ 
               borderColor: `${customStyles.colors.primary}40`
             }}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: customStyles.colors.text.muted }} />
              <input
                type="text"
                placeholder="Search amazing listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 ${getGlassmorphismClasses('low', 'md')} hover:bg-white/15 focus:bg-white/20 focus:backdrop-blur-xl`}
                style={{
                  borderColor: `${customStyles.colors.primary}30`,
                  color: customStyles.colors.text.primary,
                  '--tw-ring-color': `${customStyles.colors.primary}60`
                }}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 ${getGlassmorphismClasses('low', 'md')} hover:bg-white/15 focus:bg-white/20 focus:backdrop-blur-xl`}
                style={{
                  borderColor: `${customStyles.colors.primary}30`,
                  color: customStyles.colors.text.primary,
                  '--tw-ring-color': `${customStyles.colors.primary}60`
                }}
              >
                <option value="" style={{ backgroundColor: customStyles.colors.background.secondary }}>
                  All Categories
                </option>
                {categories.map((category) => (
                  <option key={category} value={category} style={{ backgroundColor: customStyles.colors.background.secondary }}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 ${getGlassmorphismClasses('low', 'md')} hover:bg-white/15 focus:bg-white/20 focus:backdrop-blur-xl`}
                style={{
                  borderColor: `${customStyles.colors.primary}30`,
                  color: customStyles.colors.text.primary,
                  '--tw-ring-color': `${customStyles.colors.primary}60`
                }}
              >
                <option value="newest" style={{ backgroundColor: customStyles.colors.background.secondary }}>
                  Newest First
                </option>
                <option value="oldest" style={{ backgroundColor: customStyles.colors.background.secondary }}>
                  Oldest First
                </option>
                <option value="price_low" style={{ backgroundColor: customStyles.colors.background.secondary }}>
                  Price: Low to High
                </option>
                <option value="price_high" style={{ backgroundColor: customStyles.colors.background.secondary }}>
                  Price: High to Low
                </option>
                <option value="popular" style={{ backgroundColor: customStyles.colors.background.secondary }}>
                  Most Popular
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="text-center py-20">
            <div className={`${getCardClasses()} p-12 max-w-md mx-auto shadow-xl hover:shadow-[var(--primary-color)]/30 transition-all duration-500 hover:scale-[1.02] hover:bg-white/20 hover:backdrop-blur-2xl`}
                 style={{ 
                   borderColor: `${customStyles.colors.primary}40`
                 }}>
              <Package className="w-20 h-20 mx-auto mb-6" style={{ color: customStyles.colors.primary }} />
              <h3 className="text-2xl font-bold mb-4" 
                  style={{ 
                    color: customStyles.colors.text.primary,
                    fontFamily: customStyles.typography.headingFont 
                  }}>
                No listings found
              </h3>
              <p className="leading-relaxed" style={{ color: customStyles.colors.text.muted }}>
                This storefront doesn't have any listings matching your criteria. Try adjusting your search or filters.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${Object.values(getGridColumns()).join(' ')}`}>
              {listings.map((listing, index) => (
                <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                  <div className={`${getCardClasses()} shadow-lg hover:shadow-2xl hover:shadow-[var(--primary-color)]/30 transition-all duration-500 hover:scale-105 hover:bg-white/20 hover:backdrop-blur-2xl hover:border-white/40`} 
                       style={{ 
                         animationDelay: `${index * 100}ms`,
                         borderColor: `${customStyles.colors.primary}20`
                       }}>
                    {/* Image */}
                    <div className="aspect-square relative overflow-hidden">
                      {listing.images && JSON.parse(listing.images)[0] ? (
                        <img
                          src={JSON.parse(listing.images)[0] || "/placeholder.svg"}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm">
                          <Package className="w-16 h-16" style={{ color: customStyles.colors.text.muted }} />
                        </div>
                      )}

                      {/* Enhanced Glassmorphism Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm"></div>

                      {/* Category Badge with Glassmorphism */}
                      {storefrontSettings?.storefrontDesign?.contentDisplay?.showCategories !== false && (
                        <div className="absolute top-4 left-4">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full transition-all duration-300 ${getGlassmorphismClasses('medium', 'md')} hover:bg-white/30`}
                                style={{
                                  color: customStyles.colors.text.primary,
                                  borderColor: `${customStyles.colors.primary}40`
                                }}>
                            {listing.category}
                          </span>
                        </div>
                      )}

                      {/* Chain Badge */}
                      {storefrontSettings?.storefrontDesign?.contentDisplay?.showChainBadges !== false && (
                        <div className="absolute top-4 right-4">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-md bg-white/20 border border-white/30 hover:bg-white/30 transition-all duration-300"
                                style={{
                                  color: customStyles.colors.primary,
                                  borderColor: `${customStyles.colors.primary}60`
                                }}>
                            {listing.chain.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Heart Icon with Enhanced Glassmorphism */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className={`rounded-full p-2 transition-all duration-300 ${getGlassmorphismClasses('medium', 'lg')} hover:bg-white/30 hover:scale-110`}
                             style={{
                               borderColor: `${customStyles.colors.primary}40`
                             }}>
                          <Heart className="w-4 h-4" style={{ color: customStyles.colors.primary }} />
                        </div>
                      </div>
                    </div>

                    {/* Content with subtle glassmorphism background */}
                    <div className="p-6 bg-white/5 backdrop-blur-sm">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:transition-colors"
                          style={{ 
                            color: customStyles.colors.text.primary,
                            fontFamily: customStyles.typography.headingFont 
                          }}>
                        {listing.title}
                      </h3>
                      <p className="text-sm mb-4 line-clamp-2 leading-relaxed"
                         style={{ 
                           color: customStyles.colors.text.muted,
                           fontFamily: customStyles.typography.bodyFont 
                         }}>
                        {storefrontSettings?.storefrontDesign?.contentDisplay?.truncateDescriptions !== false
                          ? listing.description.substring(
                              0,
                              storefrontSettings?.storefrontDesign?.contentDisplay?.maxDescriptionLength || 100,
                            ) + "..."
                          : listing.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          {storefrontSettings?.storefrontDesign?.contentDisplay?.showPrices !== false && (
                            <p className="text-2xl font-bold" style={{ color: customStyles.colors.primary }}>
                              {listing.price} USD
                            </p>
                          )}
                        </div>
                        {storefrontSettings?.storefrontDesign?.contentDisplay?.showViews !== false && (
                          <div className="flex items-center gap-2 text-sm" style={{ color: customStyles.colors.text.muted }}>
                            <Eye className="w-4 h-4" />
                            <span>{listing.views}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More */}
            {pagination.hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className={`${getButtonClasses("primary")} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  style={{
                    backgroundColor: customStyles.colors.primary,
                    color: customStyles.colors.text.inverse
                  }}
                >
                  {loadingMore ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[${customStyles.colors.text.inverse}] border-t-transparent"
                           style={{ borderColor: customStyles.colors.text.inverse }}></div>
                      Loading...
                    </div>
                  ) : (
                    "Load More Listings"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {storefrontSettings?.storefrontDesign?.footerText && (
        <footer className="border-t py-8 mt-16"
                style={{ 
                  borderColor: customStyles.colors.border.primary,
                  backgroundColor: customStyles.colors.background.secondary 
                }}>
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p style={{ 
              color: customStyles.colors.text.muted,
              fontFamily: customStyles.typography.bodyFont 
            }}>
              {storefrontSettings.storefrontDesign.footerText}
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}
