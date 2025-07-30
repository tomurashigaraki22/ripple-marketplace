import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ethers } from 'ethers';
import { Client, Wallet, xrpToDrops } from 'xrpl';

// Generate random addresses for each blockchain
const generateRandomAddresses = () => {
  // Random Solana address (base58 format)
  const solanaAddress = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH';
  
  // Random Ethereum address with proper checksum using ethers.getAddress()
  const evmAddress = "0x6b99ee5baa3b235ffb3d572a70ca79cde097aa94";
  
  // Random XRP address
  const xrpAddress = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH';
  
  return { solanaAddress, evmAddress, xrpAddress };
};

const { solanaAddress, evmAddress, xrpAddress } = generateRandomAddresses();

/**
 * Solana Payment Helper Function
 * @param {Object} wallet - Connected Solana wallet
 * @param {number} amount - Amount in SOL to send
 * @param {Connection} connection - Solana connection object
 */
export const sendSolanaPayment = async (wallet, amount = 0.01, connection) => {
  try {
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    console.log('🟣 SOLANA PAYMENT INITIATED');
    console.log('From:', wallet.publicKey.toString());
    console.log('To:', solanaAddress);
    console.log('Amount:', amount, 'SOL');
    
    const recipientPubKey = new PublicKey(solanaAddress);
    const lamports = amount * LAMPORTS_PER_SOL;
    
    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipientPubKey,
        lamports: lamports,
      })
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Sign and send transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    // Wait for confirmation
    await connection.confirmTransaction(signature);
    
    console.log('✅ Solana Payment Successful!');
    console.log('Transaction Signature:', signature);
    console.log('View on Solscan:', `https://solscan.io/tx/${signature}?cluster=devnet`);
    
    // Store locally for verification
    const paymentData = {
      blockchain: 'Solana',
      from: wallet.publicKey.toString(),
      to: solanaAddress,
      amount: amount,
      signature: signature,
      timestamp: new Date().toISOString(),
      explorerUrl: `https://solscan.io/tx/${signature}?cluster=devnet`
    };
    
    localStorage.setItem(`solana_payment_${signature}`, JSON.stringify(paymentData));
    console.log('💾 Payment data saved locally:', paymentData);
    
    return { success: true, signature, paymentData };
    
  } catch (error) {
    console.error('❌ Solana Payment Failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * XRP Payment Helper Function with Real XUMM Payment Request (TESTNET)
 * @param {Object} wallet - Connected XRP wallet (XUMM)
 * @param {number} amount - Amount in XRP to send
 * @param {string} network - Network type ('XRPL' or 'XAHAU')
 */
export const sendXRPPayment = async (wallet, amount = 1, network = 'XRPL') => {
  try {
    if (!wallet || !wallet.account) {
      throw new Error('XRP Wallet not connected');
    }

    console.log('🔵 XRP PAYMENT INITIATED (TESTNET)');
    console.log('From:', wallet.account);
    console.log('To:', xrpAddress);
    console.log('Amount:', amount, 'XRP');
    console.log('Network:', network, '(TESTNET)');
    
    // Create XUMM payment request URL for TESTNET
    const paymentUrl = `https://xaman.app/detect/request:${xrpAddress}?amount=${amount}&network=${network}`;
    
    console.log('🔗 XUMM Payment URL (TESTNET):', paymentUrl);
    
    // Open XUMM payment request
    if (typeof window !== 'undefined') {
      window.open(paymentUrl, '_blank');
    }
    
    // Start monitoring for actual transactions on TESTNET
    console.log('⏳ Monitoring for payment completion on TESTNET...');
    console.log('Please complete the payment in XUMM app');
    
    // Monitor for actual transactions to the destination address
    const monitoringResult = await monitorXRPTransactions(xrpAddress, amount, network, 300); // 5 minutes timeout
    
    if (monitoringResult.success) {
      console.log('✅ XRP Payment Successful (TESTNET)!');
      console.log('Transaction Hash:', monitoringResult.txHash);
      
      // Use TESTNET explorer URLs
      const explorerUrl = network === 'XRPL' 
        ? `https://testnet.xrpl.org/transactions/${monitoringResult.txHash}`
        : `https://explorer.xahau-test.net/tx/${monitoringResult.txHash}`;
      
      console.log('View on TESTNET Explorer:', explorerUrl);
      
      // Store locally for verification
      const paymentData = {
        blockchain: 'XRP',
        network: `${network}_TESTNET`,
        from: wallet.account,
        to: xrpAddress,
        amount: amount,
        txHash: monitoringResult.txHash,
        timestamp: new Date().toISOString(),
        explorerUrl: explorerUrl,
        paymentUrl: paymentUrl,
        verified: true,
        actualAmount: monitoringResult.actualAmount,
        ledgerIndex: monitoringResult.ledgerIndex,
        testnet: true
      };
      
      localStorage.setItem(`xrp_payment_${monitoringResult.txHash}`, JSON.stringify(paymentData));
      console.log('💾 Payment data saved locally (TESTNET):', paymentData);
      
      return { success: true, txHash: monitoringResult.txHash, paymentData, paymentUrl };
    } else {
      throw new Error(monitoringResult.error || 'Payment monitoring failed or timed out');
    }
    
  } catch (error) {
    console.error('❌ XRP Payment Failed (TESTNET):', error);
    return { success: false, error: error.message };
  }
};

/**
 * Monitor XRP Transactions using JSON-RPC endpoint
 * @param {string} destinationAddress - Address to monitor
 * @param {number} expectedAmount - Expected payment amount
 * @param {string} network - Network type ('XRPL' or 'XAHAU')
 * @param {number} timeoutSeconds - Monitoring timeout in seconds
 */
export const monitorXRPTransactions = async (destinationAddress, expectedAmount, network = 'XRPL', timeoutSeconds = 300) => {
  try {
    console.log('🔍 Starting XRP transaction monitoring via JSON-RPC...');
    console.log('Destination:', destinationAddress);
    console.log('Expected Amount:', expectedAmount, 'XRP');
    console.log('Network:', network);
    console.log('Timeout:', timeoutSeconds, 'seconds');
    
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;
    const checkInterval = 10000; // 10 seconds
    
    // JSON-RPC endpoints for testnet
    const getRpcEndpoint = (network) => {
      if (network === 'XRPL') {
        return 'https://s.altnet.rippletest.net:51234/'; // XRPL Testnet
      } else {
        return 'https://xahau-test.net/'; // XAHAU Testnet
      }
    };
    
    const rpcEndpoint = getRpcEndpoint(network);
    console.log('📡 Using JSON-RPC endpoint:', rpcEndpoint);
    
    // Store initial timestamp to filter new transactions
    const monitorStartTime = new Date();
    
    // Polling loop
    while (Date.now() - startTime < timeoutMs) {
      try {
        console.log('🔄 Checking for new transactions via JSON-RPC...');
        
        // Query account transactions using JSON-RPC
        const rpcRequest = {
          method: 'account_tx',
          params: [{
            account: destinationAddress,
            ledger_index_min: -1,
            ledger_index_max: -1,
            limit: 20,
            forward: false // Get most recent first
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
          console.log(`⚠️ JSON-RPC request failed: ${response.status} ${response.statusText}`);
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          continue;
        }
        
        const data = await response.json();
        
        if (data.error) {
          console.log('⚠️ JSON-RPC error:', data.error);
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          continue;
        }
        
        console.log('📊 JSON-RPC Response received, checking transactions...');
        
        const transactions = data.result?.transactions || [];
        console.log(`📋 Found ${transactions.length} recent transactions`);
        
        // Check each transaction
        for (const txData of transactions) {
          const tx = txData.tx;
          const meta = txData.meta;
          
          if (!tx) continue;
          
          // Check if this is a payment to our destination
          const isPaymentToDestination = 
            tx.TransactionType === 'Payment' &&
            tx.Destination === destinationAddress;
          
          if (!isPaymentToDestination) continue;
          
          // Check transaction success
          const isSuccessful = meta && meta.TransactionResult === 'tesSUCCESS';
          if (!isSuccessful) continue;
          
          // Parse transaction timestamp
          let txTime;
          try {
            if (tx.date && typeof tx.date === 'number') {
              // Ripple timestamp (seconds since 2000-01-01)
              txTime = new Date((tx.date + 946684800) * 1000);
            } else if (txData.ledger_index && typeof txData.ledger_index === 'number') {
              // Estimate time based on ledger index (approximately 3.5 seconds per ledger)
              const estimatedTime = new Date(Date.now() - (txData.ledger_index * 3500));
              txTime = estimatedTime;
            } else {
              // Fallback to current time
              txTime = new Date();
            }
            
            // Validate the parsed date
            if (!txTime || isNaN(txTime.getTime())) {
              console.log('⚠️ Invalid timestamp found, using current time as fallback');
              txTime = new Date();
            }
          } catch (timestampError) {
            console.log('⚠️ Error parsing timestamp:', timestampError.message, 'Using current time as fallback');
            txTime = new Date();
          }
          
          // Only consider transactions after monitoring started (with 1 minute buffer)
          const bufferTime = new Date(monitorStartTime.getTime() - 60000); // 1 minute before
          if (txTime < bufferTime) {
            console.log('⏭️ Skipping old transaction:', tx.hash);
            continue;
          }
          
          // Parse delivered amount
          let deliveredAmount = 0;
          
          // Check delivered_amount in meta first (most accurate)
          if (meta.delivered_amount) {
            if (typeof meta.delivered_amount === 'string') {
              // Native XRP in drops
              deliveredAmount = parseInt(meta.delivered_amount) / 1000000;
            } else if (typeof meta.delivered_amount === 'object' && meta.delivered_amount.value) {
              // Non-XRP currency
              deliveredAmount = parseFloat(meta.delivered_amount.value);
            }
          } else if (tx.Amount) {
            // Fallback to transaction Amount
            if (typeof tx.Amount === 'string') {
              // Native XRP in drops
              deliveredAmount = parseInt(tx.Amount) / 1000000;
            } else if (typeof tx.Amount === 'object' && tx.Amount.value) {
              // Non-XRP currency
              deliveredAmount = parseFloat(tx.Amount.value);
            }
          }
          
          console.log('📥 Found potential transaction:', {
            hash: tx.hash,
            amount: deliveredAmount,
            expected: expectedAmount,
            time: txTime.toISOString(),
            destination: tx.Destination,
            ledger: txData.ledger_index
          });
          
          // Check if amount matches (with tolerance for fees)
          const tolerance = Math.max(0.001, expectedAmount * 0.02); // 2% tolerance or 0.001 XRP minimum
          const amountDifference = Math.abs(deliveredAmount - expectedAmount);
          
          if (amountDifference <= tolerance) {
            console.log('✅ Payment verified via JSON-RPC!');
            console.log(`💰 Amount match: ${deliveredAmount} XRP (expected: ${expectedAmount} XRP, tolerance: ${tolerance})`);
            
            return {
              success: true,
              txHash: tx.hash,
              actualAmount: deliveredAmount,
              expectedAmount: expectedAmount,
              tolerance: tolerance,
              timestamp: txTime.toISOString(),
              transaction: tx,
              metadata: meta,
              ledgerIndex: txData.ledger_index,
              testnet: true,
              verificationMethod: 'json_rpc'
            };
          } else {
            console.log(`💸 Amount mismatch: ${deliveredAmount} XRP vs expected ${expectedAmount} XRP (difference: ${amountDifference}, tolerance: ${tolerance})`);
          }
        }
        
      } catch (error) {
        console.log('❌ Error checking transactions via JSON-RPC:', error.message);
      }
      
      // Wait before next check
      console.log(`⏳ Waiting ${checkInterval/1000} seconds before next check...`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    // Timeout reached
    console.log('⏰ Monitoring timeout reached');
    return {
      success: false,
      error: 'Payment monitoring timeout - no matching transaction found via JSON-RPC'
    };
    
  } catch (error) {
    console.error('❌ XRP Transaction Monitoring via JSON-RPC Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify Specific XRP Transaction using JSON-RPC
 * @param {string} txHash - Transaction hash to verify
 * @param {number} expectedAmount - Expected payment amount
 * @param {string} expectedDestination - Expected destination address
 * @param {string} network - Network type ('XRPL' or 'XAHAU')
 */
export const verifyXRPTransaction = async (txHash, expectedAmount, expectedDestination, network = 'XRPL') => {
  try {
    console.log('🔍 Verifying XRP Transaction via JSON-RPC...');
    console.log('TX Hash:', txHash);
    console.log('Expected Amount:', expectedAmount, 'XRP');
    console.log('Expected Destination:', expectedDestination);
    console.log('Network:', network);
    
    // JSON-RPC endpoints for testnet
    const getRpcEndpoint = (network) => {
      if (network === 'XRPL') {
        return 'https://s.altnet.rippletest.net:51234/'; // XRPL Testnet
      } else {
        return 'https://xahau-test.net/'; // XAHAU Testnet
      }
    };
    
    const rpcEndpoint = getRpcEndpoint(network);
    console.log('📡 Using JSON-RPC endpoint:', rpcEndpoint);
    
    // Query specific transaction using JSON-RPC
    const rpcRequest = {
      method: 'tx',
      params: [{
        transaction: txHash,
        binary: false
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
      return {
        success: false,
        verified: false,
        error: `Transaction not found via JSON-RPC: ${response.status} ${response.statusText}`
      };
    }
    
    const data = await response.json();
    
    if (data.error) {
      return {
        success: false,
        verified: false,
        error: `Transaction not found via JSON-RPC: ${data.error.error_message || data.error}`
      };
    }
    
    const transaction = data.result;
    const meta = transaction.meta;
    
    if (!transaction) {
      return {
        success: false,
        verified: false,
        error: 'Transaction not found via JSON-RPC'
      };
    }
    
    // Verification checks
    const checks = {
      transactionExists: true,
      transactionValidated: transaction.validated === true,
      correctDestination: transaction.Destination === expectedDestination,
      transactionSuccessful: meta && meta.TransactionResult === 'tesSUCCESS'
    };
    
    // Check amount
    let deliveredAmount = 0;
    
    // Check delivered_amount in meta first (most accurate)
    if (meta && meta.delivered_amount) {
      if (typeof meta.delivered_amount === 'string') {
        deliveredAmount = parseInt(meta.delivered_amount) / 1000000; // Convert drops to XRP
      } else if (typeof meta.delivered_amount === 'object' && meta.delivered_amount.value) {
        deliveredAmount = parseFloat(meta.delivered_amount.value);
      }
    } else if (transaction.Amount) {
      if (typeof transaction.Amount === 'string') {
        deliveredAmount = parseInt(transaction.Amount) / 1000000;
      } else if (typeof transaction.Amount === 'object' && transaction.Amount.value) {
        deliveredAmount = parseFloat(transaction.Amount.value);
      }
    }
    
    const tolerance = Math.max(0.001, expectedAmount * 0.02); // 2% tolerance or 0.001 XRP minimum
    checks.correctAmount = Math.abs(deliveredAmount - expectedAmount) <= tolerance;
    
    console.log('🔍 Verification Checks via JSON-RPC:', checks);
    console.log('💰 Amount Details:', {
      delivered: deliveredAmount,
      expected: expectedAmount,
      tolerance: tolerance,
      difference: Math.abs(deliveredAmount - expectedAmount)
    });
    
    const allChecksPassed = Object.values(checks).every(check => check === true);
    
    if (allChecksPassed) {
      console.log('✅ Transaction verification successful via JSON-RPC!');
      return {
        success: true,
        verified: true,
        transaction: transaction,
        checks: checks,
        deliveredAmount: deliveredAmount,
        expectedAmount: expectedAmount,
        tolerance: tolerance,
        testnet: network !== 'XRPL',
        verificationMethod: 'json_rpc'
      };
    } else {
      console.log('❌ Transaction verification failed via JSON-RPC!');
      return {
        success: false,
        verified: false,
        error: 'Verification checks failed via JSON-RPC',
        checks: checks,
        deliveredAmount: deliveredAmount,
        expectedAmount: expectedAmount
      };
    }
    
  } catch (error) {
    console.error('❌ XRP Transaction Verification via JSON-RPC Failed:', error);
    return {
      success: false,
      verified: false,
      error: error.message
    };
  }
};




/**
 * EVM Payment Helper Function (Ethereum/Polygon/BSC etc.)
 * @param {Object} signer - Ethers.js signer object
 * @param {number} amount - Amount in ETH to send
 */
export const sendEVMPayment = async (signer, amount = 0.001) => {
  try {
    if (!signer) {
      throw new Error('EVM Signer not available');
    }

    const fromAddress = await signer.getAddress();
    
    console.log('🟠 EVM PAYMENT INITIATED');
    console.log('From:', fromAddress);
    console.log('To:', evmAddress);
    console.log('Amount:', amount, 'ETH');
    
    // Prepare transaction
    const tx = {
      to: evmAddress,
      value: ethers.parseEther(amount.toString()),
      gasLimit: 21000,
    };
    
    // Get gas price using ethers.js v6 syntax
    const feeData = await signer.provider.getFeeData();
    if (feeData.gasPrice) {
      tx.gasPrice = feeData.gasPrice;
    }
    
    console.log('📝 Transaction prepared:', {
      ...tx,
      value: tx.value.toString(),
      gasPrice: tx.gasPrice ? tx.gasPrice.toString() : 'auto'
    });
    
    // Send transaction
    const txResponse = await signer.sendTransaction(tx);
    
    console.log('⏳ Transaction sent, waiting for confirmation...');
    console.log('Transaction Hash:', txResponse.hash);
    
    // Wait for confirmation
    const receipt = await txResponse.wait();
    
    console.log('✅ EVM Payment Successful!');
    console.log('Transaction Hash:', txResponse.hash);
    console.log('Block Number:', receipt.blockNumber);
    console.log('Gas Used:', receipt.gasUsed.toString());
    console.log('View on Etherscan:', `https://sepolia.etherscan.io/tx/${txResponse.hash}`);
    
    // Store locally for verification
    const paymentData = {
      blockchain: 'EVM',
      from: fromAddress,
      to: evmAddress,
      amount: amount,
      txHash: txResponse.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      timestamp: new Date().toISOString(),
      explorerUrl: `https://sepolia.etherscan.io/tx/${txResponse.hash}`
    };
    
    localStorage.setItem(`evm_payment_${txResponse.hash}`, JSON.stringify(paymentData));
    console.log('💾 Payment data saved locally:', paymentData);
    
    return { success: true, txHash: txResponse.hash, receipt, paymentData };
    
  } catch (error) {
    console.error('❌ EVM Payment Failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Utility function to retrieve all stored payment data
 */
export const getStoredPayments = () => {
  const payments = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('solana_payment_') || key.startsWith('xrp_payment_') || key.startsWith('evm_payment_'))) {
      try {
        const paymentData = JSON.parse(localStorage.getItem(key));
        payments.push(paymentData);
      } catch (error) {
        console.error('Error parsing stored payment:', error);
      }
    }
  }
  
  console.log('📊 All stored payments:', payments);
  return payments;
};

/**
 * Clear all stored payment data
 */
export const clearStoredPayments = () => {
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('solana_payment_') || key.startsWith('xrp_payment_') || key.startsWith('evm_payment_'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('🗑️ Cleared', keysToRemove.length, 'stored payments');
};