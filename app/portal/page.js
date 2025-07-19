"use client"
import { useState } from "react"
import { User, Wallet, Activity, Gift, TrendingUp, Settings, LogOut } from "lucide-react"

export default function PortalPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const userData = {
    username: "CryptoTrader2024",
    email: "trader@example.com",
    walletAddress: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
    membershipTier: "Pro",
    xrpbBalance: 1250.75,
    joinDate: "March 2024",
  }

  const recentActivity = [
    { type: "bid", item: "Cosmic NFT #1234", amount: "50 XRPB", time: "2 hours ago" },
    { type: "purchase", item: "Digital Art Collection", amount: "125 XRPB", time: "1 day ago" },
    { type: "listing", item: "Rare Gaming Item", amount: "200 XRPB", time: "3 days ago" },
    { type: "staking", item: "XRPB Staking Reward", amount: "+15.5 XRPB", time: "1 week ago" },
  ]

  const tabs = [
    { id: "overview", label: "Overview", icon: <User className="w-5 h-5" /> },
    { id: "activity", label: "Activity", icon: <Activity className="w-5 h-5" /> },
    { id: "wallet", label: "Wallet", icon: <Wallet className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">My Portal</h1>
          <p className="text-xl text-gray-300">Manage your RippleBids account and activities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card-glow p-6 rounded-lg">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-[#39FF14] rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-black" />
                </div>
                <h2 className="text-xl font-semibold">{userData.username}</h2>
                <p className="text-gray-400">{userData.email}</p>
                <div className="mt-2">
                  <span className="px-3 py-1 bg-[#39FF14] text-black rounded-full text-sm font-semibold">
                    {userData.membershipTier}
                  </span>
                </div>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id ? "bg-[#39FF14] text-black" : "hover:bg-gray-800"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-900/20 text-red-400">
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card-glow p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400">XRPB Balance</p>
                        <p className="text-2xl font-bold neon-text">{userData.xrpbBalance.toLocaleString()}</p>
                      </div>
                      <Wallet className="w-8 h-8 text-[#39FF14]" />
                    </div>
                  </div>

                  <div className="card-glow p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400">Total Trades</p>
                        <p className="text-2xl font-bold">47</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-[#39FF14]" />
                    </div>
                  </div>

                  <div className="card-glow p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400">Member Since</p>
                        <p className="text-2xl font-bold">{userData.joinDate}</p>
                      </div>
                      <User className="w-8 h-8 text-[#39FF14]" />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card-glow p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="p-4 neon-border rounded-lg hover:neon-glow transition-all">
                      <Gift className="w-8 h-8 text-[#39FF14] mx-auto mb-2" />
                      <div className="font-semibold">Claim Airdrop</div>
                      <div className="text-sm text-gray-400">Available: 25 XRPB</div>
                    </button>

                    <button className="p-4 neon-border rounded-lg hover:neon-glow transition-all">
                      <TrendingUp className="w-8 h-8 text-[#39FF14] mx-auto mb-2" />
                      <div className="font-semibold">Upgrade Membership</div>
                      <div className="text-sm text-gray-400">Get Premium benefits</div>
                    </button>

                    <button className="p-4 neon-border rounded-lg hover:neon-glow transition-all">
                      <Wallet className="w-8 h-8 text-[#39FF14] mx-auto mb-2" />
                      <div className="font-semibold">Withdraw Funds</div>
                      <div className="text-sm text-gray-400">Transfer to wallet</div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity Preview */}
                <div className="card-glow p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentActivity.slice(0, 3).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              activity.type === "bid"
                                ? "bg-blue-500/20 text-blue-400"
                                : activity.type === "purchase"
                                  ? "bg-green-500/20 text-green-400"
                                  : activity.type === "listing"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-purple-500/20 text-purple-400"
                            }`}
                          >
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold">{activity.item}</p>
                            <p className="text-sm text-gray-400">{activity.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold neon-text">{activity.amount}</p>
                          <p className="text-sm text-gray-400 capitalize">{activity.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="card-glow p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-6">Activity History</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === "bid"
                              ? "bg-blue-500/20 text-blue-400"
                              : activity.type === "purchase"
                                ? "bg-green-500/20 text-green-400"
                                : activity.type === "listing"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-purple-500/20 text-purple-400"
                          }`}
                        >
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{activity.item}</p>
                          <p className="text-sm text-gray-400">{activity.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold neon-text">{activity.amount}</p>
                        <p className="text-sm text-gray-400 capitalize">{activity.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "wallet" && (
              <div className="space-y-6">
                <div className="card-glow p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-6">Wallet Information</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg">
                      <span>Wallet Address</span>
                      <span className="font-mono text-sm">
                        {userData.walletAddress.slice(0, 10)}...{userData.walletAddress.slice(-6)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg">
                      <span>XRPB Balance</span>
                      <span className="neon-text font-semibold">{userData.xrpbBalance.toLocaleString()} XRPB</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg">
                      <span>Staked Amount</span>
                      <span className="text-purple-400 font-semibold">500 XRPB</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg">
                      <span>Pending Rewards</span>
                      <span className="text-green-400 font-semibold">12.5 XRPB</span>
                    </div>
                  </div>
                </div>

                <div className="card-glow p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-6">Staking</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-black/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Current Stake</h4>
                      <p className="text-2xl font-bold neon-text">500 XRPB</p>
                      <p className="text-sm text-gray-400">APY: 12%</p>
                    </div>
                    <div className="p-4 bg-black/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Rewards Earned</h4>
                      <p className="text-2xl font-bold text-green-400">87.3 XRPB</p>
                      <p className="text-sm text-gray-400">This month</p>
                    </div>
                  </div>
                  <div className="mt-6 flex space-x-4">
                    <button className="px-6 py-2 bg-[#39FF14] text-black rounded-lg hover:neon-glow transition-all">
                      Stake More
                    </button>
                    <button className="px-6 py-2 neon-border rounded-lg hover:neon-glow transition-all">
                      Claim Rewards
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="card-glow p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-6">Profile Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Username</label>
                      <input
                        type="text"
                        value={userData.username}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={userData.email}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="card-glow p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-6">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Email Notifications</span>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Bid Alerts</span>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Price Alerts</span>
                      <input type="checkbox" className="toggle" />
                    </div>
                  </div>
                </div>

                <div className="card-glow p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-6">Security</h3>
                  <div className="space-y-4">
                    <button className="w-full p-4 text-left border border-gray-600 rounded-lg hover:border-[#39FF14] transition-colors">
                      Change Password
                    </button>
                    <button className="w-full p-4 text-left border border-gray-600 rounded-lg hover:border-[#39FF14] transition-colors">
                      Enable Two-Factor Authentication
                    </button>
                    <button className="w-full p-4 text-left border border-gray-600 rounded-lg hover:border-[#39FF14] transition-colors">
                      Manage Connected Wallets
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
