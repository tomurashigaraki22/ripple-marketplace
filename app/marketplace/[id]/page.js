"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Heart, Share2, Flag, Clock, Users, Truck, Package, Wallet, CreditCard, MapPin, Shield } from "lucide-react"
import { useXRPL } from '../../context/XRPLContext'
import { useMetamask } from '../../context/MetamaskContext'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'

export default function ProductDetailPage() {
  // Wallet contexts
  const { xrpWalletAddress, xrplWallet } = useXRPL()
  const { metamaskWalletAddress, isConnected: metamaskConnected } = useMetamask()
  const { publicKey, connected: solanaConnected } = useWallet()
  const { connection } = useConnection()

  const [bidAmount, setBidAmount] = useState("")
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('wallet')
  const [isLiked, setIsLiked] = useState(false)
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connectedWallets, setConnectedWallets] = useState([])
  const [showShippingForm, setShowShippingForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [orderProcessing, setOrderProcessing] = useState(false)
  const params = useParams()

  // Update connected wallets using the same method as membership page
  useEffect(() => {
    const wallets = []
    if (xrpWalletAddress) {
      wallets.push({
        type: 'xrp',
        name: 'XAMAN (XRP)',
        address: xrpWalletAddress,
        icon: '🔷',
        currency: 'XRPB'
      })
    }
    if (metamaskConnected && metamaskWalletAddress) {
      wallets.push({
        type: 'evm',
        name: 'MetaMask (ETH)',
        address: metamaskWalletAddress,
        icon: '🦊',
        currency: 'XRPB'
      })
    }
    if (solanaConnected && publicKey) {
      wallets.push({
        type: 'solana',
        name: 'Solflare (SOL)',
        address: publicKey.toString(),
        icon: '☀️',
        currency: 'XRPB'
      })
    }
    setConnectedWallets(wallets)
  }, [xrpWalletAddress, metamaskConnected, metamaskWalletAddress, solanaConnected, publicKey])

  // Fetch listing details
  useEffect(() => {
    if (params.id) {
      fetchListingDetails()
    }
  }, [params.id, connectedWallets])

  const fetchListingDetails = async () => {
    try {
      setLoading(true)
      // Use the primary wallet (first connected wallet) for API call
      const primaryWallet = connectedWallets.length > 0 ? connectedWallets[0].address : null
      const url = `/api/marketplace/${params.id}${primaryWallet ? `?wallet=${primaryWallet}` : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch listing details')
      }

      const data = await response.json()
      setListing(data.listing)
    } catch (error) {
      console.error('Error fetching listing details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBid = async () => {
    if (connectedWallets.length === 0) {
      alert("Please connect a wallet to place a bid!")
      return
    }
    if (!bidAmount || Number.parseFloat(bidAmount) <= listing.price) {
      alert("Bid must be higher than current price!")
      return
    }
    
    try {
      setOrderProcessing(true)
      // Note: Bidding functionality would need a separate implementation
      // since the current schema doesn't support bid orders
      alert("Bidding feature coming soon! Please use Buy Now for immediate purchase.")
    } catch (error) {
      console.error('Error placing bid:', error)
      alert('Failed to place bid. Please try again.')
    } finally {
      setOrderProcessing(false)
    }
  }

  // const handlePaymentConfirm = async () => {
  //   try {
  //     setOrderProcessing(true)
      
  //     // Create purchase order directly without payment processing
  //     const orderData = {
  //       listing_id: listing.id,
  //       amount: listing.price,
  //       wallet_address: connectedWallets[0].address
  //     }
      
  //     if (listing.is_physical) {
  //       orderData.shipping_info = shippingInfo
  //     }
      
  //     const response = await fetch('/api/orders', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(orderData)
  //     })
      
  //     if (response.ok) {
  //       const result = await response.json()
  //       alert(`Order created successfully! Order ID: ${result.order.id}\nStatus: Order Confirmed - Payment Skipped`)
  //       setShowPaymentModal(false)
  //       setShowShippingForm(false)
  //       // Reset form data
  //       setShippingInfo({
  //         address: '',
  //         city: '',
  //         state: '',
  //         zipCode: '',
  //         country: '',
  //         phone: ''
  //       })
  //       // Refresh listing to show updated status
  //       fetchListingDetails()
  //     } else {
  //       const errorData = await response.json()
  //       throw new Error(errorData.error || 'Failed to create order')
  //     }
  //   } catch (error) {
  //     console.error('Error creating order:', error)
  //     alert(`Failed to create order: ${error.message}`)
  //   } finally {
  //     setOrderProcessing(false)
  //   }
  // }

  const handleBuyNow = () => {
    if (connectedWallets.length === 0) {
      alert('Please connect a wallet to make a purchase')
      return
    }
    
    if (listing.is_physical) {
      setShowShippingForm(true)
    } else {
      setShowPaymentModal(true)
    }
  }

  const handleShippingSubmit = () => {
    if (!shippingInfo.address || !shippingInfo.city || !shippingInfo.country) {
      alert('Please fill in all required shipping information')
      return
    }
    setShowShippingForm(false)
    setShowPaymentModal(true)
  }

  const handlePaymentConfirm = async () => {
    try {
      setOrderProcessing(true)
      
      // Create purchase order directly without payment processing
      const orderData = {
        listing_id: listing.id,
        amount: listing.price,
        order_type: 'purchase',
        wallet_address: connectedWallets[0].address
      }
      
      if (listing.is_physical) {
        orderData.shipping_info = shippingInfo
      }
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Order created successfully! Order ID: ${result.order.id}\nStatus: Order Confirmed - Payment Skipped`)
        setShowPaymentModal(false)
        setShowShippingForm(false)
        // Reset form data
        setShippingInfo({
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          phone: ''
        })
        // Refresh listing to show updated status
        fetchListingDetails()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert(`Failed to create order: ${error.message}`)
    } finally {
      setOrderProcessing(false)
    }
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

  const getChainCurrency = (chain) => {
    // All chains now use XRPB token
    return 'XRPB'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39FF14]"></div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Listing Not Found</h1>
          <p className="text-gray-400">The listing you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section - Fixed with object-contain */}
          <div className="space-y-6">
            <div className="card-glow rounded-lg overflow-hidden relative w-full h-96 bg-gray-900">
              <Image
                src={listing.images?.[0] || '/placeholder-image.jpg'}
                alt={listing.title}
                fill
                className="object-contain p-4"
                priority
              />
            </div>

            {/* Additional Images - Also fixed */}
            {listing.images && listing.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {listing.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="relative h-20 rounded-lg overflow-hidden bg-gray-900">
                    <Image
                      src={image}
                      alt={`${listing.title} ${index + 2}`}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Description Section */}
            <div className="card-glow p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Description</h3>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {listing.description || 'No description available for this item.'}
              </div>
              
              {/* Tags if available */}
              {listing.tags && listing.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  listing.chain === 'xrp' ? 'bg-blue-500/20 text-blue-400' :
                  listing.chain === 'evm' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {getChainIcon(listing.chain)} {listing.chain.toUpperCase()}
                </span>
                {listing.is_physical && (
                  <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
                    <Package className="w-4 h-4 inline mr-1" />
                    Physical Item
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">{listing.title}</h1>
            </div>

            {/* Price and Seller Info - Updated with XRPB */}
            <div className="card-glow p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Current Price</p>
                  <p className="text-3xl font-bold text-[#39FF14]">{parseFloat(listing.price)} XRPB {getChainIcon(listing.chain)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Seller</p>
                  <p className="text-white font-semibold">@{listing.seller.username}</p>
                </div>
              </div>

              {/* Payment Information - Updated for XRPB */}
              {listing.paymentInfo ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold">Payment Ready</span>
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p><strong>Your Wallet:</strong> {listing.paymentInfo.buyerWallet}</p>
                    <p><strong>Seller Wallet:</strong> {listing.paymentInfo.sellerWallet}</p>
                    <p><strong>Chain:</strong> {listing.paymentInfo.chain.toUpperCase()}</p>
                    <p><strong>Amount:</strong> {listing.paymentInfo.price} XRPB</p>
                  </div>
                </div>
              ) : connectedWallets.length > 0 ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">Wallet Connected</span>
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p><strong>Connected Wallets:</strong></p>
                    {connectedWallets.map((wallet, index) => (
                      <p key={index}>{wallet.icon} {wallet.name}: {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}</p>
                    ))}
                    <p className="text-[#39FF14] font-medium mt-2">💰 Payments will be made in XRPB tokens</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-semibold">No Wallet Connected</span>
                  </div>
                  <p className="text-sm text-gray-300">Connect a wallet to see payment options and make purchases</p>
                </div>
              )}

              {/* Available Seller Wallets */}
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Seller accepts XRPB payments on:</p>
                <div className="flex flex-wrap gap-2">
                  {listing.seller.wallets.map((wallet, index) => (
                    <span key={index} className={`px-2 py-1 rounded text-xs ${
                      wallet.chain === 'xrp' ? 'bg-blue-500/20 text-blue-400' :
                      wallet.chain === 'evm' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {getChainIcon(wallet.chain)} {wallet.chain.toUpperCase()}
                      {wallet.is_primary && ' (Primary)'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bid Section - Updated for XRPB */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Place a Bid (XRPB)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Minimum ${parseFloat(listing.price) + 1} XRPB`}
                    className="flex-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                  />
                  <button
                    onClick={handleBid}
                    disabled={connectedWallets.length === 0 || orderProcessing}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      connectedWallets.length === 0 || orderProcessing
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {orderProcessing ? 'Processing...' : 'Bid'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={handleBuyNow}
                  disabled={connectedWallets.length === 0 || orderProcessing || listing.status === 'sold'}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    connectedWallets.length === 0 || orderProcessing || listing.status === 'sold'
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-[#39FF14] text-black hover:bg-[#39FF14]/90'
                  }`}
                >
                  {orderProcessing ? 'Processing...' : 
                   listing.status === 'sold' ? 'Sold Out' :
                   `Buy Now for ${parseFloat(listing.price)} XRPB`}
                </button>
              </div>
            </div>

            {/* ... existing code for stats and bid history ... */}
          </div>
        </div>
      </div>

      {/* Shipping Form Modal */}
      {showShippingForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Shipping Information</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Street Address"
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={shippingInfo.city}
                  onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                  className="px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={shippingInfo.state}
                  onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                  className="px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={shippingInfo.zipCode}
                  onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                  className="px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={shippingInfo.country}
                  onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                  className="px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                />
              </div>
              <input
                type="tel"
                placeholder="Phone Number"
                value={shippingInfo.phone}
                onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowShippingForm(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleShippingSubmit}
                className="flex-1 px-4 py-2 bg-[#39FF14] text-black rounded-lg hover:bg-[#39FF14]/90"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Purchase</h3>
            <div className="space-y-4">
              <div className="bg-black/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Item:</span>
                    <span className="text-white">{listing.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-[#39FF14]">{listing.price} {getChainIcon(listing.chain)}</span>
                  </div>
                  {listing.is_physical && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping:</span>
                      <span className="text-white">Calculated at checkout</span>
                    </div>
                  )}
                </div>
              </div>
              
              {listing.paymentInfo && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="text-sm space-y-1">
                    <p className="text-green-400 font-semibold">Payment Details:</p>
                    <p className="text-gray-300">From: {listing.paymentInfo.buyerWallet.slice(0, 8)}...{listing.paymentInfo.buyerWallet.slice(-6)}</p>
                    <p className="text-gray-300">To: {listing.paymentInfo.sellerWallet.slice(0, 8)}...{listing.paymentInfo.sellerWallet.slice(-6)}</p>
                    <p className="text-gray-300">Network: {listing.paymentInfo.chain.toUpperCase()}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentConfirm}
                disabled={orderProcessing}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  orderProcessing
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-[#39FF14] text-black hover:bg-[#39FF14]/90'
                }`}
              >
                {orderProcessing ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


