import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction, 
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import { ethers } from 'ethers';
import { Client, Wallet, xrpToDrops } from 'xrpl';

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
    return 'Transaction failed due to a technical issue. Please try again or contact support if the problem persists.';
  }
  
  // Return the original error if it's already user-friendly
  return error;
};

// XRPL EVM RPC URL
const RPC_URL = "https://rpc.xrplevm.org";

// XRPB/XRP pair contract on XRiSE33
const PAIR_ADDRESS = "0x8f03556589d2DCA2437661c37759f5959a92493D";

// Minimal ABI to fetch reserves and tokens
const PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

// XRPB token address
const XRPB_ADDRESS = "0x6d8630D167458b337A2c8b6242c354d2f4f75D96";

/**
 * Fetch XRPB price in USD from XRPL EVM pair contract
 * @returns {Promise<number|null>} XRPB price in USD or null if error
 */
export const getXRPBPriceInUSD = async () => {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const pair = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, provider);

    // Get token ordering in the pair
    const token0 = await pair.token0();
    const token1 = await pair.token1();

    const [reserve0, reserve1] = await pair.getReserves();

    // Determine which reserve is XRPB and which is XRP
    let reserveXRPB, reserveXRP;
    if (token0.toLowerCase() === XRPB_ADDRESS.toLowerCase()) {
      reserveXRPB = reserve0;
      reserveXRP = reserve1;
    } else {
      reserveXRPB = reserve1;
      reserveXRP = reserve0;
    }

    // Calculate price of 1 XRPB in XRP
    const priceInXRP = Number(reserveXRP) / Number(reserveXRPB);

    // Get XRP price in USD from CoinGecko
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd"
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const xrpUsd = data.ripple.usd;

    // Final XRPB price in USD
    const xrpbUsd = priceInXRP * xrpUsd;

    console.log(`XRPB Price in USD: $${xrpbUsd.toFixed(6)}`);
    return xrpbUsd;
  } catch (error) {
    console.error("Error fetching XRPB price:", error.message);
    return null;
  }
};

/**
 * Calculate XRPB amount needed for USD payment
 * @param {number} usdAmount - Amount in USD
 * @param {number} xrpbPrice - XRPB price in USD
 * @returns {number} XRPB amount needed
 */
export const calculateXRPBAmount = (usdAmount, xrpbPrice) => {
  if (!xrpbPrice || xrpbPrice <= 0) {
    throw new Error('Invalid XRPB price');
  }
  return Math.ceil(usdAmount / xrpbPrice); // Round up to ensure sufficient payment
};

// MAINNET XRPB Token Addresses
const XRPB_TOKENS = {
  solana: {
    mint: 'FJLz7hP4EXVMVnRBtP77V4k55t2BfXuajKQp1gcwpump', // Correct mainnet mint
    decimals: 6,
    network: 'mainnet-beta' // Changed to mainnet
  },
  xrpl: {
    currency: 'XRPB',
    issuer: 'rsEaYfqdZKNbD3SK55xzcjPm3nDrMj4aUT',
    network: 'mainnet',
    currencyDeets: '5852504200000000000000000000000000000000'
  },
  xrplEvm: {
    address: '0x6d8630D167458b337A2c8b6242c354d2f4f75D96',
    decimals: 18,
    network: 'mainnet',
    chainId: 1440000,
    rpcUrl: 'https://rpc.xrplevm.org'
  }
};

// Payment recipient addresses (mainnet)
const PAYMENT_RECIPIENTS = {
  solana: 'H3Xri4JAdrz645q5iCaqK1BX4sVK6iZLGmKXKYEVUz3A', // Updated to your mainnet address
  xrpl: 'rpeh58KQ7cs76Aa2639LYT2hpw4D6yrSDq', 
  xrplEvm: '0x5716dD191878F342A72633665F852bd0534B9Bc1'
};

/**
 * Solana XRPB-SOL Payment Function
 * @param {Object} wallet - Connected Solana wallet
 * @param {number} amount - Amount in XRPB-SOL tokens
 * @param {Connection} connection - Solana connection object
 */
