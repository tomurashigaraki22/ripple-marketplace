"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Search, Store, Calendar, Eye, Package, Star, Filter, MapPin, Award, TrendingUp, Heart, Share2, ExternalLink } from "lucide-react"

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
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    if (userId) {
      fetchStorefront()
    }
  }, [userId, searchTerm, selectedCategory, sortBy])

  const fetchStorefront = async (offset = 0, append = false) => {
    try {
      if (!append) setLoading(true)
      else setLoadingMore(true)
      
      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString(),
        sort: sortBy
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      
      const response = await fetch(`/api/storefront/public/${userId}?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setStorefront(data.storefront)
        
        if (append) {
          setListings(prev => [...prev, ...data.listings])
        } else {
          setListings(data.listings)
        }
        
        setPagination(data.pagination)
      } else if (response.status === 404) {
        setStorefront(null)
      }
    } catch (error) {
      console.error('Failed to fetch storefront:', error)
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
        console.log('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      // Add toast notification here
    }
  }

  const categories = [...new Set(listings.map(listing => listing.category))]

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-gray-800 border-t-[#39FF14] mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="w-8 h-8 text-[#39FF14]" />
            </div>
          </div>
          <p className="text-gray-300 mt-4 text-lg font-medium">Loading storefront...</p>
        </div>
      </div>
    )
  }

  if (!storefront) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-gray-900/80 backdrop-blur-lg rounded-3xl p-8 border border-gray-700">
            <Store className="w-20 h-20 text-[#39FF14] mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Storefront Not Found</h1>
            <p className="text-gray-400 mb-6 leading-relaxed">The storefront you're looking for doesn't exist or is not active.</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 px-8 py-4 bg-[#39FF14] text-black rounded-2xl hover:bg-green-400 transition-all duration-300 transform hover:scale-105 font-semibold">
              <ExternalLink className="w-5 h-5" />
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 to-black/50"></div>
<div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%2339FF14%22 fill-opacity=%220.1%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            {/* Profile Avatar */}
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 bg-gradient-to-br from-[#39FF14] to-green-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-gray-800">
                <Store className="w-16 h-16 text-black" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#39FF14] rounded-full p-2 border-4 border-gray-800">
                <Award className="w-4 h-4 text-black" />
              </div>
            </div>
            
            {/* Storefront Info */}
            <h1 className="text-5xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-[#39FF14] to-green-400 bg-clip-text text-transparent">
                {storefront.username}'s Storefront
              </span>
            </h1>
            
            <div className="flex items-center justify-center gap-6 text-gray-300 mb-8">
              <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700">
                <Calendar className="w-4 h-4" />
                <span>Since {new Date(storefront.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700">
                <Star className="w-4 h-4 text-[#39FF14]" />
                <span className="capitalize">{storefront.membershipTier} Member</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={shareStorefront}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl text-white hover:bg-gray-700/50 transition-all duration-300"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
              <Link
                href="/marketplace"
                className="flex items-center gap-2 px-6 py-3 bg-[#39FF14] text-black rounded-2xl hover:bg-green-400 transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <ExternalLink className="w-5 h-5" />
                Browse All
              </Link>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-3xl p-6 text-center hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-105">
              <div className="bg-gradient-to-br from-[#39FF14] to-green-600 rounded-2xl p-4 w-fit mx-auto mb-4">
                <Package className="w-8 h-8 text-black" />
              </div>
              <p className="text-3xl font-bold text-white mb-2">{storefront.stats.totalListings}</p>
              <p className="text-gray-400">Active Listings</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-3xl p-6 text-center hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-105">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-fit mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-white mb-2">{storefront.stats.totalViews.toLocaleString()}</p>
              <p className="text-gray-400">Total Views</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-3xl p-6 text-center hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-105">
              <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-4 w-fit mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-white mb-2">{storefront.stats.averagePrice.toFixed(2)}</p>
              <p className="text-gray-400">Avg Price (USD)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search and Filter Bar */}
        <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-3xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search amazing listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent backdrop-blur-sm"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-6 py-4 bg-gray-900/50 border border-gray-600 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent backdrop-blur-sm"
              >
                <option value="" className="bg-gray-800">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-800">{category}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-6 py-4 bg-gray-900/50 border border-gray-600 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14] backdrop-blur-sm"
              >
                <option value="newest" className="bg-gray-800">Newest First</option>
                <option value="oldest" className="bg-gray-800">Oldest First</option>
                <option value="price_low" className="bg-gray-800">Price: Low to High</option>
                <option value="price_high" className="bg-gray-800">Price: High to Low</option>
                <option value="popular" className="bg-gray-800">Most Popular</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-3xl p-12 max-w-md mx-auto">
              <Package className="w-20 h-20 text-[#39FF14] mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">No listings found</h3>
              <p className="text-gray-400 leading-relaxed">This storefront doesn't have any listings matching your criteria. Try adjusting your search or filters.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {listings.map((listing, index) => (
                <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                  <div 
                    className="group bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-3xl overflow-hidden hover:bg-gray-700/50 hover:border-[#39FF14] transition-all duration-500 transform hover:scale-105 hover:shadow-2xl"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Image */}
                    <div className="aspect-square bg-gradient-to-br from-gray-700/50 to-gray-800/50 relative overflow-hidden">
                      {listing.images && JSON.parse(listing.images)[0] ? (
                        <img
                          src={JSON.parse(listing.images)[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-gray-500" />
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Category Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="bg-gray-800/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-gray-600">
                          {listing.category}
                        </span>
                      </div>
                      
                      {/* Chain Badge */}
                      <div className="absolute top-4 right-4">
                        <span className="bg-[#39FF14] text-black text-xs font-semibold px-3 py-1 rounded-full">
                          {listing.chain.toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Heart Icon */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-gray-800/80 backdrop-blur-sm rounded-full p-2 border border-gray-600">
                          <Heart className="w-4 h-4 text-[#39FF14]" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-[#39FF14] transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {listing.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-[#39FF14]">
                            {listing.price} USD
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Eye className="w-4 h-4" />
                          <span>{listing.views}</span>
                        </div>
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
                  className="px-8 py-4 bg-[#39FF14] text-black rounded-2xl hover:bg-green-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold text-lg"
                >
                  {loadingMore ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                      Loading...
                    </div>
                  ) : (
                    'Load More Listings'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}