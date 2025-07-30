"use client"
import { useState, useEffect } from "react"
import { Search, Filter, Eye, Package, Truck, CheckCircle, X, DollarSign, Calendar, User } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useRouter } from "next/navigation"
import AdminLayout from "../components/AdminLayout"

export default function AdminOrders() {
  const { user, token, loading, logout } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterChain, setFilterChain] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    // Wait for auth loading to complete
    if (loading) {
      console.log('Auth still loading...');
      return;
    }
    
    console.log('Auth loaded. User:', user, 'Token:', !!token);
    
    // Check if user is authenticated and has token
    if (!user || !token) {
      console.log('No user or token, redirecting to login');
      router.push('/admin/login');
      return;
    }
    
    // Check admin role
    if (user.role !== 'admin') {
      console.log('User role is not admin:', user.role);
      logout(); // Clear invalid session
      router.push('/admin/login');
      return;
    }
    
    console.log('Admin authenticated, fetching data...');
    fetchOrders();
    fetchOrderStats();
  }, [user, token, loading, router, logout])

  const handleApiError = (response) => {
    if (response.status === 401) {
      console.log('API returned 401, token expired or invalid');
      logout();
      router.push('/admin/login');
      return true;
    }
    return false;
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (handleApiError(response)) return;
      
      const data = await response.json()
      if (data.success) {
        setOrders(data.orders)
      } else {
        console.error('Failed to fetch orders:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const fetchOrderStats = async () => {
    try {
      const response = await fetch('/api/admin/orders/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (handleApiError(response)) return;
      
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      } else {
        console.error('Failed to fetch order stats:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch order stats:', error)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (handleApiError(response)) return;
      
      if (response.ok) {
        fetchOrders()
        fetchOrderStats()
        setShowModal(false)
      } else {
        console.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Failed to update order:', error)
    }
  }

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Show loading if user/token not ready yet
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Authenticating...</div>
      </div>
    )
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.seller_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.listing_title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    const matchesChain = filterChain === 'all' || order.chain === filterChain
    
    return matchesSearch && matchesStatus && matchesChain
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Calendar className="w-4 h-4 text-yellow-500" />
      case 'paid': return <DollarSign className="w-4 h-4 text-green-500" />
      case 'shipped': return <Truck className="w-4 h-4 text-blue-500" />
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'cancelled': return <X className="w-4 h-4 text-red-500" />
      default: return <Calendar className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Order Management</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Paid</p>
                <p className="text-2xl font-bold text-green-500">{stats.paid}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Shipped</p>
                <p className="text-2xl font-bold text-blue-500">{stats.shipped}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Cancelled</p>
                <p className="text-2xl font-bold text-red-500">{stats.cancelled}</p>
              </div>
              <X className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-xl font-bold text-green-500">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filterChain}
              onChange={(e) => setFilterChain(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Chains</option>
              <option value="xrp">XRP Ledger</option>
              <option value="evm">EVM</option>
              <option value="solana">Solana</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Listing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Chain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {order.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-white">{order.buyer_username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-white">{order.seller_username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white max-w-xs truncate">
                        {order.listing_title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-400">
                        {formatCurrency(order.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {order.chain.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowModal(true)
                        }}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Order Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Order ID</label>
                    <p className="text-white">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-1 capitalize">{selectedOrder.status}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Buyer</label>
                    <p className="text-white">{selectedOrder.buyer_username}</p>
                    <p className="text-gray-400 text-sm">{selectedOrder.buyer_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Seller</label>
                    <p className="text-white">{selectedOrder.seller_username}</p>
                    <p className="text-gray-400 text-sm">{selectedOrder.seller_email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Listing</label>
                  <p className="text-white">{selectedOrder.listing_title}</p>
                  <p className="text-gray-400 text-sm">{selectedOrder.listing_description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
                    <p className="text-green-400 font-medium">{formatCurrency(selectedOrder.amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Chain</label>
                    <p className="text-white">{selectedOrder.chain.toUpperCase()}</p>
                  </div>
                </div>

                {selectedOrder.transaction_hash && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Transaction Hash</label>
                    <p className="text-blue-400 font-mono text-sm break-all">{selectedOrder.transaction_hash}</p>
                  </div>
                )}

                {selectedOrder.shipping_address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Shipping Address</label>
                    <div className="bg-gray-700 p-3 rounded text-white text-sm">
                      <pre>{JSON.stringify(selectedOrder.shipping_address, null, 2)}</pre>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Created</label>
                    <p className="text-white">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Updated</label>
                    <p className="text-white">{new Date(selectedOrder.updated_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="border-t border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Update Status</label>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedOrder.id, status)}
                        disabled={selectedOrder.status === status}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          selectedOrder.status === status
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}