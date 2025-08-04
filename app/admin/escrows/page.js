"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext" // Add this import
import { Search, Shield, DollarSign, Calendar, User, Clock, CheckCircle, AlertTriangle, XCircle, ExternalLink, Wallet, Copy } from "lucide-react"
import AdminLayout from "../components/AdminLayout"

export default function AdminEscrows() {
  const [escrows, setEscrows] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [selectedEscrow, setSelectedEscrow] = useState(null)
  const [showReleaseModal, setShowReleaseModal] = useState(false)
  const [releaseAddress, setReleaseAddress] = useState("")
  const [releaseLoading, setReleaseLoading] = useState(false)
  const { token } = useAuth()

  useEffect(() => {
    fetchEscrows()
  }, [])

  const fetchEscrows = async () => {
    try {
      const token = localStorage.getItem('authToken') // Changed from 'token' to 'authToken'
            console.log("Auth Token: ", token)

      const response = await fetch('/api/admin/escrows', {
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

  const handleAdminRelease = async () => {
    if (!releaseAddress.trim()) {
      alert('Please enter a valid withdrawal address')
      return
    }

    if (!confirm(`⚠️ ADMIN RELEASE: You are about to release ${selectedEscrow.amount} XRPB to address:\n\n${releaseAddress}\n\nThis action is IRREVERSIBLE. Are you absolutely sure?`)) {
      return
    }

    setReleaseLoading(true)
    try {
      const response = await fetch('/api/admin/escrows/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Changed here too
        },
        body: JSON.stringify({ 
          escrowId: selectedEscrow.id,
          withdrawalAddress: releaseAddress
        })
      })

      if (response.ok) {
        const result = await response.json()
        fetchEscrows()
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
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'funded': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'conditions_met': return <Shield className="w-4 h-4 text-blue-400" />
      case 'released': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'disputed': return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-400" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10'
      case 'funded': return 'text-green-400 bg-green-400/10'
      case 'conditions_met': return 'text-blue-400 bg-blue-400/10'
      case 'released': return 'text-green-400 bg-green-400/10'
      case 'disputed': return 'text-red-400 bg-red-400/10'
      case 'cancelled': return 'text-gray-400 bg-gray-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const filteredEscrows = escrows.filter(escrow => {
    const matchesSearch = escrow.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         escrow.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         escrow.buyer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || escrow.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#39FF14]"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Escrow Management</h1>
          <p className="text-gray-400">Manage and monitor all platform escrows</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by escrow ID, seller, or buyer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#39FF14]/50"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#39FF14]/50"
          >
            <option value="all">All Statuses</option>
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
          {filteredEscrows.map((escrow) => (
            <div key={escrow.id} className="bg-black/50 border border-white/10 rounded-lg p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(escrow.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(escrow.status)}`}>
                      {escrow.status.charAt(0).toUpperCase() + escrow.status.slice(1)}
                    </span>
                    <span className="text-gray-400 text-sm">ID: {escrow.id.slice(0, 8)}...</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Amount</p>
                      <p className="text-white font-semibold flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        {parseFloat(escrow.amount).toFixed(6)} XRPB
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Seller</p>
                      <p className="text-white font-mono text-sm flex items-center gap-2">
                        {escrow.seller.slice(0, 10)}...
                        <button onClick={() => copyToClipboard(escrow.seller)} className="text-gray-400 hover:text-white">
                          <Copy className="w-3 h-3" />
                        </button>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Buyer</p>
                      <p className="text-white font-mono text-sm flex items-center gap-2">
                        {escrow.buyer.slice(0, 10)}...
                        <button onClick={() => copyToClipboard(escrow.buyer)} className="text-gray-400 hover:text-white">
                          <Copy className="w-3 h-3" />
                        </button>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created: {new Date(escrow.created_at).toLocaleDateString()}
                    </span>
                    {escrow.transaction_hash && (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        TX: {escrow.transaction_hash.slice(0, 10)}...
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {(escrow.status === 'funded' || escrow.status === 'conditions_met') && (
                    <button
                      onClick={() => {
                        setSelectedEscrow(escrow)
                        setShowReleaseModal(true)
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      Admin Release
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEscrows.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No escrows found</h3>
            <p className="text-gray-500">No escrows match your current filters.</p>
          </div>
        )}
      </div>

      {/* Release Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/10 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Admin Release Escrow</h3>
            <div className="mb-4">
              <p className="text-gray-400 mb-2">Escrow ID: {selectedEscrow?.id.slice(0, 8)}...</p>
              <p className="text-gray-400 mb-2">Amount: {selectedEscrow?.amount} XRPB</p>
              <p className="text-red-400 text-sm mb-4">⚠️ Admin override - no fees will be deducted</p>
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Withdrawal Address</label>
              <input
                type="text"
                value={releaseAddress}
                onChange={(e) => setReleaseAddress(e.target.value)}
                placeholder="Enter wallet address..."
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#39FF14]/50"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReleaseModal(false)
                  setReleaseAddress('')
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminRelease}
                disabled={releaseLoading || !releaseAddress.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {releaseLoading ? 'Releasing...' : 'Release Funds'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}