"use client"

import React, { createContext, useContext, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletDisconnectButton, WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

const PhantomContext = createContext(null);

export const PhantomProvider = ({ children }) => {
  // Set to mainnet-beta for production
  const network = WalletAdapterNetwork.Mainnet;

  // Use mainnet RPC endpoint
  const endpoint = useMemo(() => {
    // You can use a custom RPC endpoint for better performance
    // return 'https://your-custom-rpc-endpoint.com';
    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      // Add more wallet adapters as needed
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <PhantomContext.Provider value={{ network, endpoint }}>
            {children}
          </PhantomContext.Provider>
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