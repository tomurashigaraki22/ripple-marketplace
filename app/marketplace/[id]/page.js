"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Heart, Share2, Flag, Clock, Users, Truck, Package, Wallet, CreditCard, MapPin, Shield, DollarSign, Loader2, Store } from "lucide-react"
import { useXRPL } from '../../context/XRPLContext'
import { useMetamask } from '../../context/MetamaskContext'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { createEscrowPayment } from '../../constructs/payments/escrowPayment.js'
import { getXRPBPriceInUSD, calculateXRPBAmount, sendSolanaXRPBPayment, sendXRPLXRPBPayment, sendXRPLEvmXRPBPayment, getAllXRPBPrices } from '../../constructs/payments/buyThings'
import { useAuth } from "@/app/context/AuthContext"

const formatErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred. Please try again.';
  
  const errorStr = error.toLowerCase();
  
  // Handle specific error types
  if (errorStr.includes('missing revert data') || errorStr.includes('call_exception')) {
    return 'Transaction failed. This could be due to insufficient balance, network issues, or gas problems. Please check your wallet balance and try again.';
  }
  
  if (errorStr.includes('insufficient funds') || errorStr.includes('insufficient balance')) {
    return 'Insufficient funds in your wallet. Please add more funds and try again.';
  }
  
  if (errorStr.includes('user rejected') || errorStr.includes('user denied')) {
    return 'Transaction was cancelled by user.';
  }
  
  if (errorStr.includes('network') || errorStr.includes('connection')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  
  if (errorStr.includes('gas') || errorStr.includes('out of gas')) {
    return 'Transaction failed due to gas issues. Please try again with higher gas settings.';
  }
  
  if (errorStr.includes('nonce')) {
    return 'Transaction nonce error. Please refresh the page and try again.';
  }
  
  if (errorStr.includes('timeout')) {
    return 'Transaction timed out. Please try again.';
  }
  
  // For any other technical errors, provide a generic user-friendly message
  if (error.length > 100 || errorStr.includes('0x') || errorStr.includes('revert')) {
    return error;
  }
  
  // Return the original error if it's already user-friendly
  return error;
};

