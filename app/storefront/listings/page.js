"use client"
import { useState, useEffect } from "react"
import { Search, Filter, Plus, Edit, Trash2, Eye, Package, DollarSign } from "lucide-react"
import StorefrontLayout from "../components/StorefrontLayout"
import Link from "next/link"

export default function StorefrontListings() {
  const [listings, setListings] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem('storefront_token')
      
      if (!token) {
        router.push('/storefront/login')
        return
      }

      const response = await fetch('/api/storefront/listings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings)
      } else if (response.status === 401) {
        // Token expired
        localStorage.removeItem('storefront_token')
        localStorage.removeItem('storefront_user')
        router.push('/storefront/login')
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    
    try {
      const token = localStorage.getItem('storefront_token')
      
      const response = await fetch(`/api/storefront/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setListings(listings.filter(listing => listing.id !== listingId))
      } else if (response.status === 401) {
        localStorage.removeItem('storefront_token')
        localStorage.removeItem('storefront_user')
        router.push('/storefront/login')
      }
    } catch (error) {
      console.error('Failed to delete listing:', error)
    }
  }

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus
    const matchesCategory = filterCategory === 'all' || listing.category === filterCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'sold': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount)
  }

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#39FF14]/20 border-t-[#39FF14] rounded-full animate-spin" />
        </div>
      </StorefrontLayout>
    )
  }

  return (
    <StorefrontLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">My Listings</h1>
            <p className="text-gray-400 mt-1">Manage your marketplace listings</p>
          </div>
          <Link
            href="/storefront/listings/new"
            className="bg-gradient-to-r from-[#39FF14] to-green-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-[#39FF14] transition-all duration-300 shadow-lg shadow-[#39FF14]/20 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Listing</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="sold">Sold</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
            >
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="fashion">Fashion</option>
              <option value="home">Home & Garden</option>
              <option value="sports">Sports</option>
              <option value="books">Books</option>
              <option value="art">Art & Collectibles</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl overflow-hidden hover:border-[#39FF14]/30 transition-all duration-300">
                {/* Listing Image */}
                <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-gray-500" />
                  )}
                </div>
                
                {/* Listing Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white truncate">{listing.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(listing.status)}`}>
                      {listing.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{listing.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-[#39FF14]" />
                      <span className="text-[#39FF14] font-semibold">{formatCurrency(listing.price)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400 text-sm">
                      <Eye className="w-4 h-4" />
                      <span>{listing.views || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/storefront/listings/edit/${listing.id}`}
                      className="flex-1 bg-[#39FF14]/10 text-[#39FF14] px-4 py-2 rounded-lg text-center hover:bg-[#39FF14]/20 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => deleteListing(listing.id)}
                      className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-all duration-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
            <p className="text-gray-400 mb-6">You haven't created any listings yet or none match your filters.</p>
            <Link
              href="/storefront/listings/new"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#39FF14] to-green-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-[#39FF14] transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Listing</span>
            </Link>
          </div>
        )}
      </div>
    </StorefrontLayout>
  )
}