"use client"

import React, { createContext, useContext, useEffect } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const MetamaskContext = createContext(null);

// Wagmi configuration
const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

// Inner component that uses Wagmi hooks
const MetamaskProviderInner = ({ children }) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const connectMetamaskWallet = async () => {
    try {
      const metamaskConnector = connectors.find(
        (connector) => connector.id === 'metaMask'
      );
      console.log("Conectors: ", connectors)
      if (!metamaskConnector) {
        throw new Error('MetaMask connector not found');
      }

      // if (!window.ethereum) {
      //   alert("MetaMask is not installed. Please install MetaMask and try again.");
      //   return;
      // }

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