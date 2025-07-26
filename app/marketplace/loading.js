"use client"
import { Loader2, Zap, Search, Grid } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(57,255,20,0.1),transparent_50%)] animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#39FF14] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Loading Content */}
      <div className="relative z-10 text-center">
        {/* Main Loading Spinner */}
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-gray-800 border-t-[#39FF14] rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-[#39FF14]/50 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-white mb-4">
          Loading Marketplace
        </h2>
        <p className="text-gray-400 mb-8">
          Discovering digital assets across blockchains...
        </p>

        {/* Loading Steps */}
        <div className="space-y-4 max-w-md mx-auto">
          {/* Step 1 */}
          <div className="flex items-center space-x-3 p-3 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800">
            <div className="w-8 h-8 bg-[#39FF14] rounded-full flex items-center justify-center animate-pulse">
              <Search className="w-4 h-4 text-black" />
            </div>
            <span className="text-gray-300">Fetching marketplace data</span>
            <div className="ml-auto">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center space-x-3 p-3 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <Grid className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-gray-500">Loading collections</span>
            <div className="ml-auto">
              <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center space-x-3 p-3 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-gray-500">Connecting to blockchain</span>
            <div className="ml-auto">
              <div className="w-4 h-4 border-2 border-gray-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#39FF14] to-emerald-400 rounded-full animate-pulse" style={{width: '33%'}}></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Loading... 33%</p>
        </div>

        {/* Floating Icons */}
        <div className="absolute -top-20 -left-20 opacity-20">
          <div className="w-16 h-16 bg-[#39FF14]/20 rounded-full flex items-center justify-center animate-float">
            <Search className="w-8 h-8 text-[#39FF14]" />
          </div>
        </div>
        <div className="absolute -top-16 -right-16 opacity-20">
          <div className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center animate-float" style={{animationDelay: '1s'}}>
            <Grid className="w-6 h-6 text-[#39FF14]" />
          </div>
        </div>
        <div className="absolute -bottom-12 -left-12 opacity-20">
          <div className="w-14 h-14 bg-[#39FF14]/20 rounded-full flex items-center justify-center animate-float" style={{animationDelay: '2s'}}>
            <Zap className="w-7 h-7 text-[#39FF14]" />
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
