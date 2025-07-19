"use client"
import { useState } from "react"
import { useParams } from "next/navigation"
import { Heart, Share2, Flag, Clock, Users } from "lucide-react"

export default function ProductDetailPage() {
  const params = useParams()
  const [bidAmount, setBidAmount] = useState("")
  const [isLiked, setIsLiked] = useState(false)

  // Mock product data - in real app, fetch based on params.id
  const product = {
    id: params.id,
    title: "Cosmic NFT Collection #1234",
    description:
      "A stunning piece of digital art representing the vastness of space and cosmic energy. This unique NFT features vibrant colors and intricate details that capture the beauty of the universe.",
    image: "https://airnfts.s3.amazonaws.com/nft-images/20210814/The_Cosmic_Abyss_1628924218650.jpeg",
    currentBid: 150,
    buyNowPrice: 200,
    chain: "xrp",
    category: "Digital Art",
    owner: {
      address: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      username: "CosmicArtist",
      verified: true,
    },
    creator: {
      address: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      username: "CosmicArtist",
      verified: true,
    },
    timeLeft: "2d 14h 32m",
    totalBids: 12,
    views: 1247,
    likes: 89,
    properties: [
      { trait: "Background", value: "Cosmic Purple", rarity: "15%" },
      { trait: "Style", value: "Abstract", rarity: "25%" },
      { trait: "Energy", value: "High", rarity: "8%" },
      { trait: "Dimension", value: "3D", rarity: "12%" },
    ],
  }

  const bidHistory = [
    { bidder: "rABC...123", amount: 150, time: "2 minutes ago" },
    { bidder: "rDEF...456", amount: 145, time: "15 minutes ago" },
    { bidder: "rGHI...789", amount: 140, time: "1 hour ago" },
    { bidder: "rJKL...012", amount: 135, time: "2 hours ago" },
    { bidder: "rMNO...345", amount: 130, time: "4 hours ago" },
  ]

  const handleBid = () => {
    if (!bidAmount || Number.parseFloat(bidAmount) <= product.currentBid) {
      alert("Bid must be higher than current bid!")
      return
    }
    alert(`Bid placed: ${bidAmount} XRPB (Mock)`)
    setBidAmount("")
  }

  const handleBuyNow = () => {
    alert(`Purchased for ${product.buyNowPrice} XRPB (Mock)`)
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-6">
            <div className="card-glow rounded-lg overflow-hidden">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.title}
                className="w-full aspect-square object-cover"
              />
            </div>

            {/* Properties */}
            <div className="card-glow p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Properties</h3>
              <div className="grid grid-cols-2 gap-4">
                {product.properties.map((prop, index) => (
                  <div key={index} className="p-3 bg-black/30 rounded-lg text-center">
                    <p className="text-sm text-gray-400">{prop.trait}</p>
                    <p className="font-semibold">{prop.value}</p>
                    <p className="text-xs text-[#39FF14]">{prop.rarity}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] rounded-full text-sm">
                  {getChainIcon(product.chain)} {product.chain.toUpperCase()}
                </span>
                <span className="px-2 py-1 bg-gray-800 rounded-full text-sm">{product.category}</span>
              </div>
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">{product.views} views</span>
                </div>
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`flex items-center space-x-2 ${isLiked ? "text-red-500" : "text-gray-400"}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                  <span>{product.likes + (isLiked ? 1 : 0)}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-400 hover:text-white">
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-400 hover:text-red-400">
                  <Flag className="w-5 h-5" />
                  <span>Report</span>
                </button>
              </div>
            </div>

            {/* Pricing and Bidding */}
            <div className="card-glow p-6 rounded-lg">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-semibold">Auction ends in {product.timeLeft}</span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-gray-400 mb-1">Current Bid</p>
                  <p className="text-3xl font-bold neon-text">{product.currentBid} XRPB</p>
                  <p className="text-sm text-gray-400">{product.totalBids} bids</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Buy Now Price</p>
                  <p className="text-3xl font-bold">{product.buyNowPrice} XRPB</p>
                  <p className="text-sm text-gray-400">End auction instantly</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex space-x-4">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Min bid: ${product.currentBid + 1} XRPB`}
                    className="flex-1 px-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
                  />
                  <button
                    onClick={handleBid}
                    className="px-6 py-3 neon-border rounded-lg hover:neon-glow transition-all"
                  >
                    Place Bid
                  </button>
                </div>

                <button
                  onClick={handleBuyNow}
                  className="w-full py-3 bg-[#39FF14] text-black rounded-lg font-semibold hover:neon-glow transition-all"
                >
                  Buy Now for {product.buyNowPrice} XRPB
                </button>
              </div>
            </div>

            {/* Owner Info */}
            <div className="card-glow p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Owner</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#39FF14] rounded-full flex items-center justify-center">
                  <span className="text-black font-bold">{product.owner.username.charAt(0)}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{product.owner.username}</span>
                    {product.owner.verified && <span className="text-[#39FF14]">✓</span>}
                  </div>
                  <p className="text-sm text-gray-400 font-mono">
                    {product.owner.address.slice(0, 10)}...{product.owner.address.slice(-6)}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card-glow p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Description</h3>
              <p className="text-gray-300 leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>

        {/* Bid History */}
        <div className="mt-12">
          <div className="card-glow p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-6">Bid History</h3>
            <div className="space-y-4">
              {bidHistory.map((bid, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">{bid.bidder.slice(1, 3).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold font-mono">{bid.bidder}</p>
                      <p className="text-sm text-gray-400">{bid.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold neon-text">{bid.amount} XRPB</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
