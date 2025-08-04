"use client"
import Link from "next/link"
import { ArrowRight, Zap, Shield, Globe, Coins, Sparkles, Eye, Package } from "lucide-react"
import { useState, useEffect } from "react"

export default function HomePage() {
  const [popularListings, setPopularListings] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)

  useEffect(() => {
    fetchPopularListings()
  }, [])

  const fetchPopularListings = async () => {
    try {
      setLoadingListings(true)
      // Fetch listings sorted by popularity (views)
      const response = await fetch('/api/marketplace?sortBy=popular&limit=20')
      if (response.ok) {
        const data = await response.json()
        // Filter listings with >150 views and take maximum 5
        const popularItems = data.listings.filter(listing => listing.views > 150).slice(0, 5)
        setPopularListings(popularItems)
      }
    } catch (error) {
      console.error('Error fetching popular listings:', error)
    } finally {
      setLoadingListings(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(57,255,20,0.1),transparent_50%)] animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#39FF14] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 mt-10">
        <div className="max-w-7xl mx-auto text-center">
          {/* Main Headline */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-[#39FF14] to-white bg-clip-text text-transparent leading-tight">
              Welcome To
                RippleBids
              <br />
              MarketPlace
            </h1>
            <div className="flex justify-center mb-6">
              <Sparkles className="w-8 h-8 text-[#39FF14] animate-pulse" />
            </div>
          </div>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto font-light leading-relaxed">
            Join the future of <span className="text-[#39FF14] font-semibold">decentralized commerce</span> on XRP Ledger, EVM chains, and Solana
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link
              href="/wallet"
              className="group relative px-10 py-5 bg-black/40 backdrop-blur-xl border-2 border-[#39FF14]/50 text-[#39FF14] rounded-2xl font-bold text-lg hover:border-[#39FF14] hover:shadow-[0_0_30px_rgba(57,255,20,0.3)] transition-all duration-300 transform hover:scale-105"
            >
              <span className="absolute inset-0 bg-[#39FF14]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></span>
              <span className="relative flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Connect Wallet
              </span>
            </Link>
            
            <Link
              href="/marketplace"
              className="group relative px-10 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl font-bold text-lg hover:border-white/40 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <span className="relative flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Join Marketplace
              </span>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="group relative p-8 bg-black/40 backdrop-blur-xl border border-[#39FF14]/20 rounded-3xl hover:border-[#39FF14]/60 transition-all duration-500 transform hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14] to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] transition-all duration-300">
                  <Zap className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-[#39FF14] transition-colors duration-300">Lightning Fast</h3>
                <p className="text-gray-400 leading-relaxed">Experience instant transactions across multiple blockchains with cutting-edge technology</p>
              </div>
            </div>

            <div className="group relative p-8 bg-black/40 backdrop-blur-xl border border-[#39FF14]/20 rounded-3xl hover:border-[#39FF14]/60 transition-all duration-500 transform hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14] to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] transition-all duration-300">
                  <Shield className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-[#39FF14] transition-colors duration-300">Secure & Trusted</h3>
                <p className="text-gray-400 leading-relaxed">Built with enterprise-grade security and audited smart contracts for maximum protection</p>
              </div>
            </div>

            <div className="group relative p-8 bg-black/40 backdrop-blur-xl border border-[#39FF14]/20 rounded-3xl hover:border-[#39FF14]/60 transition-all duration-500 transform hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14] to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] transition-all duration-300">
                  <Globe className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-[#39FF14] transition-colors duration-300">Multi-Chain</h3>
                <p className="text-gray-400 leading-relaxed">Trade seamlessly across XRP Ledger, EVM chains, and Solana ecosystems</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-[#39FF14] bg-clip-text text-transparent">About RippleBids</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              The next generation marketplace powered by <span className="text-[#39FF14] font-semibold">XRPB tokens</span>, enabling seamless trading across multiple blockchain networks
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-16 items-center">
            <div className="space-y-8">
              <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-[#39FF14] to-emerald-400 bg-clip-text text-transparent">Why Choose RippleBids?</h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-6 group">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#39FF14] to-emerald-400 rounded-full flex items-center justify-center mt-1 group-hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-all duration-300">
                    <span className="text-black text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white mb-2">Multi-Chain Support</h4>
                    <p className="text-gray-400 leading-relaxed">Trade seamlessly on XRP Ledger, XRPL-EVM, and Solana networks with unified experience</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-6 group">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#39FF14] to-emerald-400 rounded-full flex items-center justify-center mt-1 group-hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-all duration-300">
                    <span className="text-black text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white mb-2">XRPB Token Utility</h4>
                    <p className="text-gray-400 leading-relaxed">Use XRPB for purchases, and exclusive premium marketplace features</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-6 group">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#39FF14] to-emerald-400 rounded-full flex items-center justify-center mt-1 group-hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-all duration-300">
                    <span className="text-black text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white mb-2">Membership Rewards</h4>
                    <p className="text-gray-400 leading-relaxed">Unlock exclusive benefits, lower fees, and early access to premium auctions</p>
                  </div>
                </div>
              </div>
            </div>
{/*             
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/20 to-emerald-400/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-black/60 backdrop-blur-xl border border-[#39FF14]/30 p-10 rounded-3xl">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#39FF14] to-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(57,255,20,0.4)]">
                    <Coins className="w-10 h-10 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-8">XRPB Token Info</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-[#39FF14]/20">
                      <span className="text-gray-400">Total Supply:</span>
                      <span className="text-[#39FF14] font-bold">1,000,000,000 XRPB</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[#39FF14]/20">
                      <span className="text-gray-400">Current Price:</span>
                      <span className="text-[#39FF14] font-bold">$0.0025</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[#39FF14]/20">
                      <span className="text-gray-400">Market Cap:</span>
                      <span className="text-[#39FF14] font-bold">$2,500,000</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-400">Holders:</span>
                      <span className="text-[#39FF14] font-bold">15,847</span>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Popular Listings Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/50 to-black"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-[#39FF14] bg-clip-text text-transparent">Popular Listings</h2>
            <p className="text-xl text-gray-300">Trending items with high demand in our marketplace</p>
          </div>

          {loadingListings ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#39FF14]/30 border-t-[#39FF14] rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-white/30 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
            </div>
          ) : popularListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
              {popularListings.map((listing, index) => (
                <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                  <div className="group relative bg-black/40 backdrop-blur-xl border border-[#39FF14]/20 rounded-3xl overflow-hidden hover:border-[#39FF14]/60 transition-all duration-500 transform hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.2)] cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      {listing.images && listing.images.length > 0 ? (
                        <img 
                          src={listing.images[0]} 
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Views Badge */}
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
                        <Eye className="w-4 h-4 text-[#39FF14]" />
                        <span className="text-white text-sm font-medium">{listing.views}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative p-6">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#39FF14] transition-colors duration-300 line-clamp-2">
                        {listing.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400 capitalize">{listing.category}</span>
                        <span className="text-sm text-[#39FF14] font-medium uppercase">{listing.chain}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-[#39FF14]">{listing.price} XRPB</p>
                          <p className="text-sm text-gray-400">by @{listing.seller_username}</p>
                        </div>
                        
                        <div className="w-10 h-10 bg-gradient-to-br from-[#39FF14] to-emerald-400 rounded-full flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-all duration-300">
                          <ArrowRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Popular Listings Yet</h3>
              <p className="text-gray-400">Check back soon for trending items with high demand!</p>
            </div>
          )}

          <div className="text-center mt-16">
            <Link
              href="/marketplace"
              className="group relative inline-flex items-center px-12 py-6 bg-gradient-to-r from-[#39FF14] to-emerald-400 text-black rounded-2xl font-bold text-xl hover:shadow-[0_0_50px_rgba(57,255,20,0.6)] transition-all duration-300 transform hover:scale-105 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#39FF14] to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></span>
              <span className="relative flex items-center gap-3">
                Explore All Listings
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
