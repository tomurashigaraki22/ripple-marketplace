"use client"
import { useEffect, useState, useRef } from 'react'

export default function SpotifyWidget({ 
  playlistId, 
  position = 'bottom-right', 
  autoplay = false, 
  showCoverArt = true,
  height = 152,
  width = 300
}) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const iframeRef = useRef(null)

  if (!playlistId) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  // Enhanced embed URL with proper autoplay handling
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0${autoplay ? '&autoplay=1&auto_play=true' : ''}&show_artwork=${showCoverArt ? 'true' : 'false'}`

  // Handle minimize/expand without stopping playback
  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  useEffect(() => {
    // Auto-start playing if autoplay is enabled
    if (autoplay) {
      setIsPlaying(true)
    }
  }, [autoplay])

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Always render the iframe but hide it when minimized */}
      <div 
        className={`bg-black/95 backdrop-blur-xl border border-[#1DB954]/30 rounded-2xl shadow-2xl shadow-[#1DB954]/20 transition-all duration-300 hover:shadow-[#1DB954]/40 ${
          isMinimized ? 'p-0' : 'p-3'
        }`}
      >
        {/* Minimized button */}
        {isMinimized && (
          <button
            onClick={handleToggleMinimize}
            className="bg-gradient-to-r from-[#1DB954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#1DB954] text-white p-3 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-[#1DB954]/50 flex items-center space-x-2"
            title="Show Spotify Player"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            {isPlaying && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </button>
        )}

        {/* Expanded header */}
        {!isMinimized && (
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#1DB954] rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">Now Playing</span>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href={`https://open.spotify.com/playlist/${playlistId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1DB954] hover:text-[#1ed760] transition-colors p-1 hover:bg-[#1DB954]/10 rounded-lg"
                title="Open in Spotify"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </a>
              <button
                onClick={handleToggleMinimize}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                title="Minimize Player"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Iframe - always rendered but hidden when minimized */}
        <div style={{ display: isMinimized ? 'none' : 'block' }}>
          <iframe
            ref={iframeRef}
            src={embedUrl}
            width={width}
            height={height}
            frameBorder="0"
            allowTransparency="true"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
            loading="lazy"
            className="rounded-xl border border-[#1DB954]/20"
            onLoad={() => setIsPlaying(true)}
          />
        </div>
      </div>
    </div>
  )
}