"use client"
import { useState } from "react"
import { Upload, DollarSign, Package, X, Plus, Minus, Camera } from "lucide-react"
import { useRouter } from "next/navigation"
import StorefrontLayout from "../../components/StorefrontLayout"
import { CATEGORIES, CONDITIONS, SIZES, COLORS } from "../../../utils/categories"

export default function NewListing() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    brand: "",
    model: "",
    condition_type: "new",
    chain: "xrp",
    isPhysical: false,
    weight: "",
    dimensions: { length: "", width: "", height: "", unit: "cm" },
    color: "",
    size: "",
    material: "",
    year_manufactured: "",
    warranty_info: "",
    shipping_info: {
      free_shipping: false,
      shipping_cost: "",
      processing_time: "1-3",
      shipping_methods: []
    },
    return_policy: "",
    quantity_available: 1,
    stock_quantity: 1, // Track inventory separately
    low_stock_threshold: 5, // Alert threshold
    sku: "",
    isbn: "",
    upc_ean: "",
    images: [],
    tags: "",
    features: [],
    specifications: {},
    compatibility: [],
    included_items: [],
    location_city: "",
    location_state: "",
    location_country: "US",
    is_negotiable: false,
    min_offer_price: "",
    is_auction: false,
    starting_bid: "", // Add this field
    bid_increment: "10", // Add this field
    auction_end_date: "",
    reserve_price: "",
    buy_it_now_price: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const router = useRouter()

  const [fieldToggles, setFieldToggles] = useState({
    showColor: false,
    showSize: false,
    showMaterial: false,
    showBrand: false,
    showModel: false,
    showWeight: false,
    showDimensions: false,
    showYear: false,
    showWarranty: false,
    showSKU: false,
    showISBN: false,
    showUPC: false,
    showFeatures: false,
    showCompatibility: false,
    showIncludedItems: false
  })

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleToggleChange = (toggleName) => {
    setFieldToggles(prev => ({
      ...prev,
      [toggleName]: !prev[toggleName]
    }))
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }))
  }

  const updateFeature = (index, value) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }))
  }

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  // Helper function to check if field is relevant for category
  const isFieldRelevantForCategory = (fieldName) => {
    if (!formData.category) return true
    
    const categoryConfig = {
      'electronics': ['showBrand', 'showModel', 'showColor', 'showWeight', 'showDimensions', 'showYear', 'showWarranty', 'showSKU', 'showFeatures', 'showCompatibility'],
      'fashion': ['showBrand', 'showColor', 'showSize', 'showMaterial', 'showYear'],
      'home-garden': ['showBrand', 'showModel', 'showColor', 'showSize', 'showMaterial', 'showWeight', 'showDimensions'],
      'sports': ['showBrand', 'showModel', 'showColor', 'showSize', 'showMaterial', 'showWeight'],
      'books': ['showISBN', 'showYear', 'showWeight'],
      'art': ['showMaterial', 'showDimensions', 'showYear', 'showWeight'],
      'automotive': ['showBrand', 'showModel', 'showYear', 'showColor', 'showWeight', 'showCompatibility', 'showWarranty'],
      'health-beauty': ['showBrand', 'showSize', 'showWeight', 'showYear'],
      'toys-games': ['showBrand', 'showModel', 'showColor', 'showWeight', 'showDimensions', 'showYear'],
      'music': ['showBrand', 'showModel', 'showColor', 'showWeight', 'showYear'],
      'collectibles': ['showBrand', 'showModel', 'showYear', 'showMaterial', 'showColor'],
      'other': ['showBrand', 'showModel', 'showColor', 'showSize', 'showMaterial', 'showWeight', 'showDimensions', 'showYear']
    }
    
    return categoryConfig[formData.category]?.includes(fieldName) ?? true
  }

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Create New Listing</h1>
          <p className="text-gray-400 mt-2">Add a comprehensive listing to your storefront</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Title */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-white mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                  placeholder="Enter listing title"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
                  required
                >
                  <option value="">Select a category</option>
                  {Object.entries(CATEGORIES).map(([key, category]) => (
                    <option key={key} value={key}>{category.name}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              {formData.category && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Subcategory</label>
                  <select
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
                  >
                    <option value="">Select subcategory</option>
                    {CATEGORIES[formData.category]?.subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Price (USD) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Stock Quantity *</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                  placeholder="1"
                  min="1"
                  required
                />
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Low Stock Alert</label>
                <input
                  type="number"
                  name="low_stock_threshold"
                  value={formData.low_stock_threshold}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                  placeholder="5"
                  min="0"
                />
                <p className="text-gray-400 text-xs mt-1">Get notified when stock falls below this number</p>
              </div>

              {/* Condition */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-white mb-2">Condition *</label>
                <select
                  name="condition_type"
                  value={formData.condition_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
                  required
                >
                  {CONDITIONS.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label} - {condition.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-white mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                  placeholder="Describe your item in detail"
                  required
                />
              </div>
            </div>
          </div>

          {/* Images Upload */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Images</h3>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-[#39FF14]/50 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploadingImages}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">Click to upload images</p>
                <p className="text-gray-400 text-sm">PNG, JPG, GIF up to 10MB each</p>
              </label>
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="mt-4 space-y-2">
                {Object.entries(uploadProgress).map(([fileId, progress]) => (
                  <div key={fileId} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-white truncate">{progress.name}</span>
                      <span className="text-xs text-gray-400">
                        {progress.status === 'completed' ? 'Completed' : 
                         progress.status === 'error' ? 'Error' : 'Uploading...'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          progress.status === 'completed' ? 'bg-green-500' :
                          progress.status === 'error' ? 'bg-red-500' : 'bg-[#39FF14]'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Uploaded Images */}
            {formData.images.length > 0 && (
              <div className="mt-6">
                <h4 className="text-white font-medium mb-3">Uploaded Images ({formData.images.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Item Details with Toggles */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Item Details</h3>
            
            {/* Item Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">Item Type *</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isPhysical"
                    checked={!formData.isPhysical}
                    onChange={() => setFormData(prev => ({ ...prev, isPhysical: false }))}
                    className="text-[#39FF14] focus:ring-[#39FF14]"
                  />
                  <span className="text-white">Digital</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isPhysical"
                    checked={formData.isPhysical}
                    onChange={() => setFormData(prev => ({ ...prev, isPhysical: true }))}
                    className="text-[#39FF14] focus:ring-[#39FF14]"
                  />
                  <span className="text-white">Physical</span>
                </label>
              </div>
            </div>

            {/* Blockchain */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">Blockchain *</label>
              <select
                name="chain"
                value={formData.chain}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
                required
              >
                <option value="xrp">XRP Ledger</option>
                <option value="evm">EVM (Ethereum)</option>
                <option value="solana">Solana</option>
              </select>
            </div>

            {/* Optional Fields with Toggles */}
            <div className="space-y-6">
              {/* Brand Toggle */}
              {isFieldRelevantForCategory('showBrand') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-white">Brand Information</label>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('showBrand')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        fieldToggles.showBrand ? 'bg-[#39FF14]' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        fieldToggles.showBrand ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {fieldToggles.showBrand && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Brand</label>
                        <input
                          type="text"
                          name="brand"
                          value={formData.brand}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                          placeholder="e.g. Apple, Nike, Samsung"
                        />
                      </div>
                      {fieldToggles.showModel && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                          <input
                            type="text"
                            name="model"
                            value={formData.model}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                            placeholder="e.g. iPhone 15 Pro, Air Jordan 1"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Model Toggle */}
              {isFieldRelevantForCategory('showModel') && !fieldToggles.showBrand && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-white">Model Information</label>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('showModel')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        fieldToggles.showModel ? 'bg-[#39FF14]' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        fieldToggles.showModel ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {fieldToggles.showModel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                      <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                        placeholder="e.g. iPhone 15 Pro, Air Jordan 1"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Color Toggle */}
              {isFieldRelevantForCategory('showColor') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-white">Color Specification</label>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('showColor')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        fieldToggles.showColor ? 'bg-[#39FF14]' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        fieldToggles.showColor ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {fieldToggles.showColor && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                      <select
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
                      >
                        <option value="">Select color</option>
                        {COLORS.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Size Toggle */}
              {isFieldRelevantForCategory('showSize') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-white">Size Information</label>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('showSize')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        fieldToggles.showSize ? 'bg-[#39FF14]' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        fieldToggles.showSize ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {fieldToggles.showSize && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Size</label>
                      <input
                        type="text"
                        name="size"
                        value={formData.size}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                        placeholder="e.g. Large, 10.5, 32GB"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Material Toggle */}
              {isFieldRelevantForCategory('showMaterial') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-white">Material Information</label>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('showMaterial')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        fieldToggles.showMaterial ? 'bg-[#39FF14]' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        fieldToggles.showMaterial ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {fieldToggles.showMaterial && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Material</label>
                      <input
                        type="text"
                        name="material"
                        value={formData.material}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                        placeholder="e.g. Cotton, Aluminum, Leather"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Physical Item Specific Fields */}
              {formData.isPhysical && (
                <>
                  {/* Weight Toggle */}
                  {isFieldRelevantForCategory('showWeight') && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-white">Weight & Dimensions</label>
                        <button
                          type="button"
                          onClick={() => handleToggleChange('showWeight')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            fieldToggles.showWeight ? 'bg-[#39FF14]' : 'bg-gray-600'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            fieldToggles.showWeight ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                      {fieldToggles.showWeight && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Weight (kg)</label>
                            <input
                              type="number"
                              name="weight"
                              value={formData.weight}
                              onChange={handleInputChange}
                              step="0.01"
                              className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Dimensions (L x W x H cm)</label>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="number"
                                name="dimensions.length"
                                value={formData.dimensions.length}
                                onChange={handleInputChange}
                                placeholder="Length"
                                className="px-3 py-2 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none text-sm"
                              />
                              <input
                                type="number"
                                name="dimensions.width"
                                value={formData.dimensions.width}
                                onChange={handleInputChange}
                                placeholder="Width"
                                className="px-3 py-2 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none text-sm"
                              />
                              <input
                                type="number"
                                name="dimensions.height"
                                value={formData.dimensions.height}
                                onChange={handleInputChange}
                                placeholder="Height"
                                className="px-3 py-2 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Additional Optional Fields */}
              {/* Year Toggle */}
              {isFieldRelevantForCategory('showYear') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-white">Year Information</label>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('showYear')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        fieldToggles.showYear ? 'bg-[#39FF14]' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        fieldToggles.showYear ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {fieldToggles.showYear && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Year Manufactured</label>
                      <input
                        type="number"
                        name="year_manufactured"
                        value={formData.year_manufactured}
                        onChange={handleInputChange}
                        min="1900"
                        max={new Date().getFullYear()}
                        className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                        placeholder={new Date().getFullYear()}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* SKU Toggle */}
              {isFieldRelevantForCategory('showSKU') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-white">Product Identifiers</label>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('showSKU')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        fieldToggles.showSKU ? 'bg-[#39FF14]' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        fieldToggles.showSKU ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {fieldToggles.showSKU && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
                        <input
                          type="text"
                          name="sku"
                          value={formData.sku}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                          placeholder="Stock Keeping Unit"
                        />
                      </div>
                      {isFieldRelevantForCategory('showISBN') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">ISBN</label>
                          <input
                            type="text"
                            name="isbn"
                            value={formData.isbn}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                            placeholder="For books"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">UPC/EAN</label>
                        <input
                          type="text"
                          name="upc_ean"
                          value={formData.upc_ean}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                          placeholder="Barcode number"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Features Toggle */}
              {isFieldRelevantForCategory('showFeatures') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-white">Key Features</label>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('showFeatures')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        fieldToggles.showFeatures ? 'bg-[#39FF14]' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        fieldToggles.showFeatures ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {fieldToggles.showFeatures && (
                    <div>
                      <div className="space-y-3">
                        {formData.features.map((feature, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => updateFeature(index, e.target.value)}
                              className="flex-1 px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                              placeholder="Enter a key feature"
                            />
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="px-3 py-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addFeature}
                          className="flex items-center gap-2 px-4 py-3 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg text-[#39FF14] hover:bg-[#39FF14]/20 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Feature
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Tags & Keywords</h3>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                placeholder="Enter tags separated by commas (e.g. vintage, rare, collectible)"
              />
              <p className="text-gray-400 text-sm mt-2">Add relevant keywords to help buyers find your listing</p>
            </div>
          </div>

          {/* Auction Settings */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Listing Type</h3>
            
            {/* Listing Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-4">How would you like to sell this item?</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg hover:border-[#39FF14]/50 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="listingType"
                    checked={!formData.is_auction}
                    onChange={() => setFormData(prev => ({ ...prev, is_auction: false }))}
                    className="text-[#39FF14] focus:ring-[#39FF14]"
                  />
                  <div>
                    <div className="text-white font-medium">Buy Now</div>
                    <div className="text-gray-400 text-sm">Sell at a fixed price</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg hover:border-[#39FF14]/50 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="listingType"
                    checked={formData.is_auction}
                    onChange={() => {
                      const futureDate = new Date()
                      futureDate.setDate(futureDate.getDate() + 7) // Default to 7 days from now
                      
                      setFormData(prev => ({ 
                        ...prev, 
                        is_auction: true,
                        auction_end_date: futureDate.toISOString().slice(0, 16),
                        starting_bid: prev.price || "1" // Use current price as starting bid or default to $1
                      }))
                    }}
                    className="text-[#39FF14] focus:ring-[#39FF14]"
                  />
                  <div>
                    <div className="text-white font-medium">Auction</div>
                    <div className="text-gray-400 text-sm">Let buyers bid on your item</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Auction-specific fields */}
            {formData.is_auction && (
              <div className="space-y-6 border-t border-gray-600 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Starting Bid */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Starting Bid (USD) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        name="starting_bid"
                        value={formData.starting_bid || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, starting_bid: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                        placeholder="0.00"
                        step="0.01"
                        min="1"
                        required={formData.is_auction}
                      />
                    </div>
                  </div>

                  {/* Bid Increment */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Bid Increment *</label>
                    <select
                      name="bid_increment"
                      value={formData.bid_increment || '10'}
                      onChange={(e) => setFormData(prev => ({ ...prev, bid_increment: e.target.value }))}
                      className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
                      required={formData.is_auction}
                    >
                      <option value="10">$10 USD</option>
                      <option value="100">$100 USD</option>
                    </select>
                  </div>
                </div>

                {/* Auction Duration */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Auction End Date *</label>
                  <input
                    type="datetime-local"
                    name="auction_end_date"
                    value={formData.auction_end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, auction_end_date: e.target.value }))}
                    min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} // Minimum 1 hour from now
                    max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)} // Maximum 30 days
                    className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
                    required={formData.is_auction}
                  />
                  <p className="text-gray-400 text-sm mt-2">Auctions can run for up to 30 days</p>
                </div>

                {/* Buy It Now Option */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={!!formData.buy_it_now_price}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        buy_it_now_price: e.target.checked ? prev.price : '' 
                      }))}
                      className="text-[#39FF14] focus:ring-[#39FF14]"
                    />
                    <span className="text-white">Allow "Buy It Now" option</span>
                  </label>
                  
                  {formData.buy_it_now_price && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Buy It Now Price (USD)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          name="buy_it_now_price"
                          value={formData.buy_it_now_price}
                          onChange={(e) => setFormData(prev => ({ ...prev, buy_it_now_price: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#39FF14] focus:outline-none"
                          placeholder="0.00"
                          step="0.01"
                          min={parseFloat(formData.starting_bid || 0) + 10}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-2">📋 Auction Guidelines</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Bidders must have sufficient wallet balance to place bids</li>
                    <li>• Bids increase by your selected increment ($10 or $100)</li>
                    <li>• The highest bidder at auction end wins the item</li>
                    <li>• Winners have 24 hours to complete payment</li>
                    <li>• All auctions are final - no cancellations after first bid</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-600 rounded-lg text-white hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingImages}
              className="px-8 py-3 bg-gradient-to-r from-[#39FF14] to-green-600 text-black font-semibold rounded-lg hover:from-green-600 hover:to-[#39FF14] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  <span>Create Listing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </StorefrontLayout>
  )
}