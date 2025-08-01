import { sendSolanaXRPBPayment, sendXRPLXRPBPayment, sendXRPLEvmXRPBPayment } from './signAndPay.js';

export async function createEscrowPayment(paymentData) {
  const { seller, buyer, amount, chain, conditions, listingId, wallet, connection } = paymentData;
  
  try {
    console.log('🔄 Step 1: Creating escrow record...');
    
    // 1. Create escrow record
    const escrowResponse = await fetch('/api/escrow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || 'anonymous'}`
      },
      body: JSON.stringify({
        seller,
        buyer,
        amount,
        chain,
        conditions,
        listingId
      })
    });
    
    const escrowData = await escrowResponse.json();
    
    if (!escrowData.success) {
      throw new Error(escrowData.error || 'Failed to create escrow');
    }
    
    console.log('✅ Escrow record created:', escrowData.escrowId);
    console.log('🔄 Step 2: Sending payment to escrow wallet...');
    
    // 2. Send payment to escrow wallet
    let paymentResult;
    const escrowWallet = escrowData.escrowWallet;
    
    console.log('💰 Escrow wallet address:', escrowWallet);
    console.log('💰 Payment amount:', amount);
    console.log('🔗 Payment chain:', chain);
    
    switch (chain) {
      case 'solana':
        if (!wallet || !connection) {
          throw new Error('Solana wallet or connection not provided');
        }
        paymentResult = await sendSolanaXRPBPayment(wallet, amount, connection);
        break;
      case 'xrpl':
        if (!wallet) {
          throw new Error('XRPL wallet not provided');
        }
        paymentResult = await sendXRPLXRPBPayment(wallet, amount);
        break;
      case 'xrpl_evm':
        if (!wallet) {
          throw new Error('XRPL EVM signer function not provided');
        }
        paymentResult = await sendXRPLEvmXRPBPayment(wallet, amount);
        break;
      default:
        throw new Error(`Unsupported chain: ${chain}`);
    }
    
    if (!paymentResult.success) {
      throw new Error(paymentResult.error || 'Payment failed');
    }
    
    console.log('✅ Payment sent successfully:', paymentResult.signature || paymentResult.txHash);
    console.log('🔄 Step 3: Funding escrow with transaction hash...');
    
    // 3. Fund the escrow with transaction hash
    const fundResponse = await fetch('/api/escrow/fund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || 'anonymous'}`
      },
      body: JSON.stringify({
        escrowId: escrowData.escrowId,
        transactionHash: paymentResult.signature || paymentResult.txHash,
        chain
      })
    });
    
    const fundData = await fundResponse.json();
    
    if (!fundData.success) {
      console.warn('⚠️ Escrow funding verification failed, but payment was sent');
    } else {
      console.log('✅ Escrow funded successfully');
    }
    
    return {
      success: true,
      escrowId: escrowData.escrowId,
      transactionHash: paymentResult.signature || paymentResult.txHash,
      message: 'Escrow payment completed successfully',
      paymentData: paymentResult.paymentData
    };
    
  } catch (error) {
    console.error('❌ Error creating escrow payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to get escrow status
export async function getEscrowStatus(escrowId) {
  try {
    const response = await fetch(`/api/escrow/${escrowId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken') || 'anonymous'}`
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching escrow status:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to release escrow (for sellers)
export async function releaseEscrow(escrowId, withdrawalAddress) {
  try {
    const response = await fetch('/api/escrow/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || 'anonymous'}`
      },
      body: JSON.stringify({
        escrowId,
        withdrawalAddress
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error releasing escrow:', error);
    return { success: false, error: error.message };
  }
}