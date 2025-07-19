"use client"
import { useState } from "react"
import Link from "next/link"
import { Search, Grid, List } from "lucide-react"
import Image from "next/image"

export default function MarketplacePage() {
  const [viewMode, setViewMode] = useState("grid")
  const [selectedChain, setSelectedChain] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("recent")

const products = [
  {
    id: 1,
    title: "Cosmic NFT Collection #1234",
    image: "https://airnfts.s3.amazonaws.com/nft-images/20210814/The_Cosmic_Abyss_1628924218650.jpeg",
    price: 150,
    chain: "xrp",
    category: "art",
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
    seller: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    bids: 18,
    timeLeft: "1d 22h",
  },
  {
    id: 6,
    title: "Collectible Trading Card",
    image: "https://learn.mudrex.com/wp-content/uploads/2023/04/WhatsApp-Image-2023-03-30-at-1.03.30-PM-2-jpeg.webp",
    price: 85,
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

  const filteredProducts = products.filter((product) => {
    if (selectedChain !== "all" && product.chain !== selectedChain) return false
    if (selectedCategory !== "all" && product.category !== selectedCategory) return false
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

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Marketplace</h1>
          <p className="text-xl text-gray-300">Discover and trade unique digital assets across multiple blockchains</p>
        </div>

        {/* Search and Filters */}
        <div className="card-glow p-6 rounded-lg mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items, collections, and accounts..."
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
              />
            </div>

            {/* Chain Filter */}
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="px-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
            >
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.icon} {chain.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
            >
              <option value="recent">Recently Listed</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="ending">Ending Soon</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 ${viewMode === "grid" ? "bg-[#39FF14] text-black" : "hover:bg-gray-800"}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 ${viewMode === "list" ? "bg-[#39FF14] text-black" : "hover:bg-gray-800"}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {filteredProducts.length} of {products.length} items
          </p>
        </div>

        {/* Products Grid */}
        <div
          className={`grid gap-6 ${
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          }`}
        >
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/marketplace/${product.id}`}>
              <div className="card-glow rounded-lg overflow-hidden hover:neon-glow transition-all cursor-pointer">
                <div className="relative">

<Image
  src={product.image}
  alt={product.title}
  width={500} // required, but can be any pixel value — won't matter with className
  height={256} // or approximate height in px (h-64 = 16rem = 256px)
  className="w-full h-64 object-cover"
/>

                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 bg-black/80 rounded-full text-sm">{getChainIcon(product.chain)}</span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 bg-red-500 text-white rounded-full text-sm">{product.timeLeft}</span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 truncate">{product.title}</h3>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Current Bid</p>
                      <p className="text-xl font-bold neon-text">{product.price} XRPB</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Bids</p>
                      <p className="text-lg font-semibold">{product.bids}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-400">Owned by</p>
                    <p className="text-sm font-mono">
                      {product.seller.slice(0, 6)}...{product.seller.slice(-4)}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 py-2 bg-[#39FF14] text-black rounded-lg font-semibold hover:neon-glow transition-all">
                      Place Bid
                    </button>
                    <button className="flex-1 py-2 neon-border rounded-lg font-semibold hover:neon-glow transition-all">
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="px-8 py-4 neon-border rounded-lg hover:neon-glow transition-all">Load More Items</button>
        </div>
      </div>
    </div>
  )
}
