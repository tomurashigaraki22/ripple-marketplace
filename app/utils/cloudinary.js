export const uploadToCloudinary = async (file) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName) {
    throw new Error(
      "Cloudinary configuration missing. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to your environment variables.",
    )
  }

  const formData = new FormData()
  formData.append("file", file)
  

    // Use a common unsigned preset name or create one without preset
  formData.append("upload_preset", "ml_default")
  
  
  formData.append("folder", "storefront/backgrounds")

  try {
    let response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    })

    // If upload preset fails, try without it (unsigned upload)
    if (!response.ok) {
      const errorData = await response.json()
      
      if (errorData.error && errorData.error.message.includes("Upload preset not found")) {
        console.warn("Upload preset not found, trying unsigned upload...")
        
        // Create new FormData without upload_preset
        const fallbackFormData = new FormData()
        fallbackFormData.append("file", file)
        fallbackFormData.append("folder", "storefront/backgrounds")
        
        // Try unsigned upload (requires unsigned upload to be enabled in Cloudinary)
        response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: fallbackFormData,
        })
      }
      
      if (!response.ok) {
        const finalError = await response.json()
        throw new Error(`Upload failed: ${finalError.error?.message || 'Unknown error'}`);
      }
    }

    const data = await response.json()
    return {
      url: data.secure_url,
      publicId: data.public_id,
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    
    // Provide helpful error messages
    if (error.message.includes("Upload preset not found")) {
      throw new Error(
        "Cloudinary upload preset not found. Please create an upload preset in your Cloudinary dashboard or enable unsigned uploads."
      )
    }
    
    throw error
  }
}
