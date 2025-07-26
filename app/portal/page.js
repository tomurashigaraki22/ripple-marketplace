"use client"
import { useState, useEffect } from "react"
import { User, Wallet, Activity, Gift, TrendingUp, Settings, LogOut, Star, Shield, Zap, Globe, Eye, Bell, Lock, CreditCard, Award, ChevronRight } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useWallet } from "../context/WalletContext"

export default function PortalPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const { user, logout } = useAuth()
  const { xrpAddress, metaMaskAddress, xrplEvmAddress } = useWallet()

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const userData = {
    username: user?.name || "CryptoTrader2024",
    email: user?.email || "trader@example.com",
    walletAddress: xrpAddress || "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
    membershipTier: "Pro",
    xrpbBalance: 1250.75,
    joinDate: "March 2024",
    totalTrades: 47,
    portfolioValue: 5420.30,
    stakingRewards: 87.3
  }

  const recentActivity = [
    { type: "bid", item: "Cosmic NFT #1234", amount: "50 XRPB", time: "2 hours ago", status: "pending" },
    { type: "purchase", item: "Digital Art Collection", amount: "125 XRPB", time: "1 day ago", status: "completed" },
    { type: "listing", item: "Rare Gaming Item", amount: "200 XRPB", time: "3 days ago", status: "active" },
    { type: "staking", item: "XRPB Staking Reward", amount: "+15.5 XRPB", time: "1 week ago", status: "completed" },
  ]

  const tabs = [
    { id: "overview", label: "Overview", icon: <User className="w-5 h-5" /> },
    { id: "activity", label: "Activity", icon: <Activity className="w-5 h-5" /> },
    { id: "wallet", label: "Wallet", icon: <Wallet className="w-5 h-5" /> },
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
              Manage your RippleBids account, track your activities, and control your digital assets
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
                    <h2 className="text-2xl font-bold text-white mb-1">{userData.username}</h2>
                    <p className="text-gray-400 text-sm mb-3">{userData.email}</p>
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#39FF14]/20 to-[#39FF14]/20 border border-[#39FF14]/50 rounded-full">
                      <Star className="w-4 h-4 text-[#39FF14]" />
                      <span className="text-[#39FF14] font-semibold text-sm">{userData.membershipTier} Member</span>
                    </div>
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
                  {/* Enhanced Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: "XRPB Balance", value: userData.xrpbBalance.toLocaleString(), icon: Wallet, suffix: "XRPB" },
                      { label: "Total Trades", value: userData.totalTrades, icon: TrendingUp, suffix: "" },
                      { label: "Portfolio Value", value: `$${userData.portfolioValue.toLocaleString()}`, icon: Award, suffix: "" },
                      { label: "Member Since", value: userData.joinDate, icon: User, suffix: "" }
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

                  {/* Enhanced Quick Actions */}
                  <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-2xl" />
                    <div className="relative">
                      <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                        <Zap className="w-6 h-6 text-[#39FF14]" />
                        <span>Quick Actions</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { icon: Gift, title: "Claim Airdrop", desc: "Available: 25 XRPB" },
                          { icon: TrendingUp, title: "Upgrade Membership", desc: "Get Premium benefits" },
                          { icon: Wallet, title: "Withdraw Funds", desc: "Transfer to wallet" }
                        ].map((action, index) => (
                          <button key={index} className="group relative p-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:border-[#39FF14]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#39FF14]/20 hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative text-center">
                              <div className="inline-flex p-4 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 group-hover:from-[#39FF14] group-hover:to-[#39FF14] mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300">
                                <action.icon className="w-8 h-8 text-white" />
                              </div>
                              <h4 className="font-bold text-white mb-2 group-hover:text-[#39FF14] transition-colors">{action.title}</h4>
                              <p className="text-sm text-gray-400">{action.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Recent Activity */}
                  <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-2xl" />
                    <div className="relative">
                      <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                        <Activity className="w-6 h-6 text-[#39FF14]" />
                        <span>Recent Activity</span>
                      </h3>
                      <div className="space-y-4">
                        {recentActivity.slice(0, 3).map((activity, index) => (
                          <div key={index} className="group flex items-center justify-between p-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:border-[#39FF14]/50 transition-all duration-300">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-gray-600 to-gray-700 group-hover:from-[#39FF14] group-hover:to-[#39FF14] transition-all duration-300 shadow-lg">
                                <Activity className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-white group-hover:text-[#39FF14] transition-colors">{activity.item}</p>
                                <p className="text-sm text-gray-400">{activity.time}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#39FF14] text-lg">{activity.amount}</p>
                              <p className="text-sm text-gray-400 capitalize">{activity.type}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "activity" && (
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-2xl" />
                  <div className="relative">
                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                      <Activity className="w-6 h-6 text-[#39FF14]" />
                      <span>Activity History</span>
                    </h3>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="group flex items-center justify-between p-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:border-[#39FF14]/50 transition-all duration-300">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-gray-600 to-gray-700 group-hover:from-[#39FF14] group-hover:to-[#39FF14] transition-all duration-300 shadow-lg">
                              <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-white group-hover:text-[#39FF14] transition-colors">{activity.item}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <p className="text-sm text-gray-400">{activity.time}</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  activity.status === 'completed' ? 'bg-[#39FF14]/20 text-[#39FF14]' :
                                  activity.status === 'pending' ? 'bg-gray-500/20 text-gray-400' :
                                  'bg-white/20 text-white'
                                }`}>
                                  {activity.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#39FF14] text-lg">{activity.amount}</p>
                            <p className="text-sm text-gray-400 capitalize">{activity.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "wallet" && (
                <div className="space-y-8">
                  {/* Wallet Information */}
                  <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-2xl" />
                    <div className="relative">
                      <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                        <Wallet className="w-6 h-6 text-[#39FF14]" />
                        <span>Wallet Information</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { label: "Wallet Address", value: `${userData.walletAddress.slice(0, 10)}...${userData.walletAddress.slice(-6)}`, icon: Globe },
                          { label: "XRPB Balance", value: `${userData.xrpbBalance.toLocaleString()} XRPB`, icon: Wallet },
                          { label: "Staked Amount", value: "500 XRPB", icon: Shield },
                          { label: "Pending Rewards", value: "12.5 XRPB", icon: Gift }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:border-[#39FF14]/50 transition-all duration-300">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg bg-gradient-to-r from-[#39FF14] to-[#39FF14]">
                                <item.icon className="w-5 h-5 text-black" />
                              </div>
                              <span className="text-gray-300">{item.label}</span>
                            </div>
                            <span className="font-bold text-white">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Staking Section */}
                  <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-2xl" />
                    <div className="relative">
                      <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                        <Shield className="w-6 h-6 text-[#39FF14]" />
                        <span>Staking Dashboard</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="p-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl">
                          <h4 className="font-bold text-white mb-4 flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-[#39FF14] to-[#39FF14] rounded-full" />
                            <span>Current Stake</span>
                          </h4>
                          <p className="text-3xl font-bold text-[#39FF14] mb-2">500 XRPB</p>
                          <p className="text-sm text-gray-400">APY: 12% • Locked until Dec 2024</p>
                        </div>
                        <div className="p-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl">
                          <h4 className="font-bold text-white mb-4 flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-[#39FF14] to-[#39FF14] rounded-full" />
                            <span>Rewards Earned</span>
                          </h4>
                          <p className="text-3xl font-bold text-[#39FF14] mb-2">{userData.stakingRewards} XRPB</p>
                          <p className="text-sm text-gray-400">This month • +15.2% from last month</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <button className="px-8 py-4 bg-gradient-to-r from-[#39FF14] to-[#39FF14] text-black rounded-xl font-bold hover:shadow-2xl hover:shadow-[#39FF14]/30 transition-all duration-300 hover:scale-105">
                          Stake More XRPB
                        </button>
                        <button className="px-8 py-4 bg-black/40 border border-[#39FF14]/50 text-[#39FF14] rounded-xl font-bold hover:bg-[#39FF14]/10 transition-all duration-300">
                          Claim Rewards
                        </button>
                        <button className="px-8 py-4 bg-black/40 border border-white/20 text-white rounded-xl font-bold hover:bg-white/5 transition-all duration-300">
                          View History
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-8">
                  {/* Profile Settings */}
                  <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-2xl" />
                    <div className="relative">
                      <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                        <User className="w-6 h-6 text-[#39FF14]" />
                        <span>Profile Settings</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">Username</label>
                          <input
                            type="text"
                            defaultValue={userData.username}
                            className="w-full px-6 py-4 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Email</label>
                          <input
                            type="email"
                            defaultValue={userData.email}
                            className="w-full px-6 py-4 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-2xl" />
                    <div className="relative">
                      <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                        <Bell className="w-6 h-6 text-[#39FF14]" />
                        <span>Notification Preferences</span>
                      </h3>
                      <div className="space-y-6">
                        {[
                          { label: "Email Notifications", desc: "Receive updates via email", checked: true },
                          { label: "Bid Alerts", desc: "Get notified when someone bids on your items", checked: true },
                          { label: "Price Alerts", desc: "Alerts for significant price changes", checked: false },
                          { label: "Marketing Updates", desc: "News and promotional content", checked: false }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:border-[#39FF14]/50 transition-all duration-300">
                            <div>
                              <h4 className="font-bold text-white mb-1">{item.label}</h4>
                              <p className="text-sm text-gray-400">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                              <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#39FF14]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#39FF14] peer-checked:to-[#39FF14]"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-2xl" />
                    <div className="relative">
                      <h3 className="text-2xl font-bold text-white mb-8 flex items-center space-x-3">
                        <Lock className="w-6 h-6 text-[#39FF14]" />
                        <span>Security & Privacy</span>
                      </h3>
                      <div className="space-y-4">
                        {[
                          { icon: Lock, title: "Change Password", desc: "Update your account password" },
                          { icon: Shield, title: "Two-Factor Authentication", desc: "Add an extra layer of security" },
                          { icon: Wallet, title: "Manage Connected Wallets", desc: "View and manage wallet connections" },
                          { icon: Eye, title: "Privacy Settings", desc: "Control your data and visibility" }
                        ].map((item, index) => (
                          <button key={index} className="group w-full flex items-center justify-between p-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl hover:border-[#39FF14]/50 transition-all duration-300 text-left">
                            <div className="flex items-center space-x-4">
                              <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 group-hover:from-[#39FF14] group-hover:to-[#39FF14] transition-all duration-300">
                                <item.icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-white group-hover:text-[#39FF14] transition-colors">{item.title}</h4>
                                <p className="text-sm text-gray-400">{item.desc}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#39FF14] transition-colors" />
                          </button>
                        ))}
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
