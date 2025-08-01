"use client"
import { useState, useEffect } from "react"
import { User, Settings, LogOut, Star, Award, ChevronRight, Package, Calendar } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function PortalPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [membershipData, setMembershipData] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    memberSince: null
  })
  const { user, logout, token } = useAuth()

  useEffect(() => {
    if (user && token) {
      fetchUserData()
    }
  }, [user, token])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Fetch user profile data
      const userResponse = await fetch('/api/auth/me', { headers })
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUserData(userData)
        setStats(prev => ({
          ...prev,
          memberSince: new Date(userData.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
          })
        }))
      }

      // Fetch membership data
      const membershipResponse = await fetch('/api/membership/current', { headers })
      if (membershipResponse.ok) {
        const membershipData = await membershipResponse.json()
        setMembershipData(membershipData.currentMembership)
      }

      // Fetch recent orders
      if (userData?.id) {
        const ordersResponse = await fetch(`/api/orders?limit=5`, { headers })
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          setRecentOrders(ordersData.orders || [])
          setStats(prev => ({
            ...prev,
            totalOrders: ordersData.pagination?.total || 0
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: <User className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ]

  const handleLogout = () => {
    logout()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#39FF14]/30 border-t-[#39FF14] rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-white/30 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          {/* Floating Particles */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#39FF14] rounded-full opacity-20 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#39FF14]/3 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/2 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-[#39FF14]/2 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      <div className="relative z-10 min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="relative inline-block">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-[#39FF14] to-white bg-clip-text text-transparent mb-6">
                My Portal
              </h1>
              <div className="absolute -inset-4 bg-gradient-to-r from-[#39FF14]/20 to-[#39FF14]/20 blur-2xl rounded-full opacity-30" />
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Manage your RippleBids account, track your activities, and view your marketplace history
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Enhanced Sidebar */}
            <div className="xl:col-span-1">
              <div className="sticky top-24">
                <div className="relative bg-black/40 backdrop-blur-xl border border-[#39FF14]/20 rounded-2xl p-8 shadow-2xl shadow-[#39FF14]/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-2xl" />
                  
                  {/* Profile Section */}
                  <div className="relative text-center mb-8">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#39FF14] to-[#39FF14] rounded-full blur-md opacity-60" />
                      <div className="relative w-24 h-24 bg-gradient-to-r from-[#39FF14] to-[#39FF14] rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/10">
                        <User className="w-12 h-12 text-black" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">{userData?.username || user?.name || "User"}</h2>
                    <p className="text-gray-400 text-sm mb-3">{userData?.email || user?.email || ""}</p>
                    {membershipData && (
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#39FF14]/20 to-[#39FF14]/20 border border-[#39FF14]/50 rounded-full">
                        <Star className="w-4 h-4 text-[#39FF14]" />
                        <span className="text-[#39FF14] font-semibold text-sm">{membershipData.tier.name} Member</span>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <nav className="space-y-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`group w-full flex items-center space-x-4 px-6 py-4 rounded-xl transition-all duration-300 relative overflow-hidden ${
                          activeTab === tab.id 
                            ? 'bg-gradient-to-r from-[#39FF14]/20 to-[#39FF14]/20 border border-[#39FF14]/50 text-[#39FF14] shadow-lg shadow-[#39FF14]/20' 
                            : 'hover:bg-white/5 text-gray-300 hover:text-white border border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className={`p-2 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 ${activeTab === tab.id ? 'from-[#39FF14] to-[#39FF14] opacity-100' : 'opacity-60 group-hover:opacity-80'} transition-all duration-300`}>
                          {tab.icon}
                        </div>
                        <span className="font-medium">{tab.label}</span>
                        {activeTab === tab.id && (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    ))}
                    
                    <button 
                      onClick={handleLogout}
                      className="group w-full flex items-center space-x-4 px-6 py-4 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/30 transition-all duration-300"
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 opacity-60 group-hover:opacity-80 transition-opacity">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <span className="font-medium">Logout</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>

            {/* Enhanced Main Content */}
            <div className="xl:col-span-3">
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { label: "Total Orders", value: stats.totalOrders, icon: Package, suffix: "" },
                      { label: "Member Since", value: stats.memberSince || "N/A", icon: Calendar, suffix: "" },
                      { label: "Membership Tier", value: membershipData?.tier.name || "Basic", icon: Award, suffix: "" }
                    ].map((stat, index) => (
                      <div key={index} className="group relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#39FF14]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#39FF14]/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 group-hover:from-[#39FF14] group-hover:to-[#39FF14] transition-all duration-300 shadow-lg">
                              <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-right">
                              <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                            </div>
                          </div>
                          <div className="flex items-baseline space-x-2">
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            {stat.suffix && <span className="text-[#39FF14] text-sm font-medium">{stat.suffix}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Membership Information */}
                  {membershipData && (
                    <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-2xl" />
                      <div className="relative">
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                          <Star className="w-6 h-6 text-[#39FF14]" />
                          <span>Membership Details</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl">
                            <p className="text-gray-400 text-sm mb-1">Current Tier</p>
                            <p className="text-white font-bold text-lg">{membershipData.tier.name}</p>
                          </div>
                          <div className="p-4 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl">
                            <p className="text-gray-400 text-sm mb-1">Status</p>
                            <p className="text-[#39FF14] font-bold text-lg">
                              {membershipData.membership.isActive ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                          {membershipData.membership.expiresAt && (
                            <div className="p-4 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl">
                              <p className="text-gray-400 text-sm mb-1">Expires</p>
                              <p className="text-white font-bold text-lg">
                                {new Date(membershipData.membership.expiresAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {membershipData.membership.startDate && (
                            <div className="p-4 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl">
                              <p className="text-gray-400 text-sm mb-1">Started</p>
                              <p className="text-white font-bold text-lg">
                                {new Date(membershipData.membership.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Orders */}
                  {recentOrders.length > 0 && (
                    <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-2xl" />
                      <div className="relative">
                        <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                          <Package className="w-6 h-6 text-[#39FF14]" />
                          <span>Recent Orders</span>
                        </h3>
                        <div className="space-y-4">
                          {recentOrders.slice(0, 3).map((order, index) => (
                            <div key={index} className="group flex items-center justify-between p-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:border-[#39FF14]/50 transition-all duration-300">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-gray-600 to-gray-700 group-hover:from-[#39FF14] group-hover:to-[#39FF14] transition-all duration-300 shadow-lg">
                                  <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-white group-hover:text-[#39FF14] transition-colors">{order.listing_title}</p>
                                  <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-[#39FF14] text-lg">{order.amount} XRPB</p>
                                <p className="text-sm text-gray-400 capitalize">{order.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-2xl" />
                  <div className="relative">
                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                      <Settings className="w-6 h-6 text-[#39FF14]" />
                      <span>Account Settings</span>
                    </h3>
                    <div className="space-y-6">
                      <div className="p-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl">
                        <h4 className="text-white font-bold mb-4">Profile Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-gray-400 text-sm">Username</label>
                            <p className="text-white font-medium">{userData?.username || "N/A"}</p>
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm">Email</label>
                            <p className="text-white font-medium">{userData?.email || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl">
                        <h4 className="text-white font-bold mb-4">Account Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-gray-400 text-sm">User ID</label>
                            <p className="text-white font-medium font-mono text-sm">{userData?.id || "N/A"}</p>
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm">Member Since</label>
                            <p className="text-white font-medium">{stats.memberSince || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
