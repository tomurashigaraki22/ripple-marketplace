"use client"
import { useState, useEffect } from "react"
import { Search, Shield, DollarSign, Calendar, User, Clock, CheckCircle, AlertTriangle, XCircle, Bell, Wallet, Copy, ExternalLink } from "lucide-react"
import StorefrontLayout from "../components/StorefrontLayout"

export default function StorefrontEscrows() {
  const [escrows, setEscrows] = useState([])
  const [notifications, setNotifications] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [selectedEscrow, setSelectedEscrow] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showReleaseModal, setShowReleaseModal] = useState(false)
  const [releaseAddress, setReleaseAddress] = useState("")
  const [releaseLoading, setReleaseLoading] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    fetchEscrows()
    fetchNotifications()
  }, [])

  const fetchEscrows = async () => {
    try {
      const token = localStorage.getItem('storefront_token')
      const response = await fetch('/api/storefront/escrows', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEscrows(data.escrows)
      }
    } catch (error) {
      console.error('Failed to fetch escrows:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('storefront_token')
      const response = await fetch('/api/storefront/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const handleReleaseEscrow = async () => {
    if (!releaseAddress.trim()) {
      alert('Please enter a valid withdrawal address')
      return
    }

    if (!confirm(`⚠️ WARNING: You are about to release ${selectedEscrow.amount} XRPB to address:\n\n${releaseAddress}\n\nThis action is IRREVERSIBLE. Are you absolutely sure?`)) {
      return
    }

    setReleaseLoading(true)
    try {
      const response = await fetch('/api/escrow/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('storefront_token')}`
        },
        body: JSON.stringify({ 
          escrowId: selectedEscrow.id,
          withdrawalAddress: releaseAddress
        })
      })

      if (response.ok) {
        const result = await response.json()
        fetchEscrows() // Refresh the list
        setShowReleaseModal(false)
        setReleaseAddress('')
        alert(`✅ Escrow released successfully!\n\nTransaction Hash: ${result.releaseHash}`)
      } else {
        const error = await response.json()
        alert(`❌ Failed to release escrow: ${error.error}`)
      }
    } catch (error) {
      console.error('Error releasing escrow:', error)
      alert('❌ Failed to release escrow')
    } finally {
      setReleaseLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'funded':
        return <Shield className="w-5 h-5 text-blue-500" />
      case 'conditions_met':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'released':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'disputed':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'funded': return 'bg-blue-100 text-blue-800'
      case 'conditions_met': return 'bg-green-100 text-green-800'
      case 'released': return 'bg-green-200 text-green-900'
      case 'disputed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const filteredEscrows = escrows.filter(escrow => {
    const matchesSearch = escrow.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         escrow.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         escrow.seller.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || escrow.status === filterStatus
    return matchesSearch && matchesStatus
  })

//   const handleReleaseEscrow = async (escrowId) => {
//     if (!confirm('Are you sure you want to release this escrow? This action cannot be undone.')) {
//       return
//     }

//     try {
//       const response = await fetch('/api/escrow/release', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('storefront_token')}`
//         },
//         body: JSON.stringify({ escrowId })
//       })

//       if (response.ok) {
//         fetchEscrows() // Refresh the list
//         alert('Escrow released successfully!')
//       } else {
//         const error = await response.json()
//         alert(`Failed to release escrow: ${error.error}`)
//       }
//     } catch (error) {
//       console.error('Error releasing escrow:', error)
//       alert('Failed to release escrow')
//     }
//   }

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#39FF14]"></div>
        </div>
      </StorefrontLayout>
    )
  }

  return (
    <StorefrontLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Escrow Management</h1>
            <p className="text-gray-400">Monitor and manage all your escrow transactions</p>
          </div>
          
          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className={`p-4 border-b border-gray-700 ${!notification.read ? 'bg-blue-900/20' : ''}`}>
                      <p className="text-white text-sm">{notification.message}</p>
                      <p className="text-gray-400 text-xs mt-1">{new Date(notification.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by escrow ID, buyer, or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="funded">Funded</option>
            <option value="conditions_met">Conditions Met</option>
            <option value="released">Released</option>
            <option value="disputed">Disputed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Escrows Grid */}
        <div className="grid gap-6">
          {filteredEscrows.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No escrows found</h3>
              <p className="text-gray-500">No escrow transactions match your current filters.</p>
            </div>
          ) : (
            filteredEscrows.map((escrow) => (
              <div key={escrow.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(escrow.status)}
                      <h3 className="text-lg font-semibold text-white">Escrow #{escrow.id.slice(0, 8)}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(escrow.status)}`}>
                        {escrow.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 mb-1">Amount</p>
                        <p className="text-white font-medium">{escrow.amount} XRPB</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Buyer</p>
                        <p className="text-white font-mono text-xs">{escrow.buyer.slice(0, 20)}...</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Created</p>
                        <p className="text-white">{new Date(escrow.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {escrow.transaction_hash && (
                      <div className="mt-3">
                        <p className="text-gray-400 text-xs mb-1">Transaction Hash</p>
                        <p className="text-[#39FF14] font-mono text-xs">{escrow.transaction_hash}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => {
                        setSelectedEscrow(escrow)
                        setShowDetailsModal(true)
                      }}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      View Details
                    </button>
                    
                    {escrow.status === 'funded' && (
                      <button
                        onClick={() => {
                          setSelectedEscrow(escrow)
                          setShowReleaseModal(true)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Wallet className="w-4 h-4" />
                        Release Escrow
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Release Escrow Modal */}
        {showReleaseModal && selectedEscrow && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Release Escrow</h2>
                <button
                  onClick={() => {
                    setShowReleaseModal(false)
                    setReleaseAddress('')
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-500 font-semibold">Warning</span>
                  </div>
                  <p className="text-yellow-200 text-sm">
                    You are about to release <strong>{selectedEscrow.amount} XRPB</strong> from escrow. This action cannot be undone.
                  </p>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Withdrawal Address *
                  </label>
                  <input
                    type="text"
                    value={releaseAddress}
                    onChange={(e) => setReleaseAddress(e.target.value)}
                    placeholder="Enter the address to receive funds"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Double-check this address. Funds sent to wrong addresses cannot be recovered.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowReleaseModal(false)
                      setReleaseAddress('')
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReleaseEscrow}
                    disabled={releaseLoading || !releaseAddress.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {releaseLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        Release Funds
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedEscrow && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Escrow Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Escrow ID</p>
                    <p className="text-white font-mono">{selectedEscrow.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEscrow.status)}`}>
                      {selectedEscrow.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Amount</p>
                    <p className="text-white font-semibold">{selectedEscrow.amount} XRPB</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Fee</p>
                    <p className="text-white">{selectedEscrow.fee || '0'} XRPB</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm mb-2">Buyer Address</p>
                  <p className="text-white font-mono text-sm bg-gray-700 p-2 rounded">{selectedEscrow.buyer}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm mb-2">Seller Address</p>
                  <p className="text-white font-mono text-sm bg-gray-700 p-2 rounded">{selectedEscrow.seller}</p>
                </div>
                
                {selectedEscrow.transaction_hash && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Transaction Hash</p>
                    <p className="text-[#39FF14] font-mono text-sm bg-gray-700 p-2 rounded">{selectedEscrow.transaction_hash}</p>
                  </div>
                )}
                
                {selectedEscrow.conditions && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Conditions</p>
                    <pre className="text-white text-sm bg-gray-700 p-2 rounded overflow-x-auto">
                      {JSON.stringify(JSON.parse(selectedEscrow.conditions), null, 2)}
                    </pre>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Created</p>
                    <p className="text-white">{new Date(selectedEscrow.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Updated</p>
                    <p className="text-white">{new Date(selectedEscrow.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  )
}