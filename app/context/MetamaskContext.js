"use client"

import React, { createContext, useContext, useEffect } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { custom, defineChain } from 'viem';
import { metaMask, walletConnect } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useWalletClient } from 'wagmi';
import { BrowserProvider, ethers } from 'ethers';

const MetamaskContext = createContext(null);

// Define XRPL EVM Sidechain Testnet with CORRECT configuration
const xrplEvmTestnet = defineChain({
  id: 1440000, // XRPL EVM Testnet chain ID
  name: 'XRPL EVM Sidechain Mainnet',
  network: 'xrpl-evm-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'XRP',
    symbol: 'XRP',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.xrplevm.org'],
    },
    public: {
      http: ['https://rpc.xrplevm.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'XRPL EVM Explorer',
      url: 'https://explorer.xrplevm.org',
    },
  },
});

// Helper function to detect mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

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


// Inner component that uses Wagmi hooks
const MetamaskProviderInner = ({ children }) => {
  const { address, isConnected, isConnecting, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  // Auto-switch to XRPL EVM when connected but on wrong network
  useEffect(() => {
    if (isConnected && address && chain && chain.id !== 1440000) {
      console.log('Connected to wrong network, switching to XRPL EVM testnet...: ', chain.id);
      switchToXRPLEVM();
    }
  }, [isConnected, address, chain]);

const connectMetamaskWallet = async () => {
  try {
    const preferredConnector = connectors.find((c) => c.id === 'metaMaskSDK');

    if (!preferredConnector) {
      throw new Error('No suitable connector found');
    }

    connect({ connector: preferredConnector });
  } catch (error) {
    console.error("Connection error:", error);
    alert(`Failed to connect wallet: ${error.message || error}`);
    throw error;
  }
};


  const switchToXRPLEVM = async () => {
    try {
      // Use Wagmi's switchChain for better mobile compatibility
      console.log("CHain")
      if (switchChain) {
        await switchChain({ chainId: 1440000 });
        console.log('Successfully switched to XRPL EVM testnet via Wagmi');
        return;
      }

      // Fallback to direct MetaMask call
      if (typeof window !== 'undefined' && window.ethereum) {
        // const chainIdHex = '0x161c28';
        const chainIdHex = '0x15f900'
        
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
                chainId: 1440000,
                chainName: 'XRPL EVM Sidechain',
                nativeCurrency: {
                  name: 'XRP',
                  symbol: 'XRP',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.xrplevm.org'],
                blockExplorerUrls: ['https://explorer.xrplevm.org'],
              }],
            });
            console.log('Successfully added and switched to XRPL EVM testnet');
          } else {
            throw switchError;
          }
        }
      } else {
        console.warn('Cannot switch network: No wallet available');
        alert('Please manually switch to XRPL EVM Mainnet in your wallet');
      }
    } catch (error) {
      console.error('Failed to switch to XRPL EVM testnet:', error);
      alert('Failed to switch to XRPL EVM Mainnet. Please switch manually in your wallet.');
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

  // Convert viem WalletClient to an EIP-1193 compatible provider for ethers
  let signer;
  if (walletClient) {
    const provider = new ethers.BrowserProvider(walletClient);
    signer = await provider.getSigner();
  }
  return signer;
};

  const value = {
    metamaskWalletAddress: address,
    evmWallet: address,
    isConnected,
    connecting: isConnecting,
    currentChain: chain,
    isXRPLEVM: chain?.name === "XRPL EVM Sidechain Mainnet",  // <-- HERE!
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
