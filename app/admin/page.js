"use client"
import { useState } from "react"
import { Upload, Plus, Edit, Trash2, Eye, TrendingUp } from "lucide-react"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    category: "art",
    chain: "xrp",
  })

  const myListings = [
    {
      id: 1,
      title: "Cosmic NFT Collection #1234",
      price: 150,
      status: "active",
      bids: 12,
      views: 1247,
      timeLeft: "2d 14h",
    },
    {
      id: 2,
      title: "Digital Gaming Sword",
      price: 75,
      status: "sold",
      bids: 8,
      views: 892,
      timeLeft: "Ended",
    },
    {
      id: 3,
      title: "Abstract Digital Art",
      price: 120,
      status: "draft",
      bids: 0,
      views: 45,
      timeLeft: "Not listed",
    },
  ]

  const stats = {
    totalListings: 15,
    activeBids: 47,
    totalSales: 8,
    totalEarnings: 2450,
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("New product:", newProduct)
    alert("Product listed successfully! (Mock)")
    setNewProduct({
      title: "",
      description: "",
      price: "",
      category: "art",
      chain: "xrp",
    })
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "create", label: "Create Listing" },
    { id: "manage", label: "Manage Listings" },
  ]

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Creator Portal</h1>
          <p className="text-xl text-gray-300">Manage your listings and track your sales</p>
        </div>

        {/* Tab Navigation */}
        <div className="card-glow p-2 rounded-lg mb-8">
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id ? "bg-[#39FF14] text-black" : "hover:bg-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card-glow p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400">Total Listings</p>
                    <p className="text-2xl font-bold neon-text">{stats.totalListings}</p>
                  </div>
                  <Plus className="w-8 h-8 text-[#39FF14]" />
                </div>
              </div>

              <div className="card-glow p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400">Active Bids</p>
                    <p className="text-2xl font-bold">{stats.activeBids}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-[#39FF14]" />
                </div>
              </div>

              <div className="card-glow p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400">Total Sales</p>
                    <p className="text-2xl font-bold">{stats.totalSales}</p>
                  </div>
                  <Eye className="w-8 h-8 text-[#39FF14]" />
                </div>
              </div>

              <div className="card-glow p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400">Total Earnings</p>
                    <p className="text-2xl font-bold neon-text">{stats.totalEarnings} XRPB</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-[#39FF14]" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card-glow p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-6">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                  <div>
                    <p className="font-semibold">New bid on Cosmic NFT Collection #1234</p>
                    <p className="text-sm text-gray-400">2 minutes ago</p>
                  </div>
                  <p className="neon-text font-semibold">150 XRPB</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                  <div>
                    <p className="font-semibold">Digital Gaming Sword sold</p>
                    <p className="text-sm text-gray-400">1 hour ago</p>
                  </div>
                  <p className="text-green-400 font-semibold">75 XRPB</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                  <div>
                    <p className="font-semibold">New listing created: Abstract Digital Art</p>
                    <p className="text-sm text-gray-400">3 hours ago</p>
                  </div>
                  <p className="text-blue-400 font-semibold">Listed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Listing Tab */}
        {activeTab === "create" && (
          <div className="card-glow p-8 rounded-lg">
            <h3 className="text-2xl font-semibold mb-6">Create New Listing</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Form */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={newProduct.title}
                      onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
                      placeholder="Enter product title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
                      placeholder="Describe your product"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Starting Price (XRPB)</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
                      >
                        <option value="art">Digital Art</option>
                        <option value="gaming">Gaming Items</option>
                        <option value="music">Music & Audio</option>
                        <option value="real-estate">Virtual Real Estate</option>
                        <option value="collectibles">Collectibles</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Blockchain</label>
                      <select
                        value={newProduct.chain}
                        onChange={(e) => setNewProduct({ ...newProduct, chain: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
                      >
                        <option value="xrp">🔷 XRP Ledger</option>
                        <option value="evm">⚡ XRPL-EVM</option>
                        <option value="solana">🌟 Solana</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Column - Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Product Image</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-[#39FF14] transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">Drag and drop your image here</p>
                    <p className="text-sm text-gray-500">or click to browse</p>
                    <input type="file" className="hidden" accept="image/*" />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#39FF14] text-black rounded-lg font-semibold hover:neon-glow transition-all"
                >
                  List Product
                </button>
                <button
                  type="button"
                  className="px-8 py-3 neon-border rounded-lg font-semibold hover:neon-glow transition-all"
                >
                  Save as Draft
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manage Listings Tab */}
        {activeTab === "manage" && (
          <div className="card-glow p-6 rounded-lg">
            <h3 className="text-2xl font-semibold mb-6">My Listings</h3>

            <div className="space-y-4">
              {myListings.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between p-6 bg-black/30 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg"></div>
                    <div>
                      <h4 className="font-semibold">{listing.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{listing.price} XRPB</span>
                        <span>{listing.bids} bids</span>
                        <span>{listing.views} views</span>
                        <span>{listing.timeLeft}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        listing.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : listing.status === "sold"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {listing.status}
                    </span>

                    <div className="flex space-x-2">
                      <button className="p-2 hover:bg-gray-700 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-700 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-red-900/20 text-red-400 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <div className="card-glow p-6 rounded-lg">
              <h3 className="text-2xl font-semibold mb-6">Sales Analytics</h3>
              <div className="h-64 bg-black/30 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Analytics chart would go here</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-glow p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-4">Top Performing Items</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Cosmic NFT Collection</span>
                    <span className="neon-text">150 XRPB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Abstract Digital Art</span>
                    <span className="neon-text">120 XRPB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Digital Gaming Sword</span>
                    <span className="neon-text">75 XRPB</span>
                  </div>
                </div>
              </div>

              <div className="card-glow p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-4">Monthly Revenue</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>January 2024</span>
                    <span>850 XRPB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>February 2024</span>
                    <span>1,200 XRPB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>March 2024</span>
                    <span className="neon-text">1,450 XRPB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
