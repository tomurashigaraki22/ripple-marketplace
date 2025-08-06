"use client"
import { useState, useEffect } from "react"
import { Settings, Bell, Shield, Eye, Save, Globe, Lock, Mail, Smartphone, Monitor, Moon, Sun, Palette, Languages, HelpCircle } from "lucide-react"
import StorefrontLayout from "../components/StorefrontLayout"
import { useAuth } from "../../context/AuthContext"

export default function StorefrontSettings() {
  useEffect(() => {
    console.log(
    "main"
    )
  }, [])
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    // Account Preferences
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    theme: 'dark',
    
    // Notifications
    emailNotifications: {
      newOrders: true,
      orderUpdates: true,
      paymentReceived: true,
      lowStock: true,
      promotions: false,
      newsletter: false
    },
    pushNotifications: {
      newOrders: true,
      orderUpdates: true,
      paymentReceived: true,
      lowStock: false
    },
    
    // Privacy & Security
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    twoFactorAuth: false,
    loginAlerts: true,
    
    // Storefront Settings
    autoAcceptOrders: false,
    showInventoryCount: true,
    allowOffers: true,
    requireBuyerMessage: false,
    businessHours: {
      enabled: false,
      start: '09:00',
      end: '17:00',
      timezone: 'UTC'
    }
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('account')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/storefront/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data.settings }))
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/storefront/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (section, key, value) => {
    if (section) {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }))
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: value
      }))
    }
  }

  const tabs = [
    { id: 'account', name: 'Account', icon: Settings },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield },
    { id: 'storefront', name: 'Storefront', icon: Globe }
  ]

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39FF14]"></div>
        </div>
      </StorefrontLayout>
    )
  }

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account preferences and storefront configuration</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              
              {/* Account Settings */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Account Preferences
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Language */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Languages className="w-4 h-4 inline mr-2" />
                        Language
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleChange(null, 'language', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]/50"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>

                    {/* Timezone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Globe className="w-4 h-4 inline mr-2" />
                        Timezone
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleChange(null, 'timezone', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]/50"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>

                    {/* Currency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={settings.currency}
                        onChange={(e) => handleChange(null, 'currency', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]/50"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>

                    {/* Theme */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Palette className="w-4 h-4 inline mr-2" />
                        Theme
                      </label>
                      <select
                        value={settings.theme}
                        onChange={(e) => handleChange(null, 'theme', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]/50"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Bell className="w-5 h-5 mr-2" />
                      Notification Preferences
                    </h2>
                  </div>

                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Notifications
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(settings.emailNotifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <label className="text-gray-300 font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <p className="text-sm text-gray-500">
                              {key === 'newOrders' && 'Get notified when you receive new orders'}
                              {key === 'orderUpdates' && 'Updates on order status changes'}
                              {key === 'paymentReceived' && 'Notifications when payments are received'}
                              {key === 'lowStock' && 'Alerts when inventory is running low'}
                              {key === 'promotions' && 'Marketing and promotional emails'}
                              {key === 'newsletter' && 'Weekly newsletter and updates'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleChange('emailNotifications', key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39FF14]"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Push Notifications
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(settings.pushNotifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <label className="text-gray-300 font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <p className="text-sm text-gray-500">
                              {key === 'newOrders' && 'Instant notifications for new orders'}
                              {key === 'orderUpdates' && 'Real-time order status updates'}
                              {key === 'paymentReceived' && 'Immediate payment confirmations'}
                              {key === 'lowStock' && 'Low inventory alerts'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleChange('pushNotifications', key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39FF14]"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy & Security Settings */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Privacy & Security
                    </h2>
                  </div>

                  {/* Profile Visibility */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Profile Visibility
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Profile Visibility
                        </label>
                        <select
                          value={settings.profileVisibility}
                          onChange={(e) => handleChange(null, 'profileVisibility', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]/50"
                        >
                          <option value="public">Public</option>
                          <option value="members">Members Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-gray-300 font-medium">Show Email Address</label>
                          <p className="text-sm text-gray-500">Display your email on your public profile</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.showEmail}
                            onChange={(e) => handleChange(null, 'showEmail', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39FF14]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-gray-300 font-medium">Show Phone Number</label>
                          <p className="text-sm text-gray-500">Display your phone number on your public profile</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.showPhone}
                            onChange={(e) => handleChange(null, 'showPhone', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39FF14]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Security
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-gray-300 font-medium">Two-Factor Authentication</label>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.twoFactorAuth}
                            onChange={(e) => handleChange(null, 'twoFactorAuth', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39FF14]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-gray-300 font-medium">Login Alerts</label>
                          <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.loginAlerts}
                            onChange={(e) => handleChange(null, 'loginAlerts', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39FF14]"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Storefront Settings */}
              {activeTab === 'storefront' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Globe className="w-5 h-5 mr-2" />
                      Storefront Configuration
                    </h2>
                  </div>

                  {/* Order Management */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Order Management</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-gray-300 font-medium">Auto-Accept Orders</label>
                          <p className="text-sm text-gray-500">Automatically accept orders without manual review</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.autoAcceptOrders}
                            onChange={(e) => handleChange(null, 'autoAcceptOrders', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39FF14]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-gray-300 font-medium">Require Buyer Message</label>
                          <p className="text-sm text-gray-500">Require buyers to include a message with their order</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.requireBuyerMessage}
                            onChange={(e) => handleChange(null, 'requireBuyerMessage', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39FF14]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Listing Display */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Listing Display</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-gray-300 font-medium">Show Inventory Count</label>
                          <p className="text-sm text-gray-500">Display remaining stock count on listings</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.showInventoryCount}
                            onChange={(e) => handleChange(null, 'showInventoryCount', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39FF14]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-gray-300 font-medium">Allow Offers</label>
                          <p className="text-sm text-gray-500">Allow buyers to make offers on your listings</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.allowOffers}
                            onChange={(e) => handleChange(null, 'allowOffers', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39FF14]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Business Hours */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Business Hours</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-gray-300 font-medium">Enable Business Hours</label>
                          <p className="text-sm text-gray-500">Set specific hours when you're available for orders</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.businessHours.enabled}
                            onChange={(e) => handleChange('businessHours', 'enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39FF14]"></div>
                        </label>
                      </div>

                      {settings.businessHours.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                            <input
                              type="time"
                              value={settings.businessHours.start}
                              onChange={(e) => handleChange('businessHours', 'start', e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]/50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                            <input
                              type="time"
                              value={settings.businessHours.end}
                              onChange={(e) => handleChange('businessHours', 'end', e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#39FF14]/50"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-white/10">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-[#39FF14] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#39FF14]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  )
}