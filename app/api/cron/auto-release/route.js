import { NextResponse } from 'next/server'
import { db } from '../../../lib/db.js'
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js'
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { ethers } from 'ethers'
import { Client, Wallet, xrpToDrops } from 'xrpl'
import * as bip39 from 'bip39'
import { derivePath } from 'ed25519-hd-key'

// XRPB Token configurations
const XRPB_TOKENS = {
  solana: {
    mint: 'FJLz7hP4EXVMVnRBtP77V4k55t2BfXuajKQp1gcwpump',
    decimals: 6
  },
  xrpl: {
    currency: 'XRPB',
    issuer: 'rsEaYfqdZKNbD3SK55xzcjPm3nDrMj4aUT'
  },
  xrplEvm: {
    address: '0x6d8630D167458b337A2c8b6242c354d2f4f75D96',
    decimals: 18
  }
}

// Platform wallet private keys
const PLATFORM_WALLETS = {
  solana: process.env.SOLANA_PRIVATE_KEY,
  xrpl: process.env.XRPL_PRIVATE_KEY,
  xrpl_evm: process.env.ESCROW_XRPL_EVM_PRIVATE_KEY
}

export async function POST(request) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url)
    const cronSecret = searchParams.get('secret')
    
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find orders that are 20+ days old and still in escrow_funded status
    const [orders] = await db.query(`
      SELECT o.*, e.id as escrow_id, e.amount, e.chain, e.transaction_hash, e.buyer as buyer_wallet
      FROM orders o 
      LEFT JOIN escrows e ON o.escrow_id = e.id
      WHERE o.status = 'escrow_funded' 
      AND o.created_at <= DATE_SUB(NOW(), INTERVAL 20 DAY)
      AND e.status = 'funded'
    `)

    let releasedCount = 0
    const results = []

    for (const order of orders) {
      try {
        // Determine blockchain from escrow chain or transaction hash
        let blockchain = order.chain
        if (!blockchain) {
          blockchain = determineBlockchainFromTxHash(order.transaction_hash)
        }

        if (!blockchain) {
          console.error(`Cannot determine blockchain for order ${order.id}`)
          continue
        }

        // Transfer funds back to buyer (full amount since this is auto-release)
        const releaseAmount = parseFloat(order.amount)
        let releaseHash
        
        try {
          releaseHash = await transferFunds(blockchain, order.buyer_wallet, releaseAmount)
        } catch (transferError) {
          console.error(`Fund transfer failed for order ${order.id}:`, transferError)
          results.push({
            orderId: order.id,
            success: false,
            error: transferError.message
          })
          continue
        }

        // Update order status
        await db.query(
          'UPDATE orders SET status = "auto_completed", updated_at = NOW() WHERE id = ?',
          [order.id]
        )

        // Update escrow status with release hash
        if (order.escrow_id) {
          await db.query(
            'UPDATE escrows SET status = "auto_released", release_hash = ?, withdrawal_address = ?, updated_at = NOW() WHERE id = ?',
            [releaseHash, order.buyer_wallet, order.escrow_id]
          )
        }

        // Create notification for buyer
        await db.query(
          'INSERT INTO notifications (user_id, type, message, created_at) VALUES (?, ?, ?, NOW())',
          [order.buyer_id, 'auto_release', `Order ${order.id.slice(0, 8)} was automatically completed after 20 days. ${releaseAmount} XRPB refunded to your wallet.`]
        )

        // Create notification for seller
        await db.query(
          'INSERT INTO notifications (user_id, type, message, created_at) VALUES (?, ?, ?, NOW())',
          [order.seller_id, 'auto_release', `Order ${order.id.slice(0, 8)} was automatically completed after 20 days. Funds were refunded to buyer.`]
        )

        results.push({
          orderId: order.id,
          success: true,
          releaseHash,
          amount: releaseAmount,
          blockchain
        })

        releasedCount++
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error)
        results.push({
          orderId: order.id,
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-released ${releasedCount} orders`,
      results
    })

  } catch (error) {
    console.error('Error in auto-release:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Determine blockchain from transaction hash format
function determineBlockchainFromTxHash(txHash) {
  if (!txHash) return null
  
  // Solana transaction hashes are base58 encoded, typically 87-88 characters
  if (txHash.length >= 87 && txHash.length <= 88 && !/[^1-9A-HJ-NP-Za-km-z]/.test(txHash)) {
    return 'solana'
  }
  
  // XRPL transaction hashes are 64 character hex strings
  if (txHash.length === 64 && /^[A-Fa-f0-9]+$/.test(txHash)) {
    return 'xrpl'
  }
  
  // XRPL EVM transaction hashes start with 0x and are 66 characters total
  if (txHash.startsWith('0x') && txHash.length === 66 && /^0x[A-Fa-f0-9]+$/.test(txHash)) {
    return 'xrpl_evm'
  }
  
  return null
}

// Transfer funds function
async function transferFunds(blockchain, toAddress, amount) {
  console.log(`\n=== AUTO-RELEASE FUND TRANSFER ===`)
  console.log(`Blockchain: ${blockchain}`)
  console.log(`To Address: ${toAddress}`)
  console.log(`Amount: ${amount} XRPB`)
  
  switch (blockchain) {
    case 'solana':
      return await transferSolanaXRPB(toAddress, amount)
      
    case 'xrpl':
      return await transferXRPLXRPB(toAddress, amount)
      
    case 'xrpl_evm':
      return await transferXRPLEvmXRPB(toAddress, amount)
      
    default:
      throw new Error(`Unsupported blockchain: ${blockchain}`)
  }
}

// Solana XRPB transfer using seed phrase
async function transferSolanaXRPB(toAddress, amount) {
  const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com')
  
  // Convert seed phrase to keypair
  const seedPhrase = process.env.SOLANA_SEED_PHRASE
  if (!seedPhrase) {
    throw new Error('SOLANA_SEED_PHRASE not found in environment variables')
  }
  
  const seed = bip39.mnemonicToSeedSync(seedPhrase)
  const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key
  const fromKeypair = Keypair.fromSeed(derivedSeed)
  
  const mintPublicKey = new PublicKey(XRPB_TOKENS.solana.mint)
  const toPublicKey = new PublicKey(toAddress)
  
  // Get token accounts
  const fromTokenAccount = await getAssociatedTokenAddress(mintPublicKey, fromKeypair.publicKey)
  const toTokenAccount = await getAssociatedTokenAddress(mintPublicKey, toPublicKey)
  
  // Convert amount to token units
  const tokenAmount = Math.floor(amount * Math.pow(10, XRPB_TOKENS.solana.decimals))
  
  // Create transfer instruction
  const transferInstruction = createTransferInstruction(
    fromTokenAccount,
    toTokenAccount,
    fromKeypair.publicKey,
    tokenAmount,
    [],
    TOKEN_PROGRAM_ID
  )
  
  // Create and send transaction
  const transaction = new Transaction().add(transferInstruction)
  const signature = await connection.sendTransaction(transaction, [fromKeypair])
  
  // Wait for confirmation
  await connection.confirmTransaction(signature)
  
  return signature
}

// XRPL XRPB transfer
async function transferXRPLXRPB(toAddress, amount) {
  const client = new Client(process.env.XRPL_RPC_URL || 'wss://xrplcluster.com')
  await client.connect()
  
  const wallet = Wallet.fromSeed(PLATFORM_WALLETS.xrpl)
  
  const payment = {
    TransactionType: 'Payment',
    Account: wallet.address,
    Destination: toAddress,
    Amount: {
      currency: XRPB_TOKENS.xrpl.currency,
      issuer: XRPB_TOKENS.xrpl.issuer,
      value: amount.toString()
    }
  }
  
  const response = await client.submitAndWait(payment, { wallet })
  await client.disconnect()
  
  return response.result.hash
}

// XRPL EVM XRPB transfer
async function transferXRPLEvmXRPB(toAddress, amount) {
  const provider = new ethers.JsonRpcProvider(process.env.XRPL_EVM_RPC_URL || 'https://rpc.xrplevm.org')
  const wallet = new ethers.Wallet(PLATFORM_WALLETS.xrpl_evm, provider)
  
  // XRPB token contract ABI (minimal)
  const tokenABI = [
    'function transfer(address to, uint256 amount) returns (bool)'
  ]
  
  const tokenContract = new ethers.Contract(XRPB_TOKENS.xrplEvm.address, tokenABI, wallet)
  
  // Convert amount to token units
  const tokenAmount = ethers.parseUnits(amount.toString(), XRPB_TOKENS.xrplEvm.decimals)
  
  // Send transfer transaction
  const tx = await tokenContract.transfer(toAddress, tokenAmount)
  const receipt = await tx.wait()
  
  return tx.hash
}