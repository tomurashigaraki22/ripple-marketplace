"use client"
import { useState, useEffect } from "react"
import { User, Mail, Phone, MapPin, Save, Camera, Globe, Edit3 } from "lucide-react"
import StorefrontLayout from "../components/StorefrontLayout"
import { useAuth } from "../../context/AuthContext"
import { useRouter } from "next/navigation"

export default function StorefrontProfile() {
  const { token, authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    avatar: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!token) {
        router.push('/storefront/login')
        return
      }
      fetchProfile()
    }
  }, [token, authLoading])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/storefront/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status === 401) {
        router.push('/storefront/login')
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      } else {
        console.error('Failed to fetch profile:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/storefront/profile', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(profile)
      })
      
      if (response.status === 401) {
        router.push('/storefront/login')
        return
      }
      
      if (response.ok) {
        setMessage('Profile updated successfully!')
      } else {
        const data = await response.json()
        setMessage(data.error || 'Failed to update profile')
      }
    } catch (error) {
      setMessage('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    })
  }

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
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-gray-400">Manage your storefront profile and public information</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`p-4 rounded-lg border ${
            message.includes('successfully') 
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Profile Picture</h2>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#39FF14]/20 to-cyan-500/20 border-2 border-[#39FF14]/30 flex items-center justify-center overflow-hidden">
                    {profile.avatar ? (
                      <img 
                        src={profile.avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-[#39FF14]" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 w-10 h-10 bg-[#39FF14] text-black rounded-full flex items-center justify-center hover:bg-[#39FF14]/80 transition-colors">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="text-white font-medium">{profile.username || 'Username'}</p>
                  <p className="text-gray-400 text-sm">{profile.email}</p>
                </div>
                
                <button className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2">
                  <Camera className="w-4 h-4" />
                  <span>Change Photo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={profile.username}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 focus:border-[#39FF14]/50 transition-all"
                      placeholder="Enter your username"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 focus:border-[#39FF14]/50 transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 focus:border-[#39FF14]/50 transition-all"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={profile.location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 focus:border-[#39FF14]/50 transition-all"
                      placeholder="Enter your location"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={profile.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 focus:border-[#39FF14]/50 transition-all"
                    placeholder="https://your-website.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Edit3 className="w-4 h-4 inline mr-2" />
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 focus:border-[#39FF14]/50 transition-all resize-none"
                    placeholder="Tell us about yourself and your store..."
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-gray-700/50">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-gradient-to-r from-[#39FF14] to-cyan-400 text-black font-semibold rounded-lg hover:from-[#39FF14]/80 hover:to-cyan-400/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Account Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Privacy Settings</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-[#39FF14] bg-gray-700 border-gray-600 rounded focus:ring-[#39FF14] focus:ring-2"
                  />
                  <span className="text-gray-300">Show email publicly</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-[#39FF14] bg-gray-700 border-gray-600 rounded focus:ring-[#39FF14] focus:ring-2"
                  />
                  <span className="text-gray-300">Allow contact via website</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-[#39FF14] bg-gray-700 border-gray-600 rounded focus:ring-[#39FF14] focus:ring-2"
                  />
                  <span className="text-gray-300">Show location publicly</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Notification Preferences</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-[#39FF14] bg-gray-700 border-gray-600 rounded focus:ring-[#39FF14] focus:ring-2"
                    defaultChecked
                  />
                  <span className="text-gray-300">Email notifications for new orders</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-[#39FF14] bg-gray-700 border-gray-600 rounded focus:ring-[#39FF14] focus:ring-2"
                    defaultChecked
                  />
                  <span className="text-gray-300">SMS notifications for urgent updates</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-[#39FF14] bg-gray-700 border-gray-600 rounded focus:ring-[#39FF14] focus:ring-2"
                  />
                  <span className="text-gray-300">Marketing emails</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  )
}