"use client"

import React, { createContext, useContext, useEffect } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const MetamaskContext = createContext(null);

// Wagmi configuration with mobile support
const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected({
      target: 'metaMask',
    }),
    // Add WalletConnect for mobile support
    walletConnect({
      projectId: "7f999d777dd494df9a3038f609665cea",
      metadata: {
        name: 'RippleBids',
        description: 'Blockchain-powered marketplace',
        url: 'https://your-domain.com',
        icons: ['https://your-domain.com/logo.jpg']
      }
    })
  ],
  transports: {
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

// Helper function to detect mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Inner component that uses Wagmi hooks
const MetamaskProviderInner = ({ children }) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const connectMetamaskWallet = async () => {
    try {
      const mobile = isMobile();
      
      if (mobile) {
        // For mobile devices, try WalletConnect first, then deep link to MetaMask
        const walletConnectConnector = connectors.find(
          (connector) => connector.id === 'walletConnect'
        );
        
        if (walletConnectConnector) {
          connect({ connector: walletConnectConnector });
          return;
        }
        
        // Fallback: Deep link to MetaMask mobile app
        const deepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
        window.open(deepLink, '_blank');
        return;
      }
      
      // Desktop: Use injected connector
      const metamaskConnector = connectors.find(
        (connector) => connector.id === 'metaMask'
      );
      
      if (!metamaskConnector) {
        throw new Error('MetaMask connector not found');
      }

      if (!window.ethereum) {
        alert("MetaMask is not installed. Please install MetaMask and try again.");
        return;
      }

      connect({ connector: metamaskConnector });
    } catch (error) {
      console.error("MetaMask connection error:", error);
      alert("Failed to connect MetaMask. Please try again.");
      throw error;
    }
  };

  const disconnectMetamaskWallet = () => {
    disconnect();
  };

  const value = {
    metamaskWalletAddress: address,
    evmWallet: address,
    isConnected,
    connecting: isConnecting,
    connectMetamaskWallet,
    disconnectMetamaskWallet,
  };

  return (
    <MetamaskContext.Provider value={value}>
      {children}
    </MetamaskContext.Provider>
  );
};

export const MetamaskProvider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MetamaskProviderInner>
          {children}
        </MetamaskProviderInner>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export const useMetamask = () => {
  const context = useContext(MetamaskContext);
  if (!context) {
    throw new Error('useMetamask must be used within a MetamaskProvider');
  }
  return context;
};