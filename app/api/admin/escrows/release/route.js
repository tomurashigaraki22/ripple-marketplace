import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db.js'
import { verifyUserAccess } from '../../../../utils/auth.js'
import { v4 as uuidv4 } from 'uuid'
// Import the same transfer functions from the original escrow release
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js'
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { ethers } from 'ethers'
import { Client, Wallet, xrpToDrops } from 'xrpl'
import * as bip39 from 'bip39'
import { derivePath } from 'ed25519-hd-key'

// XRPB Token configurations (same as original)
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

const PLATFORM_WALLETS = {
  solana: process.env.SOLANA_PRIVATE_KEY,
  xrpl: process.env.XRPL_PRIVATE_KEY,
  xrpl_evm: process.env.ESCROW_XRPL_EVM_PRIVATE_KEY
}

export async function POST(request) {
  try {
    const user = await verifyUserAccess(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

if (user?.user?.role !== 'admin') {
        console.log("User: ", user)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { escrowId, withdrawalAddress } = await request.json()

    if (!escrowId || !withdrawalAddress) {
      return NextResponse.json({ error: 'Missing escrow ID or withdrawal address' }, { status: 400 })
    }

    // Get escrow details
    const [escrows] = await db.query('SELECT * FROM escrows WHERE id = ?', [escrowId])
    if (escrows.length === 0) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    }

    const escrow = escrows[0]
    
    // Admin can release any escrow regardless of status (except already released)
    if (escrow.status === 'released') {
      return NextResponse.json({ error: 'Escrow has already been released' }, { status: 400 })
    }

    // Determine blockchain
    let blockchain = escrow.chain
    if (!blockchain) {
      blockchain = determineBlockchainFromTxHash(escrow.transaction_hash)
    }

    // Admin release - no fees deducted (full amount)
    const releaseAmount = parseFloat(escrow.amount)

    // Perform blockchain transfer
    let releaseHash
    try {
      releaseHash = await transferFunds(blockchain, withdrawalAddress, releaseAmount)
    } catch (transferError) {
      console.error('Fund transfer failed:', transferError)
      return NextResponse.json({ 
        error: 'Fund transfer failed: ' + transferError.message 
      }, { status: 500 })
    }
    
    // Update escrow status
    await db.query(
      'UPDATE escrows SET status = "released", release_hash = ?, withdrawal_address = ?, updated_at = NOW() WHERE id = ?',
      [releaseHash, withdrawalAddress, escrowId]
    )

    // Create audit trail entry
    const auditId = uuidv4()
    await db.query(
      'INSERT INTO audit_trail (id, admin_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [
        auditId,
        user.id,
        'admin_escrow_release',
        'escrow',
        escrowId,
        JSON.stringify({
          escrow_id: escrowId,
          amount: releaseAmount,
          withdrawal_address: withdrawalAddress,
          release_hash: releaseHash,
          blockchain: blockchain
        })
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Funds released successfully by admin',
      releaseHash,
      amount: releaseAmount,
      blockchain
    })

  } catch (error) {
    console.error('Error in admin escrow release:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions (same as original escrow release)
function determineBlockchainFromTxHash(txHash) {
  if (!txHash) return null
  
  if (txHash.length >= 87 && txHash.length <= 88 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(txHash)) {
    return 'solana'
  }
  
  if (txHash.length === 64 && /^[A-Fa-f0-9]+$/.test(txHash)) {
    return 'xrpl'
  }
  
  if (txHash.length === 66 && txHash.startsWith('0x') && /^0x[A-Fa-f0-9]+$/.test(txHash)) {
    return 'xrpl_evm'
  }
  
  return null
}

// Include all the transfer functions from the original file...
// (transferFunds, transferSolanaXRPB, transferXRPLXRPB, transferXRPLEvmXRPB)
// ... [Copy the transfer functions from the original escrow release file]