export default function ProductDetailPage() {
  // Wallet contexts
  const { xrpWalletAddress, xrplWallet } = useXRPL()
  const { metamaskWalletAddress, isConnected: metamaskConnected, getSigner, isXRPLEVM } = useMetamask()
  const { publicKey, connected: solanaConnected, sendTransaction, signTransaction, signAllTransactions } = useWallet()
  const { connection } = useConnection()

  const [bidAmount, setBidAmount] = useState("")
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: ''
  })
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connectedWallets, setConnectedWallets] = useState([])
  const [showShippingForm, setShowShippingForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [orderProcessing, setOrderProcessing] = useState(false)
  const [xrpbPrice, setXrpbPrice] = useState(null) // No fallback price
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  const [xrpbPrices, setXrpbPrices] = useState({
    solana: null,
    xrpl: null,
    xrplEvm: null
  })
  const [priceLoadingStates, setPriceLoadingStates] = useState({
    solana: false,
    xrpl: false,
    xrplEvm: false
  })
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [calculatedAmount, setCalculatedAmount] = useState(0)
  const params = useParams()

  // Add authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/marketplace')
    }
  }, [user, authLoading, router])

  // Helper function to check if buy button should be shown
  const shouldShowBuyButton = () => {
    // Don't show if no wallets connected
    if (connectedWallets.length === 0) {
      return false;
    }
    
    // Don't show if listing is sold
    if (listing?.status === 'sold') {
      return false;
    }
    
    // Check if at least one connected wallet has a valid price
const hasValidPriceForConnectedWallet = connectedWallets.some(wallet => {
  const walletType = wallet.type === 'xrpl_evm' ? 'evm' : wallet.type;
  console.log("Wallet Type:", walletType);

  let priceToCheck;

  switch (walletType) {
    case 'solana':
      priceToCheck = xrpbPrices?.solana;
      break;
    case 'xrp':
      priceToCheck = xrpbPrices?.xrpl;
      break;
    case 'evm':
      priceToCheck = xrpbPrices?.xrplEvm;
      break;
    default:
      return false;
  }

  // Ensure the price is not undefined, not 0.0001, and greater than 0
  return priceToCheck !== undefined && priceToCheck !== 0.0001 && priceToCheck > 0;
});

    
    if (!hasValidPriceForConnectedWallet) {
      return false;
    }
    
    return true;
  };
  
  // Helper function to render conditional field
  const renderField = (label, value, icon = null) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) return null;
    
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-b-0">
        <span className="text-gray-400 text-sm flex items-center gap-2">
          {icon && <span className="text-[#39FF14]">{icon}</span>}
          {label}:
        </span>
        <span className="text-white font-medium text-sm">{value}</span>
      </div>
    )
  }

  // Helper function to get category-specific fields
  const getCategorySpecificFields = (listing) => {
    const fields = []
    
    // Common fields for all categories
    if (listing.brand) fields.push(renderField('Brand', listing.brand, '🏷️'))
    if (listing.model) fields.push(renderField('Model', listing.model, '📱'))
    if (listing.condition_type) fields.push(renderField('Condition', listing.condition_type, '⭐'))
    
    // Category-specific fields
    switch (listing.category) {
      case 'fashion':
      case 'clothing':
        if (listing.size) fields.push(renderField('Size', listing.size, '📏'))
        if (listing.color) fields.push(renderField('Color', listing.color, '🎨'))
        if (listing.material) fields.push(renderField('Material', listing.material, '🧵'))
        break
        
      case 'electronics':
      case 'technology':
        if (listing.year_manufactured) fields.push(renderField('Year', listing.year_manufactured, '📅'))
        if (listing.warranty_info) fields.push(renderField('Warranty', listing.warranty_info, '🛡️'))
        break
        
      case 'books':
      case 'media':
        if (listing.isbn) fields.push(renderField('ISBN', listing.isbn, '📚'))
        if (listing.year_manufactured) fields.push(renderField('Publication Year', listing.year_manufactured, '📅'))
        break
        
      case 'collectibles':
      case 'art':
        if (listing.year_manufactured) fields.push(renderField('Year Made', listing.year_manufactured, '🎨'))
        if (listing.material) fields.push(renderField('Material', listing.material, '🏺'))
        break
        
      case 'automotive':
      case 'vehicles':
        if (listing.year_manufactured) fields.push(renderField('Year', listing.year_manufactured, '🚗'))
        if (listing.color) fields.push(renderField('Color', listing.color, '🎨'))
        break
    }
    
    // Physical item specific fields
    if (listing.is_physical) {
      if (listing.weight) fields.push(renderField('Weight', `${listing.weight} kg`, '⚖️'))
      if (listing.dimensions) {
        const dims = listing.dimensions
        if (dims.length && dims.width && dims.height) {
          fields.push(renderField('Dimensions', `${dims.length} × ${dims.width} × ${dims.height} ${dims.unit || 'cm'}`, '📦'))
        }
      }
      if (listing.location) fields.push(renderField('Location', listing.location, '📍'))
    }
    
    // Additional fields
    if (listing.sku) fields.push(renderField('SKU', listing.sku, '🔢'))
    if (listing.upc_ean) fields.push(renderField('UPC/EAN', listing.upc_ean, '📊'))
    if (listing.quantity_available && listing.quantity_available > 1) {
      fields.push(renderField('Available', `${listing.quantity_available} units`, '📦'))
    }
    
    return fields
  }

  // Helper function to get error message when buy button is hidden
  const getBuyButtonErrorMessage = () => {
    if (listing?.status === 'sold') {
      return 'This item is sold out';
    }
    
    if (connectedWallets.length === 0) {
      return 'Please connect a wallet to make a purchase';
    }
    
    // Check if any prices are available at all
    const hasAnyValidPrices = Object.values(xrpbPrices).some(price => price && price > 0.0001);
    if (!hasAnyValidPrices) {
      return 'Unable to fetch current XRPB prices. Please try again later.';
    }
    
    // Check if connected wallets have valid prices
    const hasValidPriceForConnectedWallet = connectedWallets.some(wallet => {
      const walletType = wallet.type === 'xrpl_evm' ? 'evm' : wallet.type;
      let priceToCheck;
      switch (walletType) {
        case 'solana':
          priceToCheck = xrpbPrices.solana;
          break;
        case 'xrp':
          priceToCheck = xrpbPrices.xrpl;
          break;
        case 'evm':
          priceToCheck = xrpbPrices.xrplEvm;
          break;
        default:
          return false;
      }
      return priceToCheck && priceToCheck > 0.0001;
    });
    
    if (!hasValidPriceForConnectedWallet) {
      return 'XRPB prices not available for your connected wallets. Please try connecting a different wallet or try again later.';
    }
    
    return 'Unable to process purchase at this time. Please try again later.';
  };

  // Update connected wallets using the same method as membership page
  useEffect(() => {
    const wallets = []
    if (xrpWalletAddress) {
      wallets.push({
        type: 'xrp',
        name: 'XAMAN (XRP)',
        address: xrpWalletAddress,
        icon: '🔷',
        currency: 'XRPB',
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
        name: 'Phantom (SOL)',
        address: publicKey.toString(),
        icon: '👻',
        currency: 'XRPB',
        network: 'Solana Mainnet'
      })
    }
    setConnectedWallets(wallets)
  }, [xrpWalletAddress, metamaskConnected, metamaskWalletAddress, solanaConnected, publicKey, isXRPLEVM])

  // Fetch listing details
  useEffect(() => {
    if (params.id) {
      fetchListingDetails()
    }
  }, [params.id, connectedWallets])

  const fetchListingDetails = async () => {
    try {
      setLoading(true)
      // Use the primary wallet (first connected wallet) for API call
      const primaryWallet = connectedWallets.length > 0 ? connectedWallets[0].address : null
      const url = `/api/marketplace/${params.id}${primaryWallet ? `?wallet=${primaryWallet}` : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch listing details')
      }

      const data = await response.json()
      setListing(data.listing)
    } catch (error) {
      console.error('Error fetching listing details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBid = async () => {
    if (connectedWallets.length === 0) {
      alert("Please connect a wallet to place a bid!")
      return
    }
    if (!bidAmount || Number.parseFloat(bidAmount) <= listing.price) {
      alert("Bid must be higher than current price!")
      return
    }
    
    try {
      setOrderProcessing(true)
      // Note: Bidding functionality would need a separate implementation
      // since the current schema doesn't support bid orders
      alert("Bidding feature coming soon! Please use Buy Now for immediate purchase.")
    } catch (error) {
      console.error('Error placing bid:', error)
      alert('Failed to place bid. Please try again.')
    } finally {
      setOrderProcessing(false)
    }
  }

  const handleBuyNow = async () => {
    if (connectedWallets.length === 0) {
      alert("Please connect a wallet to make a purchase!")
      return
    }

    if (listing.is_physical) {
      setShowShippingForm(true)
    } else {
      setShowPaymentModal(true)
    }
  }

  const handleShippingSubmit = () => {
    // Validate shipping info
    const requiredFields = ['address', 'city', 'state', 'zipCode', 'country', 'phone']
    const missingFields = requiredFields.filter(field => !shippingInfo[field]?.trim())
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`)
      return
    }
    
    setShowShippingForm(false)
    setShowPaymentModal(true)
  }

  const handlePaymentConfirm = async () => {
    // Add authentication check before payment
    if (!user) {
      alert('Please log in to make a purchase')
      router.push('/login?redirect=/marketplace')
      return
    }

    if (!selectedPaymentMethod) {
      alert('Please select a payment method!')
      return
    }

    setOrderProcessing(true)
    
    try {
      const primaryWallet = selectedPaymentMethod
      const chainType = primaryWallet.type === 'xrpl_evm' ? 'evm' : primaryWallet.type
      
      // Calculate XRPB amount with enhanced validation
      let xrpbAmount;
      try {
        const listingPrice = parseFloat(listing.price);
        if (!listingPrice || listingPrice <= 0 || isNaN(listingPrice)) {
          throw new Error('Invalid listing price');
        }
        
        xrpbAmount = getPaymentAmountForWallet(listingPrice, chainType);
        
        // Final validation before payment
        if (!xrpbAmount || xrpbAmount <= 0 || isNaN(xrpbAmount) || !Number.isFinite(xrpbAmount)) {
          throw new Error('Invalid payment amount calculated');
        }
        
        console.log('💰 Calculated XRPB amount:', xrpbAmount);
      } catch (error) {
        console.error('Payment calculation error:', error);
        alert(`❌ ${formatErrorMessage(error.message)}`);
        setOrderProcessing(false);
        return;
      }
      
      let walletForPayment
      if (chainType === 'xrp') {
        walletForPayment = xrplWallet
      } else if (chainType === 'evm') {
        walletForPayment = getSigner
      } else if (chainType === 'solana') {
        walletForPayment = {
          publicKey,
          connected: solanaConnected,
          sendTransaction,
          signTransaction,
          signAllTransactions
        }
      }

      console.log('🔄 Step 1: Sending payment first...')
      
      // STEP 1: Send payment FIRST
      let paymentResult;
      const mappedChain = chainType === 'evm' ? 'xrpl_evm' : (chainType === 'xrp' ? 'xrpl' : chainType);
      
      switch (mappedChain) {
        case 'solana':
          if (!walletForPayment || !connection) {
            throw new Error('Solana wallet or connection not provided');
          }
          paymentResult = await sendSolanaXRPBPayment(walletForPayment, xrpbAmount, connection);
          break;
        case 'xrpl':
          if (!walletForPayment) {
            throw new Error('XRPL wallet not provided');
          }
          paymentResult = await sendXRPLXRPBPayment(walletForPayment, xrpbAmount);
          break;
        case 'xrpl_evm':
          if (!walletForPayment) {
            throw new Error('XRPL EVM signer function not provided');
          }
          paymentResult = await sendXRPLEvmXRPBPayment(walletForPayment, xrpbAmount);
          break;
        default:
          throw new Error(`Unsupported chain: ${mappedChain}`);
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
        return
      }

      console.log('✅ Payment successful! Transaction:', paymentResult.signature || paymentResult.txHash)
      console.log('🔄 Step 2: Creating escrow record with payment proof...')
      
      // STEP 2: Create escrow record ONLY after successful payment
      const escrowResponse = await fetch('/api/escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'anonymous'}`
        },
        body: JSON.stringify({
          seller: listing.seller.wallets.find(w => w.chain === chainType)?.address || 
                  listing.seller.wallets[0]?.address || '',
          buyer: primaryWallet.address,
          amount: xrpbAmount,
          chain: mappedChain,
          conditions: {
            delivery_required: true,
            satisfactory_condition: true,
            auto_release_days: 20
          },
          listingId: listing.id,
          transactionHash: paymentResult.signature || paymentResult.txHash, // Include payment proof
          paymentVerified: true // Mark as pre-verified
        })
      });
      
      const escrowData = await escrowResponse.json();
      
      if (!escrowData.success) {
        console.error('⚠️ Escrow creation failed but payment was sent:', paymentResult.signature || paymentResult.txHash);
        throw new Error(escrowData.error || 'Failed to create escrow after payment');
      }

      console.log('✅ Escrow created successfully:', escrowData.escrowId)

      // Create order record
              const orderData = {
                listing_id: listing.id,
                amount: xrpbAmount, // Use calculated XRPB amount
                order_type: 'purchase',
                wallet_address: primaryWallet.address,
                buyer_id: user.id, // Add buyer_id from authenticated user
                escrow_id: escrowData.escrowId,
                transaction_hash: paymentResult.signature || paymentResult.txHash,
                payment_chain: mappedChain // ✅ Payment chain is stored here
              }
      
      if (listing.is_physical) {
        orderData.shipping_info = shippingInfo
      }
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`✅ Purchase Successful!\n\nOrder ID: ${result.order.id}\nEscrow ID: ${escrowData.escrowId}\nTransaction: ${paymentResult.signature || paymentResult.txHash}\n\nYour payment of ${xrpbAmount} XRPB (≈$${listing.price} USD) has been sent and escrow created. The seller will be notified to fulfill the order.`)
        setShowPaymentModal(false)
        setShowShippingForm(false)
        setSelectedPaymentMethod(null)
        // Reset form data
        setShippingInfo({
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          phone: ''
        })
        // Refresh listing to show updated status
        fetchListingDetails()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Error in purchase flow:', error)
      alert(`❌ Purchase failed: ${formatErrorMessage(error.message)}`)
    } finally {
      setOrderProcessing(false)
    }
  }

  const getChainIcon = (chain) => {
    switch (chain) {
      case "xrp":
        return "🔷"
      case "evm":
        return "⚡"
      case "solana":
        return "🌟"
      default:
        return "🌐"
    }
  }

  const getChainCurrency = (chain) => {
    // All chains now use XRPB token
    return 'XRPB'
  }

  // Function to fetch XRPB prices from all chains
  const fetchAllXRPBPrices = async () => {
    console.log('🔄 Fetching XRPB prices from all chains...');
    
    setPriceLoadingStates({
      solana: true,
      xrpl: true,
      xrplEvm: true
    });
    setIsLoadingPrice(true);
    
    try {
      const prices = await getAllXRPBPrices();
      
      setXrpbPrices({
        solana: prices.solana || null, // No fallback - null if failed
        xrpl: prices.xrpl || null,
        xrplEvm: prices.xrplEvm || null
      });
      
      // Set main price to the first available price, or null if none available
      const mainPrice = prices.solana || prices.xrpl || prices.xrplEvm || null;
      setXrpbPrice(mainPrice);
      
      console.log('✅ All XRPB prices fetched:', prices);
    } catch (error) {
      console.error('❌ Error fetching XRPB prices:', error);
      // No fallback prices - set all to null
      setXrpbPrices({
        solana: null,
        xrpl: null,
        xrplEvm: null
      });
      setXrpbPrice(null);
    } finally {
      setPriceLoadingStates({
        solana: false,
        xrpl: false,
        xrplEvm: false
      });
      setIsLoadingPrice(false);
    }
  };

  // Function to get payment amount based on connected wallet chain
  const getPaymentAmountForWallet = (priceUSD, walletType) => {
    // Add comprehensive validation
    if (!priceUSD || priceUSD === 0 || isNaN(priceUSD) || priceUSD < 0) {
      throw new Error('Invalid USD price provided');
    }
    
    let priceToUse;
    switch (walletType) {
      case 'solana':
        priceToUse = xrpbPrices.solana;
        break;
      case 'xrp':
        priceToUse = xrpbPrices.xrpl;
        break;
      case 'xrpl_evm':
      case 'evm':
        console.log("This is the price to use: ", xrpbPrices.xrplEvm)
        priceToUse = xrpbPrices.xrplEvm;
        break;
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
    
    // Enhanced price validation
    if (!priceToUse || priceToUse <= 0 || isNaN(priceToUse) || !Number.isFinite(priceToUse)) {
      throw new Error(`XRPB price not available for ${walletType} chain. Please wait for prices to load or try again later.`);
    }
    
    try {
      const calculatedAmount = calculateXRPBAmount(priceUSD, priceToUse);
      
      // Validate the calculated amount
      if (!calculatedAmount || calculatedAmount <= 0 || isNaN(calculatedAmount) || !Number.isFinite(calculatedAmount)) {
        throw new Error('Failed to calculate valid payment amount');
      }
      
      return calculatedAmount;
    } catch (error) {
      console.error('Error calculating XRPB amount:', error);
      throw new Error('Unable to calculate payment amount. Please try again.');
    }
  };

  // Function to get payment amount for a specific wallet type
  const getPaymentAmount = (priceUSD, walletType) => {
    try {
      return getPaymentAmountForWallet(priceUSD, walletType);
    } catch (error) {
      return 0; // Return 0 if price not available for display purposes
    }
  }

  // Fetch XRPB price on component mount
  useEffect(() => {
    fetchAllXRPBPrices()
    // Set up interval to refresh prices every 30 seconds
    const interval = setInterval(fetchAllXRPBPrices, 30000);
    return () => clearInterval(interval);
  }, [])

  // Update calculated amount when listing or XRPB prices change
  useEffect(() => {
    if (listing && listing.price) {
      // If a payment method is selected, use that
      if (selectedPaymentMethod) {
        try {
          const chainType = selectedPaymentMethod.type === 'xrpl_evm' ? 'evm' : selectedPaymentMethod.type;
          const amount = getPaymentAmountForWallet(parseFloat(listing.price), chainType);
          setCalculatedAmount(amount);
        } catch (error) {
          setCalculatedAmount(0); // Set to 0 if price not available
        }
      } 
      // If no payment method selected but wallets are connected, use the first connected wallet
      else if (connectedWallets.length > 0) {
        try {
          const primaryWallet = connectedWallets[0];
          const chainType = primaryWallet.type === 'xrpl_evm' ? 'evm' : primaryWallet.type;
          const amount = getPaymentAmountForWallet(parseFloat(listing.price), chainType);
          setCalculatedAmount(amount);
        } catch (error) {
          setCalculatedAmount(0); // Set to 0 if price not available
        }
      } else {
        setCalculatedAmount(0);
      }
    } else {
      setCalculatedAmount(0);
    }
  }, [listing, xrpbPrices, selectedPaymentMethod, connectedWallets])

  // Update connected wallets using the same method as membership page
  useEffect(() => {
    const wallets = []
    if (xrpWalletAddress) {
      wallets.push({
        type: 'xrp',
        name: 'XAMAN (XRP)',
        address: xrpWalletAddress,
        icon: '🔷',
        currency: 'XRPB',
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
        name: 'Solflare (SOL)',
        address: publicKey.toString(),
        icon: '☀️',
        currency: 'XRPB',
        network: 'Solana Mainnet'
      })
    }
    setConnectedWallets(wallets)
  }, [xrpWalletAddress, metamaskConnected, metamaskWalletAddress, solanaConnected, publicKey, isXRPLEVM])

  // Fetch listing details
  useEffect(() => {
    if (params.id) {
      fetchListingDetails()
    }
  }, [params.id, connectedWallets])

  // const fetchListingDetails = async () => {
  //   try {
  //     setLoading(true)
  //     // Use the primary wallet (first connected wallet) for API call
  //     const primaryWallet = connectedWallets.length > 0 ? connectedWallets[0].address : null
  //     const url = `/api/marketplace/${params.id}${primaryWallet ? `?wallet=${primaryWallet}` : ''}`
  //     const response = await fetch(url)
      
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch listing details')
  //     }

  //     const data = await response.json()
  //     setListing(data.listing)
  //   } catch (error) {
  //     console.error('Error fetching listing details:', error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // const handleBid = async () => {
  //   if (connectedWallets.length === 0) {
  //     alert("Please connect a wallet to place a bid!")
  //     return
  //   }
  //   if (!bidAmount || Number.parseFloat(bidAmount) <= listing.price) {
  //     alert("Bid must be higher than current price!")
  //     return
  //   }
    
  //   try {
  //     setOrderProcessing(true)
  //     // Note: Bidding functionality would need a separate implementation
  //     // since the current schema doesn't support bid orders
  //     alert("Bidding feature coming soon! Please use Buy Now for immediate purchase.")
  //   } catch (error) {
  //     console.error('Error placing bid:', error)
  //     alert('Failed to place bid. Please try again.')
  //   } finally {
  //     setOrderProcessing(false)
  //   }
  // }

  // const handleBuyNow = async () => {
  //   if (connectedWallets.length === 0) {
  //     alert('Please connect a wallet to make a purchase')
  //     return
  //   }
  //   console.log("Listing: ", listing)
    
  //   if (listing.is_physical) {
  //     setShowShippingForm(true)
  //   } else {
  //     setShowPaymentModal(true)
  //   }
  // }

  // const handleShippingSubmit = () => {
  //   if (!shippingInfo.address || !shippingInfo.city || !shippingInfo.country) {
  //     alert('Please fill in all required shipping information')
  //     return
  //   }
  //   setShowShippingForm(false)
  //   setShowPaymentModal(true)
  // }

  // const handlePaymentConfirm = async () => {
  //   try {
  //     setOrderProcessing(true)
      
  //     // Get the primary connected wallet
  //     const primaryWallet = connectedWallets[0]
  //     if (!primaryWallet) {
  //       throw new Error('No wallet connected')
  //     }

  //     // Prepare wallet object based on chain
  //     let walletForPayment
  //     let chainType = primaryWallet.type
      
  //     switch (chainType) {
  //       case 'solana':
  //         walletForPayment = {
  //           publicKey,
  //           connected: solanaConnected,
  //           sendTransaction,
  //           signTransaction,
  //           signAllTransactions
  //         }
  //         break
  //       case 'xrp':
  //         walletForPayment = xrplWallet
  //         break
  //       case 'evm':
  //         walletForPayment = getSigner
  //         break
  //       default:
  //         throw new Error('Unsupported wallet type')
  //     }

  //     // Create escrow payment
  //     const escrowPaymentData = {
  //       seller: listing.seller.wallets.find(w => w.chain === chainType)?.address || 
  //               listing.seller.wallets[0]?.address || 
  //               '', // Use empty string if no wallet found
  //       buyer: primaryWallet.address,
  //       amount: parseFloat(listing.price),
  //       chain: chainType === 'evm' ? 'xrpl_evm' : chainType,
  //       conditions: {
  //         delivery_required: true,
  //         satisfactory_condition: true,
  //         auto_release_days: 20
  //       },
  //       listingId: listing.id,
  //       wallet: walletForPayment,
  //       connection: chainType === 'solana' ? connection : null
  //     }

  //     console.log('🔄 Creating escrow payment...', escrowPaymentData)
      
  //     const escrowResult = await createEscrowPayment(escrowPaymentData)
      
  //     if (!escrowResult.success) {
  //       throw new Error(escrowResult.error)
  //     }

  //     // Create order record
  //     const orderData = {
  //       listing_id: listing.id,
  //       amount: listing.price,
  //       order_type: 'purchase',
  //       wallet_address: primaryWallet.address,
  //       escrow_id: escrowResult.escrowId,
  //       transaction_hash: escrowResult.transactionHash,
  //       payment_chain: chainType
  //     }
      
  //     if (listing.is_physical) {
  //       orderData.shipping_info = shippingInfo
  //     }
      
  //     const response = await fetch('/api/orders', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(orderData)
  //     })
      
  //     if (response.ok) {
  //       const result = await response.json()
  //       alert(`✅ Escrow Payment Successful!\n\nOrder ID: ${result.order.id}\nEscrow ID: ${escrowResult.escrowId}\nTransaction: ${escrowResult.transactionHash}\n\nYour payment is now held in escrow. The seller will be notified to fulfill the order. Funds will be released automatically after 20 days or when conditions are met.`)
  //       setShowPaymentModal(false)
  //       setShowShippingForm(false)
  //       // Reset form data
  //       setShippingInfo({
  //         address: '',
  //         city: '',
  //         state: '',
  //         zipCode: '',
  //         country: '',
  //         phone: ''
  //       })
  //       // Refresh listing to show updated status
  //       fetchListingDetails()
  //     } else {
  //       const errorData = await response.json()
  //       throw new Error(errorData.error || 'Failed to create order')
  //     }
  //   } catch (error) {
  //     console.error('Error creating escrow payment:', error)
  //     alert(`❌ Escrow payment failed: ${error.message}`)
  //   } finally {
  //     setOrderProcessing(false)
  //   }
  // }

  // const getChainIcon = (chain) => {
  //   switch (chain) {
  //     case "xrp":
  //       return "🔷"
  //     case "evm":
  //       return "⚡"
  //     case "solana":
  //       return "🌟"
  //     default:
  //       return "🌐"
  //   }
  // }

  // const getChainCurrency = (chain) => {
  //   // All chains now use XRPB token
  //   return 'XRPB'
  // }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39FF14]"></div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Listing Not Found</h1>
          <p className="text-gray-400">The listing you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section - Fixed with object-contain */}
          <div className="space-y-6">
            <div className="card-glow rounded-lg overflow-hidden relative w-full h-96 bg-gray-900">
              <Image
                src={listing.images?.[0] || '/placeholder-image.jpg'}
                alt={listing.title}
                fill
                className="object-contain p-4"
                priority
              />
            </div>

            {/* Additional Images - Also fixed */}
            {listing.images && listing.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {listing.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="relative h-20 rounded-lg overflow-hidden bg-gray-900">
                    <Image
                      src={image}
                      alt={`${listing.title} ${index + 2}`}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Description Section */}
            <div className="card-glow p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Description</h3>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {listing.description || 'No description available for this item.'}
              </div>
              
              {/* Tags if available */}
              {listing.tags && listing.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  listing.chain === 'xrp' ? 'bg-blue-500/20 text-blue-400' :
                  listing.chain === 'evm' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {getChainIcon(listing.chain)} {listing.chain.toUpperCase()}
                </span>
                {listing.is_physical && (
                  <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
                    <Package className="w-4 h-4 inline mr-1" />
                    Physical Item
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">{listing.title}</h1>
            </div>

            {/* Price and Seller Info - Updated with XRPB */}
            <div className="card-glow p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Current Price</p>
                  <p className="text-3xl font-bold text-[#39FF14]">{parseFloat(listing.price)} USD {getChainIcon(listing.chain)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Seller</p>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-white font-semibold">@{listing.seller.username}</p>
                    </div>
                    <Link 
                      href={`/storefront/public/${listing.seller.id}`}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#39FF14]/10 hover:bg-[#39FF14]/20 border border-[#39FF14]/30 hover:border-[#39FF14]/50 rounded-lg text-[#39FF14] hover:text-[#39FF14] transition-all duration-300 text-sm font-medium"
                    >
                      <Store className="w-4 h-4" />
                      Visit Storefront
                    </Link>
                  </div>
                </div>
              </div>

              {/* Payment Information - Updated for XRPB */}
              {listing.paymentInfo ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold">Payment Ready</span>
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p><strong>Your Wallet:</strong> {listing.paymentInfo.buyerWallet}</p>
                    <p><strong>Seller Wallet:</strong> {listing.paymentInfo.sellerWallet}</p>
                    <p><strong>Chain:</strong> {listing.paymentInfo.chain.toUpperCase()}</p>
                    <p><strong>Amount:</strong> {listing.paymentInfo.price} XRPB</p>
                  </div>
                </div>
              ) : connectedWallets.length > 0 ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">Wallet Connected</span>
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p><strong>Connected Wallets:</strong></p>
                    {connectedWallets.map((wallet, index) => (
                      <p key={index}>{wallet.icon} {wallet.name}: {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}</p>
                    ))}
                    <p className="text-[#39FF14] font-medium mt-2">💰 Payments will be made in XRPB tokens</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-semibold">No Wallet Connected</span>
                  </div>
                  <p className="text-sm text-gray-300">Connect a wallet to see payment options and make purchases</p>
                </div>
              )}

              {/* Available Seller Wallets */}
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Seller accepts XRPB payments on:</p>
                <div className="flex flex-wrap gap-2">
                  {listing.seller.wallets.map((wallet, index) => (
                    <span key={index} className={`px-2 py-1 rounded text-xs ${
                      wallet.chain === 'xrp' ? 'bg-blue-500/20 text-blue-400' :
                      wallet.chain === 'evm' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {getChainIcon(wallet.chain)} {wallet.chain.toUpperCase()}
                      {wallet.is_primary && ' (Primary)'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bid Section - Updated for XRPB */}
              {/* Remove bidAmount and handleBid function */}

              {shouldShowBuyButton() && (
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={handleBuyNow}
                    disabled={orderProcessing}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      orderProcessing
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-[#39FF14] text-black hover:bg-[#39FF14]/90'
                    }`}
                  >
                    {orderProcessing ? 'Processing...' : 
                     `Buy Now for $${listing?.price} USD (≈${calculatedAmount} XRPB)`}
                  </button>
                </div>
              )}

              {/* Show message when buy button is hidden */}
              {!shouldShowBuyButton() && connectedWallets.length === 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm text-center">
                    Connect a wallet to see purchase options
                  </p>
                </div>
              )}

              {!shouldShowBuyButton() && connectedWallets.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm text-center">
                    {getBuyButtonErrorMessage()}
                  </p>
                </div>
              )}
            </div>

            {/* ... existing code for stats and bid history ... */}
          </div>
        </div>
      </div>

      {/* Shipping Form Modal */}
      {showShippingForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Shipping Information</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Street Address"
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={shippingInfo.city}
                  onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                  className="px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={shippingInfo.state}
                  onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                  className="px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={shippingInfo.zipCode}
                  onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                  className="px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={shippingInfo.country}
                  onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                  className="px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                />
              </div>
              <input
                type="tel"
                placeholder="Phone Number"
                value={shippingInfo.phone}
                onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowShippingForm(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleShippingSubmit}
                className="flex-1 px-4 py-2 bg-[#39FF14] text-black rounded-lg hover:bg-[#39FF14]/90"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Updated Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Choose Payment Method</h3>
            
            {/* Payment Method Selection */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-[#39FF14]" />
                Select Wallet
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {connectedWallets.map((wallet, index) => {
                  const amount = getPaymentAmount(parseFloat(listing.price), wallet.type)
                  return (
                    <div
                      key={wallet.type}
                      onClick={() => setSelectedPaymentMethod(wallet)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                        selectedPaymentMethod?.type === wallet.type
                          ? 'border-[#39FF14] bg-[#39FF14]/10 shadow-[0_0_20px_rgba(57,255,20,0.3)]'
                          : 'border-gray-600 bg-black/40 hover:border-[#39FF14]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{wallet.icon}</span>
                          <div>
                            <p className="text-white font-semibold text-sm">{wallet.name}</p>
                            <p className="text-gray-400 text-xs font-mono">
                              {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                            </p>
                            {wallet.needsSwitch && (
                              <p className="text-yellow-400 text-xs">⚠️ Network switch required</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#39FF14] font-bold text-sm">
                            {amount} {wallet.currency}
                          </p>
                          <p className="text-gray-400 text-xs">
                            ≈ ${listing?.price} USD
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment Summary */}
            {selectedPaymentMethod && (
              <div className="mb-6 p-4 bg-gradient-to-r from-[#39FF14]/10 to-emerald-400/10 rounded-lg border border-[#39FF14]/30 max-h-64 overflow-y-auto">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center sticky top-0 bg-gradient-to-r from-[#39FF14]/10 to-emerald-400/10 pb-2">
                  <DollarSign className="w-5 h-5 mr-2 text-[#39FF14]" />
                  Payment Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Item:</span>
                    <span className="text-white font-semibold">{listing.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">USD Price:</span>
                    <span className="text-white">${listing.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">XRPB Price:</span>
                    <span className="text-[#39FF14]">${xrpbPrice?.toFixed(18) || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Payment Method:</span>
                    <span className="text-white font-semibold">{selectedPaymentMethod.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Amount:</span>
                    <span className="text-[#39FF14] font-bold">
                      {getPaymentAmount(parseFloat(listing.price), selectedPaymentMethod.type)} {selectedPaymentMethod.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">
                      Escrow Fee (
                      {user.membership_tier_id === 1
                        ? '3.5%'
                        : user.membership_tier_id === 2
                        ? '2.5%'
                        : '1.5%'}
                      ):
                    </span>
                    <span className="text-yellow-400">
                      {(
                        getPaymentAmount(parseFloat(listing.price), selectedPaymentMethod.type) *
                        (user.membership_tier_id === 1
                          ? 0.035
                          : user.membership_tier_id === 2
                          ? 0.025
                          : 0.015)
                      ).toFixed(2)}{' '}
                      XRPB
                    </span>
                  </div>

                  <div className="flex justify-between font-semibold border-t border-gray-600 pt-2">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-[#39FF14]">
                      {(
                        getPaymentAmount(parseFloat(listing.price), selectedPaymentMethod.type) *
                        (1 +
                          (user.membership_tier_id === 1
                            ? 0.035
                            : user.membership_tier_id === 2
                            ? 0.025
                            : 0.015))
                      ).toFixed(2)}{' '}
                      XRPB
                    </span>
                  </div>

                  {listing.is_physical && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Shipping:</span>
                      <span className="text-white">Calculated at checkout</span>
                    </div>
                  )}
                </div>
              </div>
            )}
              
            {/* Escrow Protection Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="text-sm space-y-1">
                <p className="text-blue-400 font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Escrow Protection Active
                </p>
                <p className="text-gray-300">Your payment will be held securely until delivery is confirmed or 20 days pass.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedPaymentMethod(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentConfirm}
                disabled={orderProcessing || !selectedPaymentMethod}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  orderProcessing || !selectedPaymentMethod
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-[#39FF14] text-black hover:bg-[#39FF14]/90'
                }`}
              >
                {orderProcessing ? 'Creating Escrow...' : 'Confirm Escrow Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}

              {/* XRPB Price Display */}
              <div className="mb-4">
                <div className="bg-black/40 backdrop-blur-xl border border-[#39FF14]/30 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-[#39FF14]" />
                      <span className="text-white font-medium text-sm">
                        XRPB Price: 
                        {isLoadingPrice ? (
                          <Loader2 className="w-4 h-4 animate-spin inline ml-2" />
                        ) : (
                          <span className="text-[#39FF14] ml-1">${xrpbPrice.toFixed(9)}</span>
                        )}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">≈ {calculatedAmount} XRPB</p>
                      <p className="text-xs text-gray-400">for ${listing?.price} USD</p>
                    </div>
                  </div>
                  
                  {/* Chain-specific prices */}
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center">
                      <span className="text-blue-400 mr-1">🔷</span>
                      <span className="text-gray-400">XRPL:</span>
                      {priceLoadingStates.xrpl ? (
                        <Loader2 className="w-3 h-3 animate-spin ml-1" />
                      ) : (
                        <span className="text-[#39FF14] ml-1">${xrpbPrices.xrpl.toFixed(9)}</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-400 mr-1">🦊</span>
                      <span className="text-gray-400">EVM:</span>
                      {priceLoadingStates.xrplEvm ? (
                        <Loader2 className="w-3 h-3 animate-spin ml-1" />
                      ) : (
                        <span className="text-[#39FF14] ml-1">${xrpbPrices.xrplEvm.toFixed(9)}</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-400 mr-1">☀️</span>
                      <span className="text-gray-400">SOL:</span>
                      {priceLoadingStates.solana ? (
                        <Loader2 className="w-3 h-3 animate-spin ml-1" />
                      ) : (
                        <span className="text-[#39FF14] ml-1">${xrpbPrices.solana.toFixed(9)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Product Details Section */}
              <div className="card-glow p-6 rounded-lg mb-4">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#39FF14]" />
                  Product Details
                </h3>
                
                {/* Basic Information */}
                <div className="space-y-1 mb-6">
                  {renderField('Category', listing.category?.charAt(0).toUpperCase() + listing.category?.slice(1), '📂')}
                  {listing.subcategory && renderField('Subcategory', listing.subcategory?.charAt(0).toUpperCase() + listing.subcategory?.slice(1), '📁')}
                  
                  {/* Category-specific fields */}
                  {getCategorySpecificFields(listing)}
                </div>
                
                {/* Pricing Information */}
                {(listing.original_price || listing.discount_percentage) && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                    <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Pricing Details
                    </h4>
                    <div className="space-y-1">
                      {listing.original_price && renderField('Original Price', `$${listing.original_price}`)}
                      {listing.discount_percentage && renderField('Discount', `${listing.discount_percentage}%`)}
                      {listing.original_price && listing.discount_percentage && (
                        renderField('You Save', `$${(listing.original_price * listing.discount_percentage / 100).toFixed(2)}`)
                      )}
                    </div>
                  </div>
                )}
                
                {/* Features */}
                {listing.features && listing.features.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <span className="text-[#39FF14]">✨</span>
                      Key Features
                    </h4>
                    <ul className="space-y-1">
                      {listing.features.map((feature, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-[#39FF14] mt-1">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Specifications */}
                {listing.specifications && Object.keys(listing.specifications).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <span className="text-[#39FF14]">🔧</span>
                      Specifications
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(listing.specifications).map(([key, value]) => (
                        renderField(key.charAt(0).toUpperCase() + key.slice(1), value)
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Warranty & Return Policy */}
                {(listing.warranty_info || listing.return_policy) && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                    <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Warranty & Returns
                    </h4>
                    <div className="space-y-1">
                      {listing.warranty_info && renderField('Warranty', listing.warranty_info)}
                      {listing.return_policy && renderField('Return Policy', listing.return_policy)}
                    </div>
                  </div>
                )}
                
                {/* Shipping Information */}
                {listing.shipping_info && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
                    <h4 className="text-orange-400 font-semibold mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Shipping Information
                    </h4>
                    <div className="space-y-1">
                      {typeof listing.shipping_info === 'object' ? (
                        Object.entries(listing.shipping_info).map(([key, value]) => (
                          renderField(key.charAt(0).toUpperCase() + key.slice(1), value)
                        ))
                      ) : (
                        <p className="text-gray-300 text-sm">{listing.shipping_info}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Age Restriction */}
                {listing.age_restriction && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Age Restriction
                    </h4>
                    <p className="text-gray-300 text-sm">{listing.age_restriction}+ years required</p>
                  </div>
                )}
              </div>

              {shouldShowBuyButton() && (
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={handleBuyNow}
                    disabled={orderProcessing}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      orderProcessing
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-[#39FF14] text-black hover:bg-[#39FF14]/90'
                    }`}
                  >
                    {orderProcessing ? 'Processing...' : 
                     `Buy Now for $${listing?.price} USD (≈${calculatedAmount} XRPB)`}
                  </button>
                </div>
              )}

              {/* Show message when buy button is hidden */}
              {!shouldShowBuyButton() && connectedWallets.length === 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm text-center">
                    Connect a wallet to see purchase options
                  </p>
                </div>
              )}

              {!shouldShowBuyButton() && connectedWallets.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm text-center">
                    {listing?.status === 'sold' 
                      ? 'This item is sold out'
                      : 'Unable to fetch current XRPB prices. Please try again later.'}
                  </p>
                </div>
              )}

      {/* Updated Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Choose Payment Method</h3>
            
            {/* Payment Method Selection */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-[#39FF14]" />
                Select Wallet
              </h4>
              <div className="space-y-3">
                {connectedWallets.map((wallet, index) => {
                  const amount = getPaymentAmount(parseFloat(listing.price), wallet.type)
                  return (
                    <div
                      key={wallet.type}
                      onClick={() => setSelectedPaymentMethod(wallet)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                        selectedPaymentMethod?.type === wallet.type
                          ? 'border-[#39FF14] bg-[#39FF14]/10 shadow-[0_0_20px_rgba(57,255,20,0.3)]'
                          : 'border-gray-600 bg-black/40 hover:border-[#39FF14]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{wallet.icon}</span>
                          <div>
                            <p className="text-white font-semibold text-sm">{wallet.name}</p>
                            <p className="text-gray-400 text-xs font-mono">
                              {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                            </p>
                            {wallet.needsSwitch && (
                              <p className="text-yellow-400 text-xs">⚠️ Network switch required</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#39FF14] font-bold text-sm">
                            {amount} {wallet.currency}
                          </p>
                          <p className="text-gray-400 text-xs">
                            ≈ ${listing?.price} USD
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment Summary */}
            {selectedPaymentMethod && (
              <div className="mb-6 p-4 bg-gradient-to-r from-[#39FF14]/10 to-emerald-400/10 rounded-lg border border-[#39FF14]/30">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-[#39FF14]" />
                  Payment Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Item:</span>
                    <span className="text-white font-semibold">{listing.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">USD Price:</span>
                    <span className="text-white">${listing.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">XRPB Price:</span>
                    <span className="text-[#39FF14]">${xrpbPrice.toFixed(9)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Payment Method:</span>
                    <span className="text-white font-semibold">{selectedPaymentMethod.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Amount:</span>
                    <span className="text-[#39FF14] font-bold">
                      {getPaymentAmount(parseFloat(listing.price), selectedPaymentMethod.type)} {selectedPaymentMethod.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Escrow Fee (2.5%):</span>
                    <span className="text-yellow-400">{(getPaymentAmount(parseFloat(listing.price), selectedPaymentMethod.type) * 0.025).toFixed(2)} XRPB</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-gray-600 pt-2">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-[#39FF14]">{(getPaymentAmount(parseFloat(listing.price), selectedPaymentMethod.type) * 1.025).toFixed(2)} XRPB</span>
                  </div>
                  {listing.is_physical && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Shipping:</span>
                      <span className="text-white">Calculated at checkout</span>
                    </div>
                  )}
                </div>
              </div>
            )}
              
            {/* Escrow Protection Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="text-sm space-y-1">
                <p className="text-blue-400 font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Escrow Protection Active
                </p>
                <p className="text-gray-300">Your payment will be held securely until delivery is confirmed or 20 days pass.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentConfirm}
                disabled={orderProcessing}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  orderProcessing
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-[#39FF14] text-black hover:bg-[#39FF14]/90'
                }`}
              >
                {orderProcessing ? 'Creating Escrow...' : 'Confirm Escrow Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


