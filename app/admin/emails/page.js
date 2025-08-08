'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'

export default function AdminEmailsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('compose')
  const [loading, setLoading] = useState(false)
  const [campaigns, setCampaigns] = useState([])
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: '',
    recipients: 'all', // 'all' or 'selected'
    includeImages: false
  })

  // Authentication check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [user, authLoading, router])

  // Fetch users for selection
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers()
      fetchCampaigns()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/emails', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const handleSendEmail = async () => {
    if (!emailForm.subject || !emailForm.message) {
      alert('Please fill in subject and message')
      return
    }

    if (emailForm.recipients === 'selected' && selectedUsers.length === 0) {
      alert('Please select at least one user')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          ...emailForm,
          selectedUserIds: selectedUsers
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(`Email campaign sent successfully to ${result.sentCount} recipients!`)
        setEmailForm({
          subject: '',
          message: '',
          recipients: 'all',
          includeImages: false
        })
        setSelectedUsers([])
        fetchCampaigns()
      } else {
        alert(result.error || 'Failed to send emails')
      }
    } catch (error) {
      console.error('Error sending emails:', error)
      alert('Failed to send emails')
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#39FF14] text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#39FF14] mb-8">📧 Email Management</h1>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'compose'
                ? 'bg-[#39FF14] text-black'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            Compose Email
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-[#39FF14] text-black'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            Campaign History
          </button>
        </div>

        {/* Compose Email Tab */}
        {activeTab === 'compose' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Compose Promotional Email</h2>
            
            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]"
                placeholder="Enter email subject..."
              />
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={emailForm.message}
                onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                rows={8}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]"
                placeholder="Enter your promotional message..."
              />
            </div>

            {/* Recipients */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Recipients</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recipients"
                    value="all"
                    checked={emailForm.recipients === 'all'}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, recipients: e.target.value }))}
                    className="mr-2"
                  />
                  All Registered Users
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recipients"
                    value="selected"
                    checked={emailForm.recipients === 'selected'}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, recipients: e.target.value }))}
                    className="mr-2"
                  />
                  Selected Users
                </label>
              </div>
            </div>

            {/* User Selection */}
            {emailForm.recipients === 'selected' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Select Users ({selectedUsers.length} selected)
                </label>
                <div className="max-h-60 overflow-y-auto bg-black border border-gray-700 rounded-lg p-4">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center py-2 hover:bg-gray-800 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelection(user.id)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendEmail}
              disabled={loading}
              className="bg-[#39FF14] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#32E610] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Email Campaign'}
            </button>
          </div>
        )}

        {/* Campaign History Tab */}
        {activeTab === 'history' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Campaign History</h2>
            
            {campaigns.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No email campaigns sent yet.
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="bg-black border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{campaign.subject}</h3>
                      <span className="text-sm text-gray-400">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3 line-clamp-2">{campaign.message}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">
                        By: {campaign.created_by_username}
                      </span>
                      <div className="flex space-x-4">
                        <span className="text-[#39FF14]">
                          ✅ {campaign.sent_count} sent
                        </span>
                        {campaign.failed_count > 0 && (
                          <span className="text-red-400">
                            ❌ {campaign.failed_count} failed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}