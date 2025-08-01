"use client"
import { useState, useEffect } from "react"
import { Users, Package, CreditCard, TrendingUp, Eye, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useRouter } from "next/navigation"
import AdminLayout from "../components/AdminLayout"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingListings: 0,
    activeMemberships: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role_name !== 'admin') {
      router.push('/admin/login')
      return
    }
    fetchDashboardData()
  }, [user, router])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No admin token found')
        router.push('/admin/login')
        return
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken')
          router.push('/admin/login')
          return
        }
        throw new Error('Failed to fetch dashboard data')
      }
      
      const data = await response.json()
      setStats(data.stats)
      setRecentActivity(data.recentActivity)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users className="w-8 h-8" />,
      color: "from-blue-500 to-blue-600",
      change: "+12%"
    },
    {
      title: "Total Listings",
      value: stats.totalListings,
      icon: <Package className="w-8 h-8" />,
      color: "from-green-500 to-green-600",
      change: "+8%"
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: <CreditCard className="w-8 h-8" />,
      color: "from-purple-500 to-purple-600",
      change: "+15%"
    },
    {
      title: "Revenue (XRPB)",
      value: stats.totalRevenue,
      icon: <DollarSign className="w-8 h-8" />,
      color: "from-yellow-500 to-yellow-600",
      change: "+23%"
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
            <p className="text-gray-400 mt-2">Welcome back, {user?.username}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Last updated</p>
            <p className="text-white font-medium">{new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#39FF14]/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                  {stat.icon}
                </div>
                <span className="text-green-400 text-sm font-medium">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value.toLocaleString()}</h3>
              <p className="text-gray-400 text-sm">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-[#39FF14]" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-black/20 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'user' ? 'bg-blue-500/20 text-blue-400' :
                    activity.type === 'listing' ? 'bg-green-500/20 text-green-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {activity.type === 'user' ? <Users className="w-5 h-5" /> :
                     activity.type === 'listing' ? <Package className="w-5 h-5" /> :
                     <CreditCard className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.description}</p>
                    <p className="text-gray-400 text-xs">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-[#39FF14]" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => router.push("/admin/users")} className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all text-left">
                <Users className="w-6 h-6 text-blue-400 mb-2" />
                <p className="text-white font-medium">Manage Users</p>
                <p className="text-gray-400 text-xs">View and edit users</p>
              </button>
              <button onClick={() => router.push("/admin/listings")} className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all text-left">
                <Package className="w-6 h-6 text-green-400 mb-2" />
                <p className="text-white font-medium">Review Listings</p>
                <p className="text-gray-400 text-xs">{stats.pendingListings} pending</p>
              </button>
              <button onClick={() => router.push("/admin/orders")} className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all text-left">
                <CreditCard className="w-6 h-6 text-purple-400 mb-2" />
                <p className="text-white font-medium">View Orders</p>
                <p className="text-gray-400 text-xs">Process orders</p>
              </button>
              <button onClick={() => router.push("/admin/analytics")} className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-all text-left">
                <TrendingUp className="w-6 h-6 text-yellow-400 mb-2" />
                <p className="text-white font-medium">Analytics</p>
                <p className="text-gray-400 text-xs">View reports</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}