export const sendSolanaXRPBPayment = async (wallet, amount, connection) => {
  try {
    // Comprehensive wallet validation
    if (!wallet) {
      throw new Error('❌ Wallet object is null or undefined');
    }
    
    if (!wallet.connected) {
      throw new Error('❌ Solana wallet not connected');
    }
    
    if (!wallet.publicKey) {
      throw new Error('❌ Wallet public key is not available');
    }

    console.log('🟣 SOLANA XRPB PAYMENT INITIATED (MAINNET)');
    console.log('From:', wallet.publicKey.toString());
    console.log('To:', PAYMENT_RECIPIENTS.solana);
    console.log('Amount:', amount, 'XRPB-SOL');
    
    const mintAddress = new PublicKey(XRPB_TOKENS.solana.mint);
    const recipientAddress = new PublicKey(PAYMENT_RECIPIENTS.solana);
    
    // Get sender's associated token account
    const senderTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      wallet.publicKey
    );
    
    // Check if sender has XRPB token account
    console.log('🔍 Checking sender token account...');
    const senderAccountInfo = await connection.getAccountInfo(senderTokenAccount);
    if (!senderAccountInfo) {
      throw new Error('❌ You do not have an XRPB token account. Please ensure you have XRPB tokens in your wallet first.');
    }
    
    // Check sender's XRPB balance
    console.log('💰 Checking XRPB balance...');
    const senderTokenAccountInfo = await connection.getTokenAccountBalance(senderTokenAccount);
    const currentBalance = senderTokenAccountInfo.value.uiAmount || 0;
    
    console.log('Current XRPB balance:', currentBalance);
    console.log('Required amount:', amount);
    
    if (currentBalance < amount) {
      throw new Error(`❌ Insufficient XRPB balance. Required: ${amount} XRPB, Available: ${currentBalance} XRPB`);
    }
    
    // Get or create recipient's associated token account
    console.log('📝 Getting or creating recipient token account...');
    const recipientTokenAccountInfo = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.publicKey, // payer
      mintAddress,
      recipientAddress
    );
    
    const recipientTokenAccount = recipientTokenAccountInfo.address;
    
    // Convert amount to token units (considering decimals)
    const tokenAmount = amount * Math.pow(10, XRPB_TOKENS.solana.decimals);
    
    console.log('📝 Creating transfer instruction...');
    console.log('From token account:', senderTokenAccount.toString());
    console.log('To token account:', recipientTokenAccount.toString());
    console.log('Token amount (raw):', tokenAmount);
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      senderTokenAccount,
      recipientTokenAccount,
      wallet.publicKey,
      tokenAmount,
      [],
      TOKEN_PROGRAM_ID
    );
    
    // Create transaction
    const transaction = new Transaction().add(transferInstruction);
    
    // Get recent blockhash with better error handling and commitment level
    let blockhash, lastValidBlockHeight;

    try {
      const latest = await connection.getLatestBlockhashAndContext("finalized");
      blockhash = latest.value.blockhash;
      lastValidBlockHeight = latest.value.lastValidBlockHeight;
      console.log('✅ Successfully fetched blockhash:', blockhash);
    } catch (blockhashError) {
      console.error('❌ Failed to fetch recent blockhash:', blockhashError);
      throw new Error(`Failed to get recent blockhash: ${blockhashError.message}`);
    }

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

        
    console.log('📝 Transaction prepared with blockhash:', blockhash);
    
    // Use sendTransaction method directly (destructured from useWallet)
    let signature;
    
    try {
      if (wallet.sendTransaction && typeof wallet.sendTransaction === 'function') {
        console.log('📤 Using sendTransaction method...');
        signature = await wallet.sendTransaction(transaction, connection, {
          skipPreflight: false,
          preflightCommitment: 'finalized'
        });
      } else {
        throw new Error('❌ sendTransaction method not available. Available methods: ' + Object.keys(wallet).join(', '));
      }
    } catch (walletError) {
      console.error('❌ Wallet operation failed:', walletError);
      throw new Error(`Wallet operation failed: ${walletError.message}`);
    }
    
    console.log('📤 Transaction sent with signature:', signature);
    
    // Wait for confirmation
    try {
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature
      });
      console.log('✅ Transaction confirmed');
    } catch (confirmError) {
      console.error('⚠️ Confirmation error:', confirmError);
      console.log('🔄 Transaction may still be processing...');
    }
    
    console.log('✅ Solana XRPB Payment Successful!');
    console.log('Transaction Signature:', signature);
    console.log('View on Solscan:', `https://solscan.io/tx/${signature}`);
    
    const paymentData = {
      blockchain: 'Solana',
      token: 'XRPB-SOL',
      from: wallet.publicKey.toString(),
      to: PAYMENT_RECIPIENTS.solana,
      amount: amount,
      signature: signature,
      timestamp: new Date().toISOString(),
      explorerUrl: `https://solscan.io/tx/${signature}`,
      network: 'mainnet-beta',
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight
    };
    
    localStorage.setItem(`solana_xrpb_payment_${signature}`, JSON.stringify(paymentData));
    console.log('💾 Payment data saved locally:', paymentData);
    
    return { success: true, signature, paymentData };
    
  } catch (error) {
    console.error('❌ Solana XRPB Payment Failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * XRPL XRPB Payment Function
 * @param {Object} wallet - Connected XRPL wallet
 * @param {number} amount - Amount in XRPB tokens
 */
export const sendXRPLXRPBPayment = async (wallet, amount) => {
  try {
    // if (!wallet || !wallet.account) {
    //   alert("This is the issue")
    //   throw new Error('XRPL Wallet not connected');
    // }

    console.log('🔵 XRPL XRPB PAYMENT INITIATED (MAINNET)');
    console.log('From:', wallet.account);
    console.log('To:', PAYMENT_RECIPIENTS.xrpl);
    console.log('Amount:', amount, 'XRPB');
    
    // Create XUMM payment request for XRPB token
    const paymentUrl = `https://xaman.app/detect/request:${PAYMENT_RECIPIENTS.xrpl}?amount=${amount}&currency=${XRPB_TOKENS.xrpl.currencyDeets}&issuer=${XRPB_TOKENS.xrpl.issuer}&network=mainnet`;
    
    console.log('🔗 XUMM XRPB Payment URL:', paymentUrl);
    
    // Open XUMM payment request
    if (typeof window !== 'undefined') {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  if (isIOS) {
    // For iOS, show confirmation before navigating
    const userConfirmed = confirm(
      'You will be redirected to XAMAN app to complete the payment. Continue?'
    );
    
    if (userConfirmed) {
      window.location.href = paymentUrl;
    } else {
      throw new Error('Payment cancelled by user');
    }
  } else {
    // For other platforms, try new tab first
    const newWindow = window.open(paymentUrl, '_blank');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      const userConfirmed = confirm(
        'Popup was blocked. Open payment page in current tab?'
      );
      
      if (userConfirmed) {
        window.location.href = paymentUrl;
      } else {
        throw new Error('Payment cancelled by user');
      }
    }
  }
}
    
    console.log('⏳ Monitoring for XRPB payment completion...');
    console.log('Please complete the XRPB payment in XUMM app');
    
    // Monitor for XRPB token transactions using currencyDeets
    const monitoringResult = await monitorXRPLXRPBTransactions(
      PAYMENT_RECIPIENTS.xrpl, 
      amount, 
      XRPB_TOKENS.xrpl.currencyDeets, // Use currencyDeets instead of currency
      XRPB_TOKENS.xrpl.issuer,
      300
    );
    
    if (monitoringResult.success) {
      console.log('✅ XRPL XRPB Payment Successful!');
      console.log('Transaction Hash:', monitoringResult.txHash);
      
      const explorerUrl = `https://livenet.xrpl.org/transactions/${monitoringResult.txHash}`;
      console.log('View on XRPL Explorer:', explorerUrl);
      
      const paymentData = {
        blockchain: 'XRPL',
        token: 'XRPB',
        from: wallet.account,
        to: PAYMENT_RECIPIENTS.xrpl,
        amount: amount,
        txHash: monitoringResult.txHash,
        timestamp: new Date().toISOString(),
        explorerUrl: explorerUrl,
        paymentUrl: paymentUrl,
        verified: true,
        network: 'mainnet'
      };
      
      localStorage.setItem(`xrpl_xrpb_payment_${monitoringResult.txHash}`, JSON.stringify(paymentData));
      console.log('💾 Payment data saved locally:', paymentData);
      
      return { success: true, txHash: monitoringResult.txHash, paymentData, paymentUrl };
    } else {
      throw new Error(monitoringResult.error || 'XRPB payment monitoring failed');
    }
    
  } catch (error) {
    console.error('❌ XRPL XRPB Payment Failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * XRPL EVM XRPB Payment Function
 * @param {Function} getSignerFn - Function to get the Wagmi signer
 * @param {number} amount - Amount in XRPB tokens
 */
export const sendXRPLEvmXRPBPayment = async (getSignerFn, amount) => {
  try {
    if (!getSignerFn) {
      throw new Error('Signer function not provided');
    }

    // Get signer from Wagmi
    const signer = await getSignerFn();
    if (!signer) {
      throw new Error('XRPL EVM Signer not available');
    }

    const fromAddress = await signer.getAddress();
    
    console.log('🟠 XRPL EVM XRPB PAYMENT INITIATED (TESTNET)');
    console.log('From:', fromAddress);
    console.log('To:', PAYMENT_RECIPIENTS.xrplEvm);
    console.log('Amount:', amount, 'XRPB');
    
    // ERC-20 XRPB Token Contract ABI (minimal)
    const xrpbAbi = [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];
    
    // Create contract instance
    const xrpbContract = new ethers.Contract(
      XRPB_TOKENS.xrplEvm.address,
      xrpbAbi,
      signer
    );
    
    // Convert amount to token units (considering decimals)
    const tokenAmount = ethers.parseUnits(amount.toString(), XRPB_TOKENS.xrplEvm.decimals);
    
    console.log('📝 XRPB Transfer prepared:', {
      contract: XRPB_TOKENS.xrplEvm.address,
      to: PAYMENT_RECIPIENTS.xrplEvm,
      amount: tokenAmount.toString()
    });
    
    // Send XRPB transfer transaction
    const txResponse = await xrpbContract.transfer(
      PAYMENT_RECIPIENTS.xrplEvm,
      tokenAmount
    );
    
    console.log('⏳ XRPB transfer sent, waiting for confirmation...');
    console.log('Transaction Hash:', txResponse.hash);
    
    // Wait for confirmation
    const receipt = await txResponse.wait();
    
    console.log('✅ XRPL EVM XRPB Payment Successful!');
    console.log('Transaction Hash:', txResponse.hash);
    console.log('Block Number:', receipt.blockNumber);
    console.log('Gas Used:', receipt.gasUsed.toString());
    console.log('View on XRPL EVM Mainnet Explorer:', `https://explorer.xrplevm.org/tx/${txResponse.hash}`);
    
    const paymentData = {
      blockchain: 'XRPL_EVM',
      token: 'XRPB',
      from: fromAddress,
      to: PAYMENT_RECIPIENTS.xrplEvm,
      amount: amount,
      txHash: txResponse.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      timestamp: new Date().toISOString(),
      explorerUrl: `https://explorer.xrplevm.org/tx/${txResponse.hash}`,
      network: 'mainnet'
    };
    
    localStorage.setItem(`xrpl_evm_xrpb_payment_${txResponse.hash}`, JSON.stringify(paymentData));
    console.log('💾 Payment data saved locally:', paymentData);
    
    return { success: true, txHash: txResponse.hash, paymentData };
    
  } catch (error) {
    console.error('❌ XRPL EVM XRPB Payment Failed:', error);
    return { success: false, error: formatErrorMessage(error.message) };
  }
};

/**
 * Monitor XRPL XRPB Token Transactions
 * @param {string} destinationAddress - Address to monitor
 * @param {number} expectedAmount - Expected payment amount
 * @param {string} currency - Token currency code
 * @param {string} issuer - Token issuer address
 * @param {number} timeoutSeconds - Monitoring timeout in seconds
 */
export const monitorXRPLXRPBTransactions = async (destinationAddress, expectedAmount, currency, issuer, timeoutSeconds = 300) => {
  try {
    console.log('🔍 Starting XRPL XRPB transaction monitoring...');
    console.log('Destination:', destinationAddress);
    console.log('Expected Amount:', expectedAmount, currency);
    console.log('Issuer:', issuer);
    
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;
    const checkInterval = 10000; // 10 seconds
    
    const rpcEndpoint = 'https://xrplcluster.com/';
    console.log('📡 Using XRPL mainnet endpoint:', rpcEndpoint);
    
    const monitorStartTime = new Date();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        console.log('🔄 Checking for new XRPB transactions...');
        
        const rpcRequest = {
          method: 'account_tx',
          params: [{
            account: destinationAddress,
            ledger_index_min: -1,
            ledger_index_max: -1,
            limit: 20,
            forward: false
          }]
        };
        
        const response = await fetch(rpcEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rpcRequest)
        });
        
        if (!response.ok) {
          console.log(`⚠️ XRPL request failed: ${response.status}`);
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          continue;
        }
        
        const data = await response.json();
        
        if (data.error) {
          console.log('⚠️ XRPL error:', data.error);
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          continue;
        }
        
        const transactions = data.result?.transactions || [];
        console.log("Transactions: ", transactions)
        console.log(`📋 Found ${transactions.length} recent transactions`);
        
        for (const txData of transactions) {
          const tx = txData.tx;
          const meta = txData.meta;
          
          if (!tx || tx.TransactionType !== 'Payment') continue;
          if (tx.Destination !== destinationAddress) continue;
          if (!meta || meta.TransactionResult !== 'tesSUCCESS') continue;
          
          // Check if this is an XRPB token payment or native XRP payment
          let deliveredAmount = 0;
          let isValidPayment = false;
          let paymentType = 'unknown';
          
          console.log('🔍 Analyzing transaction:', {
            hash: tx.hash,
            delivered_amount: meta.delivered_amount,
            tx_Amount: tx.Amount,
            expected_currency: currency,
            expected_currencyDeets: XRPB_TOKENS.xrpl.currencyDeets,
            expected_issuer: issuer
          });
          
          // First check for XRPB token in delivered_amount (object format)
          if (meta.delivered_amount && typeof meta.delivered_amount === 'object') {
            const delivered = meta.delivered_amount;
            console.log('📦 Object delivered_amount:', delivered);
            // Check using currencyDeets hex value for proper XRPB identification
            if ((delivered.currency === XRPB_TOKENS.xrpl.currencyDeets || delivered.currency === currency) && delivered.issuer === issuer) {
              deliveredAmount = parseFloat(delivered.value);
              isValidPayment = true;
              paymentType = 'XRPB_TOKEN';
              console.log('✅ Found XRPB in delivered_amount object');
            }
          } 
          // Then check for XRPB token in tx.Amount (object format)
          else if (tx.Amount && typeof tx.Amount === 'object') {
            const amount = tx.Amount;
            console.log('📦 Object tx.Amount:', amount);
            // Check using currencyDeets hex value for proper XRPB identification
            if ((amount.currency === XRPB_TOKENS.xrpl.currencyDeets || amount.currency === currency) && amount.issuer === issuer) {
              deliveredAmount = parseFloat(amount.value);
              isValidPayment = true;
              paymentType = 'XRPB_TOKEN';
              console.log('✅ Found XRPB in tx.Amount object');
            }
          }
          // Handle string delivered_amount (could be XRP or XRPB)
          else if (typeof meta.delivered_amount === 'string') {
            console.log('⚠️ String delivered_amount detected, analyzing...');
            
            // Check AffectedNodes for XRPB-related RippleState changes
            const affectedNodes = meta.AffectedNodes || [];
            let foundXRPBNode = false;
            
            for (const node of affectedNodes) {
              const nodeData = node.ModifiedNode || node.CreatedNode || node.DeletedNode;
              if (nodeData && nodeData.LedgerEntryType === 'RippleState') {
                const finalFields = nodeData.FinalFields || nodeData.NewFields;
                if (finalFields) {
                  console.log('🔍 Checking RippleState node:', finalFields);
                  // Check for XRPB using currencyDeets or issuer
                  const hasXRPBCurrency = (finalFields.LowLimit && 
                    (finalFields.LowLimit.currency === XRPB_TOKENS.xrpl.currencyDeets || finalFields.LowLimit.issuer === issuer)) ||
                    (finalFields.HighLimit && 
                    (finalFields.HighLimit.currency === XRPB_TOKENS.xrpl.currencyDeets || finalFields.HighLimit.issuer === issuer));
                  
                  if (hasXRPBCurrency) {
                    foundXRPBNode = true;
                    console.log('✅ Found XRPB RippleState node with currencyDeets');
                    break;
                  }
                }
              }
            }
            
            if (foundXRPBNode) {
              // This is actually an XRPB transaction disguised as XRP
              deliveredAmount = parseFloat(meta.delivered_amount) / 1000000;
              isValidPayment = true;
              paymentType = 'XRPB_DISGUISED';
              console.log('✅ Confirmed XRPB payment via RippleState analysis using currencyDeets');
            } else {
              // This is a native XRP payment - accept it
              deliveredAmount = parseFloat(meta.delivered_amount) / 1000000; // Convert drops to XRP
              isValidPayment = true;
              paymentType = 'NATIVE_XRP';
              console.log('✅ Processing as native XRP payment');
            }
          }
          
          console.log('📊 Payment analysis result:', {
            isValidPayment,
            paymentType,
            deliveredAmount,
            expectedAmount,
            currency,
            currencyDeets: XRPB_TOKENS.xrpl.currencyDeets,
            issuer
          });
          
          if (!isValidPayment) {
            console.log('⏭️ Skipping invalid transaction');
            continue;
          }
          
          // Parse transaction timestamp
          let txTime = new Date();
          if (tx.date && typeof tx.date === 'number') {
            txTime = new Date((tx.date + 946684800) * 1000);
          }
          
          // Only consider recent transactions
          const bufferTime = new Date(monitorStartTime.getTime() - 60000);
          if (txTime < bufferTime) continue;
          
          console.log('📥 Found XRPB transaction:', {
            hash: tx.hash,
            amount: deliveredAmount,
            expected: expectedAmount,
            currency: currency,
            issuer: issuer
          });
          
          // Check if amount matches
          const tolerance = Math.max(0.001, expectedAmount * 0.09);
          const amountDifference = Math.abs(deliveredAmount - expectedAmount);
          
          if (amountDifference <= tolerance) {
            console.log('✅ XRPB payment verified!');
            return {
              success: true,
              txHash: tx.hash,
              actualAmount: deliveredAmount,
              expectedAmount: expectedAmount,
              currency: currency,
              issuer: issuer,
              timestamp: txTime.toISOString(),
              transaction: tx,
              metadata: meta
            };
          }
        }
        
      } catch (error) {
        console.log('❌ Error checking XRPB transactions:', error.message);
      }
      
      console.log(`⏳ Waiting ${checkInterval/1000} seconds before next check...`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    return {
      success: false,
      error: 'XRPB payment monitoring timeout'
    };
    
  } catch (error) {
    console.error('❌ XRPL XRPB Transaction Monitoring Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Legacy function names for backward compatibility
export const sendSolanaPayment = sendSolanaXRPBPayment;
export const sendXRPPayment = sendXRPLXRPBPayment;
export const sendEVMPayment = sendXRPLEvmXRPBPayment;

/**
 * Enhanced XRPB price fetching with GeckoTerminal as primary source
 * @returns {Promise<number|null>} XRPB price in USD or null if error
 */
export const getXRPBPriceInUSDEnhanced = async () => {
  const sources = [
    // Source 1: GeckoTerminal API (most accurate for this specific pool)
    async () => {
      return await getXRPBPriceFromGeckoTerminal();
    },
    
    // Source 2: Your existing DEX pair method (fallback)
    async () => {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const pair = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, provider);
      
      const token0 = await pair.token0();
      const token1 = await pair.token1();
      const [reserve0, reserve1] = await pair.getReserves();
      
      let reserveXRPB, reserveXRP;
      if (token0.toLowerCase() === XRPB_ADDRESS.toLowerCase()) {
        reserveXRPB = reserve0;
        reserveXRP = reserve1;
      } else {
        reserveXRPB = reserve1;
        reserveXRP = reserve0;
      }
      
      const priceInXRP = Number(reserveXRP) / Number(reserveXRPB);
      
      const xrpResponse = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd"
      );
      const xrpData = await xrpResponse.json();
      
      return priceInXRP * xrpData.ripple.usd;
    },
    
    // Source 3: Direct CoinGecko (if XRPB is listed)
    async () => {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=xrpb&vs_currencies=usd"
      );
      const data = await response.json();
      return data.xrpb?.usd || null;
    }
  ];
  
  for (let i = 0; i < sources.length; i++) {
    try {
      console.log(`🔄 Trying price source ${i + 1}...`);
      const price = await sources[i]();
      if (price && price > 0) {
        console.log(`✅ Price fetched from source ${i + 1}: $${price.toFixed(6)}`);
        return price;
      }
    } catch (error) {
      console.warn(`⚠️ Source ${i + 1} failed:`, error.message);
    }
  }
  
  console.warn('⚠️ All price sources failed, using fallback');
  return 3.10; // Fallback price
};



/**
 * Get XRPB price with multiple fallback sources
 * @returns {Promise<number>} XRPB price in USD
 */
export const getXRPBPriceMultiSource = async () => {
  const sources = [
    // Source 1: GeckoTerminal + XRPL (most accurate)
    async () => {
      return await getXRPBPriceFromGeckoTerminal();
    },
    
    // Source 2: XRPL EVM DEX pair (existing method)
    async () => {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const pair = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, provider);
      
      const token0 = await pair.token0();
      const token1 = await pair.token1();
      const [reserve0, reserve1] = await pair.getReserves();
      
      let reserveXRPB, reserveXRP;
      if (token0.toLowerCase() === XRPB_ADDRESS.toLowerCase()) {
        reserveXRPB = reserve0;
        reserveXRP = reserve1;
      } else {
        reserveXRPB = reserve1;
        reserveXRP = reserve0;
      }
      
      const priceInXRP = Number(reserveXRP) / Number(reserveXRPB);
      
      const xrpResponse = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd"
      );
      const xrpData = await xrpResponse.json();
      
      return priceInXRP * xrpData.ripple.usd;
    }
  ];
  
  for (let i = 0; i < sources.length; i++) {
    try {
      console.log(`🔄 Trying XRPB price source ${i + 1}...`);
      const price = await sources[i]();
      if (price && price > 0) {
        console.log(`✅ XRPB price fetched from source ${i + 1}: $${price.toFixed(8)}`);
        return price;
      }
    } catch (error) {
      console.warn(`⚠️ XRPB price source ${i + 1} failed:`, error.message);
    }
  }
  
  console.warn('⚠️ All XRPB price sources failed, using fallback');
  return 0.0001; // Conservative fallback based on your data
};

