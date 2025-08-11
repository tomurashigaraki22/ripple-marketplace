'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../components/AdminLayout'

export default function AdminEmailsPage() {
  const { user, loading: authLoading, getValidToken } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('compose')
  const [loading, setLoading] = useState(false)
  const [campaigns, setCampaigns] = useState([])
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  const [emailForm, setEmailForm] = useState({
    templateType: 'promotional', // 'promotional' or 'newsletter'
    subject: '',
    message: '',
    recipients: 'all', // 'all' or 'selected'
    includeImages: false,
    // Promotional template fields
    title: '',
    subtitle: '',
    content: '',
    ctaText: '',
    ctaUrl: '',
    // Newsletter template fields
    date: '',
    newsletterContent: ''
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

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }, [users, searchTerm])

  // Reset form fields when template type changes
  useEffect(() => {
    setEmailForm(prev => ({
      ...prev,
      subject: '',
      message: '',
      title: '',
      subtitle: '',
      content: '',
      ctaText: '',
      ctaUrl: '',
      date: '',
      newsletterContent: ''
    }))
  }, [emailForm.templateType])

  const fetchUsers = async () => {
    try {
      // Fetch all users without pagination for email selection
      const response = await fetch('/api/admin/users?all=true', {
        headers: {
          'Authorization': `Bearer ${getValidToken()}`
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
          'Authorization': `Bearer ${getValidToken()}`
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

  const validateForm = () => {
    if (!emailForm.subject) {
      alert('Please fill in the subject')
      return false
    }

    if (emailForm.templateType === 'promotional') {
      if (!emailForm.title || !emailForm.content) {
        alert('Please fill in the title and content for promotional email')
        return false
      }
    } else if (emailForm.templateType === 'newsletter') {
      if (!emailForm.newsletterContent) {
        alert('Please fill in the newsletter content')
        return false
      }
    }

    if (emailForm.recipients === 'selected' && selectedUsers.length === 0) {
      alert('Please select at least one user')
      return false
    }

    return true
  }

  const handleSendEmail = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getValidToken()}`
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
          templateType: 'promotional',
          subject: '',
          message: '',
          recipients: 'all',
          includeImages: false,
          title: '',
          subtitle: '',
          content: '',
          ctaText: '',
          ctaUrl: '',
          date: '',
          newsletterContent: ''
        })
        setSelectedUsers([])
        setSearchTerm('')
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

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#39FF14] text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <AdminLayout>
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
            <h2 className="text-xl font-semibold mb-6">Compose Email Campaign</h2>
            
            {/* Template Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Email Template Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setEmailForm(prev => ({ ...prev, templateType: 'promotional' }))}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    emailForm.templateType === 'promotional'
                      ? 'border-[#39FF14] bg-[#39FF14]/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-left">
                    <h3 className="font-semibold text-lg mb-2">🎉 Promotional Email</h3>
                    <p className="text-sm text-gray-400">Special offers, deals, and marketing campaigns</p>
                  </div>
                </button>
                <button
                  onClick={() => setEmailForm(prev => ({ ...prev, templateType: 'newsletter' }))}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    emailForm.templateType === 'newsletter'
                      ? 'border-[#39FF14] bg-[#39FF14]/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-left">
                    <h3 className="font-semibold text-lg mb-2">📰 Newsletter</h3>
                    <p className="text-sm text-gray-400">Regular updates, news, and highlights</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email Subject *</label>
              <input
                type="text"
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]"
                placeholder={emailForm.templateType === 'promotional' ? 'Special Offer - Limited Time!' : 'RippleBids Newsletter - Weekly Update'}
              />
            </div>

            {/* Template-specific fields */}
            {emailForm.templateType === 'promotional' && (
              <div className="space-y-4 mb-6">
                <div className="bg-black/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-[#39FF14] mb-4">Promotional Email Details</h3>
                  
                  {/* Title */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Main Title *</label>
                    <input
                      type="text"
                      value={emailForm.title}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]"
                      placeholder="🎉 Special Offer"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Subtitle</label>
                    <input
                      type="text"
                      value={emailForm.subtitle}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]"
                      placeholder="Don't miss out on this amazing deal!"
                    />
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Main Content *</label>
                    <textarea
                      value={emailForm.content}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]"
                      placeholder="Enter your promotional content here. You can use HTML for formatting..."
                    />
                  </div>

                  {/* CTA Button */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Call-to-Action Text</label>
                      <input
                        type="text"
                        value={emailForm.ctaText}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, ctaText: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]"
                        placeholder="Shop Now"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Call-to-Action URL</label>
                      <input
                        type="url"
                        value={emailForm.ctaUrl}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, ctaUrl: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]"
                        placeholder="https://ripplebids.com/marketplace"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {emailForm.templateType === 'newsletter' && (
              <div className="space-y-4 mb-6">
                <div className="bg-black/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-[#39FF14] mb-4">Newsletter Details</h3>
                  
                  {/* Date */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Newsletter Date</label>
                    <input
                      type="date"
                      value={emailForm.date}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]"
                    />
                  </div>

                  {/* Newsletter Content */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Newsletter Content *</label>
                    <textarea
                      value={emailForm.newsletterContent}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, newsletterContent: e.target.value }))}
                      rows={8}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]"
                      placeholder="Enter your newsletter content here. You can include highlights, news, updates, etc. HTML formatting is supported..."
                    />
                  </div>

                  <div className="text-sm text-gray-400 bg-gray-800 p-3 rounded">
                    <strong>💡 Newsletter Tips:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>• Include weekly highlights and marketplace trends</li>
                      <li>• Add featured listings or popular items</li>
                      <li>• Share platform updates and new features</li>
                      <li>• Use HTML for better formatting (headings, lists, links)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

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
                  All Registered Users ({users.length} users)
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
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium">
                    Select Users ({selectedUsers.length} of {filteredUsers.length} selected)
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1 bg-[#39FF14] text-black rounded text-sm hover:bg-[#32E610]"
                    >
                      {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Search Input */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users by username, email, or ID..."
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#39FF14]"
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto bg-black border border-gray-700 rounded-lg p-4">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                      {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                    </div>
                  ) : (
                    filteredUsers.map(user => (
                      <label key={user.id} className="flex items-center py-2 hover:bg-gray-800 px-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelection(user.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                          <div className="text-xs text-gray-500">
                            ID: {user.id} | Role: {user.role} | Tier: {user.membershipTier}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Preview Section */}
            <div className="mb-6 bg-black/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-[#39FF14] mb-3">📋 Email Preview</h3>
              <div className="bg-gray-800 p-4 rounded border">
                <div className="text-sm text-gray-400 mb-2">Subject: <span className="text-white">{emailForm.subject || 'No subject'}</span></div>
                <div className="text-sm text-gray-400 mb-2">Template: <span className="text-white capitalize">{emailForm.templateType}</span></div>
                <div className="text-sm text-gray-400 mb-2">Recipients: <span className="text-white">
                  {emailForm.recipients === 'all' ? `All users (${users.length})` : `Selected users (${selectedUsers.length})`}
                </span></div>
                {emailForm.templateType === 'promotional' && emailForm.title && (
                  <div className="text-sm text-gray-400">Title: <span className="text-white">{emailForm.title}</span></div>
                )}
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendEmail}
              disabled={loading}
              className="bg-[#39FF14] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#32E610] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : `Send ${emailForm.templateType === 'promotional' ? 'Promotional' : 'Newsletter'} Campaign`}
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
                      <div>
                        <h3 className="font-semibold text-lg">{campaign.subject}</h3>
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded mt-1 inline-block">
                          {campaign.templateType || 'promotional'}
                        </span>
                      </div>
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
    </AdminLayout>
  )
}