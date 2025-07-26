"use client"
import { useState } from "react"
import Link from "next/link"
import { Search, Grid, List, Package, Square, Filter, Clock, Users } from "lucide-react"
import Image from "next/image"
import { useParams } from "next/navigation"

export default function MarketplacePage() {
  const [viewMode, setViewMode] = useState("grid")
  const params = useParams()
  const [selectedChain, setSelectedChain] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [itemType, setItemType] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [searchQuery, setSearchQuery] = useState("")

const products = [
  {
    id: 1,
    title: "Cosmic NFT Collection #1234",
    image: "https://airnfts.s3.amazonaws.com/nft-images/20210814/The_Cosmic_Abyss_1628924218650.jpeg",
    price: 150,
    chain: "xrp",
    category: "art",
    isPhysical: false,
    seller: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
    bids: 12,
    timeLeft: "2d 14h",
  },
  {
    id: 2,
    title: "Digital Gaming Sword",
    image: "https://img-cdn.magiceden.dev/autoquality:none/rs:fill:640:640:0:0/plain/https%3A%2F%2Fi.imgur.com%2FQZbnkpP.mp4%3Fext%3Dmp4",
    price: 75,
    chain: "solana",
    category: "gaming",
    isPhysical: true,
    seller: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    bids: 8,
    timeLeft: "1d 6h",
  },
  {
    id: 3,
    title: "Rare Music NFT",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhIyAwZtT_n2GP0B7WMGp6Tsn3Glu5Lgb10A&s",
    price: 200,
    chain: "evm",
    category: "music",
    isPhysical: true,
    seller: "0x742d35Cc6634C0532925a3b8D4C9db96590b5b8e",
    bids: 25,
    timeLeft: "5h 30m",
  },
  {
    id: 4,
    title: "Virtual Real Estate Plot",
    image: "https://miro.medium.com/v2/resize:fit:700/0*4x1ilUDV5dMkZbKJ.png",
    price: 500,
    chain: "xrp",
    isPhysical: false,
    category: "real-estate",
    seller: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
    bids: 45,
    timeLeft: "3d 12h",
  },
  {
    id: 5,
    title: "Abstract Digital Art",
    image: "https://static01.nyt.com/images/2021/08/15/fashion/TEEN-NFTS--fewocious/merlin_193103526_0e21192f-51f9-4f99-9389-c9aaaf858d09-articleLarge.jpg?quality=75&auto=webp&disable=upscale",
    price: 120,
    chain: "solana",
    category: "art",
    isPhysical: false,
    seller: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    bids: 18,
    timeLeft: "1d 22h",
  },
  {
    id: 6,
    title: "Collectible Trading Card",
    image: "https://learn.mudrex.com/wp-content/uploads/2023/04/WhatsApp-Image-2023-03-30-at-1.03.30-PM-2-jpeg.webp",
    price: 85,
    isPhysical: true,
    chain: "evm",
    category: "collectibles",
    seller: "0x742d35Cc6634C0532925a3b8D4C9db96590b5b8e",
    bids: 6,
    timeLeft: "4h 15m",
  },
]

  const chains = [
    { id: "all", name: "All Chains", icon: "🌐" },
    { id: "xrp", name: "XRP Ledger", icon: "🔷" },
    { id: "evm", name: "XRPL-EVM", icon: "⚡" },
    { id: "solana", name: "Solana", icon: "🌟" },
  ]

  const categories = [
    { id: "all", name: "All Categories" },
    { id: "art", name: "Digital Art" },
    { id: "gaming", name: "Gaming Items" },
    { id: "music", name: "Music & Audio" },
    { id: "real-estate", name: "Virtual Real Estate" },
    { id: "collectibles", name: "Collectibles" },
  ]

  const itemTypes = [
    { id: "all", name: "All Items", icon: <Square className="w-4 h-4" /> },
    { id: "digital", name: "Digital Items", icon: <Square className="w-4 h-4" /> },
    { id: "physical", name: "Physical Items", icon: <Package className="w-4 h-4" /> },
  ]

  const filteredProducts = products.filter((product) => {
    if (selectedChain !== "all" && product.chain !== selectedChain) return false
    if (selectedCategory !== "all" && product.category !== selectedCategory) return false
    if (itemType !== "all" && product.isPhysical !== (itemType === "physical")) return false
    if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getChainIcon = (chain) => {
    switch (chain) {
      case "xrp":
        return "🔷"
      case "evm":
        return "⚡"
      case "solana":
        return "🌟"
      default:
        return "🌐"
    }
  }

  const getChainColor = (chain) => {
    switch (chain) {
      case "xrp":
        return "bg-blue-500/20 text-blue-400"
      case "evm":
        return "bg-purple-500/20 text-purple-400"
      case "solana":
        return "bg-green-500/20 text-green-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Clean Header Section */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Marketplace
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Discover digital assets and physical items across multiple blockchains
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Search and Filter Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-800">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items, collections, and accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none focus:ring-2 focus:ring-[#39FF14]/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Chain Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Blockchain</label>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:border-[#39FF14] focus:outline-none focus:ring-2 focus:ring-[#39FF14]/20 transition-all duration-200"
              >
                {chains.map((chain) => (
                  <option key={chain.id} value={chain.id} className="bg-black">
                    {chain.icon} {chain.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:border-[#39FF14] focus:outline-none focus:ring-2 focus:ring-[#39FF14]/20 transition-all duration-200"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id} className="bg-black">
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:border-[#39FF14] focus:outline-none focus:ring-2 focus:ring-[#39FF14]/20 transition-all duration-200"
              >
                {itemTypes.map((type) => (
                  <option key={type.id} value={type.id} className="bg-black">
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:border-[#39FF14] focus:outline-none focus:ring-2 focus:ring-[#39FF14]/20 transition-all duration-200"
              >
                <option value="recent" className="bg-black">Recently Listed</option>
                <option value="price-low" className="bg-black">Price: Low to High</option>
                <option value="price-high" className="bg-black">Price: High to Low</option>
                <option value="ending" className="bg-black">Ending Soon</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">View</label>
              <div className="flex bg-black/50 border border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 p-3 transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-[#39FF14] text-black"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <Grid className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex-1 p-3 transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-[#39FF14] text-black"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <List className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <p className="text-gray-400">
              <span className="text-white font-semibold">{filteredProducts.length}</span> of{" "}
              <span className="text-white font-semibold">{products.length}</span> items
            </p>
            {(selectedChain !== "all" || selectedCategory !== "all" || itemType !== "all" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedChain("all")
                  setSelectedCategory("all")
                  setItemType("all")
                  setSearchQuery("")
                }}
                className="text-[#39FF14] hover:text-[#39FF14]/80 text-sm font-medium transition-colors duration-200"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Products Grid/List */}
        <div
          className={`grid gap-6 mb-12 ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          }`}
        >
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/marketplace/${product.id}`}>
              <div className="group bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800 hover:border-[#39FF14]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#39FF14]/10 cursor-pointer">
                {/* Product Image */}
                <div className="relative overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.title}
                    width={500}
                    height={300}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Overlay Elements */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Chain Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getChainColor(product.chain)}`}>
                      {getChainIcon(product.chain)} {product.chain.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Time Left Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-red-500/90 text-white rounded-full text-xs font-medium flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{product.timeLeft}</span>
                    </span>
                  </div>
                  
                  {/* Physical Item Badge */}
                  {product.isPhysical && (
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-[#39FF14]/90 text-black rounded-full text-xs font-medium flex items-center space-x-1">
                        <Package className="w-3 h-3" />
                        <span>Physical</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-[#39FF14] transition-colors duration-200">
                    {product.title}
                  </h3>

                  {/* Price and Bids */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Current Bid</p>
                      <p className="text-xl font-bold text-[#39FF14]">{product.price} XRPB</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">Bids</p>
                      <div className="flex items-center space-x-1 text-gray-300">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">{product.bids}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="mb-6">
                    <p className="text-xs text-gray-400 mb-1">Owned by</p>
                    <p className="text-sm font-mono text-gray-300">
                      {product.seller.slice(0, 6)}...{product.seller.slice(-4)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button className="flex-1 py-3 bg-[#39FF14] text-black rounded-xl font-semibold hover:bg-[#39FF14]/90 hover:shadow-lg hover:shadow-[#39FF14]/20 transition-all duration-200 transform hover:scale-[1.02]">
                      Place Bid
                    </button>
                    <button className="flex-1 py-3 bg-transparent border border-[#39FF14] text-[#39FF14] rounded-xl font-semibold hover:bg-[#39FF14]/10 transition-all duration-200 transform hover:scale-[1.02]">
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More Section */}
        {filteredProducts.length > 0 && (
          <div className="text-center">
            <button className="px-8 py-4 bg-gray-900/50 border border-gray-700 text-white rounded-xl font-semibold hover:border-[#39FF14] hover:bg-[#39FF14]/10 transition-all duration-200 transform hover:scale-105">
              Load More Items
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No items found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSelectedChain("all")
                setSelectedCategory("all")
                setItemType("all")
                setSearchQuery("")
              }}
              className="px-6 py-3 bg-[#39FF14] text-black rounded-xl font-semibold hover:bg-[#39FF14]/90 transition-all duration-200"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