/**
 * Get XRPB price from GeckoTerminal (GeckoTerminal)
 */
export const getXRPBPriceFromGeckoTerminal = async () => {
  try {
    const response = await fetch(
      'https://api.geckoterminal.com/api/v2/networks/solana/tokens/FJLz7hP4EXVMVnRBtP77V4k55t2BfXuajKQp1gcwpump'
    );
    
    if (response.ok) {
      const data = await response.json();
      const price = parseFloat(data.data.attributes.price_usd);
      
      if (price && price > 0) {
        console.log('✅ XRPB price from GeckoTerminal (full precision):', price);
        return price; // Return the exact value without rounding
      }
    }
    
    console.warn('⚠️ Could not fetch XRPB price from GeckoTerminal');
    return null;
  } catch (error) {
    console.error('❌ Error fetching XRPB price from GeckoTerminal:', error);
    return null;
  }
};

/**
 * Get XRPB price from Solana using the new API
 */
export const getXRPBPriceFromSolana = async () => {
  try {
    const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/FJLz7hP4EXVMVnRBtP77V4k55t2BfXuajKQp1gcwpump');
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.pairs && Array.isArray(data.pairs) && data.pairs.length > 0) {
        const pair = data.pairs[0];
        
        if (pair.priceUsd) {
          const priceValue = parseFloat(pair.priceUsd);
          
          if (priceValue && priceValue > 0) {
            console.log('✅ XRPB price from DexScreener (Solana):', priceValue);
            return priceValue;
          }
        }
      }
    }
    
    console.warn('⚠️ Could not fetch XRPB price from DexScreener API');
    return null;
  } catch (error) {
    console.error('❌ Error fetching XRPB price from DexScreener API:', error);
    return null;
  }
};

