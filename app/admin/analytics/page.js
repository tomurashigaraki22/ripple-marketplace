"use client"
import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Users, DollarSign, Package, Calendar, Download, Filter } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useRouter } from "next/navigation"
import AdminLayout from "../components/AdminLayout"

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalRevenue: 0,
      totalUsers: 0,
      totalListings: 0,
      totalOrders: 0
    },
    charts: {
      revenueData: [],
      userGrowth: [],
      topCategories: [],
      membershipDistribution: []
    }
  })
  const [timeRange, setTimeRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const { user, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role_name !== 'admin')) {
      router.push('/admin/login')
      return
    }
    if (user && token) {
      fetchAnalytics()
    }
  }, [user, token, router, timeRange])

  const fetchAnalytics = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.analytics || analytics)
      } else {
        console.error('Failed to fetch analytics:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const overviewCards = [
    {
      title: "Total Revenue",
      value: `${analytics.overview.totalRevenue} XRPB`,
      icon: <DollarSign className="w-8 h-8" />,
      color: "from-green-500 to-green-600",
      change: "+23%"
    },
    {
      title: "Total Users",
      value: analytics.overview.totalUsers,
      icon: <Users className="w-8 h-8" />,
      color: "from-blue-500 to-blue-600",
      change: "+12%"
    },
    {
      title: "Total Listings",
      value: analytics.overview.totalListings,
      icon: <Package className="w-8 h-8" />,
      color: "from-purple-500 to-purple-600",
      change: "+8%"
    },
    {
      title: "Total Orders",
      value: analytics.overview.totalOrders,
      icon: <BarChart3 className="w-8 h-8" />,
      color: "from-orange-500 to-orange-600",
      change: "+15%"
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-gray-400 mt-2">Comprehensive platform analytics and insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-black/40 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] rounded-lg hover:bg-[#39FF14]/20 transition-all">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewCards.map((card, index) => (
            <div key={index} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#39FF14]/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center text-white`}>
                  {card.icon}
                </div>
                <span className="text-green-400 text-sm font-medium">{card.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{card.value}</h3>
              <p className="text-gray-400 text-sm">{card.title}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-[#39FF14]" />
              Revenue Trends
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>Revenue chart visualization would go here</p>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2 text-[#39FF14]" />
              User Growth
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>User growth chart visualization would go here</p>
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Package className="w-5 h-5 mr-2 text-[#39FF14]" />
              Top Categories
            </h3>
            <div className="space-y-4">
              {['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books'].map((category, index) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-white">{category}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#39FF14] to-cyan-400 h-2 rounded-full"
                        style={{ width: `${(5-index) * 20}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-sm">{(5-index) * 20}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Membership Distribution */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-[#39FF14]" />
              Membership Distribution
            </h3>
            <div className="space-y-4">
              {[
                { tier: 'Free', count: 1250, color: 'bg-gray-500' },
                { tier: 'Basic', count: 450, color: 'bg-blue-500' },
                { tier: 'Pro', count: 180, color: 'bg-purple-500' },
                { tier: 'Premium', count: 75, color: 'bg-yellow-500' }
              ].map((item) => (
                <div key={item.tier} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-white">{item.tier}</span>
                  </div>
                  <span className="text-gray-400">{item.count} users</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}