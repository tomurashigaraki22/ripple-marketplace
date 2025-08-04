"use client"
import { useState, useEffect } from "react"
import { Search, Calendar, User, Activity, Filter, Eye, Download } from "lucide-react"
import AdminLayout from "../components/AdminLayout"

export default function AdminAuditTrail() {
  const [auditLogs, setAuditLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState("all")
  const [filterDate, setFilterDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('authToken') // Changed from 'token' to 'authToken'
      console.log("Auth Token: ", token)
      const response = await fetch('/api/admin/audit-trail', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'admin_escrow_release': return <Activity className="w-4 h-4 text-red-400" />
      case 'user_login': return <User className="w-4 h-4 text-green-400" />
      case 'listing_approved': return <Eye className="w-4 h-4 text-blue-400" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'admin_escrow_release': return 'text-red-400 bg-red-400/10'
      case 'user_login': return 'text-green-400 bg-green-400/10'
      case 'listing_approved': return 'text-blue-400 bg-blue-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.admin_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.target_id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = filterAction === 'all' || log.action === filterAction
    const matchesDate = !filterDate || log.created_at.startsWith(filterDate)
    return matchesSearch && matchesAction && matchesDate
  })

  const exportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Timestamp,Admin,Action,Target Type,Target ID,Details\n" +
      filteredLogs.map(log => 
        `${log.created_at},${log.admin_username},${log.action},${log.target_type},${log.target_id},"${JSON.stringify(log.details).replace(/"/g, '""')}"`
      ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `audit_trail_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Audit Trail</h1>
            <p className="text-gray-400">Track all administrative actions and system events</p>
          </div>
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-[#39FF14] text-black rounded-lg hover:bg-[#39FF14]/80 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#39FF14]/50"
            />
          </div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#39FF14]/50"
          >
            <option value="all">All Actions</option>
            <option value="admin_escrow_release">Escrow Release</option>
            <option value="user_login">User Login</option>
            <option value="listing_approved">Listing Approved</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#39FF14]/50"
          />
          <div className="text-gray-400 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            {filteredLogs.length} records
          </div>
        </div>

        {/* Audit Logs */}
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div key={log.id} className="bg-black/50 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getActionIcon(log.action)}
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        by {log.admin_username}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedLog(log)
                    setShowDetailsModal(true)
                  }}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                >
                  View Details
                </button>
              </div>
              
              {log.target_type && (
                <div className="mt-3 text-sm text-gray-400">
                  Target: {log.target_type} - {log.target_id?.slice(0, 20)}...
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No audit logs found</h3>
            <p className="text-gray-500">No logs match your current filters.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/10 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Audit Log Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">Action</label>
                <p className="text-white">{selectedLog.action}</p>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Admin</label>
                <p className="text-white">{selectedLog.admin_username}</p>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Timestamp</label>
                <p className="text-white">{new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Target</label>
                <p className="text-white">{selectedLog.target_type}: {selectedLog.target_id}</p>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Details</label>
                <pre className="text-white bg-black/50 p-3 rounded border border-white/10 text-sm overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}