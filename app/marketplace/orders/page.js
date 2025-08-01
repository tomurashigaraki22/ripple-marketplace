"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Package, Clock, CheckCircle, XCircle, Truck, Eye, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useXRPL } from "../../context/XRPLContext"
import { useMetamask } from "../../context/MetamaskContext"
import { useWallet, useConnection } from '@solana/wallet-adapter-react'

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0 })
  const [connectedWallets, setConnectedWallets] = useState([])
  const [confirmingOrder, setConfirmingOrder] = useState(null)

  // Wallet contexts
  const { xrpWalletAddress } = useXRPL()
  const { metamaskWalletAddress, isConnected: metamaskConnected } = useMetamask()
  const { publicKey, connected: solanaConnected } = useWallet()
  const { connection } = useConnection()

  // Update connected wallets
  useEffect(() => {
    const wallets = []
    if (xrpWalletAddress) {
      wallets.push({
        type: 'xrp',
        name: 'XAMAN (XRP)',
        address: xrpWalletAddress,
        icon: '🔷',
        currency: 'XRP'
      })
    }
    if (metamaskConnected && metamaskWalletAddress) {
      wallets.push({
        type: 'evm',
        name: 'MetaMask (ETH)',
        address: metamaskWalletAddress,
        icon: '🦊',
        currency: 'ETH'
      })
    }
    if (solanaConnected && publicKey) {
      wallets.push({
        type: 'solana',
        name: 'Phantom (SOL)',
        address: publicKey.toString(),
        icon: '👻',
        currency: 'SOL'
      })
    }
    setConnectedWallets(wallets)
  }, [xrpWalletAddress, metamaskConnected, metamaskWalletAddress, solanaConnected, publicKey])

  useEffect(() => {
    if (connectedWallets.length > 0) {
      fetchOrders()
    }
  }, [connectedWallets, selectedStatus, pagination.page])

  const fetchOrders = async () => {
    if (connectedWallets.length === 0) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        wallet: connectedWallets[0].address,
        page: pagination.page.toString(),
        limit: '10'
      })

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      const response = await fetch(`/api/orders?${params}`)
      if (!response.ok) throw new Error('Failed to fetch orders')
      
      const data = await response.json()
      setOrders(data.orders)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkDelivered = async (orderId) => {
  try {
    setConfirmingOrder(orderId)
    
    // Get buyer_id from connected wallet or user context
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        status: 'delivered',
        buyer_id: connectedWallets[0]?.address // or get from user context
      })
    })

    if (response.ok) {
      // Refresh orders
      fetchOrders()
      alert('Order marked as delivered successfully!')
    } else {
      const error = await response.json()
      alert(`Error: ${error.message}`)
    }
  } catch (error) {
    console.error('Error marking order as delivered:', error)
    alert('Failed to mark order as delivered')
  } finally {
    setConfirmingOrder(null)
  }
}

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'shipped':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'delivered':
        return 'bg-green-600/20 text-green-300 border-green-600/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  if (connectedWallets.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">My Orders</h1>
            <p className="text-gray-400 mb-8">Please connect a wallet to view your orders</p>
            <Link
              href="/wallet"
              className="inline-flex items-center px-6 py-3 bg-[#39FF14] text-black font-semibold rounded-xl hover:bg-[#39FF14]/90 transition-colors duration-300"
            >
              Connect Wallet
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          {[...Array(15)].map((_, i) => (
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
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-10">
        {/* Header */}
        <div className="mb-8">
          {/* <div className="flex items-center mb-6">
            <Link
              href="/marketplace"
              className="flex items-center text-gray-400 hover:text-[#39FF14] transition-colors duration-300 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Marketplace
            </Link>
          </div> */}
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-[#39FF14] to-white bg-clip-text text-transparent mb-2">
                My Orders
              </h1>
              <p className="text-gray-400">
                Track and manage your marketplace purchases
              </p>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-black/60 border border-gray-600/50 rounded-xl px-4 py-2 text-white focus:border-[#39FF14]/50 focus:outline-none"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39FF14]"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
            <p className="text-gray-400 mb-8">
              {selectedStatus === 'all' 
                ? "You haven't made any purchases yet" 
                : `No orders with status: ${selectedStatus}`
              }
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-6 py-3 bg-[#39FF14] text-black font-semibold rounded-xl hover:bg-[#39FF14]/90 transition-colors duration-300"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              let images = []
              try {
                images = order.listing_images ? JSON.parse(order.listing_images) : []
              } catch (error) {
                console.warn('Invalid JSON in listing_images:', order.listing_images)
                // If it's a single URL string, wrap it in an array
                if (typeof order.listing_images === 'string' && order.listing_images.startsWith('http')) {
                  images = [order.listing_images]
                }
              }
              const mainImage = images[0] || '/placeholder-image.jpg'
              const daysLeft = getDaysUntilAutoRelease(order.created_at)
              
              return (
                <div
                  key={order.id}
                  className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-[#39FF14]/30 transition-all duration-300"
                >
                  <div className="flex items-start space-x-6">
                    {/* Order Image */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-700/50">
                        <Image
                          src={order.listing_images[0]}
                          alt={order.listing_title}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    {/* Order Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {order.listing_title}
                          </h3>
                          <p className="text-gray-400 text-sm mb-2">
                            Order #{order.id.slice(0, 8)}...
                          </p>
                          <p className="text-gray-400 text-sm">
                            Seller: {order.seller_username}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-bold text-[#39FF14] mb-2">
                            {order.amount} USD
                          </div>
                          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          Ordered: {formatDate(order.created_at)}
                          {order.status === 'escrow_funded' && daysLeft > 0 && (
                            <div className="text-yellow-400 mt-1">
                              ⏰ Auto-release in {daysLeft} days
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/marketplace/${order.listing_id}`}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:text-white transition-colors duration-300"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Item</span>
                          </Link>

                          {order.status === 'shipped' && (
                            <button
                              onClick={() => handleMarkDelivered(order.id)}
                              disabled={confirmingOrder === order.id}
                              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                            >
                              {confirmingOrder === order.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Mark as Delivered</span>
                                </>
                              )}
                            </button>
                          )}
                          
                          {order.status === 'escrow_funded' && (
    <button
      onClick={() => handleConfirmReceived(order.id)}
      disabled={confirmingOrder === order.id}
      className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
    >
      {confirmingOrder === order.id ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Order Received</span>
        </>
      )}
    </button>
  )}
                        </div>
                      </div>
                      
                      {/* Shipping Address */}
                      {order.shipping_address && (
                        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-300 mb-1">Shipping Address:</h4>
                          <div className="text-sm text-gray-400">
                            {typeof order.shipping_address === 'string' ? (
                              <p>{order.shipping_address}</p>
                            ) : (
                              <div>
                                <p>{order.shipping_address.address}</p>
                                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}</p>
                                <p>{order.shipping_address.country}</p>
                                {order.shipping_address.phone && (
                                  <p>Phone: {order.shipping_address.phone}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-12">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
            >
              Previous
            </button>
            
            <span className="text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


const handleConfirmReceived = async (orderId) => {
  if (!confirm('Confirm that you have received this order? This will release the funds to the seller.')) {
    return
  }

  setConfirmingOrder(orderId)
  try {
    const response = await fetch('/api/orders/confirm-received', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId })
    })

    if (response.ok) {
      alert('✅ Order confirmed! Funds have been released to the seller.')
      fetchOrders() // Refresh orders
    } else {
      const error = await response.json()
      alert(`Failed to confirm order: ${error.error}`)
    }
  } catch (error) {
    console.error('Error confirming order:', error)
    alert('Failed to confirm order')
  } finally {
    setConfirmingOrder(null)
  }
}


const getDaysUntilAutoRelease = (createdAt) => {
  const created = new Date(createdAt)
  const now = new Date()
  const daysPassed = Math.floor((now - created) / (1000 * 60 * 60 * 24))
  return Math.max(0, 20 - daysPassed)
}