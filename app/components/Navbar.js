"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Wallet, User, ShoppingBag, LogOut, ChevronDown, Zap, Shield, Globe, Package } from "lucide-react"
import Image from "next/image"
import { useAuth } from "../context/AuthContext"
import { useXRPL } from "../context/XRPLContext"
import { useMetamask } from "../context/MetamaskContext"
import { useWallet, useConnection } from '@solana/wallet-adapter-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  
  // Individual wallet contexts
  const { 
    xrpWalletAddress,
    connectXrpWallet,
    disconnectXrpWallet,
  } = useXRPL()
  
  const {
    metamaskWalletAddress,
    connectMetamaskWallet,
    disconnectMetamaskWallet,
    connecting,
  } = useMetamask()
  
  // Solana Wallet Adapter hooks
  const { publicKey, connected, connecting: phantomConnecting, disconnect } = useWallet()
  const { connection } = useConnection()
  
  const phantomWalletAddress = publicKey?.toString()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const handleWalletConnect = async (walletType) => {
    try {
      switch (walletType) {
        case 'xrp':
          await connectXrpWallet()
          break
        case 'metamask':
          await connectMetamaskWallet()
          break
        case 'phantom':
          // Phantom connection is handled by WalletMultiButton
          break
        default:
          console.error('Unknown wallet type:', walletType)
      }
      setShowWalletMenu(false)
    } catch (error) {
      console.error(`Failed to connect ${walletType}:`, error)
    }
  }

  const handleWalletDisconnect = async (walletType) => {
    try {
      switch (walletType) {
        case 'xrp':
          await disconnectXrpWallet()
          break
        case 'metamask':
          await disconnectMetamaskWallet()
          break
        case 'phantom':
          await disconnect()
          break
        default:
          console.error('Unknown wallet type:', walletType)
      }
    } catch (error) {
      console.error(`Failed to disconnect ${walletType}:`, error)
    }
  }

  const hasAnyWallet = xrpWalletAddress || metamaskWalletAddress || phantomWalletAddress

  return (
    <>
      {/* Animated Background Particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          {/* Floating Particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#39FF14] rounded-full opacity-30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#39FF14]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-black/80 backdrop-blur-xl border-b border-[#39FF14]/30 shadow-2xl shadow-[#39FF14]/10' 
          : 'bg-black/60 backdrop-blur-md border-b border-[#39FF14]/20'
      }`}>
        {/* Glowing Top Border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#39FF14] to-transparent opacity-60" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="flex justify-between items-center h-20">
            {/* Logo & Brand */}
            <Link href="/" className="group flex items-center space-x-3 relative">
              <div className="relative">
                <div className="absolute inset-0 bg-[#39FF14]/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#39FF14]/50 group-hover:border-[#39FF14] transition-all duration-300">
                  <Image
                    src="/logo.jpg"
                    alt="RippleBids Logo"
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-white via-[#39FF14] to-white bg-clip-text text-transparent group-hover:from-[#39FF14] group-hover:to-white transition-all duration-300">
                  RippleBids
                </span>
                <span className="text-xs text-gray-400 font-light tracking-wider">DECENTRALIZED COMMERCE</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {[
                { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
                { href: '/marketplace/orders', label: 'My Orders', icon: Package },
                { href: '/membership', label: 'Membership', icon: Shield },
                { href: '/portal', label: 'My Portal', icon: User },
                { href: '/faqs', label: 'FAQs', icon: Globe }
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group relative px-6 py-3 rounded-xl transition-all duration-300 hover:bg-[#39FF14]/10"
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#39FF14] transition-colors duration-300" />
                    <span className="text-gray-300 group-hover:text-white font-medium transition-colors duration-300">
                      {label}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[#39FF14] to-cyan-400 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Wallet Section */}
              <div className="relative">
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className={`group relative flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 overflow-hidden ${
                    hasAnyWallet 
                      ? 'bg-gradient-to-r from-[#39FF14]/20 to-cyan-500/20 border border-[#39FF14]/50 text-[#39FF14] shadow-lg shadow-[#39FF14]/20' 
                      : 'bg-black/40 border border-gray-600/50 text-gray-300 hover:border-[#39FF14]/50 hover:bg-[#39FF14]/10 hover:text-[#39FF14]'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#39FF14]/0 via-[#39FF14]/10 to-[#39FF14]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Wallet className="w-5 h-5 relative z-10" />
                  <span className="relative z-10 font-medium">
                    {hasAnyWallet ? 'Wallets Connected' : 'Connect Wallet'}
                  </span>
                  <ChevronDown className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-180" />
                </button>
                
                {showWalletMenu && (
                  <div className="absolute right-0 mt-4 w-80 bg-black/95 backdrop-blur-xl border border-[#39FF14]/30 rounded-2xl shadow-2xl shadow-[#39FF14]/20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent" />
                    <div className="relative p-6 space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-white mb-1">Wallet Connections</h3>
                        <p className="text-sm text-gray-400">Connect your preferred wallets</p>
                      </div>
                      
                      {/* Wallet Options */}
                      {[
                        { type: 'xrp', name: 'XRP (XUMM)', address: xrpWalletAddress, color: 'from-blue-500 to-purple-500' },
                        { type: 'metamask', name: 'MetaMask (EVM)', address: metamaskWalletAddress, color: 'from-orange-500 to-yellow-500' },
                        { type: 'phantom', name: 'Phantom (SOL)', address: phantomWalletAddress, color: 'from-purple-500 to-pink-500' }
                      ].map(({ type, name, address, color }) => (
                        <div key={type} className="group p-4 rounded-xl bg-gray-900/50 border border-gray-700/50 hover:border-[#39FF14]/50 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${color}`} />
                              <span className="text-white font-medium">{name}</span>
                            </div>
                            {address ? (
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-[#39FF14] font-mono bg-[#39FF14]/10 px-2 py-1 rounded">
                                  {address.slice(0, 6)}...{address.slice(-4)}
                                </span>
                                <button
                                  onClick={() => handleWalletDisconnect(type)}
                                  className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all duration-300"
                                >
                                  Disconnect
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleWalletConnect(type)}
                                disabled={connecting && type === 'metamask'}
                                className="text-xs text-[#39FF14] hover:text-white px-4 py-2 rounded-lg bg-[#39FF14]/10 hover:bg-[#39FF14]/20 border border-[#39FF14]/30 hover:border-[#39FF14] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {connecting && type === 'metamask' ? 'Connecting...' : 'Connect'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Section */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#39FF14]/20 to-cyan-500/20 border border-[#39FF14]/50 rounded-xl text-[#39FF14] hover:from-[#39FF14]/30 hover:to-cyan-500/30 transition-all duration-300 shadow-lg shadow-[#39FF14]/20"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#39FF14] to-cyan-400 flex items-center justify-center">
                      <User className="w-4 h-4 text-black" />
                    </div>
                    <span className="font-medium">{user.name || user.email}</span>
                    <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-4 w-64 bg-black/95 backdrop-blur-xl border border-[#39FF14]/30 rounded-2xl shadow-2xl shadow-[#39FF14]/20 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent" />
                      <div className="relative p-4">
                        <div className="text-center mb-4 pb-4 border-b border-gray-700/50">
                          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-[#39FF14] to-cyan-400 flex items-center justify-center mb-2">
                            <User className="w-6 h-6 text-black" />
                          </div>
                          <p className="text-white font-medium">{user.name || 'User'}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Link
                            href="/portal"
                            className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#39FF14]/10 rounded-lg transition-all duration-300"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <User className="w-4 h-4 inline mr-3" />
                            My Portal
                          </Link>
                          <Link
                            href="/wallet"
                            className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#39FF14]/10 rounded-lg transition-all duration-300"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Wallet className="w-4 h-4 inline mr-3" />
                            Wallet Settings
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                          >
                            <LogOut className="w-4 h-4 inline mr-3" />
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="group relative px-8 py-3 bg-gradient-to-r from-[#39FF14] to-cyan-400 text-black rounded-xl font-semibold overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[#39FF14]/30 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-[#39FF14] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">Login</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden relative p-3 rounded-xl bg-black/40 border border-gray-600/50 text-white hover:border-[#39FF14]/50 hover:bg-[#39FF14]/10 transition-all duration-300"
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6">
                <span className={`absolute block w-6 h-0.5 bg-current transition-all duration-300 ${isOpen ? 'rotate-45 top-3' : 'top-1'}`} />
                <span className={`absolute block w-6 h-0.5 bg-current transition-all duration-300 ${isOpen ? 'opacity-0' : 'top-3'}`} />
                <span className={`absolute block w-6 h-0.5 bg-current transition-all duration-300 ${isOpen ? '-rotate-45 top-3' : 'top-5'}`} />
              </div>
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          <div className={`lg:hidden transition-all duration-500 ease-in-out overflow-hidden ${
            isOpen ? "max-h-screen pb-6" : "max-h-0"
          }`}>
            <div className="pt-4 space-y-4">
              {/* Mobile Navigation */}
              <div className="space-y-2">
                {[
                  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
                  { href: '/membership', label: 'Membership', icon: Shield },
                  { href: '/portal', label: 'My Portal', icon: User },
                  { href: '/faqs', label: 'FAQs', icon: Globe }
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-[#39FF14]/10 transition-all duration-300"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </Link>
                ))}
              </div>
              
              {/* Mobile Wallet Section */}
              <div className="pt-4 border-t border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 px-4">WALLET CONNECTIONS</h3>
                <div className="space-y-3 px-4">
                  {[
                    { type: 'xrp', name: 'XRP (XUMM)', address: xrpWalletAddress },
                    { type: 'metamask', name: 'MetaMask', address: metamaskWalletAddress },
                    { type: 'phantom', name: 'Phantom', address: phantomWalletAddress }
                  ].map(({ type, name, address }) => (
                    <div key={type} className="flex justify-between items-center p-3 rounded-lg bg-gray-900/50">
                      <span className="text-sm text-white">{name}</span>
                      {address ? (
                        <button
                          onClick={() => handleWalletDisconnect(type)}
                          className="text-xs text-red-400 px-3 py-1 rounded bg-red-500/10"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => handleWalletConnect(type)}
                          disabled={connecting && type === 'metamask'}
                          className="text-xs text-[#39FF14] px-3 py-1 rounded bg-[#39FF14]/10 disabled:opacity-50"
                        >
                          {connecting && type === 'metamask' ? 'Connecting...' : 'Connect'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Mobile User Section */}
              <div className="pt-4 border-t border-gray-700/50">
                {user ? (
                  <div className="px-4 space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/30">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#39FF14] to-cyan-400 flex items-center justify-center">
                        <User className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name || 'User'}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/30 transition-all duration-300"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-4">
                    <Link
                      href="/login"
                      className="block w-full text-center px-6 py-4 bg-gradient-to-r from-[#39FF14] to-cyan-400 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-[#39FF14]/30 transition-all duration-300"
                    >
                      Login to RippleBids
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Glow Effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#39FF14]/50 to-transparent" />
      </nav>
    </>
  )
}