/**
 * Get XRPB price from XRPL using OnTheDex API (returns price in USD)
 */
export const getXRPBPriceFromXRPL = async () => {
  try {
    const response = await fetch('https://api.onthedex.live/public/v1/aggregator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tokens: ['XRPB.rsEaYfqdZKNbD3SK55xzcjPm3nDrMj4aUT']
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Check if we have tokens data
      if (data.tokens && Array.isArray(data.tokens) && data.tokens.length > 0) {
        const token = data.tokens[0];
        
        if (token.price_usd && typeof token.price_usd === 'number') {
          console.log('✅ XRPB price from OnTheDex API (USD):', token.dex.pairs[0].bid);
          return token.dex.pairs[0].bid;
        }
      }
    }
    
    console.warn('⚠️ Could not fetch XRPB price from OnTheDex API');
    return null;
  } catch (error) {
    console.error('❌ Error fetching XRPB price from OnTheDex API:', error);
    return null;
  }
};

/**
 * Get XRPB price from XRPL EVM - simplified without CoinGecko
 */
export const getXRPBPriceFromXRPLEVM = async () => {
      try {
        console.log('🔄 Fetching XRPB price from XRiSE33 API...');
        
        const response = await fetch('https://api.xrise33.com/tokens?limit=1&page=10');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract the XRPB token data
        if (data.data && data.data.length > 0) {
          const xrpbToken = data.data[0];
          
          // Verify this is the correct XRPB token
          if (xrpbToken.symbol === 'XRPB' && xrpbToken.address.toLowerCase() === '0x6d8630d167458b337a2c8b6242c354d2f4f75d96') {
            const usdPrice = parseFloat(xrpbToken.usdPerToken);
            console.log(`✅ XRPB Price from XRiSE33: $${usdPrice}`);
            return usdPrice;
          } else {
            throw new Error('XRPB token not found in API response');
          }
        } else {
          throw new Error('No token data found in API response');
        }
      } catch (error) {
        console.error('❌ Error fetching XRPB price from XRiSE33 API:', error);
        // Fallback to previous method or return null
        console.log('⚠️ Falling back to previous price calculation method...');
        return null;
      }
    };


/**
 * Get all XRPB prices from different chains using individual API calls only
 */
export const getAllXRPBPrices = async () => {
  try {
    console.log('🔄 Fetching XRPB prices from all chains using individual API calls...');
    
    // Use individual API calls only (no combined endpoint)
    const [solanaPrice, xrplPrice, xrplEvmPrice] = await Promise.allSettled([
      getXRPBPriceFromSolana(),
      getXRPBPriceFromXRPL(),
      getXRPBPriceFromXRPLEVM()
    ]);
    
    const results = {
      solana: solanaPrice.status === 'fulfilled' ? solanaPrice.value : null,
      xrpl: xrplPrice.status === 'fulfilled' ? xrplPrice.value : null,
      xrplEvm: xrplEvmPrice.status === 'fulfilled' ? xrplEvmPrice.value : null
    };
    
    console.log('✅ All XRPB prices fetched (individual calls only):', results);
    return results;
  } catch (error) {
    console.error('❌ Error fetching all XRPB prices:', error);
    return {
      solana: null,
      xrpl: null,
      xrplEvm: null
    };
  }
};
