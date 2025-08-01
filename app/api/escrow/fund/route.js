import { NextResponse } from 'next/server';
import { db } from '../../../lib/db.js';
import { verifyUserAccess } from '@/app/utils/auth.js';
import { Connection, PublicKey } from '@solana/web3.js';
import { Client } from 'xrpl';
import { ethers } from 'ethers';

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await verifyUserAccess(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { escrowId, transactionHash, chain } = await request.json();

    if (!escrowId || !transactionHash || !chain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify transaction on blockchain
    const isValid = await verifyTransaction(transactionHash, chain, escrowId);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 });
    }

    // Update escrow status to funded and store chain
    await db.query(
      'UPDATE escrows SET status = "funded", transaction_hash = ?, chain = ?, updated_at = NOW() WHERE id = ?',
      [transactionHash, chain, escrowId]
    );

    // Schedule automatic release after 20 days
    scheduleAutoRelease(escrowId);

    return NextResponse.json({
      success: true,
      message: 'Escrow funded successfully'
    });

  } catch (error) {
    console.error('Error funding escrow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function verifyTransaction(txHash, chain, escrowId) {
  try {
    // Get escrow details
    const [escrows] = await db.query('SELECT * FROM escrows WHERE id = ?', [escrowId]);
    if (escrows.length === 0) return false;
    
    const escrow = escrows[0];
    const expectedAmount = parseFloat(escrow.amount);

    switch (chain) {
      case 'solana':
        return await verifySolanaTransaction(txHash, expectedAmount);
      case 'xrpl':
        return await verifyXRPLTransaction(txHash, expectedAmount);
      case 'xrpl_evm':
        return await verifyXRPLEvmTransaction(txHash, expectedAmount);
      default:
        return false;
    }
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
}

async function verifySolanaTransaction(txHash, expectedAmount) {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    const tx = await connection.getTransaction(txHash, { commitment: 'confirmed' });
    
    if (!tx || !tx.meta || tx.meta.err) return false;
    
    // Verify amount and recipient
    const escrowWallet = process.env.ESCROW_SOLANA_WALLET;
    // Add more specific verification logic here
    
    return true;
  } catch (error) {
    console.error('Error verifying Solana transaction:', error);
    return false;
  }
}

async function verifyXRPLTransaction(txHash, expectedAmount) {
  try {
    const client = new Client(process.env.XRPL_RPC_URL || 'wss://xrplcluster.com');
    await client.connect();
    
    const tx = await client.request({
      command: 'tx',
      transaction: txHash
    });
    
    await client.disconnect();
    
    if (!tx || tx.result.meta.TransactionResult !== 'tesSUCCESS') return false;
    
    // Verify amount and recipient
    const escrowWallet = process.env.ESCROW_XRPL_WALLET;
    // Add more specific verification logic here
    
    return true;
  } catch (error) {
    console.error('Error verifying XRPL transaction:', error);
    return false;
  }
}

async function verifyXRPLEvmTransaction(txHash, expectedAmount) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.XRPL_EVM_RPC_URL || 'https://rpc.xrplevm.org');
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!tx || !receipt || receipt.status !== 1) return false;
    
    // Verify amount and recipient
    const escrowWallet = process.env.ESCROW_XRPL_EVM_WALLET;
    // Add more specific verification logic here
    
    return true;
  } catch (error) {
    console.error('Error verifying XRPL EVM transaction:', error);
    return false;
  }
}

function scheduleAutoRelease(escrowId) {
  // In a production environment, you'd use a job queue like Bull or a cron job
  // For now, we'll use a simple setTimeout (not recommended for production)
  setTimeout(async () => {
    try {
      const [escrows] = await db.query(
        'SELECT * FROM escrows WHERE id = ? AND status IN ("funded", "conditions_met")',
        [escrowId]
      );
      
      if (escrows.length > 0) {
        await releaseEscrowFunds(escrowId, 'auto_release');
      }
    } catch (error) {
      console.error('Error in auto release:', error);
    }
  }, 20 * 24 * 60 * 60 * 1000); // 20 days
}

async function releaseEscrowFunds(escrowId, reason = 'manual') {
  // Implementation for releasing funds to seller
  // This will be implemented in the release API
}