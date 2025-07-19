import Link from "next/link"
import { ArrowRight, Zap, Shield, Globe, Coins } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 gradient-bg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="neon-text">Claim Your XRPB Tokens</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join the future of decentralized commerce on XRP Ledger, EVM chains, and Solana
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              href="/claim"
              className="px-8 py-4 bg-[#39FF14] text-black rounded-lg font-semibold hover:neon-glow transition-all animate-pulse-neon"
            >
              Claim Tokens
            </Link>
            <Link
              href="/wallet"
              className="px-8 py-4 neon-border rounded-lg font-semibold hover:neon-glow transition-all"
            >
              Connect Wallet
            </Link>
            <Link
              href="/marketplace"
              className="px-8 py-4 border border-white/20 rounded-lg font-semibold hover:border-[#39FF14] transition-all"
            >
              Join Marketplace
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="card-glow p-6 rounded-lg">
              <Zap className="w-12 h-12 text-[#39FF14] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-400">Experience instant transactions across multiple blockchains</p>
            </div>
            <div className="card-glow p-6 rounded-lg">
              <Shield className="w-12 h-12 text-[#39FF14] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure & Trusted</h3>
              <p className="text-gray-400">Built with enterprise-grade security and smart contracts</p>
            </div>
            <div className="card-glow p-6 rounded-lg">
              <Globe className="w-12 h-12 text-[#39FF14] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Multi-Chain</h3>
              <p className="text-gray-400">Trade across XRP Ledger, EVM chains, and Solana</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">About RippleBids</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The next generation marketplace powered by XRPB tokens, enabling seamless trading across multiple
              blockchain networks
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6 neon-text">Why Choose RippleBids?</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-[#39FF14] rounded-full flex items-center justify-center mt-1">
                    <span className="text-black text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Multi-Chain Support</h4>
                    <p className="text-gray-400">Trade on XRP Ledger, XRPL-EVM, and Solana networks</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-[#39FF14] rounded-full flex items-center justify-center mt-1">
                    <span className="text-black text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">XRPB Token Utility</h4>
                    <p className="text-gray-400">Use XRPB for purchases, staking, and premium features</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-[#39FF14] rounded-full flex items-center justify-center mt-1">
                    <span className="text-black text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Membership Rewards</h4>
                    <p className="text-gray-400">Unlock exclusive benefits and lower fees</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-glow p-8 rounded-lg">
              <Coins className="w-16 h-16 text-[#39FF14] mx-auto mb-6" />
              <h3 className="text-xl font-bold text-center mb-4">XRPB Token Info</h3>
              <div className="space-y-3 text-center">
                <p>
                  <span className="text-[#39FF14]">Total Supply:</span> 1,000,000,000 XRPB
                </p>
                <p>
                  <span className="text-[#39FF14]">Current Price:</span> $0.0025
                </p>
                <p>
                  <span className="text-[#39FF14]">Market Cap:</span> $2,500,000
                </p>
                <p>
                  <span className="text-[#39FF14]">Holders:</span> 15,847
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-gray-300">Get started in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#39FF14] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Connect Wallet</h3>
              <p className="text-gray-400">Connect your XUMM, MetaMask, or Phantom wallet to get started</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#39FF14] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Claim or Buy XRPB</h3>
              <p className="text-gray-400">Get your XRPB tokens through our airdrop or purchase them directly</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#39FF14] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Start Bidding</h3>
              <p className="text-gray-400">Browse the marketplace and start bidding on exclusive items</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/marketplace"
              className="inline-flex items-center px-8 py-4 bg-[#39FF14] text-black rounded-lg font-semibold hover:neon-glow transition-all"
            >
              Explore Marketplace
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
