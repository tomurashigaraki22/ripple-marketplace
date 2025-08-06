"use client"
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, Camera, Smile, Flag, User, X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { io } from 'socket.io-client';

export default function MessageCenter({ orderId, userType }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // New state for improved image upload
  const [uploadProgress, setUploadProgress] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!user || !orderId) return;

    // Initialize socket connection
    const newSocket = io("wss://ripple-websocket-server.onrender.com", {
      transports: ['websocket'],
      upgrade: false
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      newSocket.emit('join_room', {
        order_id: orderId,
        user_id: user.id,
        user_type: userType
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('recent_messages', (recentMessages) => {
      console.log('Received recent messages:', recentMessages);
      setMessages(recentMessages);
    });

    newSocket.on('new_message', (message) => {
      console.log('Received new message:', message);
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, orderId, userType]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [newMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

    const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected) return;

    console.log('Sending message:', newMessage.trim());
    socket.emit('send_message', {
      message: newMessage.trim()
    });

    setNewMessage('');
    setShowEmojiPicker(false);
  };

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
    const folder = 'ripple-marketplace/messages'
    
    // Parameters for signature
    const params = {
      timestamp,
      folder,
      public_id: `message_${timestamp}_${Math.random().toString(36).substring(7)}`
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

    // Validate file sizes (max 5MB each)
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`)
        return
      }
    }

    setUploadingImages(true)
    const newPreviews = []
    
    try {
      // Create previews for all files
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileId = `${Date.now()}-${i}`
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        newPreviews.push({
          id: fileId,
          file,
          previewUrl,
          name: file.name,
          status: 'pending'
        })
        
        // Initialize progress
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { name: file.name, progress: 0, status: 'uploading' }
        }))
      }
      
      setImagePreviews(newPreviews)
      
      // Upload files one by one
      for (const preview of newPreviews) {
        try {
          // Upload to Cloudinary with signed upload
          const uploadResult = await uploadToCloudinary(preview.file)
          
          // Update progress to complete
          setUploadProgress(prev => ({
            ...prev,
            [preview.id]: { name: preview.name, progress: 100, status: 'completed' }
          }))
          
          // Send message with image
          if (socket && isConnected) {
            socket.emit('send_message', {
              image_url: uploadResult.url
            })
          }
          
          // Update preview status
          setImagePreviews(prev => 
            prev.map(p => 
              p.id === preview.id 
                ? { ...p, status: 'completed', uploadedUrl: uploadResult.url }
                : p
            )
          )
          
        } catch (error) {
          // Update progress to error
          setUploadProgress(prev => ({
            ...prev,
            [preview.id]: { name: preview.name, progress: 0, status: 'error' }
          }))
          
          // Update preview status
          setImagePreviews(prev => 
            prev.map(p => 
              p.id === preview.id 
                ? { ...p, status: 'error' }
                : p
            )
          )
          
          console.error(`Failed to upload ${preview.name}:`, error)
        }
      }
      
      // Clear progress and previews after a delay
      setTimeout(() => {
        setUploadProgress({})
        setImagePreviews([])
        // Clean up preview URLs
        newPreviews.forEach(preview => {
          URL.revokeObjectURL(preview.previewUrl)
        })
      }, 3000)
      
    } catch (error) {
      console.error('Upload process error:', error)
      alert('Failed to process images. Please try again.')
    } finally {
      setUploadingImages(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removePreview = (previewId) => {
    setImagePreviews(prev => {
      const preview = prev.find(p => p.id === previewId)
      if (preview) {
        URL.revokeObjectURL(preview.previewUrl)
      }
      return prev.filter(p => p.id !== previewId)
    })
    
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[previewId]
      return newProgress
    })
  }

  const handleReportMessage = (messageId) => {
    if (socket && isConnected) {
      socket.emit('report_message', { message_id: messageId });
      alert('Message reported to administrators');
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 lg:p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors flex-shrink-0 ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <h3 className="font-semibold text-white text-xs sm:text-sm lg:text-base truncate">
            Order #{orderId.toString().slice(-8)}
          </h3>
        </div>
        <div className="text-xs sm:text-sm text-gray-400 flex-shrink-0">
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3 lg:space-y-4 bg-gray-900 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-center text-xs sm:text-sm lg:text-base px-4">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sent_by === userType;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwnMessage && (
                  <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 ${
                    message.sent_by === 'seller' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    <User size={12} className="sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] sm:max-w-[75%] lg:max-w-md px-2 sm:px-3 lg:px-4 py-2 sm:py-3 rounded-lg shadow-sm ${
                  isOwnMessage
                    ? 'bg-[#39FF14] text-black'
                    : 'bg-gray-800 text-white border border-gray-700'
                }`}>
                  {!isOwnMessage && (
                    <div className="text-xs font-medium mb-1 opacity-75 text-gray-400">
                      {message.username || 'User'}
                    </div>
                  )}
                  
                  {message.image_url && (
                    <div className="mb-2">
                      <img
                        src={message.image_url}
                        alt="Shared image"
                        className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-h-48 sm:max-h-64"
                        onClick={() => window.open(message.image_url, '_blank')}
                        loading="lazy"
                      />
                    </div>
                  )}
                  
                  {message.message && (
                    <div className="break-words text-xs sm:text-sm lg:text-base whitespace-pre-wrap">
                      {message.message}
                    </div>
                  )}
                  
                  <div className={`text-xs mt-1 flex items-center justify-between ${
                    isOwnMessage ? 'text-black/70' : 'text-gray-400'
                  }`}>
                    <span>{formatTime(message.created_at)}</span>
                    {!isOwnMessage && (
                      <button
                        onClick={() => handleReportMessage(message.id)}
                        className="ml-2 hover:text-red-400 transition-colors p-1"
                        title="Report message"
                      >
                        <Flag size={8} className="sm:w-2.5 sm:h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
                {isOwnMessage && (
                  <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ml-2 sm:ml-3 ${
                    userType === 'seller' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    <User size={12} className="sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="border-t border-gray-700 p-2 sm:p-3 bg-gray-800/50 flex-shrink-0">
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
            {imagePreviews.map((preview) => (
              <div key={preview.id} className="relative group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-600">
                  <img
                    src={preview.previewUrl}
                    alt={preview.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    {preview.status === 'pending' && (
                      <Upload size={12} className="sm:w-4 sm:h-4 text-white" />
                    )}
                    {preview.status === 'uploading' && (
                      <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    )}
                    {preview.status === 'completed' && (
                      <CheckCircle size={12} className="sm:w-4 sm:h-4 text-green-400" />
                    )}
                    {preview.status === 'error' && (
                      <AlertCircle size={12} className="sm:w-4 sm:h-4 text-red-400" />
                    )}
                  </div>
                </div>
                {preview.status === 'pending' && (
                  <button
                    onClick={() => removePreview(preview.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                  >
                    <X size={8} className="sm:w-3 sm:h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="space-y-1">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-400 truncate flex-1">{progress.name}</span>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {progress.status === 'uploading' && (
                      <div className="w-8 sm:w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#39FF14] transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                    )}
                    {progress.status === 'completed' && (
                      <CheckCircle size={10} className="sm:w-3 sm:h-3 text-green-400" />
                    )}
                    {progress.status === 'error' && (
                      <AlertCircle size={10} className="sm:w-3 sm:h-3 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-700 p-2 sm:p-3 lg:p-4 bg-gray-800/50 backdrop-blur-sm flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-1 sm:space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full p-2 sm:p-3 bg-gray-900 border border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent text-white placeholder-gray-400 text-xs sm:text-sm lg:text-base min-h-[36px] sm:min-h-[40px] max-h-[80px] sm:max-h-[120px]"
              rows={1}
              disabled={!isConnected}
            />
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <div className="bg-white rounded-lg shadow-lg border border-gray-300">
                  <EmojiPicker 
                    onEmojiClick={onEmojiClick}
                    width={250}
                    height={300}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-400 hover:text-[#39FF14] transition-colors rounded-lg hover:bg-gray-700"
              disabled={!isConnected}
            >
              <Smile size={16} className="sm:w-5 sm:h-5" />
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImages || !isConnected}
              className="p-2 text-gray-400 hover:text-[#39FF14] transition-colors rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImages ? (
                <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-400 border-t-[#39FF14] rounded-full"></div>
              ) : (
                <Camera size={16} className="sm:w-5 sm:h-5" />
              )}
            </button>
            
            <button
              type="submit"
              disabled={!newMessage.trim() || !isConnected}
              className="p-2 bg-[#39FF14] text-black rounded-lg hover:bg-[#39FF14]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </form>
        
        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-2 text-xs text-red-400 text-center">
            Connection lost. Trying to reconnect...
          </div>
        )}
      </div>
    </div>
  );
}