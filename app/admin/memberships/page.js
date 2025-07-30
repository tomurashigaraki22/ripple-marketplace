"use client"
import { useState, useEffect } from "react"
import { Users, Shield, TrendingUp, DollarSign, Calendar, Search, Filter, Eye, Edit, Trash2, Plus } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useRouter } from "next/navigation"
import AdminLayout from "../components/AdminLayout"

export default function AdminMemberships() {
  const [memberships, setMemberships] = useState([])
  const [membershipTiers, setMembershipTiers] = useState([])
  const [stats, setStats] = useState({
    totalMemberships: 0,
    activeMemberships: 0,
    revenue: 0,
    conversionRate: 0
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTier, setFilterTier] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { user, token } = useAuth() // Make sure to destructure token
  const router = useRouter()

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role_name !== 'admin')) {
      router.push('/admin/login')
      return
    }
    if (token) { // Only fetch when token is available
      fetchMemberships()
      fetchMembershipTiers()
      fetchStats()
    }
  }, [user, router, token]) // Add token to dependencies

  const fetchMemberships = async () => {
    try {
      const response = await fetch('/api/admin/memberships', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setMemberships(data.memberships || [])
    } catch (error) {
      console.error('Failed to fetch memberships:', error)
    }
  }

  const fetchMembershipTiers = async () => {
    try {
      const response = await fetch('/api/membership-tiers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setMembershipTiers(data.tiers || [])
    } catch (error) {
      console.error('Failed to fetch membership tiers:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/memberships/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Failed to fetch membership stats:', error)
    }
  }

  // Add this helper function to calculate membership status
  const getMembershipStatus = (membership) => {
    if (!membership.is_active) return 'cancelled'
    if (membership.expires_at && new Date(membership.expires_at) < new Date()) return 'expired'
    return 'active'
  }

  // Update the filteredMemberships calculation
  const filteredMemberships = memberships
    .filter(membership => {
      const matchesSearch = searchTerm === "" || 
        membership.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        membership.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTier = filterTier === "all" || membership.tier_name === filterTier
      
      const membershipStatus = getMembershipStatus(membership)
      const matchesStatus = filterStatus === "all" || membershipStatus === filterStatus
      
      return matchesSearch && matchesTier && matchesStatus
    })
    .map(membership => ({
      ...membership,
      status: getMembershipStatus(membership)
    }))

  const statCards = [
    {
      title: "Total Memberships",
      value: stats.totalMemberships,
      icon: <Users className="w-8 h-8" />,
      color: "from-blue-500 to-blue-600",
      change: "+12%"
    },
    {
      title: "Active Members",
      value: stats.activeMemberships,
      icon: <Shield className="w-8 h-8" />,
      color: "from-green-500 to-green-600",
      change: "+8%"
    },
    {
      title: "Revenue (XRPB)",
      value: stats.revenue,
      icon: <DollarSign className="w-8 h-8" />,
      color: "from-yellow-500 to-yellow-600",
      change: "+23%"
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: <TrendingUp className="w-8 h-8" />,
      color: "from-purple-500 to-purple-600",
      change: "+5%"
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Membership Management</h1>
            <p className="text-gray-400 mt-2">Manage user memberships and tiers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#39FF14] to-cyan-400 text-black rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Create Membership</span>
          </button>
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
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-sm">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
              >
                <option value="all">All Tiers</option>
                {membershipTiers.map(tier => (
                  <option key={tier.id} value={tier.name}>{tier.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Memberships Table */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">Active Memberships</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">User</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Tier</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Start Date</th>
                  <th className="text-left p-4 text-gray-400 font-medium">End Date</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMemberships.map((membership) => (
                  <tr key={membership.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">{membership.username}</p>
                        <p className="text-gray-400 text-sm">{membership.user_email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        membership.tier_name === 'Premium' ? 'bg-yellow-500/20 text-yellow-400' :
                        membership.tier_name === 'Pro' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {membership.tier_name}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        membership.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        membership.status === 'expired' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {membership.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">
                      {membership.created_at ? new Date(membership.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-gray-300">
                      {membership.expires_at ? new Date(membership.expires_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="p-2 hover:bg-blue-900/20 text-blue-400 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-yellow-900/20 text-yellow-400 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-900/20 text-red-400 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}