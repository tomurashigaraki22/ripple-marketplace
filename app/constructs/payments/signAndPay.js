import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ethers } from 'ethers';
import { Client, Wallet, xrpToDrops } from 'xrpl';

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
// TESTNET XRPB Token Addresses
const XRPB_TOKENS = {
  solana: {
    mint: 'FJLz7hP4EXVMVnRBtP77V4k55t2BfXuajKQp1gcwpump', // Replace with actual XRPB-SOL testnet mint
    decimals: 6,
    network: 'devnet' // Changed to devnet for testing
  },
  xrpl: {
    currency: 'XRPB',
    issuer: 'rsEaYfqdZKNbD3SK55xzcjPm3nDrMj4aUT', // Replace with testnet XRPB issuer
    network: 'testnet'
  },
  xrplEvm: {
    address: '0x2557C801144b11503BB524C5503AcCd48E5F54fE', // Replace with testnet XRPB contract
    decimals: 18,
    network: 'testnet',
    chainId: 1449000, // Correct testnet chain ID
    rpcUrl: 'https://rpc.testnet.xrplevm.org' // Correct testnet RPC
  }
};

// Payment recipient addresses (your testnet wallet addresses)


// Update recipient for testnet
const PAYMENT_RECIPIENTS = {
  solana: '5D927MqdT7MvSGRzMGt81WRvJ5sSYEC3KpN5knQV7GsC',
  xrpl: 'rEKpA2YoapyM8aTQGcEeCQVCaPKk1ZCCvA', 
  xrplEvm: '0x5716dD191878F342A72633665F852bd0534B9Bc1' // Replace with your testnet wallet
};

/**
 * Solana XRPB-SOL Payment Function
 * @param {Object} wallet - Connected Solana wallet
 * @param {number} amount - Amount in XRPB-SOL tokens
 * @param {Connection} connection - Solana connection object
 */
export const sendSolanaXRPBPayment = async (wallet, amount, connection) => {
  try {
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Solana wallet not connected');
    }

    console.log('🟣 SOLANA XRPB PAYMENT INITIATED (MAINNET)');
    console.log('From:', wallet.publicKey.toString());
    console.log('To:', PAYMENT_RECIPIENTS.solana);
    console.log('Amount:', amount, 'XRPB-SOL');
    
    const mintAddress = new PublicKey(XRPB_TOKENS.solana.mint);
    const recipientAddress = new PublicKey(PAYMENT_RECIPIENTS.solana);
    
    // Get associated token accounts
    const senderTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      wallet.publicKey
    );
    
    const recipientTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      recipientAddress
    );
    
    // Convert amount to token units (considering decimals)
    const tokenAmount = amount * Math.pow(10, XRPB_TOKENS.solana.decimals);
    
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
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Sign and send transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    // Wait for confirmation
    await connection.confirmTransaction(signature);
    
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
      network: 'mainnet'
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
    if (!wallet || !wallet.account) {
      throw new Error('XRPL Wallet not connected');
    }

    console.log('🔵 XRPL XRPB PAYMENT INITIATED (MAINNET)');
    console.log('From:', wallet.account);
    console.log('To:', PAYMENT_RECIPIENTS.xrpl);
    console.log('Amount:', amount, 'XRPB');
    
    // Create XUMM payment request for XRPB token
    const paymentUrl = `https://xaman.app/detect/request:${PAYMENT_RECIPIENTS.xrpl}?amount=${amount}&currency=${XRPB_TOKENS.xrpl.currency}&issuer=${XRPB_TOKENS.xrpl.issuer}&network=mainnet`;
    
    console.log('🔗 XUMM XRPB Payment URL:', paymentUrl);
    
    // Open XUMM payment request
    if (typeof window !== 'undefined') {
      window.open(paymentUrl, '_blank');
    }
    
    console.log('⏳ Monitoring for XRPB payment completion...');
    console.log('Please complete the XRPB payment in XUMM app');
    
    // Monitor for XRPB token transactions
    const monitoringResult = await monitorXRPLXRPBTransactions(
      PAYMENT_RECIPIENTS.xrpl, 
      amount, 
      XRPB_TOKENS.xrpl.currency,
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
    console.log('View on XRPL EVM Testnet Explorer:', `https://explorer.testnet.xrplevm.org/tx/${txResponse.hash}`);
    
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
      explorerUrl: `https://explorer.testnet.xrplevm.org/tx/${txResponse.hash}`,
      network: 'testnet'
    };
    
    localStorage.setItem(`xrpl_evm_xrpb_payment_${txResponse.hash}`, JSON.stringify(paymentData));
    console.log('💾 Payment data saved locally:', paymentData);
    
    return { success: true, txHash: txResponse.hash, paymentData };
    
  } catch (error) {
    console.error('❌ XRPL EVM XRPB Payment Failed:', error);
    return { success: false, error: error.message };
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
        console.log(`📋 Found ${transactions.length} recent transactions`);
        
        for (const txData of transactions) {
          const tx = txData.tx;
          const meta = txData.meta;
          
          if (!tx || tx.TransactionType !== 'Payment') continue;
          if (tx.Destination !== destinationAddress) continue;
          if (!meta || meta.TransactionResult !== 'tesSUCCESS') continue;
          
          // Check if this is an XRPB token payment
          let deliveredAmount = 0;
          let isXRPBPayment = false;
          
          if (meta.delivered_amount && typeof meta.delivered_amount === 'object') {
            const delivered = meta.delivered_amount;
            if (delivered.currency === currency && delivered.issuer === issuer) {
              deliveredAmount = parseFloat(delivered.value);
              isXRPBPayment = true;
            }
          } else if (tx.Amount && typeof tx.Amount === 'object') {
            const amount = tx.Amount;
            if (amount.currency === currency && amount.issuer === issuer) {
              deliveredAmount = parseFloat(amount.value);
              isXRPBPayment = true;
            }
          }
          
          if (!isXRPBPayment) continue;
          
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
          const tolerance = Math.max(0.001, expectedAmount * 0.02);
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
