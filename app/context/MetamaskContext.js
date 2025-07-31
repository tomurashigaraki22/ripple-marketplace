"use client"

import React, { createContext, useContext, useEffect } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { metaMask } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

const MetamaskContext = createContext(null);

// Define XRPL EVM Sidechain Testnet with CORRECT configuration
const xrplEvmTestnet = defineChain({
  id: 1449000, // XRPL EVM Testnet chain ID
  name: 'XRPL EVM Sidechain Testnet',
  network: 'xrpl-evm-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'XRP',
    symbol: 'XRP',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.xrplevm.org'],
    },
    public: {
      http: ['https://rpc.testnet.xrplevm.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'XRPL EVM Testnet Explorer',
      url: 'https://evm-sidechain.peersyst.tech',
    },
  },
});

// Simplified Wagmi configuration - only injected connector
const config = createConfig({
  chains: [xrplEvmTestnet],
  connectors: [
    metaMask(),
  ],
  transports: {
    [xrplEvmTestnet.id]: http(),
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
  const { address, isConnected, isConnecting, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  // Auto-switch to XRPL EVM when connected but on wrong network
  useEffect(() => {
    if (isConnected && address && chain && chain.id !== 1449000) {
      console.log('Connected to wrong network, switching to XRPL EVM testnet...');
      switchToXRPLEVM();
    }
  }, [isConnected, address, chain]);

  const connectMetamaskWallet = async () => {
    try {
      console.log("Connectors: ", connectors)
      const metamaskConnector = connectors.find(
        (connector) => connector.id === 'metaMaskSDK'
      );
      
      if (!metamaskConnector) {
        throw new Error('MetaMask connector not found');
      }

      connect({ connector: metamaskConnector });
      
    } catch (error) {
      console.error("MetaMask connection error:", error);
      alert(`Failed to connect MetaMask: ${error}`);
      throw error;
    }
  };

  const switchToXRPLEVM = async () => {
    try {
      // Use Wagmi's switchChain for better mobile compatibility
      if (switchChain) {
        await switchChain({ chainId: 1449000 });
        console.log('Successfully switched to XRPL EVM testnet via Wagmi');
        return;
      }

      // Fallback to direct MetaMask call
      if (typeof window !== 'undefined' && window.ethereum) {
        const chainIdHex = '0x161c28';
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });
          console.log('Successfully switched to XRPL EVM testnet');
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x161c28',
                chainName: 'XRPL EVM Sidechain Testnet',
                nativeCurrency: {
                  name: 'XRP',
                  symbol: 'XRP',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.testnet.xrplevm.org'],
                blockExplorerUrls: ['https://evm-sidechain.peersyst.tech'],
              }],
            });
            console.log('Successfully added and switched to XRPL EVM testnet');
          } else {
            throw switchError;
          }
        }
      } else {
        console.warn('Cannot switch network: No wallet available');
        alert('Please manually switch to XRPL EVM Testnet in your wallet');
      }
    } catch (error) {
      console.error('Failed to switch to XRPL EVM testnet:', error);
      alert('Failed to switch to XRPL EVM testnet. Please switch manually in your wallet.');
    }
  };

  const disconnectMetamaskWallet = () => {
    disconnect();
  };

  // Create ethers signer from wallet client
  const getSigner = async () => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }
    
    // Convert viem wallet client to ethers signer
    const provider = new ethers.BrowserProvider(walletClient);
    return provider.getSigner();
  };

  const value = {
    metamaskWalletAddress: address,
    evmWallet: address,
    isConnected,
    connecting: isConnecting,
    currentChain: chain,
    isXRPLEVM: chain?.id === 1449000,
    connectMetamaskWallet,
    disconnectMetamaskWallet,
    switchToXRPLEVM,
    getSigner,
    walletClient,
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
