"use client"

import { useState, useEffect } from 'react'
import Link from "next/link"
import { Check, Star, Crown, Zap, Sparkles, ArrowRight, Wallet, X, AlertCircle, CheckCircle, Loader2, CreditCard, DollarSign, Store, ShoppingBag } from "lucide-react"
import { useXRPL } from '../context/XRPLContext'
import { useMetamask } from '../context/MetamaskContext'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { sendSolanaXRPBPayment, sendXRPLXRPBPayment, sendXRPLEvmXRPBPayment, getXRPBPriceInUSD, calculateXRPBAmount } from '../constructs/payments/signAndPay'
import { ethers } from 'ethers'
import { Clock } from 'lucide-react'; // or your preferred icon library

export default function MembershipPage() {
  // Wallet contexts
  const { xrpWalletAddress, xrplWallet, xrpbBalance } = useXRPL()
  const { metamaskWalletAddress, isConnected: metamaskConnected, isXRPLEVM, getSigner } = useMetamask()
  const { publicKey, connected: solanaConnected, wallet } = useWallet()
  const { connection } = useConnection()

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState(null)
  const [connectedWallets, setConnectedWallets] = useState([])
  
  // Subscription status states
  const [currentMembership, setCurrentMembership] = useState(null)
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false)
  const [membershipLoading, setMembershipLoading] = useState(true)
  
  // XRPB price and conversion states
  const [xrpbPrice, setXrpbPrice] = useState(3.10) // Default $0.10 per XRPB
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)

  // Update connected wallets with XRPB token info
  useEffect(() => {
    const wallets = []
    if (xrpWalletAddress) {
      wallets.push({
        type: 'xrpl',
        name: 'XAMAN (XRPL)',
        address: xrpWalletAddress,
        icon: '🔷',
        currency: 'XRPB',
        balance: xrpbBalance,
        network: 'XRPL Mainnet'
      })
    }
    if (metamaskConnected && metamaskWalletAddress) {
      wallets.push({
        type: 'xrpl_evm',
        name: 'MetaMask (XRPL EVM)',
        address: metamaskWalletAddress,
        icon: '🦊',
        currency: 'XRPB',
        network: isXRPLEVM ? 'XRPL EVM Mainnet' : 'Wrong Network',
        needsSwitch: !isXRPLEVM
      })
    }
    if (solanaConnected && publicKey) {
      wallets.push({
        type: 'solana',
        name: 'Phantom (Solana)',
        address: publicKey.toString(),
        icon: '☀️',
        currency: 'XRPB-SOL',
        network: 'Solana Mainnet'
      })
    }
    setConnectedWallets(wallets)
  }, [xrpWalletAddress, xrpbBalance, metamaskConnected, metamaskWalletAddress, isXRPLEVM, solanaConnected, publicKey])

  // Function to calculate XRPB amount from USD
  // const calculateXRPBAmount = (usdAmount) => {
  //   return Math.ceil(usdAmount / xrpbPrice) // Round up to ensure sufficient payment
  // }

  // Add this new function after calculateXRPBAmount
  const getPaymentAmount = (tier, walletType) => {
    if (!tier || tier.priceUSD === 0) return 0
    return calculateXRPBAmount(tier.priceUSD, xrpbPrice)
  }



  // Fetch XRPB price on component mount
  useEffect(() => {
    fetchXRPBPrice()
  }, [])




  // Fetch membership data
  useEffect(() => {
    fetchCurrentMembership()
    fetchMembershipTiers()
  }, [])

  const fetchCurrentMembership = async () => {
    try {
      setMembershipLoading(true)
      const token = localStorage.getItem('authToken')
      if (!token) {
        setMembershipLoading(false)
        return
      }
  
      const response = await fetch('/api/membership/current', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
  
      if (response.ok) {
        const data = await response.json()
        setCurrentMembership(data.currentMembership)
        const isActive = data.currentMembership && 
                      data.currentMembership.membership &&
                      Boolean(data.currentMembership.membership.isActive) &&
                      (data.currentMembership.tier.name.toLowerCase() === 'pro' || 
                       data.currentMembership.tier.name.toLowerCase() === 'premium')
        setIsSubscriptionActive(isActive)
        console.log('Current membership:', data.currentMembership)
      }
    } catch (error) {
      console.error('Error fetching current membership:', error)
    } finally {
      setMembershipLoading(false)
    }
  }
  


  const handleUpgrade = (tier) => {
    if (tier.disabled) return
    
    if (connectedWallets.length === 0) {
      alert('Please connect a wallet first!')
      return
    }
    
    setSelectedTier(tier)
    setShowPaymentModal(true)
    setPaymentResult(null)
  }

  // Function to calculate XRPB amount from USD using dynamic pricing
  const calculateXRPBAmountDynamic = async (usdAmount) => {
    try {
      const currentPrice = await getXRPBPriceInUSD();
      if (currentPrice) {
        setXrpbPrice(currentPrice);
        return calculateXRPBAmount(usdAmount, currentPrice);
      } else {
        // Fallback to static price if API fails
        console.warn('Using fallback XRPB price');
        return calculateXRPBAmount(usdAmount, xrpbPrice);
      }
    } catch (error) {
      console.error('Error calculating XRPB amount:', error);
      // Fallback to static calculation
      return Math.ceil(usdAmount / xrpbPrice);
    }
  };

  // Function to fetch XRPB price with dynamic pricing
  const fetchXRPBPrice = async () => {
    setIsLoadingPrice(true);
    try {
      const dynamicPrice = await getXRPBPriceInUSD();
      if (dynamicPrice) {
        setXrpbPrice(dynamicPrice);
        console.log('✅ Dynamic XRPB price fetched:', dynamicPrice);
      } else {
        // Fallback price
        setXrpbPrice(3.10);
        console.warn('⚠️ Using fallback XRPB price: $3.10');
      }
    } catch (error) {
      console.error('Error fetching XRPB price:', error);
      setXrpbPrice(3.10); // Fallback price
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Update tiers to use dynamic calculation
  const tiers = [
    {
      name: "Free",
      price: "Free",
      priceUSD: 0,
      priceXRPB: 0,
      icon: <Star className="w-8 h-8" />,
      features: [
        "Basic marketplace access",
        "Standard transaction fees (3.5%)",
        "Community support",
        "Basic profile features",
        "Limited daily transactions (10)",
      ],
      buttonText: "Current Plan",
      buttonClass: "bg-black/40 backdrop-blur-xl border border-gray-600 text-gray-400 cursor-not-allowed",
      popular: false,
      disabled: true
    },
    {
      name: "Pro",
      price: "$25/month",
      priceUSD: 25,
      priceXRPB: Math.ceil(25 / xrpbPrice), // Dynamic calculation
      icon: <Zap className="w-8 h-8" />,
      features: [
        "All Free features",
        "Reduced fees (2.5%)",
        "Priority customer support",
        "Advanced analytics",
        "Unlimited transactions",
        "Early access to new features",
        "Custom profile themes",
      ],
      buttonText: "Upgrade to Pro",
      buttonClass: "bg-gradient-to-r from-[#39FF14] to-emerald-400 text-black hover:shadow-[0_0_40px_rgba(57,255,20,0.6)] transform hover:scale-105",
      popular: true,
      disabled: false
    },
    {
      name: "Premium",
      price: "$50/month",
      priceUSD: 50,
      priceXRPB: Math.ceil(50 / xrpbPrice), // Dynamic calculation
      icon: <Crown className="w-8 h-8" />,
      features: [
        "All Pro features",
        "Lowest fees (1.5%)",
        "Dedicated account manager",
        "Exclusive drops access",
        "White-label solutions",
        "API access",
        "Custom integrations",
      ],
      buttonText: "Upgrade to Premium",
      buttonClass: "bg-black/40 backdrop-blur-xl border-2 border-[#39FF14]/50 text-[#39FF14] hover:border-[#39FF14] hover:shadow-[0_0_30px_rgba(57,255,20,0.3)] transform hover:scale-105",
      popular: false,
      disabled: false
    },
  ]

  const benefits = [
    {
      title: "Lower Transaction Fees",
      description: "Save money on every transaction with reduced fees for Pro and Premium members",
      icon: <Zap className="w-8 h-8" />,
    },
    {
      title: "Exclusive NFT Drops",
      description: "Get early access to limited edition NFTs and exclusive marketplace items",
      icon: <Sparkles className="w-8 h-8" />,
    },
    {
      title: "Priority Support",
      description: "24/7 priority customer support with dedicated account management",
      icon: <Crown className="w-8 h-8" />,
    },
  ]

  // Fetch membership data

  
  const fetchMembershipTiers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return
  
      const response = await fetch('/api/membership/tiers-with-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
  
      if (response.ok) {
        const data = await response.json()
        console.log('Membership tiers:', data.membershipTiers)
      }
    } catch (error) {
      console.error('Error fetching membership tiers:', error)
    }
  }



  const handlePayment = async () => {
    if (!selectedTier || !paymentMethod) return;

    setIsProcessing(true);
    setPaymentResult(null);

    try {
      let result;
      // Calculate XRPB amount using dynamic pricing
      const xrpbAmount = await calculateXRPBAmountDynamic(selectedTier.priceUSD);

      // Check if wallet needs network switch
      if (paymentMethod.needsSwitch) {
        await switchToXRPLEVM()
        setPaymentResult({
          success: false,
          pending: true,
          message: 'Please switch to XRPL EVM network and try again.'
        })
        setIsProcessing(false)
        return
      }

      console.log('🚀 Starting payment with:', {
        tier: selectedTier.name,
        method: paymentMethod.type,
        amount: xrpbAmount,
        usdAmount: selectedTier.priceUSD
      })

      switch (paymentMethod.type) {
        // At the top of the component, get the wallet object

        
        // In the handlePayment function, around line 325, replace the solana case with:
        case 'solana':
        // Use the wallet object directly from useWallet hook
        
        // Validate wallet before proceeding
        if (!solanaConnected) {
          throw new Error('Please connect your Phantom wallet first');
        }
        
        // Create a wallet object with publicKey included
        const walletWithPublicKey = {
        ...wallet,
        publicKey: publicKey
        };
        
        result = await sendSolanaXRPBPayment(
        walletWithPublicKey,
        2,
        connection
        );
        break;

        case 'xrpl':
          setPaymentResult({
            success: false,
            pending: true,
            message: 'Please complete the XRPB payment in XAMAN app. This may take a few minutes...'
          });
          
          result = await sendXRPLXRPBPayment(
            { account: xrpWalletAddress },
            1
          );
          break;

        case 'xrpl_evm':
          if (!getSigner) {
            throw new Error('MetaMask signer not available');
          }
          console.log('🦊 Using Wagmi signer for XRPL EVM payment...');
          console.log('💰 XRPB Amount calculated:', xrpbAmount, 'for $', selectedTier.priceUSD);
          result = await sendXRPLEvmXRPBPayment(getSigner, xrpbAmount);
          break;

        default:
          throw new Error('Unsupported payment method');
      }

      console.log('💰 Payment result:', result)
      setPaymentResult(result)
      
      if (result.success) {
        const membershipData = {
          tier: selectedTier.name,
          paymentMethod: paymentMethod.name,
          amountUSD: selectedTier.priceUSD,
          amountXRPB: xrpbAmount,
          currency: paymentMethod.currency,
          timestamp: new Date().toISOString(),
          txHash: result.signature || result.txHash,
          paymentUrl: result.paymentUrl,
          verified: result.paymentData?.verified,
          network: paymentMethod.network
        }
        localStorage.setItem('membership_upgrade', JSON.stringify(membershipData))
        
        console.log('✅ Membership upgrade completed:', membershipData)
      }

    } catch (error) {
      console.error('❌ Payment failed with error:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        paymentMethod: paymentMethod?.type,
        tier: selectedTier?.name
      })
      setPaymentResult({
        success: false,
        error: error.message
      })
    } finally {
      setIsProcessing(false)
    }
  };

  const closeModal = () => {
    setShowPaymentModal(false)
    setSelectedTier(null)
    setPaymentMethod(null)
    setPaymentResult(null)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(57,255,20,0.1),transparent_50%)] animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#39FF14] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 mt-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white via-[#39FF14] to-white bg-clip-text text-transparent leading-tight">
                XRPB Membership Tiers
              </h1>
              <div className="flex justify-center mb-6">
                <Sparkles className="w-8 h-8 text-[#39FF14] animate-pulse" />
              </div>
            </div>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-light leading-relaxed">
              Affordable USD pricing, paid with <span className="text-[#39FF14] font-semibold">XRPB tokens</span> across multiple chains
            </p>
            
            {/* XRPB Price Display */}
            <div className="mt-6 flex justify-center">
              <div className="bg-black/40 backdrop-blur-xl border border-[#39FF14]/30 rounded-2xl px-6 py-3">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-[#39FF14]" />
                  <span className="text-white font-medium">
                    XRPB Price: 
                    {isLoadingPrice ? (
                      <Loader2 className="w-4 h-4 animate-spin inline ml-2" />
                    ) : (
                      <span className="text-[#39FF14] font-bold ml-1">${xrpbPrice.toFixed(6)}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Active Subscription Status */}
            {!membershipLoading && isSubscriptionActive && currentMembership && (
              <div className="mt-8 flex justify-center">
                <div className="bg-gradient-to-r from-[#39FF14]/20 to-emerald-400/20 backdrop-blur-xl border-2 border-[#39FF14]/60 rounded-3xl p-8 max-w-2xl w-full">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14] to-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(57,255,20,0.5)]">
                        {currentMembership.tier.name === 'Premium' ? (
                          <Crown className="w-8 h-8 text-black" />
                        ) : (
                          <Zap className="w-8 h-8 text-black" />
                        )}
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      🎉 {currentMembership.tier.name.toUpperCase()} Member Active!
                    </h2>
                    <p className="text-[#39FF14] font-semibold mb-6">
                      Subscription Status: {Boolean(currentMembership.membership?.isActive) ? 'Active' : 'Inactive'}
                      {currentMembership.membership?.expiresAt && (
                        <span className="block text-sm text-gray-300 mt-1">
                          Expires: {new Date(currentMembership.membership.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                    
                    <Link
                      href="/storefront/login"
                      className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#39FF14] to-emerald-400 text-black rounded-2xl font-bold text-lg hover:shadow-[0_0_50px_rgba(57,255,20,0.8)] transition-all duration-300 transform hover:scale-110 overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-[#39FF14] to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></span>
                      <span className="relative flex items-center gap-3">
                        <Store className="w-6 h-6" />
                        Access Your Storefront
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    </Link>
                    
                    <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-300">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-[#39FF14]" />
                        <span>Reduced Fees Active</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="w-4 h-4 text-[#39FF14]" />
                        <span>Storefront Access</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Connected Wallets Status */}
            {connectedWallets.length > 0 && (
              <div className={`${isSubscriptionActive ? 'mt-6' : 'mt-8'} flex justify-center`}>
                <div className="bg-black/40 backdrop-blur-xl border border-[#39FF14]/30 rounded-2xl px-6 py-3">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="w-5 h-5 text-[#39FF14]" />
                    <span className="text-white font-medium">
                      {connectedWallets.length} XRPB Wallet{connectedWallets.length > 1 ? 's' : ''} Connected
                    </span>
                    <div className="flex space-x-2">
                      {connectedWallets.map((wallet, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          <span className="text-lg">{wallet.icon}</span>
                          <span className="text-xs text-[#39FF14]">{wallet.currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`group relative p-8 bg-black/40 backdrop-blur-xl border rounded-3xl transition-all duration-500 transform hover:scale-105 ${
                  tier.popular 
                    ? "border-[#39FF14]/60 hover:shadow-[0_0_50px_rgba(57,255,20,0.3)] scale-105" 
                    : "border-[#39FF14]/20 hover:border-[#39FF14]/40 hover:shadow-[0_0_30px_rgba(57,255,20,0.2)]"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#39FF14] to-emerald-400 text-black px-6 py-2 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(57,255,20,0.4)]">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                      tier.popular 
                        ? "bg-gradient-to-br from-[#39FF14] to-emerald-400 text-black shadow-[0_0_30px_rgba(57,255,20,0.5)]" 
                        : "bg-gradient-to-br from-[#39FF14]/20 to-emerald-400/20 text-[#39FF14] group-hover:shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                    }`}>
                      {tier.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-[#39FF14] transition-colors duration-300">{tier.name}</h3>
                    <div className="text-3xl font-black bg-gradient-to-r from-[#39FF14] to-emerald-400 bg-clip-text text-transparent mb-2">{tier.price}</div>
                    {tier.priceUSD > 0 && (
                      <div className="text-sm text-gray-400">
                        ≈ {tier.priceXRPB} XRPB tokens
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 mb-8">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-gradient-to-br from-[#39FF14] to-emerald-400 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                        <span className="text-gray-300 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleUpgrade(tier)}
                    disabled={tier.disabled}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${tier.buttonClass}`}
                  >
                    {tier.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="relative mb-20">
            <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/10 to-emerald-400/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-black/60 backdrop-blur-xl border border-[#39FF14]/30 p-12 rounded-3xl">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-[#39FF14] bg-clip-text text-transparent">Membership Benefits</h2>
                <p className="text-xl text-gray-300 leading-relaxed">Discover what makes RippleBids membership special</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="group text-center p-6 bg-black/40 backdrop-blur-xl border border-[#39FF14]/20 rounded-2xl hover:border-[#39FF14]/40 transition-all duration-300 transform hover:scale-105">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14]/20 to-emerald-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#39FF14] group-hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-300">
                      {benefit.icon}
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-white group-hover:text-[#39FF14] transition-colors duration-300">{benefit.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Connect Wallet CTA */}
          {connectedWallets.length === 0 && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/10 to-emerald-400/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-black/60 backdrop-blur-xl border border-[#39FF14]/30 p-12 rounded-3xl">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-[#39FF14] mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-white to-[#39FF14] bg-clip-text text-transparent">Connect Your Wallet</h2>
                  <p className="text-xl text-gray-300 mb-8">Connect a wallet to upgrade your membership and unlock premium features</p>
                  <Link
                    href="/wallet"
                    className="group relative inline-flex items-center px-12 py-6 bg-gradient-to-r from-[#39FF14] to-emerald-400 text-black rounded-2xl font-bold text-xl hover:shadow-[0_0_50px_rgba(57,255,20,0.6)] transition-all duration-300 transform hover:scale-105 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#39FF14] to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></span>
                    <span className="relative flex items-center gap-3">
                      <Wallet className="w-6 h-6" />
                      Connect Wallet
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/90 backdrop-blur-xl border border-[#39FF14]/30 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-[#39FF14] bg-clip-text text-transparent">
                Upgrade to {selectedTier?.name}
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!paymentResult ? (
              <>
                {/* Payment Method Selection */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-[#39FF14]" />
                    Choose Payment Method
                  </h3>
                  <div className="grid gap-4">
                    {connectedWallets.map((wallet, index) => {
                      const amount = getPaymentAmount(selectedTier, wallet.type)
                      return (
                        <div
                          key={wallet.type}
                          onClick={() => setPaymentMethod(wallet)}
                          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                            paymentMethod?.type === wallet.type
                              ? 'border-[#39FF14] bg-[#39FF14]/10 shadow-[0_0_20px_rgba(57,255,20,0.3)]'
                              : 'border-gray-600 bg-black/40 hover:border-[#39FF14]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className="text-3xl">{wallet.icon}</span>
                              <div>
                                <p className="text-white font-semibold">{wallet.name}</p>
                                <p className="text-gray-400 text-sm font-mono">
                                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[#39FF14] font-bold text-lg">
                                {amount} {wallet.currency}
                              </p>
                              <p className="text-gray-400 text-sm">
                                ≈ ${selectedTier?.priceUSD} USD
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Payment Summary */}
                {paymentMethod && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-[#39FF14]/10 to-emerald-400/10 rounded-2xl border border-[#39FF14]/30">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-[#39FF14]" />
                      Payment Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Membership Tier:</span>
                        <span className="text-white font-semibold">{selectedTier?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Payment Method:</span>
                        <span className="text-white font-semibold">{paymentMethod.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Amount:</span>
                        <span className="text-[#39FF14] font-bold">
                          {getPaymentAmount(selectedTier, paymentMethod.type)} {paymentMethod.currency}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-600 pt-3">
                        <span className="text-gray-300">USD Equivalent:</span>
                        <span className="text-white font-semibold">${selectedTier?.priceUSD}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-4 px-6 bg-gray-600 text-white rounded-2xl font-semibold hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={!paymentMethod || isProcessing}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-[#39FF14] to-emerald-400 text-black rounded-2xl font-bold hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Payment'
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Payment Result */
              <div className="text-center">
                {paymentResult.success ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-[#39FF14] mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-[#39FF14] mb-4">Payment Successful!</h3>
                    <p className="text-gray-300 mb-6">
                      Your membership has been upgraded to {selectedTier?.name}.
                    </p>
                    <div className="bg-black/40 p-4 rounded-xl mb-6">
                      <p className="text-sm text-gray-400 mb-2">Transaction Hash:</p>
                      <p className="font-mono text-xs text-[#39FF14] break-all">
                        {paymentResult.signature || paymentResult.txHash}
                      </p>
                    </div>
                    {paymentResult.paymentData?.explorerUrl && (
                      <a
                        href={paymentResult.paymentData.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#39FF14] hover:underline text-sm"
                      >
                        View on Explorer →
                      </a>
                    )}
                  </>
                ) : (
              paymentResult.pending ? (
                  <>
                    <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-yellow-500 mb-4">Payment Pending</h3>
                    <p className="text-gray-300 mb-6">
                      Your payment is being processed. Please wait...
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-red-500 mb-4">Payment Failed</h3>
                    <p className="text-gray-300 mb-6">
                      {paymentResult.error || 'An error occurred during payment processing.'}
                    </p>
                  </>
                ))}
                <button
                  onClick={closeModal}
                  className="py-3 px-8 bg-gradient-to-r from-[#39FF14] to-emerald-400 text-black rounded-2xl font-bold hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] transition-all duration-300"
                >
                  Close
                </button>
              </div>
            )}
            {/* Payment Result Display */}
            {paymentResult && (
              <div className="mt-8 p-6 rounded-2xl border-2 transition-all duration-300 ${
                paymentResult.success 
                  ? 'border-[#39FF14] bg-[#39FF14]/10' 
                  : paymentResult.pending
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-red-500 bg-red-500/10'
              }">
                <div className="flex items-center space-x-3 mb-4">
                  {paymentResult.success ? (
                    <CheckCircle className="w-6 h-6 text-[#39FF14]" />
                  ) : paymentResult.pending ? (
                    <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                  <h3 className={`text-lg font-semibold ${
                    paymentResult.success 
                      ? 'text-[#39FF14]' 
                      : paymentResult.pending
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}>
                    {paymentResult.success 
                      ? 'Payment Successful!' 
                      : paymentResult.pending
                      ? 'Payment Pending'
                      : 'Payment Failed'
                    }
                  </h3>
                </div>
                
                {paymentResult.pending && paymentResult.message && (
                  <p className="text-yellow-400 mb-4">{paymentResult.message}</p>
                )}
                
                {paymentResult.success && (
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">
                      <span className="font-medium">Transaction:</span> 
                      <span className="font-mono ml-2">
                        {(paymentResult.signature || paymentResult.txHash)?.slice(0, 20)}...
                      </span>
                    </p>
                    {paymentResult.paymentData?.explorerUrl && (
                      <a 
                        href={paymentResult.paymentData.explorerUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-[#39FF14] hover:text-emerald-400 transition-colors"
                      >
                        View on Explorer
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </a>
                    )}
                  </div>
                )}
                
                {paymentResult.error && (
                  <p className="text-red-400">{paymentResult.error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}