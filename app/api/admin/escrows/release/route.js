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
    const releaseAmount = parseFloat((escrow.amount * 0.975).toFixed(6))

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

// Balance checking functions
async function checkSolanaXRPBBalance(walletAddress) {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    const walletPublicKey = new PublicKey(walletAddress);
    const mintPublicKey = new PublicKey(XRPB_TOKENS.solana.mint);
    
    const tokenAccount = await getAssociatedTokenAddress(mintPublicKey, walletPublicKey);
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    
    return {
      balance: balance.value.uiAmount || 0,
      raw: balance.value.amount
    };
  } catch (error) {
    console.error('Error checking Solana XRPB balance:', error);
    return { balance: 0, raw: '0' };
  }
}

async function checkXRPLXRPBBalance(walletAddress) {
  try {
    const client = new Client(process.env.XRPL_RPC_URL || 'wss://xrplcluster.com');
    await client.connect();
    
    const response = await client.request({
      command: 'account_lines',
      account: walletAddress,
      ledger_index: 'validated'
    });
    
    await client.disconnect();
    
    const xrpbLine = response.result.lines.find(line => 
      line.currency === XRPB_TOKENS.xrpl.currency && 
      line.account === XRPB_TOKENS.xrpl.issuer
    );
    
    return {
      balance: xrpbLine ? parseFloat(xrpbLine.balance) : 0
    };
  } catch (error) {
    console.error('Error checking XRPL XRPB balance:', error);
    return { balance: 0 };
  }
}

async function checkXRPLEvmBalances(walletAddress) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.XRPL_EVM_RPC_URL || 'https://rpc.xrplevm.org');
    
    // Check native XRP balance
    const nativeBalance = await provider.getBalance(walletAddress);
    const nativeBalanceFormatted = parseFloat(ethers.formatEther(nativeBalance));
    
    // Check XRPB token balance
    const tokenContract = new ethers.Contract(
      XRPB_TOKENS.xrplEvm.address,
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );
    
    const tokenBalance = await tokenContract.balanceOf(walletAddress);
    const tokenBalanceFormatted = parseFloat(ethers.formatUnits(tokenBalance, XRPB_TOKENS.xrplEvm.decimals));
    
    return {
      nativeBalance: nativeBalanceFormatted,
      tokenBalance: tokenBalanceFormatted
    };
  } catch (error) {
    console.error('Error checking XRPL EVM balances:', error);
    return { nativeBalance: 0, tokenBalance: 0 };
  }
}

async function transferFunds(blockchain, toAddress, amount) {
  console.log(`\n=== ADMIN ESCROW FUND TRANSFER ===`);
  console.log(`Blockchain: ${blockchain}`);
  console.log(`To Address: ${toAddress}`);
  console.log(`Amount: ${amount} XRPB`);
  
  // Check balances before transfer
  let platformWallet;
  let balanceInfo;
  
  switch (blockchain) {
    case 'solana':
      // Get platform wallet address from keypair
      const seedPhrase = process.env.SOLANA_SEED_PHRASE;
      const seed = bip39.mnemonicToSeedSync(seedPhrase);
      const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
      const fromKeypair = Keypair.fromSeed(derivedSeed);
      platformWallet = fromKeypair.publicKey.toString();
      
      balanceInfo = await checkSolanaXRPBBalance(platformWallet);
      console.log(`Platform Solana Wallet: ${platformWallet}`);
      console.log(`XRPB Balance: ${balanceInfo.balance}`);
      
      if (balanceInfo.balance < amount) {
        throw new Error(`Insufficient XRPB balance. Required: ${amount}, Available: ${balanceInfo.balance}`);
      }
      
      return await transferSolanaXRPB(toAddress, amount);
      
    case 'xrpl':
      const xrplWallet = Wallet.fromSeed(PLATFORM_WALLETS.xrpl);
      platformWallet = xrplWallet.address;
      
      balanceInfo = await checkXRPLXRPBBalance(platformWallet);
      console.log(`Platform XRPL Wallet: ${platformWallet}`);
      console.log(`XRPB Balance: ${balanceInfo.balance}`);
      
      if (balanceInfo.balance < amount) {
        throw new Error(`Insufficient XRPB balance. Required: ${amount}, Available: ${balanceInfo.balance}`);
      }
      
      return await transferXRPLXRPB(toAddress, amount);
      
    case 'xrpl_evm':
      const provider = new ethers.JsonRpcProvider(process.env.XRPL_EVM_RPC_URL || 'https://rpc.xrplevm.org');
      const evmWallet = new ethers.Wallet(PLATFORM_WALLETS.xrpl_evm, provider);
      platformWallet = evmWallet.address;
      
      balanceInfo = await checkXRPLEvmBalances(platformWallet);
      console.log(`Platform XRPL EVM Wallet: ${platformWallet}`);
      console.log(`Native Balance: ${balanceInfo.nativeBalance} XRP`);
      console.log(`XRPB Balance: ${balanceInfo.tokenBalance}`);
      
      // Check for gas fees (estimate ~0.001 XRP for transaction)
      if (balanceInfo.nativeBalance < 0.001) {
        throw new Error(`Insufficient native balance for gas fees. Required: ~0.001 XRP, Available: ${balanceInfo.nativeBalance} XRP`);
      }
      
      if (balanceInfo.tokenBalance < amount) {
        throw new Error(`Insufficient XRPB balance. Required: ${amount}, Available: ${balanceInfo.tokenBalance}`);
      }
      
      return await transferXRPLEvmXRPB(toAddress, amount);
      
    default:
      throw new Error(`Unsupported blockchain: ${blockchain}`);
  }
}

