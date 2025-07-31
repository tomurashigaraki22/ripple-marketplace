"use client"

import { useState, useEffect } from 'react'
import { useXRPL } from '../context/XRPLContext'
import { useMetamask } from '../context/MetamaskContext'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui'
import { Wallet, Copy, Globe, CheckCircle, AlertCircle, ExternalLink, TrendingUp } from 'lucide-react'
import { WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

export default function WalletPage() {
  // XRPL Context
  const {
    xrpWalletAddress,
    xrplWallet,
    connectXrpWallet,
    disconnectXrpWallet,
  } = useXRPL()

  const endpoint = clusterApiUrl('mainnet-beta');
  // Only include Solflare wallet adapter
  const wallets = [
    new SolflareWalletAdapter(),
  ];

  // Metamask Context
  const {
    metamaskWalletAddress,
    evmWallet,
    isConnected,
    connecting,
    connectMetamaskWallet,
    disconnectMetamaskWallet,
  } = useMetamask()

  // Solana Wallet Adapter
  const { publicKey, connected: phantomConnected, connecting: phantomConnecting } = useWallet()
  const { connection } = useConnection()
  
  const phantomWalletAddress = publicKey?.toString()
  const [isLoading, setIsLoading] = useState(false)

  const wallets2 = [
    {
      name: "XAMAN",
      chain: "XRP Ledger",
      icon: "🔷",
      address: xrpWalletAddress,
      connected: !!xrpWalletAddress,
      connectFn: connectXrpWallet,
      disconnectFn: disconnectXrpWallet,
      connecting: false,
      description: "Connect to XRP Ledger for XRPB transactions",
      color: "from-blue-500 to-cyan-500",
      token: "XRPB"
    },
    {
      name: "MetaMask",
      chain: "XRPL-EVM",
      icon: "🦊",
      address: metamaskWalletAddress,
      connected: !!metamaskWalletAddress,
      connectFn: connectMetamaskWallet,
      disconnectFn: disconnectMetamaskWallet,
      connecting: connecting,
      description: "Access XRPL EVM Sidechain for XRPB transactions",
      color: "from-orange-500 to-amber-500",
      token: "XRPB"
    },
    {
      name: "Solflare",
      chain: "Solana",
      icon: "☀️",
      address: phantomWalletAddress,
      connected: phantomConnected,
      connectFn: null,
      disconnectFn: null,
      connecting: phantomConnecting,
      description: "Connect to Solana for XRPB-SOL transactions",
      color: "from-purple-500 to-pink-500",
      token: "XRPB-SOL"
    },
  ]

  const handleConnect = async (wallet) => {
    try {
      console.log("🔗 Attempting to connect:", wallet.name)
      if (wallet.connectFn) {
        setIsLoading(true)
        await wallet.connectFn()
        console.log("✅ Connection successful for:", wallet.name)
      }
    } catch (error) {
      console.error(`❌ Failed to connect ${wallet.name}:`, error)
      alert(`Failed to connect ${wallet.name}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async (wallet) => {
    try {
      console.log("🔌 Disconnecting:", wallet.name)
      setIsLoading(true)
      await wallet.disconnectFn()
      console.log("✅ Disconnection successful for:", wallet.name)
    } catch (error) {
      console.error(`❌ Failed to disconnect ${wallet.name}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address)
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-[#39FF14] text-black px-4 py-2 rounded-lg font-medium z-50 animate-bounce'
    notification.textContent = 'Address copied!'
    document.body.appendChild(notification)
    setTimeout(() => document.body.removeChild(notification), 2000)
  }

  const connectedWallets = wallets2.filter(w => w.connected)
  const hasConnectedWallet = connectedWallets.length > 0

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Enhanced Animated Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
                {/* Floating particles */}
                {[...Array(20)].map((_, i) => (
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
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
              </div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
              {/* Enhanced Header */}
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#39FF14] to-emerald-400 rounded-full mb-6 shadow-lg shadow-[#39FF14]/25">
                  <Wallet className="w-10 h-10 text-black" />
                </div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-[#39FF14] to-white bg-clip-text text-transparent">
                  Multi-Chain Wallet Hub
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                  Connect your preferred wallets to access the RippleBids marketplace across multiple blockchains
                </p>
              </div>

              {/* Connected Wallets Overview */}
              {hasConnectedWallet && (
                <div className="bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-xl border border-[#39FF14]/30 rounded-3xl p-8 mb-12 shadow-2xl shadow-[#39FF14]/10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-8 h-8 text-[#39FF14]" />
                      <h2 className="text-3xl font-bold text-white">Wallet Overview</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Connected Wallets */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-[#39FF14]" />
                        <span>Connected Wallets ({connectedWallets.length})</span>
                      </h3>
                      {connectedWallets.map((wallet) => (
                        <div key={wallet.name} className="group p-6 rounded-2xl bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700/50 hover:border-[#39FF14]/30 transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="text-3xl">{wallet.icon}</div>
                              <div>
                                <p className="text-white font-semibold text-lg">{wallet.name}</p>
                                <p className="text-sm text-gray-400">{wallet.chain}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDisconnect(wallet)}
                              disabled={isLoading}
                              className="px-4 py-2 text-sm border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/20 transition-all duration-300 disabled:opacity-50"
                            >
                              {isLoading ? 'Disconnecting...' : 'Disconnect'}
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-400 text-sm">Address:</span>
                              <span className="font-mono text-sm text-[#39FF14] bg-[#39FF14]/10 px-3 py-1 rounded-lg">
                                {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
                              </span>
                            </div>
                            <button
                              onClick={() => copyAddress(wallet.address)}
                              className="text-[#39FF14] hover:text-[#39FF14]/80 transition-colors p-2 hover:bg-[#39FF14]/10 rounded-lg"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Supported Tokens */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-4">Supported Tokens</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {connectedWallets.map((wallet) => (
                          <div key={wallet.name} className="p-6 rounded-2xl bg-gradient-to-br from-[#39FF14]/20 to-emerald-400/20 border border-[#39FF14]/30 hover:shadow-lg hover:shadow-[#39FF14]/20 transition-all duration-300">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-lg font-bold text-[#39FF14]">{wallet.token}</p>
                                <p className="text-sm text-gray-300">{wallet.chain}</p>
                              </div>
                              <div className="text-2xl">{wallet.icon}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Wallet Connection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {wallets2.map((wallet) => (
                  <div
                    key={wallet.name}
                    className={`group relative p-8 rounded-3xl border transition-all duration-500 transform hover:scale-105 ${
                      wallet.connected
                        ? 'bg-gradient-to-br from-[#39FF14]/10 via-emerald-500/5 to-[#39FF14]/10 border-[#39FF14]/50 shadow-[0_0_40px_rgba(57,255,20,0.15)]'
                        : 'bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 border-gray-700/50 hover:border-[#39FF14]/30 hover:shadow-[0_0_30px_rgba(57,255,20,0.1)]'
                    }`}
                  >
                    {/* Connection Status Indicator */}
                    {wallet.connected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#39FF14] rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-4 h-4 text-black" />
                      </div>
                    )}

                    <div className="text-center">
                      <div className={`text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                        {wallet.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{wallet.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{wallet.chain}</p>
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">{wallet.description}</p>
                      <div className="mb-6 p-3 bg-[#39FF14]/10 rounded-xl border border-[#39FF14]/30">
                        <p className="text-sm font-semibold text-[#39FF14]">Token: {wallet.token}</p>
                      </div>
                      
                      {wallet.connected ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center space-x-2 text-[#39FF14]">
                            <div className="w-3 h-3 bg-[#39FF14] rounded-full animate-pulse" />
                            <span className="text-sm font-medium">Connected</span>
                          </div>
                          <div className="p-3 bg-gray-900/50 rounded-xl">
                            <p className="text-xs font-mono text-gray-300">
                              {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDisconnect(wallet)}
                            disabled={isLoading}
                            className="w-full px-6 py-3 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/20 transition-all duration-300 disabled:opacity-50 font-medium"
                          >
                            {isLoading ? 'Disconnecting...' : 'Disconnect'}
                          </button>
                        </div>
                      ) : (
                        wallet.name === "Solflare" ? (
                          <div className='flex flex-col items-center justify-center space-y-4'>
                            <div className="wallet-adapter-button-trigger-wrapper">
                              <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 !border-0 !rounded-xl !font-medium !px-8 !py-3 hover:!shadow-lg hover:!shadow-purple-500/25 !transition-all !duration-300" />
                            </div>
                            {phantomConnected && (
                              <WalletDisconnectButton className="!bg-red-500/20 !border !border-red-500/50 !text-red-400 !rounded-xl !font-medium !px-6 !py-2 hover:!bg-red-500/30 !transition-all !duration-300" />
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnect(wallet)}
                            disabled={wallet.connecting || isLoading}
                            className={`w-full px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                              wallet.connecting || isLoading
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : `bg-gradient-to-r ${wallet.color} text-white hover:shadow-[0_0_25px_rgba(57,255,20,0.3)] shadow-lg`
                            }`}
                          >
                            {wallet.connecting || isLoading ? (
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                <span>Connecting...</span>
                              </div>
                            ) : (
                              'Connect Wallet'
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Instructions */}
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-6">Getting Started</h2>
                <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Connect your preferred wallets to unlock cross-chain XRPB trading on RippleBids
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      step: "1",
                      title: "Choose Your Chain",
                      description: "Select from XRPL (XRPB), XRPL EVM (XRPB), or Solana (XRPB-SOL) based on your preferred blockchain",
                      icon: <Wallet className="w-8 h-8" />
                    },
                    {
                      step: "2",
                      title: "Secure Connection",
                      description: "Authorize the connection through your wallet's secure interface - your private keys never leave your device",
                      icon: <CheckCircle className="w-8 h-8" />
                    },
                    {
                      step: "3",
                      title: "Start Trading",
                      description: "Access the marketplace and trade with XRPB tokens across multiple blockchains with your connected wallets",
                      icon: <ExternalLink className="w-8 h-8" />
                    }
                  ].map((item, index) => (
                    <div key={index} className="group p-8 bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 rounded-2xl border border-gray-700/50 hover:border-[#39FF14]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#39FF14]/10">
                      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#39FF14] to-emerald-400 rounded-full mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                        <span className="text-black font-bold text-xl">{item.step}</span>
                      </div>
                      <div className="text-[#39FF14] mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <h3 className="font-bold text-white mb-4 text-xl">{item.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/30 rounded-2xl p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-blue-400 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Security First</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Your wallet connections are secure and private. RippleBids never stores your private keys or seed phrases. 
                  Always verify you're on the official RippleBids domain before connecting your wallets.
                </p>
              </div>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
