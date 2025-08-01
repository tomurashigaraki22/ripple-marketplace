import { NextResponse } from 'next/server';
import { db } from '../../../lib/db.js';
import { verifyUserAccess } from '../../../utils/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ethers } from 'ethers';
import { Client, Wallet, xrpToDrops } from 'xrpl';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

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
  // xrplEvm: {
  //   address: '0x2557C801144b11503BB524C5503AcCd48E5F54fE', // TESTNET XRPB contract
  //   decimals: 18
  // }
  xrplEvm: {
    address: '0x6d8630D167458b337A2c8b6242c354d2f4f75D96', // TESTNET XRPB contract
    decimals: 18
  }
};

// Platform wallet private keys (store these in environment variables)
const PLATFORM_WALLETS = {
  solana: process.env.SOLANA_PRIVATE_KEY,
  xrpl: process.env.XRPL_PRIVATE_KEY,
  xrpl_evm: process.env.ESCROW_XRPL_EVM_PRIVATE_KEY
};

export async function POST(request) {
  try {
    const user = await verifyUserAccess(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { escrowId, withdrawalAddress } = await request.json();

    if (!escrowId || !withdrawalAddress) {
      return NextResponse.json({ error: 'Missing escrow ID or withdrawal address' }, { status: 400 });
    }

    // Get escrow details
    const [escrows] = await db.query('SELECT * FROM escrows WHERE id = ?', [escrowId]);
    if (escrows.length === 0) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    const escrow = escrows[0];
    
    // Parse conditions
    let conditionsInfo = {};
    try {
      conditionsInfo = JSON.parse(escrow.conditions || '{}');
    } catch (e) {
      console.error('Error parsing conditions:', e);
    }

    // Check if escrow can be released
    if (escrow.status !== 'funded' && escrow.status !== 'conditions_met') {
      let errorMessage = 'Cannot release escrow. ';
      let requiredConditions = [];

      switch (escrow.status) {
        case 'pending':
          errorMessage += 'Escrow is not yet funded.';
          break;
        case 'disputed':
          errorMessage += 'Escrow is under dispute.';
          requiredConditions.push('Dispute must be resolved');
          break;
        case 'cancelled':
          errorMessage += 'Escrow has been cancelled.';
          break;
        case 'released':
          errorMessage += 'Escrow has already been released.';
          break;
        default:
          errorMessage += 'Current status does not allow release.';
      }

      // Check specific conditions from the JSON
      if (conditionsInfo.delivery_confirmation && !conditionsInfo.delivery_confirmed) {
        requiredConditions.push('Delivery confirmation required');
      }
      if (conditionsInfo.inspection_period && !conditionsInfo.inspection_completed) {
        requiredConditions.push('Inspection period must be completed');
      }
      if (conditionsInfo.dispute_period && !conditionsInfo.dispute_period_expired) {
        requiredConditions.push('Dispute period must expire');
      }

      return NextResponse.json({ 
        error: errorMessage,
        current_status: escrow.status,
        required_conditions: requiredConditions,
        conditions: conditionsInfo
      }, { status: 400 });
    }

    // Determine blockchain from escrow chain or transaction hash
    let blockchain = escrow.chain;
    if (!blockchain) {
      blockchain = determineBlockchainFromTxHash(escrow.transaction_hash);
    }

    // Calculate release amount (subtract platform fee)
    const platformFeePercent = 0.025; // 2.5%
    const releaseAmount = parseFloat(escrow.amount) * (1 - platformFeePercent);

    // Perform actual blockchain transfer
    let releaseHash;
    try {
      releaseHash = await transferFunds(blockchain, withdrawalAddress, releaseAmount);
    } catch (transferError) {
      console.error('Fund transfer failed:', transferError);
      return NextResponse.json({ 
        error: 'Fund transfer failed: ' + transferError.message 
      }, { status: 500 });
    }
    
    // Update escrow status
    await db.query(
      'UPDATE escrows SET status = "released", release_hash = ?, withdrawal_address = ?, updated_at = NOW() WHERE id = ?',
      [releaseHash, withdrawalAddress, escrowId]
    );

    // Create notification
    const notificationId = uuidv4();
    await db.query(
      'INSERT INTO notifications (id, user_id, type, title, message, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [
        notificationId,
        user.id, 
        'escrow_released', 
        'Escrow Released',
        `Escrow ${escrowId.slice(0, 8)} has been released. Amount: ${releaseAmount} XRPB sent to ${withdrawalAddress.slice(0, 10)}...`
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Funds released successfully',
      releaseHash,
      amount: releaseAmount,
      blockchain
    });

  } catch (error) {
    console.error('Error releasing escrow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Determine blockchain from transaction hash format
function determineBlockchainFromTxHash(txHash) {
  if (!txHash) return null;
  
  // Solana: base58 encoded, typically 87-88 characters
  if (txHash.length >= 87 && txHash.length <= 88 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(txHash)) {
    return 'solana';
  }
  
  // XRPL: 64 character hex string
  if (txHash.length === 64 && /^[A-Fa-f0-9]+$/.test(txHash)) {
    return 'xrpl';
  }
  
  // XRPL EVM: 66 character hex string starting with 0x
  if (txHash.length === 66 && txHash.startsWith('0x') && /^0x[A-Fa-f0-9]+$/.test(txHash)) {
    return 'xrpl_evm';
  }
  
  return null;
}

// Add balance checking functions after the PLATFORM_WALLETS definition

// Check Solana XRPB balance
async function checkSolanaXRPBBalance(walletAddress) {
  const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  const mintPublicKey = new PublicKey(XRPB_TOKENS.solana.mint);
  const walletPublicKey = new PublicKey(walletAddress);
  
  try {
    const tokenAccount = await getAssociatedTokenAddress(mintPublicKey, walletPublicKey);
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return {
      balance: balance.value.uiAmount || 0,
      decimals: XRPB_TOKENS.solana.decimals,
      raw: balance.value.amount
    };
  } catch (error) {
    console.log(`Solana token account not found for ${walletAddress}:`, error.message);
    return { balance: 0, decimals: XRPB_TOKENS.solana.decimals, raw: '0' };
  }
}

// Check XRPL XRPB balance
async function checkXRPLXRPBBalance(walletAddress) {
  const client = new Client(process.env.XRPL_RPC_URL || 'wss://xrplcluster.com');
  await client.connect();
  
  try {
    const response = await client.request({
      command: 'account_lines',
      account: walletAddress,
      ledger_index: 'validated'
    });
    
    const xrpbLine = response.result.lines.find(line => 
      line.currency === XRPB_TOKENS.xrpl.currency && 
      line.account === XRPB_TOKENS.xrpl.issuer
    );
    
    await client.disconnect();
    return {
      balance: xrpbLine ? parseFloat(xrpbLine.balance) : 0,
      currency: XRPB_TOKENS.xrpl.currency,
      issuer: XRPB_TOKENS.xrpl.issuer
    };
  } catch (error) {
    await client.disconnect();
    console.log(`XRPL balance check failed for ${walletAddress}:`, error.message);
    return { balance: 0, currency: XRPB_TOKENS.xrpl.currency, issuer: XRPB_TOKENS.xrpl.issuer };
  }
}

// Check XRPL EVM XRPB balance and native balance
async function checkXRPLEvmBalances(walletAddress) {
  const provider = new ethers.JsonRpcProvider(process.env.XRPL_EVM_RPC_URL || 'https://rpc.xrplevm.org');
  
  try {
    // Check native balance (for gas fees)
    const nativeBalance = await provider.getBalance(walletAddress);
    const nativeBalanceEth = ethers.formatEther(nativeBalance);
    
    // Check XRPB token balance
    const tokenABI = [
      'function balanceOf(address owner) view returns (uint256)'
    ];
    const tokenContract = new ethers.Contract(XRPB_TOKENS.xrplEvm.address, tokenABI, provider);
    const tokenBalance = await tokenContract.balanceOf(walletAddress);
    const tokenBalanceFormatted = ethers.formatUnits(tokenBalance, XRPB_TOKENS.xrplEvm.decimals);
    
    return {
      nativeBalance: parseFloat(nativeBalanceEth),
      tokenBalance: parseFloat(tokenBalanceFormatted),
      nativeBalanceWei: nativeBalance.toString(),
      tokenBalanceRaw: tokenBalance.toString()
    };
  } catch (error) {
    console.log(`XRPL EVM balance check failed for ${walletAddress}:`, error.message);
    return {
      nativeBalance: 0,
      tokenBalance: 0,
      nativeBalanceWei: '0',
      tokenBalanceRaw: '0'
    };
  }
}

// Updated transferFunds function with balance checking
async function transferFunds(blockchain, toAddress, amount) {
  console.log(`\n=== ESCROW FUND TRANSFER ===`);
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
  const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  
  // Convert seed phrase to keypair
  const seedPhrase = process.env.SOLANA_SEED_PHRASE;
  if (!seedPhrase) {
    throw new Error('SOLANA_SEED_PHRASE not found in environment variables');
  }
  
  const seed = bip39.mnemonicToSeedSync(seedPhrase);
  const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
  const fromKeypair = Keypair.fromSeed(derivedSeed);
  
  const mintPublicKey = new PublicKey(XRPB_TOKENS.solana.mint);
  const toPublicKey = new PublicKey(toAddress);
  
  // Get token accounts
  const fromTokenAccount = await getAssociatedTokenAddress(mintPublicKey, fromKeypair.publicKey);
  const toTokenAccount = await getAssociatedTokenAddress(mintPublicKey, toPublicKey);
  
  // Convert amount to token units
  const tokenAmount = Math.floor(amount * Math.pow(10, XRPB_TOKENS.solana.decimals));
  
  // Create transfer instruction
  const transferInstruction = createTransferInstruction(
    fromTokenAccount,
    toTokenAccount,
    fromKeypair.publicKey,
    tokenAmount,
    [],
    TOKEN_PROGRAM_ID
  );
  
  // Create and send transaction
  const transaction = new Transaction().add(transferInstruction);
  const signature = await connection.sendTransaction(transaction, [fromKeypair]);
  
  // Wait for confirmation
  await connection.confirmTransaction(signature);
  
  return signature;
}

// XRPL XRPB transfer
async function transferXRPLXRPB(toAddress, amount) {
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
  
  return response.result.hash;
}

// XRPL EVM XRPB transfer
async function transferXRPLEvmXRPB(toAddress, amount) {
  const provider = new ethers.JsonRpcProvider(process.env.XRPL_EVM_RPC_URL || 'https://rpc.xrplevm.org'); // TESTNET RPC
  const wallet = new ethers.Wallet(PLATFORM_WALLETS.xrpl_evm, provider);
  
  // XRPB token contract ABI (minimal)
  const tokenABI = [
    'function transfer(address to, uint256 amount) returns (bool)'
  ];
  
  const tokenContract = new ethers.Contract(XRPB_TOKENS.xrplEvm.address, tokenABI, wallet);
  
  // Convert amount to token units
  const tokenAmount = ethers.parseUnits(amount.toString(), XRPB_TOKENS.xrplEvm.decimals);
  
  // Send transfer transaction
  const tx = await tokenContract.transfer(toAddress, tokenAmount);
  const receipt = await tx.wait();
  
  return tx.hash;
}