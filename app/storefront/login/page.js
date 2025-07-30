"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Store, Eye, EyeOff } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

export default function StorefrontLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('') // Clear error when user types
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/storefront/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Use AuthContext login method instead of manual localStorage
        const loginSuccess = login(data.token, data.user)
        
        if (loginSuccess) {
          // Also store as storefront_token for compatibility
          localStorage.setItem('storefront_token', data.token)
          localStorage.setItem('storefront_user', JSON.stringify(data.user))
          
          // Redirect to storefront dashboard
          router.push('/storefront/dashboard')
        } else {
          setError('Failed to authenticate user')
        }
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-[#39FF14] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Site
          </Link>
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-[#39FF14] to-cyan-400 rounded-full flex items-center justify-center">
              <Store className="w-8 h-8 text-black" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Storefront Login</h2>
          <p className="text-gray-400">Access your seller dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none transition-colors"
              placeholder="Enter your storefront email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Generated Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none transition-colors pr-12"
                placeholder="Enter your generated password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-[#39FF14] to-cyan-400 text-black rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In to Storefront'}
          </button>
        </form>

        {/* Help Text */}
        <div className="text-center space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> Storefront credentials are automatically generated when you purchase a membership. 
              Check your membership confirmation or contact support if you need assistance.
            </p>
          </div>
          
          <p className="text-gray-400 text-sm">
            Don't have a membership?{' '}
            <Link href="/membership" className="text-[#39FF14] hover:underline">
              Purchase Membership
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}