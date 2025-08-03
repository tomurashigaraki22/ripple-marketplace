"use client"
import { useState } from "react"
import { Upload, Image as ImageIcon, DollarSign, Package, Globe, X, Loader } from "lucide-react"
import { useRouter } from "next/navigation"
import StorefrontLayout from "../../components/StorefrontLayout"

export default function NewListing() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "art",
    chain: "xrp",
    isPhysical: false,
    images: [],
    tags: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const router = useRouter()

  // Generate signature for signed upload
  const generateSignature = async (params) => {
    try {
      const response = await fetch('/api/cloudinary/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate signature')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Signature generation error:', error)
      throw error
    }
  }

  const uploadToCloudinary = async (file) => {
    const timestamp = Math.round(new Date().getTime() / 1000)
    const folder = 'ripple-marketplace/listings'
    
    // Parameters for signature
    const params = {
      timestamp,
      folder,
      public_id: `listing_${timestamp}_${Math.random().toString(36).substring(7)}`
    }

    try {
      // Get signature from backend
      const { signature, api_key } = await generateSignature(params)
      
      // Prepare form data for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', api_key)
      formData.append('timestamp', timestamp)
      formData.append('signature', signature)
      formData.append('folder', folder)
      formData.append('public_id', params.public_id)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      )

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      return {
        url: data.secure_url,
        publicId: data.public_id,
        originalName: file.name
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw error
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingImages(true)
    const newImages = []
    const totalFiles = files.length

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileId = `${Date.now()}-${i}`
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { name: file.name, progress: 0, status: 'uploading' }
        }))

        try {
          // Upload to Cloudinary with signed upload
          const uploadResult = await uploadToCloudinary(file)
          
          // Update progress to complete
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { name: file.name, progress: 100, status: 'completed' }
          }))

          newImages.push(uploadResult)
        } catch (error) {
          // Update progress to error
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { name: file.name, progress: 0, status: 'error' }
          }))
          console.error(`Failed to upload ${file.name}:`, error)
        }
      }

      // Add successfully uploaded images to form data
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }))

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress({})
      }, 2000)

    } catch (error) {
      console.error('Upload process error:', error)
    } finally {
      setUploadingImages(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
  
    try {
      // Get the stored token
      const token = localStorage.getItem('storefront_token')
      
      if (!token) {
        alert('Please log in to create listings')
        router.push('/storefront/login')
        return
      }
  
      // Prepare data with image URLs
      const submitData = {
        ...formData,
        images: formData.images.map(img => img.url) // Send only URLs to API
      }
  
      const response = await fetch('/api/storefront/listings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add the token here!
        },
        body: JSON.stringify(submitData)
      })
  
      if (response.ok) {
        router.push('/storefront/listings')
      } else {
        const errorData = await response.json()
        console.error('Failed to create listing:', errorData)
        
        // Handle token expiration
        if (response.status === 401) {
          localStorage.removeItem('storefront_token')
          localStorage.removeItem('storefront_user')
          alert('Your session has expired. Please log in again.')
          router.push('/storefront/login')
        } else {
          alert(errorData.error || 'Failed to create listing. Please try again.')
        }
      }
    } catch (error) {
      console.error('Failed to create listing:', error)
      alert('Failed to create listing. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Create New Listing</h1>
          <p className="text-gray-400 mt-2">Add a new item to your storefront</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                  placeholder="Enter listing title"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                  placeholder="Describe your item in detail"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Price (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
                >
                  <option value="art">Digital Art</option>
                  <option value="gaming">Gaming</option>
                  <option value="music">Music</option>
                  <option value="collectibles">Collectibles</option>
                  <option value="photography">Photography</option>
                  <option value="utility">Utility</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Blockchain</label>
                <select
                  value={formData.chain}
                  onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
                >
                  <option value="xrp">XRP Ledger</option>
                  <option value="evm">EVM (Ethereum)</option>
                  <option value="solana">Solana</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Item Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="itemType"
                      checked={!formData.isPhysical}
                      onChange={() => setFormData({ ...formData, isPhysical: false })}
                      className="text-[#39FF14] focus:ring-[#39FF14]"
                    />
                    <span className="text-white">Digital</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="itemType"
                      checked={formData.isPhysical}
                      onChange={() => setFormData({ ...formData, isPhysical: true })}
                      className="text-[#39FF14] focus:ring-[#39FF14]"
                    />
                    <span className="text-white">Physical</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Images</h3>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-[#39FF14]/50 transition-colors mb-6">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploadingImages}
              />
              <label htmlFor="image-upload" className={`cursor-pointer ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploadingImages ? (
                  <Loader className="w-12 h-12 text-[#39FF14] mx-auto mb-4 animate-spin" />
                ) : (
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                )}
                <p className="text-white font-medium mb-2">
                  {uploadingImages ? 'Uploading Images...' : 'Upload Images'}
                </p>
                <p className="text-gray-400 text-sm">
                  {uploadingImages ? 'Please wait while images are being uploaded' : 'Drag and drop or click to select files'}
                </p>
              </label>
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="mb-6 space-y-2">
                <h4 className="text-white font-medium mb-3">Upload Progress</h4>
                {Object.entries(uploadProgress).map(([fileId, progress]) => (
                  <div key={fileId} className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300 truncate">{progress.name}</span>
                      <span className={`text-xs ${
                        progress.status === 'completed' ? 'text-green-400' :
                        progress.status === 'error' ? 'text-red-400' :
                        'text-[#39FF14]'
                      }`}>
                        {progress.status === 'completed' ? 'Completed' :
                         progress.status === 'error' ? 'Failed' :
                         'Uploading...'}
                      </span>
                    </div>
                    {progress.status === 'uploading' && (
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-[#39FF14] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Uploaded Images Preview */}
            {formData.images.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3">Uploaded Images ({formData.images.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={image.originalName || `Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-white bg-black/70 rounded px-2 py-1 truncate">
                          {image.originalName || `Image ${index + 1}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-600 text-gray-400 rounded-lg hover:border-gray-500 hover:text-white transition-colors"
              disabled={isSubmitting || uploadingImages}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingImages || formData.images.length === 0}
              className="px-6 py-3 bg-[#39FF14] text-black rounded-lg font-semibold hover:neon-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : uploadingImages ? 'Uploading...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </StorefrontLayout>
  )
}