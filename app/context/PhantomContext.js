"use client"

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

const PhantomContext = createContext(null);

// Inner component that uses wallet hooks
const PhantomContextProvider = ({ children }) => {
  const { publicKey, connected, connecting, disconnect, signTransaction, signAllTransactions, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState(0);

  // Fetch SOL balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && publicKey) {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / 1e9); // Convert lamports to SOL
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      } else {
        setBalance(0);
      }
    };

    fetchBalance();
    
    // Set up balance polling
    const interval = setInterval(fetchBalance, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [connected, publicKey, connection]);

  // Sign and send transaction function
  const signAndSendTransaction = async (transaction) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  // Sign transaction without sending
  const signTransactionOnly = async (transaction) => {
    if (!connected || !publicKey || !signTransaction) {
      throw new Error('Wallet not connected or signing not available');
    }

    try {
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      return signedTransaction;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  };

  // Sign multiple transactions
  const signMultipleTransactions = async (transactions) => {
    if (!connected || !publicKey || !signAllTransactions) {
      throw new Error('Wallet not connected or batch signing not available');
    }

    try {
      const { blockhash } = await connection.getLatestBlockhash();
      
      // Prepare all transactions
      const preparedTransactions = transactions.map(tx => {
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;
        return tx;
      });

      const signedTransactions = await signAllTransactions(preparedTransactions);
      return signedTransactions;
    } catch (error) {
      console.error('Batch transaction signing failed:', error);
      throw error;
    }
  };

  const contextValue = {
    // Wallet state
    publicKey,
    connected,
    connecting,
    balance,
    
    // Connection
    connection,
    
    // Functions
    disconnect,
    signAndSendTransaction,
    signTransactionOnly,
    signMultipleTransactions,
    
    // Raw wallet functions (for advanced use)
    signTransaction,
    signAllTransactions,
    sendTransaction
  };

  return (
    <PhantomContext.Provider value={contextValue}>
      {children}
    </PhantomContext.Provider>
  );
};

export const PhantomProvider = ({ children }) => {
  // Set to mainnet-beta for production
  const network = WalletAdapterNetwork.Mainnet;

  // Use your custom QuickNode RPC endpoint
  const endpoint = useMemo(() => {
    // Your custom QuickNode endpoint with API key
    return 'https://compatible-greatest-frog.solana-mainnet.quiknode.pro/67de1f5f160c557ad555a253d434e55fcedf0b5f/';
    
    // Fallback options if needed:
    // return 'https://api.mainnet-beta.solana.com';
    // return clusterApiUrl(network);
  }, [network]);

  // Only use PhantomWalletAdapter - removed WalletConnect and Solflare
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <PhantomContextProvider>
            {children}
          </PhantomContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const usePhantom = () => {
  const context = useContext(PhantomContext);
  if (!context) {
    throw new Error('usePhantom must be used within a PhantomProvider');
  }
  return context;
};