// Solana XRPB transfer using seed phrase
async function transferSolanaXRPB(toAddress, amount) {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    
    // Create keypair from seed phrase
    const seedPhrase = process.env.SOLANA_SEED_PHRASE;
    const seed = bip39.mnemonicToSeedSync(seedPhrase);
    const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
    const fromKeypair = Keypair.fromSeed(derivedSeed);
    
    const mintPublicKey = new PublicKey(XRPB_TOKENS.solana.mint);
    const toPublicKey = new PublicKey(toAddress);
    
    const fromTokenAccount = await getAssociatedTokenAddress(mintPublicKey, fromKeypair.publicKey);
    const toTokenAccount = await getAssociatedTokenAddress(mintPublicKey, toPublicKey);
    
    const amountInSmallestUnit = Math.floor(amount * Math.pow(10, XRPB_TOKENS.solana.decimals));
    
    const transaction = new Transaction().add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromKeypair.publicKey,
        amountInSmallestUnit,
        [],
        TOKEN_PROGRAM_ID
      )
    );
    
    const signature = await connection.sendTransaction(transaction, [fromKeypair]);
    await connection.confirmTransaction(signature);
    
    console.log(`Solana XRPB transfer successful: ${signature}`);
    return signature;
  } catch (error) {
    console.error('Solana XRPB transfer failed:', error);
    throw error;
  }
}

async function transferXRPLXRPB(toAddress, amount) {
  try {
    const client = new Client(process.env.XRPL_RPC_URL || 'wss://xrplcluster.com');
    await client.connect();
    
    const wallet = Wallet.fromSeed(PLATFORM_WALLETS.xrpl);
    
    const payment = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: toAddress,
      Amount: {
        currency: XRPB_TOKENS.xrpl.currency,
        issuer: XRPB_TOKENS.xrpl.issuer,
        value: amount.toString()
      }
    };
    
    const response = await client.submitAndWait(payment, { wallet });
    await client.disconnect();
    
    console.log(`XRPL XRPB transfer successful: ${response.result.hash}`);
    return response.result.hash;
  } catch (error) {
    console.error('XRPL XRPB transfer failed:', error);
    throw error;
  }
}

async function transferXRPLEvmXRPB(toAddress, amount) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.XRPL_EVM_RPC_URL || 'https://rpc.xrplevm.org');
    const wallet = new ethers.Wallet(PLATFORM_WALLETS.xrpl_evm, provider);
    
    const tokenContract = new ethers.Contract(
      XRPB_TOKENS.xrplEvm.address,
      ['function transfer(address to, uint256 amount) returns (bool)'],
      wallet
    );
    
    const amountInSmallestUnit = ethers.parseUnits(amount.toString(), XRPB_TOKENS.xrplEvm.decimals);
    const tx = await tokenContract.transfer(toAddress, amountInSmallestUnit);
    const receipt = await tx.wait();
    
    console.log(`XRPL EVM XRPB transfer successful: ${receipt.hash}`);
    return receipt.hash;
  } catch (error) {
    console.error('XRPL EVM XRPB transfer failed:', error);
    throw error;
  }
}