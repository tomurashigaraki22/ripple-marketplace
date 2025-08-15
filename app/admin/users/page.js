"use client"
import { useState, useEffect } from "react"
import { Search, Filter, Edit, Trash2, Shield, Crown, Star, Ban, CheckCircle, UserPlus, AlertCircle } from "lucide-react"
import AdminLayout from "../components/AdminLayout"

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterMembership, setFilterMembership] = useState("all")
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [confirmAction, setConfirmAction] = useState({ show: false, userId: null, action: '', userName: '' })

  useEffect(() => {
    fetchUsers()
  }, [])

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000)
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No admin token found')
        window.location.href = '/admin/login'
        return
      }

      const response = await fetch('/api/admin/users?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.status === 401) {
        localStorage.removeItem('authToken')
        window.location.href = '/admin/login'
        return
      }
      
      const data = await response.json()
      console.log("Users Data: ", data)
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setUsers([])
      showNotification('error', 'Failed to fetch users')
    }
  }

  const handleUserAction = async (userId, action, additionalData = {}) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No admin token found')
        window.location.href = '/admin/login'
        return
      }

      const requestBody = { action, ...additionalData }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })
      
      if (response.status === 401) {
        localStorage.removeItem('authToken')
        window.location.href = '/admin/login'
        return
      }
      
      if (response.ok) {
        fetchUsers()
        const actionMessages = {
          'suspend': 'User suspended successfully',
          'activate': 'User activated successfully',
          'delete': 'User deleted successfully',
          'edit': 'User updated successfully'
        }
        showNotification('success', actionMessages[action] || 'Action completed successfully')
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Action failed')
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      showNotification('error', 'Failed to update user')
    }
  }

  const handleRoleUpgrade = (userId, userName) => {
    setConfirmAction({
      show: true,
      userId,
      action: 'upgrade_to_admin',
      userName
    })
  }

  const confirmRoleUpgrade = async () => {
    await handleUserAction(confirmAction.userId, 'edit', { role: 'admin' })
    setConfirmAction({ show: false, userId: null, action: '', userName: '' })
  }

  const confirmUserAction = (userId, action, userName) => {
    setConfirmAction({
      show: true,
      userId,
      action,
      userName
    })
  }

  const executeConfirmedAction = async () => {
    const { userId, action } = confirmAction
    if (action === 'upgrade_to_admin') {
      await confirmRoleUpgrade()
    } else {
      await handleUserAction(userId, action)
    }
    setConfirmAction({ show: false, userId: null, action: '', userName: '' })
  }

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    if (!user || !user.username || !user.email) return false
    
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesMembership = filterMembership === 'all' || user.membershipTier === filterMembership
    return matchesSearch && matchesRole && matchesMembership
  }) : []

  const getMembershipIcon = (tier) => {
    switch (tier) {
      case 'pro': return <Crown className="w-4 h-4 text-purple-400" />
      case 'premium': return <Star className="w-4 h-4 text-yellow-400" />
      default: return <Shield className="w-4 h-4 text-gray-400" />
    }
  }

  const getActionMessage = (action, userName) => {
    switch (action) {
      case 'upgrade_to_admin':
        return `Are you sure you want to upgrade ${userName} to admin? This will give them full administrative privileges.`
      case 'suspend':
        return `Are you sure you want to suspend ${userName}?`
      case 'activate':
        return `Are you sure you want to activate ${userName}?`
      case 'delete':
        return `Are you sure you want to delete ${userName}? This action cannot be undone.`
      default:
        return `Are you sure you want to perform this action on ${userName}?`
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
            'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {notification.type === 'success' ? 
              <CheckCircle className="w-5 h-5" /> : 
              <AlertCircle className="w-5 h-5" />
            }
            <span>{notification.message}</span>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmAction.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-black/90 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Confirm Action</h3>
              <p className="text-gray-300 mb-6">
                {getActionMessage(confirmAction.action, confirmAction.userName)}
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setConfirmAction({ show: false, userId: null, action: '', userName: '' })}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    confirmAction.action === 'delete' ? 
                    'bg-red-600 hover:bg-red-700 text-white' :
                    confirmAction.action === 'upgrade_to_admin' ?
                    'bg-gradient-to-r from-[#39FF14] to-cyan-400 text-black hover:shadow-lg' :
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 mt-2">Manage user accounts and permissions</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{filteredUsers.length}</p>
            <p className="text-gray-400 text-sm">Total Users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
            <select
              value={filterMembership}
              onChange={(e) => setFilterMembership(e.target.value)}
              className="px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
            >
              <option value="all">All Memberships</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Membership</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Role</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Joined</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">{user.username[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getMembershipIcon(user.membershipTier)}
                        <span className="text-white capitalize">{user.membershipTier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                        user.role === 'moderator' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        user.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {(() => {
                        const dateValue = user.created_at || user.createdAt;
                        if (!dateValue) return 'N/A';
                        
                        try {
                          const date = new Date(dateValue);
                          return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                        } catch (error) {
                          return 'Invalid Date';
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* Upgrade to Admin Button */}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleRoleUpgrade(user.id, user.username)}
                            className="text-gray-400 hover:text-[#39FF14] transition-colors"
                            title="Upgrade to Admin"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Suspend/Activate Button */}
                        <button
                          onClick={() => confirmUserAction(user.id, user.status === 'active' ? 'suspend' : 'activate', user.username)}
                          className={`transition-colors ${
                            user.status === 'active' ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-green-400'
                          }`}
                          title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                        >
                          {user.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => confirmUserAction(user.id, 'delete', user.username)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}