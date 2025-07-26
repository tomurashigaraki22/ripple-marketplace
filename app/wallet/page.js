"use client"

import { useState, useEffect } from 'react'
import { useWallet2 } from '../context/WalletContext'
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui'
import { Wallet, Copy, Globe } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'

export default function WalletPage() {
  const {
    // XRPL/XUMM
    xrpWalletAddress,
    xrplWallet,
    xrpBalance,
    connectXrpWallet,
    disconnectXrpWallet,
    
    // MetaMask/EVM
    metamaskWalletAddress,
    evmWallet,
    isConnected,
    connecting,
    connectMetamaskWallet,
    disconnectMetamaskWallet,
    
    // Phantom/Solana (using wallet adapter)
    phantomWalletAddress,
    solanaWallet,
    solanaBalance,
    solanaConnected,
    solanaConnecting,
    disconnectPhantomWallet,
  } = useWallet2()

  const [balance, setBalance] = useState({
    xrpb: 1250.75,
    xrp: xrpBalance || 0,
    sol: solanaBalance || 0,
    eth: 0.5,
  })

  useEffect(() => {
    setBalance(prev => ({
      ...prev,
      xrp: xrpBalance || 0,
      sol: solanaBalance || 0,
    }))
  }, [xrpBalance, solanaBalance])
  const {connect} = useWallet()

  const wallets = [
    {
      name: "XUMM",
      chain: "XRP Ledger",
      icon: "🔷",
      address: xrpWalletAddress,
      connected: !!xrpWalletAddress,
      connectFn: connectXrpWallet,
      disconnectFn: disconnectXrpWallet,
    },
    {
      name: "MetaMask",
      chain: "XRPL-EVM",
      icon: "🦊",
      address: metamaskWalletAddress,
      connected: !!metamaskWalletAddress,
      connectFn: connectMetamaskWallet,
      disconnectFn: disconnectMetamaskWallet,
    },
    {
      name: "Phantom",
      chain: "Solana",
      icon: "👻",
      address: phantomWalletAddress,
      connected: solanaConnected,
      connectFn: connect, // Will use WalletMultiButton
      disconnectFn: disconnectPhantomWallet,
    },
  ]

  const handleConnect = async (wallet) => {
    try {
      console.log("Tried to connect: ", wallet)
      if (wallet.connectFn) {
        await wallet.connectFn()
      }
    } catch (error) {
      console.error(`Failed to connect ${wallet.name}:`, error)
      alert(`Failed to connect ${wallet.name}. Please try again.`)
    }
  }

  const handleDisconnect = async (wallet) => {
    try {
      await wallet.disconnectFn()
    } catch (error) {
      console.error(`Failed to disconnect ${wallet.name}:`, error)
    }
  }

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address)
    alert("Address copied to clipboard!")
  }

  const connectedWallets = wallets.filter(w => w.connected)
  const hasConnectedWallet = connectedWallets.length > 0

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#39FF14] rounded-full opacity-20 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-[#39FF14] to-white bg-clip-text text-transparent">
            Wallet Connection
          </h1>
          <p className="text-xl text-gray-300">Connect your wallet to start trading on RippleBids</p>
        </div>

        {/* Connected Wallet Status */}
        {hasConnectedWallet && (
          <div className="bg-black/40 backdrop-blur-xl border border-[#39FF14]/30 rounded-2xl p-6 mb-8 shadow-2xl shadow-[#39FF14]/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-[#39FF14] flex items-center space-x-2">
                <Wallet className="w-6 h-6" />
                <span>Connected Wallets</span>
              </h2>
              <div className="flex items-center space-x-2 text-[#39FF14]">
                <div className="w-3 h-3 bg-[#39FF14] rounded-full animate-pulse" />
                <span className="text-sm font-medium">{connectedWallets.length} Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-white mb-3">Wallet Information</h3>
                {connectedWallets.map((wallet) => (
                  <div key={wallet.name} className="p-4 rounded-xl bg-gray-900/50 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{wallet.icon}</span>
                        <div>
                          <p className="text-white font-medium">{wallet.name}</p>
                          <p className="text-sm text-gray-400">{wallet.chain}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDisconnect(wallet)}
                        className="px-3 py-1 text-xs border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition-all duration-300"
                      >
                        Disconnect
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">Address:</span>
                      <span className="font-mono text-sm text-[#39FF14] bg-[#39FF14]/10 px-2 py-1 rounded">
                        {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
                      </span>
                      <button
                        onClick={() => copyAddress(wallet.address)}
                        className="text-[#39FF14] hover:text-[#39FF14]/80 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-white mb-3">Balances</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-900/50">
                    <span className="text-gray-300">XRPB:</span>
                    <span className="text-[#39FF14] font-semibold text-lg">{balance.xrpb.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-900/50">
                    <span className="text-gray-300">XRP:</span>
                    <span className="text-white font-medium">{balance.xrp.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-900/50">
                    <span className="text-gray-300">SOL:</span>
                    <span className="text-white font-medium">{balance.sol.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-900/50">
                    <span className="text-gray-300">ETH:</span>
                    <span className="text-white font-medium">{balance.eth.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {wallets.map((wallet) => (
            <div 
              key={wallet.name} 
              className={`group relative p-6 rounded-2xl transition-all duration-300 overflow-hidden ${
                wallet.connected 
                  ? "bg-gradient-to-br from-[#39FF14]/20 to-cyan-500/20 border-2 border-[#39FF14]/50 shadow-2xl shadow-[#39FF14]/20" 
                  : "bg-black/40 backdrop-blur-xl border border-gray-600/50 hover:border-[#39FF14]/50 hover:bg-[#39FF14]/5"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative text-center">
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {wallet.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{wallet.name}</h3>
                <p className="text-gray-400 mb-6">{wallet.chain}</p>

                {wallet.connected ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2 text-[#39FF14]">
                      <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
                      <span className="font-medium">Connected</span>
                    </div>
                    <div className="text-sm text-gray-400 font-mono bg-gray-900/50 px-3 py-2 rounded-lg">
                      {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                    </div>
                    {wallet.name === 'Phantom' ? (
                      <div className="flex justify-center">
                        <WalletDisconnectButton className="!bg-red-600 hover:!bg-red-700 !text-white !border-0 !rounded-xl !py-2 !px-4 !text-sm" />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDisconnect(wallet)}
                        className="w-full py-3 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/20 hover:border-red-500 transition-all duration-300"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    
                      <button
                        onClick={async () => {
                          if (wallet.name === "Phantom"){
                            await connect()
                          }
                          else{
                            handleConnect(wallet)
                          }
                        }}
                        disabled={connecting && wallet.name === 'MetaMask'}
                        className="w-full py-3 bg-gradient-to-r from-[#39FF14]/20 to-cyan-500/20 border border-[#39FF14]/50 text-[#39FF14] rounded-xl hover:from-[#39FF14]/30 hover:to-cyan-500/30 hover:border-[#39FF14] hover:shadow-lg hover:shadow-[#39FF14]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {connecting && wallet.name === 'MetaMask' ? 'Connecting...' : 'Connect'}
                      </button>
                    
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Chain Switcher */}
        <div className="bg-black/40 backdrop-blur-xl border border-[#39FF14]/30 rounded-2xl p-6 shadow-2xl shadow-[#39FF14]/10">
          <h2 className="text-2xl font-semibold mb-6 text-white flex items-center space-x-2">
            <Globe className="w-6 h-6 text-[#39FF14]" />
            <span>Active Chains</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="group p-6 border-2 border-[#39FF14] rounded-xl bg-[#39FF14]/10 hover:bg-[#39FF14]/20 transition-all duration-300">
              <div className="text-center">
                <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">🔷</div>
                <div className="font-semibold text-white mb-1">XRP Ledger</div>
                <div className="text-sm text-[#39FF14] font-medium">Active</div>
              </div>
            </button>
            <button className="group p-6 border border-gray-600 rounded-xl hover:border-[#39FF14] hover:bg-[#39FF14]/5 transition-all duration-300">
              <div className="text-center">
                <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">⚡</div>
                <div className="font-semibold text-white mb-1">XRPL-EVM</div>
                <div className="text-sm text-gray-400 group-hover:text-[#39FF14] transition-colors duration-300">Switch</div>
              </div>
            </button>
            <button className="group p-6 border border-gray-600 rounded-xl hover:border-[#39FF14] hover:bg-[#39FF14]/5 transition-all duration-300">
              <div className="text-center">
                <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">🌟</div>
                <div className="font-semibold text-white mb-1">Solana</div>
                <div className="text-sm text-gray-400 group-hover:text-[#39FF14] transition-colors duration-300">Switch</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
