"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Upload, X, Save, Loader2 } from "lucide-react"
import StorefrontLayout from "../../../components/StorefrontLayout"
import Link from "next/link"

export default function EditListing() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [listing, setListing] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'new',
    images: [],
    tags: ''
  })
  const [imageFiles, setImageFiles] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [imagesToDelete, setImagesToDelete] = useState([])

  useEffect(() => {
    if (listingId) {
      fetchListing()
    }
  }, [listingId])

  const fetchListing = async () => {
    try {
      const token = localStorage.getItem('storefront_token')
      
      if (!token) {
        router.push('/storefront/login')
        return
      }

      const response = await fetch(`/api/storefront/listings/${listingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const listingData = data.listing
        
        setListing(listingData)
        setFormData({
          title: listingData.title || '',
          description: listingData.description || '',
          price: listingData.price?.toString() || '',
          category: listingData.category || '',
          condition: listingData.condition || 'new',
          images: listingData.images || [],
          tags: Array.isArray(listingData.tags) ? listingData.tags.join(', ') : (listingData.tags || '')
        })
        setExistingImages(listingData.images || [])
      } else if (response.status === 401) {
        localStorage.removeItem('storefront_token')
        localStorage.removeItem('storefront_user')
        router.push('/storefront/login')
      } else if (response.status === 404) {
        router.push('/storefront/listings')
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error)
      router.push('/storefront/listings')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    setImageFiles(prev => [...prev, ...files])
  }

  const removeNewImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (imageUrl) => {
    setExistingImages(prev => prev.filter(img => img !== imageUrl))
    setImagesToDelete(prev => [...prev, imageUrl])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('storefront_token')
      
      if (!token) {
        router.push('/storefront/login')
        return
      }

      // Upload new images if any
      let newImageUrls = []
      if (imageFiles.length > 0) {
        const imageFormData = new FormData()
        imageFiles.forEach(file => {
          imageFormData.append('images', file)
        })

        const uploadResponse = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: imageFormData
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          newImageUrls = uploadData.urls || []
        }
      }

      // Combine existing images (not deleted) with new images
      const allImages = [...existingImages, ...newImageUrls]

      // Update listing
      const updateData = {
        ...formData,
        price: parseFloat(formData.price),
        images: allImages,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        imagesToDelete: imagesToDelete
      }

      const response = await fetch(`/api/storefront/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        router.push('/storefront/listings')
      } else if (response.status === 401) {
        localStorage.removeItem('storefront_token')
        localStorage.removeItem('storefront_user')
        router.push('/storefront/login')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update listing')
      }
    } catch (error) {
      console.error('Failed to update listing:', error)
      alert('Failed to update listing')
    } finally {
      setSaving(false)
    }
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

  if (!listing) {
    return (
      <StorefrontLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-white mb-4">Listing Not Found</h1>
          <Link href="/storefront/listings" className="text-[#39FF14] hover:underline">
            Back to Listings
          </Link>
        </div>
      </StorefrontLayout>
    )
  }

  return (
    <StorefrontLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/storefront/listings"
            className="p-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-gray-400 hover:text-white hover:border-[#39FF14]/50 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Listing</h1>
            <p className="text-gray-400 mt-1">Update your marketplace listing</p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Listing Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
                  placeholder="Enter listing title"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
                  placeholder="0.00"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
                >
                  <option value="">Select a category</option>
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion</option>
                  <option value="home">Home & Garden</option>
                  <option value="sports">Sports</option>
                  <option value="books">Books</option>
                  <option value="art">Art & Collectibles</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Condition *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50"
                  placeholder="e.g. vintage, rare, collectible"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 resize-none"
                  placeholder="Describe your item in detail"
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Images</h2>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Current Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(imageUrl)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {imageFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">New Images to Upload</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Add more images to your listing</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-flex items-center px-6 py-3 bg-[#39FF14]/10 text-[#39FF14] rounded-lg hover:bg-[#39FF14]/20 transition-all duration-300 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Images
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Link
              href="/storefront/listings"
              className="flex-1 py-4 px-6 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-500 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-[#39FF14] to-green-600 text-black rounded-xl font-bold hover:from-green-600 hover:to-[#39FF14] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Update Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </StorefrontLayout>
  )
}