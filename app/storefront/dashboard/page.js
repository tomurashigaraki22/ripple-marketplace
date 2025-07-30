"use client"
import { useState, useEffect } from "react"
import { Package, TrendingUp, Eye, DollarSign, Plus, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import StorefrontLayout from "../components/StorefrontLayout"
import { useAuth } from "../../context/AuthContext"

export default function StorefrontDashboard() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalEarnings: 0,
    pendingOrders: 0,
    completedOrders: 0
  })
  const [recentListings, setRecentListings] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return
    
    // If no token after auth loading is complete, redirect to login
    if (!token) {
      router.push('/storefront/login')
      return
    }
    
    // If we have a token, fetch dashboard data
    fetchDashboardData()
  }, [token, authLoading, router])

  const fetchDashboardData = async () => {
    try {
      if (!token) {
        console.error('No auth token found')
        setLoading(false)
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Fetch dashboard statistics
      const statsResponse = await fetch('/api/storefront/stats', { headers })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      } else if (statsResponse.status === 401) {
        console.error('Authentication failed')
        router.push('/storefront/login')
        return
      }

      // Fetch recent listings
      const listingsResponse = await fetch('/api/storefront/listings?limit=5', { headers })
      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json()
        setRecentListings(listingsData.listings)
      }

      // Fetch recent orders
      const ordersResponse = await fetch('/api/storefront/orders?limit=5', { headers })
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setRecentOrders(ordersData.orders)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
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
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back to your storefront</p>
          </div>
          <Link
            href="/storefront/listings/new"
            className="bg-gradient-to-r from-[#39FF14] to-green-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-[#39FF14] transition-all duration-300 shadow-lg shadow-[#39FF14]/20 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Listing</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Listings</p>
                <p className="text-2xl font-bold text-white">{stats.totalListings}</p>
              </div>
              <Package className="w-8 h-8 text-[#39FF14]" />
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Listings</p>
                <p className="text-2xl font-bold text-green-400">{stats.activeListings}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Views</p>
                <p className="text-2xl font-bold text-blue-400">{stats.totalViews}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold text-[#39FF14]">{formatCurrency(stats.totalEarnings)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-[#39FF14]" />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Listings */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Listings</h2>
              <Link
                href="/storefront/listings"
                className="text-[#39FF14] hover:text-green-400 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentListings.length > 0 ? (
                recentListings.map((listing) => (
                  <div key={listing.id} className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#39FF14]/20 to-green-600/20 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-[#39FF14]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{listing.title}</h3>
                      <p className="text-gray-400 text-sm">{formatCurrency(listing.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{listing.views} views</p>
                      <p className={`text-xs px-2 py-1 rounded-full ${
                        listing.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        listing.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {listing.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No listings yet</p>
                  <Link
                    href="/storefront/listings/new"
                    className="text-[#39FF14] hover:text-green-400 text-sm font-medium mt-2 inline-block"
                  >
                    Create your first listing
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
              <Link
                href="/storefront/orders"
                className="text-[#39FF14] hover:text-green-400 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{order.listing_title}</h3>
                      <p className="text-gray-400 text-sm">Order #{order.id.substring(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#39FF14] font-medium">{formatCurrency(order.amount)}</p>
                      <p className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
                        order.status === 'paid' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No orders yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/storefront/listings/new"
              className="flex items-center space-x-3 p-4 bg-gradient-to-r from-[#39FF14]/10 to-green-600/10 border border-[#39FF14]/20 rounded-lg hover:from-[#39FF14]/20 hover:to-green-600/20 transition-all duration-300"
            >
              <Plus className="w-6 h-6 text-[#39FF14]" />
              <span className="text-white font-medium">Create New Listing</span>
            </Link>
            
            <Link
              href="/storefront/analytics"
              className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20 rounded-lg hover:from-blue-500/20 hover:to-purple-600/20 transition-all duration-300"
            >
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <span className="text-white font-medium">View Analytics</span>
            </Link>
            
            <Link
              href="/storefront/settings"
              className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-600/10 to-gray-700/10 border border-gray-600/20 rounded-lg hover:from-gray-600/20 hover:to-gray-700/20 transition-all duration-300"
            >
              <Package className="w-6 h-6 text-gray-400" />
              <span className="text-white font-medium">Manage Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  )
}