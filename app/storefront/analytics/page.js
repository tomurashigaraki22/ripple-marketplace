"use client"
import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Eye, DollarSign, Package, Users } from "lucide-react"
import StorefrontLayout from "../components/StorefrontLayout"
import { useAuth } from "../../context/AuthContext"
import { useRouter } from "next/navigation"

export default function StorefrontAnalytics() {
  const { token, authLoading } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState({
    overview: {
      totalViews: 0,
      totalEarnings: 0,
      totalListings: 0,
      conversionRate: 0
    },
    monthlyData: [],
    topListings: [],
    categoryPerformance: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    if (!authLoading) {
      if (!token) {
        router.push('/storefront/login')
        return
      }
      fetchAnalytics()
    }
  }, [token, authLoading, timeRange])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/storefront/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status === 401) {
        router.push('/storefront/login')
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      } else {
        console.error('Failed to fetch analytics:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
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
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400 mt-1">Track your storefront performance</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Views</p>
                <p className="text-2xl font-bold text-white">{analytics.overview.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold text-[#39FF14]">{formatCurrency(analytics.overview.totalEarnings)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-[#39FF14]" />
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Listings</p>
                <p className="text-2xl font-bold text-white">{analytics.overview.totalListings}</p>
              </div>
              <Package className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Conversion Rate</p>
                <p className="text-2xl font-bold text-white">{analytics.overview.conversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Performance */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Monthly Performance</h2>
            <div className="h-64 flex items-end justify-between space-x-2">
              {analytics.monthlyData.map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-[#39FF14] to-green-400 rounded-t"
                    style={{
                      height: `${(month.earnings / Math.max(...analytics.monthlyData.map(m => m.earnings))) * 200}px`
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-2">{month.month}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Listings */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Top Performing Listings</h2>
            <div className="space-y-4">
              {analytics.topListings.map((listing, index) => (
                <div key={listing.id} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#39FF14] to-green-600 rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{listing.title}</h3>
                    <p className="text-gray-400 text-sm">{listing.views} views • {formatCurrency(listing.earnings)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Category Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.categoryPerformance.map((category) => (
              <div key={category.name} className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium capitalize">{category.name}</h3>
                  <span className="text-[#39FF14] text-sm font-semibold">{formatCurrency(category.earnings)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{category.listings} listings</span>
                  <span>{category.views} views</span>
                </div>
                <div className="mt-3 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#39FF14] to-green-400 h-2 rounded-full"
                    style={{
                      width: `${(category.earnings / Math.max(...analytics.categoryPerformance.map(c => c.earnings))) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  )
}