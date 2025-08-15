"use client"
import { useState, useEffect } from "react"
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, Package } from "lucide-react"
import AdminLayout from "../components/AdminLayout"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"

export default function AdminListings() {
  const [listings, setListings] = useState([])
  const {logout} = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      // Change from 'adminToken' to 'authToken'
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No admin token found')
        return
      }

      const response = await fetch('/api/admin/listings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch listings')
      }
      
      const data = await response.json()
      console.log("Listing: ", data)
      setListings(data.listings)
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    }
  }

  const handleListingAction = async (listingId, action) => {
    try {
      // Change from 'adminToken' to 'authToken'
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No admin token found')
        return
      }

      const response = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      })
      
      if (response.ok) {
        if (action === "view"){
          await logout();
          router.push(`/marketplace/${listingId}`)
        }
        fetchListings()
      } else {
        throw new Error('Failed to update listing')
      }
    } catch (error) {
      console.error('Failed to update listing:', error)
    }
  }

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus
    const matchesCategory = filterCategory === 'all' || listing.category === filterCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />
      default: return <Package className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Listings Management</h1>
            <p className="text-gray-400 mt-2">Review and manage marketplace listings</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-yellow-400">{listings.filter(l => l.status === 'pending').length}</p>
              <p className="text-gray-400 text-sm">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{listings.filter(l => l.status === 'approved').length}</p>
              <p className="text-gray-400 text-sm">Approved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{listings.filter(l => l.status === 'rejected').length}</p>
              <p className="text-gray-400 text-sm">Rejected</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="art">Digital Art</option>
              <option value="gaming">Gaming</option>
              <option value="music">Music</option>
              <option value="collectibles">Collectibles</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-[#39FF14]/30 transition-all">
              <div className="relative h-48">
                <Image
                  src={listing.images[0] || '/placeholder.jpg'}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 right-4">
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                    listing.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    listing.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {getStatusIcon(listing.status)}
                    <span className="capitalize">{listing.status}</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">{listing.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{listing.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#39FF14] font-bold">$ {parseFloat(listing.price)}</span>
                  <span className="text-gray-400 text-sm">{listing.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span>By {listing.seller}</span>
                  <span>{new Date(listing.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleListingAction(listing.id, 'view')}
                    className="flex-1 py-2 bg-gray-600/20 text-gray-300 rounded-lg hover:bg-gray-600/30 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  {listing.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleListingAction(listing.id, 'approve')}
                        className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleListingAction(listing.id, 'reject')}
                        className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center space-x-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}