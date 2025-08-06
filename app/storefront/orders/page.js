"use client"
import { useState, useEffect } from "react"
import { Search, Package, DollarSign, Calendar, User, Truck, CheckCircle, Edit3, Eye, MapPin, Phone, Mail, MessageCircle } from "lucide-react"
import StorefrontLayout from "../components/StorefrontLayout"
import MessageCenter from "../../components/messaging/MessageCenter"

export default function StorefrontOrders() {
  const [orders, setOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showShippingModal, setShowShippingModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [selectedChatOrder, setSelectedChatOrder] = useState(null)
  const [shippingData, setShippingData] = useState({
    tracking_number: '',
    shipping_carrier: '',
    shipping_notes: ''
  })
  const [updating, setUpdating] = useState(false)

  // ... existing code ...

  const handleOpenChat = (order) => {
    setSelectedChatOrder(order)
    setShowChatModal(true)
  }

  const handleCloseChat = () => {
    setShowChatModal(false)
    setSelectedChatOrder(null)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('storefront_token')
      const response = await fetch('/api/storefront/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus, additionalData = {}) => {
    try {
      setUpdating(true)
      const token = localStorage.getItem('storefront_token')
      const response = await fetch(`/api/storefront/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, ...additionalData })
      })
      
      if (response.ok) {
        const data = await response.json()
        setOrders(orders
          .map(order => 
            order.id === orderId ? data.order : order
          )
        )
        setShowShippingModal(false)
        setShippingData({ tracking_number: '', shipping_carrier: '', shipping_notes: '' })
      }
    } catch (error) {
      console.error('Failed to update order:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleShippingUpdate = (order) => {
    setSelectedOrder(order)
    setShippingData({
      tracking_number: order.tracking_number || '',
      shipping_carrier: order.shipping_carrier || '',
      shipping_notes: order.shipping_notes || ''
    })
    setShowShippingModal(true)
  }

  const submitShippingUpdate = () => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, 'shipped', shippingData)
    }
  }

  const filteredOrders = orders.filter(order => {
  // Check if order exists first
  if (!order) return false;
  
  const matchesSearch = 
    (order.id?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (order.buyer_username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (order.listing_title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  
  const matchesStatus = filterStatus === 'all' || order.status === filterStatus
  
  return matchesSearch && matchesStatus
})

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Calendar className="w-4 h-4 text-yellow-500" />
      case 'paid': return <DollarSign className="w-4 h-4 text-green-500" />
      case 'shipped': return <Truck className="w-4 h-4 text-blue-500" />
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-600" />
      default: return <Package className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'shipped': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'delivered': return 'bg-green-600/20 text-green-500 border-green-600/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount)
  }

    const handleSetWithdrawalAddress = async (orderId, chain) => {
    const address = prompt(`Enter your ${chain.toUpperCase()} withdrawal address:`);
    if (!address) return;

    try {
      const response = await fetch('/api/storefront/withdrawal-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          orderId,
          withdrawalAddress: address,
          chain
        })
      });

      if (response.ok) {
        alert('Withdrawal address set successfully!');
        fetchOrders(); // Refresh orders
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error setting withdrawal address:', error);
      alert('Failed to set withdrawal address');
    }
  };

  const handleReleaseEscrow = async (escrowId) => {
    if (!confirm('Are you sure you want to release the escrow? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/escrow/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ escrowId })
      });

      if (response.ok) {
        alert('Escrow released successfully! Funds have been transferred to your withdrawal address.');
        fetchOrders(); // Refresh orders
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error releasing escrow:', error);
      alert('Failed to release escrow');
    }
  };

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#39FF14]/20 border-t-[#39FF14] rounded-full animate-spin" />
        </div>
      </StorefrontLayout>
    )
  }

  return (
    <StorefrontLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Orders & Shipping</h1>
          <p className="text-gray-400 mt-1">Manage your customer orders and shipping</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:border-[#39FF14]/30 transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Order Info */}
                  <div className="lg:col-span-2">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{order.listing_title}</h3>
                        <p className="text-gray-400 text-sm">Order #{order.id.substring(0, 8)}</p>
                        {order.tracking_number && (
                          <p className="text-[#39FF14] text-sm mt-1">
                            Tracking: {order.tracking_number}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
                    </div>
                                {/* Add escrow management buttons in order cards */}
            {order.escrow_id && order.status === 'escrow_funded' && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => handleSetWithdrawalAddress(order.id, order.payment_chain)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Set Withdrawal Address
                </button>
                <button
                  onClick={() => handleReleaseEscrow(order.escrow_id)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Release Escrow (Delivery Complete)
                </button>
              </div>
            )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{order.buyer_username}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Shipping Address */}
                  <div className="text-sm">
                    <p className="text-gray-400 mb-2">Shipping Address</p>
                    {order.shipping_address ? (
                      <div className="text-white space-y-1">
                        <p>{order.shipping_address.name}</p>
                        <p>{order.shipping_address.street}</p>
                        <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                        <p>{order.shipping_address.country}</p>
                        {order.shipping_address.phone && (
                          <p className="flex items-center space-x-1 text-gray-400">
                            <Phone className="w-3 h-3" />
                            <span>{order.shipping_address.phone}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No address provided</p>
                    )}
                  </div>
                  
                  {/* Amount */}
                  <div className="flex items-center">
                    <div>
                      <p className="text-gray-400 text-sm">Amount</p>
                      <p className="text-[#39FF14] font-semibold text-lg">{formatCurrency(order.amount)}</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    {/* Chat Button - Always available for communication */}
                    <button
                      onClick={() => handleOpenChat(order)}
                      className="bg-purple-500/10 text-purple-400 px-4 py-2 rounded-lg hover:bg-purple-500/20 transition-all duration-300 flex items-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat with Buyer</span>
                    </button>
                    
                    {(order.status === 'paid' || order.status === 'escrow_funded') && (
                      <button
                        onClick={() => handleShippingUpdate(order)}
                        className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/20 transition-all duration-300 flex items-center space-x-2"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Ship Order</span>
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="bg-green-500/10 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/20 transition-all duration-300 flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark Delivered</span>
                        </button>
                        <button
                          onClick={() => handleShippingUpdate(order)}
                          className="bg-gray-500/10 text-gray-400 px-4 py-2 rounded-lg hover:bg-gray-500/20 transition-all duration-300 flex items-center space-x-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Update Tracking</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No orders found</h3>
            <p className="text-gray-400">You don't have any orders yet or none match your filters.</p>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChatModal && selectedChatOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Chat with {selectedChatOrder.buyer_username}
                </h3>
                <p className="text-sm text-gray-400">
                  Order #{selectedChatOrder.id.substring(0, 8)} - {selectedChatOrder.listing_title}
                </p>
              </div>
              <button
                onClick={handleCloseChat}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <MessageCenter 
                orderId={selectedChatOrder.id}
                userType="seller"
                onClose={handleCloseChat}
              />
            </div>
          </div>
        </div>
      )}

      {/* Shipping Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Update Shipping Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Shipping Carrier</label>
                <select
                  value={shippingData.shipping_carrier}
                  onChange={(e) => setShippingData({...shippingData, shipping_carrier: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
                >
                  <option value="">Select Carrier</option>
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="USPS">USPS</option>
                  <option value="DHL">DHL</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tracking Number</label>
                <input
                  type="text"
                  value={shippingData.tracking_number}
                  onChange={(e) => setShippingData({...shippingData, tracking_number: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
                  placeholder="Enter tracking number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Shipping Notes (Optional)</label>
                <textarea
                  value={shippingData.shipping_notes}
                  onChange={(e) => setShippingData({...shippingData, shipping_notes: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
                  rows={3}
                  placeholder="Add any shipping notes..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowShippingModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={submitShippingUpdate}
                disabled={updating || !shippingData.tracking_number}
                className="flex-1 px-4 py-2 bg-[#39FF14] text-black rounded-lg hover:bg-[#39FF14]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Ship Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </StorefrontLayout>
  )
}


// Add escrow-specific order management

