"use client"

import React, { createContext, useState, useContext, useEffect } from 'react';
import { XummPkce } from 'xumm-oauth2-pkce';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';

const WalletContext = createContext(null);

const LOCAL_KEY = 'xrpl_wallet';
const ETHEREUM_MAINNET_CHAIN_ID = 1;

export const WalletProviderMain = ({ children }) => {
  // XUMM/XRPL States
  const [xrpWalletAddress, setXrpWalletAddress] = useState(null);
  const [xrplWallet, setXrplWallet] = useState(null);
  const [xrpBalance, setXrpBalance] = useState(0);
  
  // MetaMask/EVM States
  const [metamaskWalletAddress, setMetamaskWalletAddress] = useState(null);
  const [evmWallet, setEvmWallet] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  
  // Solana States (using wallet adapter)
  const {
    publicKey: solanaPublicKey,
    connected: solanaConnected,
    connecting: solanaConnecting,
    disconnect: solanaDisconnect,
    wallet: solanaWalletAdapter,
    connect,
    select: solanaSelect
  } = useSolanaWallet();
  
  const [solanaBalance, setSolanaBalance] = useState(0);
  
  // General States
  const [currentStep, setCurrentStep] = useState(1);
  
  // Initialize XUMM
  const xumm = new XummPkce('6f42c09e-9637-49f2-8d90-d79f89b9d437', {
    redirectUrl: typeof window !== 'undefined' ? window.location.origin : '',
    rememberJwt: true,
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    implicit: true
  });

  // Utility function to get XRP balance
  const getXrpBalance = async (address) => {
    try {
      const response = await fetch(`https://api.xrpscan.com/api/v1/account/${address}`);
      const data = await response.json();
      return parseFloat(data.xrpBalance || 0);
    } catch (error) {
      console.error('Error fetching XRP balance:', error);
      return 0;
    }
  };

  // Utility function to get Solana balance
  const getSolanaBalance = async (address) => {
    try {
      const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const publicKey = new PublicKey(address);
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error fetching Solana balance:', error);
      return 0;
    }
  };

  // XUMM/XRPL Wallet Functions
  const connectXrpWallet = async () => {
    try {
      const payload = await xumm.authorize();
      console.log('Payload:', payload);
      
      const state = await xumm.state();
      console.log("Authorized account:", state.me.account);
      console.log("Full state:", state);

      const walletData = {
        address: state.me.account,
        network: 'mainnet',
      };
      
      setXrplWallet(walletData);
      setXrpWalletAddress(state.me.account);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(walletData));

      const balance = await getXrpBalance(state.me.account);
      setXrpBalance(balance);
      setCurrentStep(2);
      
      return walletData;
    } catch (err) {
      console.error("XUMM login failed:", err);
      throw err;
    }
  };

  const disconnectXrpWallet = () => {
    setXrpWalletAddress(null);
    setXrplWallet(null);
    setXrpBalance(0);
    localStorage.removeItem(LOCAL_KEY);
    setCurrentStep(1);
  };

  // MetaMask/EVM Wallet Functions
  const connectMetamaskWallet = async () => {
    try {
      setConnecting(true);
      
      if (!window.ethereum) {
        alert("MetaMask is not installed. Please install MetaMask and try again.");
        return;
      }

      // Check if already connected
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        console.log("Already connected:", accounts[0]);
        setEvmWallet(accounts[0]);
        setMetamaskWalletAddress(accounts[0]);
        setIsConnected(true);
        return accounts[0];
      }

      // Request account access
      const newAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!newAccounts || !newAccounts.length) {
        alert("Failed to connect MetaMask.");
        return;
      }

      // Ensure chain is Ethereum Mainnet
      const currentChainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(currentChainIdHex, 16);

      if (currentChainId !== ETHEREUM_MAINNET_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }],
          });
        } catch (err) {
          console.error("Error switching to Ethereum Mainnet:", err);
          alert("Please switch to Ethereum Mainnet manually in MetaMask.");
        }
      }

      setEvmWallet(newAccounts[0]);
      setMetamaskWalletAddress(newAccounts[0]);
      setIsConnected(true);
      
      return newAccounts[0];
    } catch (error) {
      console.error("MetaMask connection error:", error);
      alert("Failed to connect MetaMask. Please try again.");
      throw error;
    } finally {
      setConnecting(false);
    }
  };

  const disconnectMetamaskWallet = () => {
    setMetamaskWalletAddress(null);
    setEvmWallet(null);
    setIsConnected(false);
  };

  // Solana wallet functions (simplified with wallet adapter)
  const disconnectPhantomWallet = async () => {
    try {
      console.log('🔌 Disconnecting Solana wallet...');
      await solanaDisconnect();
      console.log('✅ Solana wallet disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting Solana wallet:', error);
    }
  };

  // Debug Solana wallet state changes
  useEffect(() => {
    console.log('🔍 Solana Wallet State Update:');
    console.log('  - Connected:', solanaConnected);
    console.log('  - Connecting:', solanaConnecting);
    console.log('  - Public Key:', solanaPublicKey?.toString());
    console.log('  - Wallet:', solanaWalletAdapter?.adapter?.name);
    
    if (solanaConnected && solanaPublicKey) {
      console.log('✅ Solana wallet successfully connected!');
    } else if (solanaConnecting) {
      console.log('⏳ Solana wallet is connecting...');
    } else {
      console.log('❌ Solana wallet not connected');
    }
  }, [solanaConnected, solanaConnecting, solanaPublicKey, solanaWalletAdapter]);

  // Initialize and handle XUMM events
  useEffect(() => {
    // Handle OAuth redirect and events
    xumm.on("success", async () => {
      try {
        const state = await xumm.state();
        console.log("Success - Account:", state.me.account);
        
        const walletData = {
          address: state.me.account,
          network: 'mainnet',
        };
        
        setXrplWallet(walletData);
        setXrpWalletAddress(state.me.account);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(walletData));

        const balance = await getXrpBalance(state.me.account);
        setXrpBalance(balance);
        setCurrentStep(2);
      } catch (err) {
        console.error("Error processing success:", err);
      }
    });

    xumm.on("error", (error) => {
      console.error("XUMM error:", error);
    });

    // Check for existing wallet connection
    const savedWallet = localStorage.getItem(LOCAL_KEY);
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet);
        setXrplWallet(walletData);
        setXrpWalletAddress(walletData.address);
        getXrpBalance(walletData.address).then(setXrpBalance);
      } catch (error) {
        console.error("Error loading saved wallet:", error);
        localStorage.removeItem(LOCAL_KEY);
      }
    }

    // Check for xummAuthToken in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const authToken = urlParams.get('xummAuthToken');
      if (authToken) {
        console.log("Detected return from OAuth");
      }

      if (window.location.href.includes("?xummAuthToken=")) {
        console.log("Detected return from OAuth");
      }
    }
  }, []);

  // Check for existing MetaMask connection on load
  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            setEvmWallet(accounts[0]);
            setMetamaskWalletAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error("Error checking MetaMask connection:", error);
        }
      }
    };

    checkMetaMaskConnection();
  }, []);

  // Update Solana balance when connected
  useEffect(() => {
    if (solanaConnected && solanaPublicKey) {
      console.log('💰 Fetching Solana balance for:', solanaPublicKey.toString());
      getSolanaBalance(solanaPublicKey.toString()).then((balance) => {
        console.log('💰 Solana balance:', balance);
        setSolanaBalance(balance);
      });
    } else {
      setSolanaBalance(0);
    }
  }, [solanaConnected, solanaPublicKey]);

  const value = {
    // XRPL/XUMM
    xrpWalletAddress,
    xrplWallet,
    xrpBalance,
    connectXrpWallet,
    disconnectXrpWallet,
    
    // MetaMask/EVM
    metamaskWalletAddress,
    evmWallet,
    isConnected,
    connecting,
    connectMetamaskWallet,
    disconnectMetamaskWallet,
    
    // Solana (using wallet adapter)
    phantomWalletAddress: solanaPublicKey?.toString() || null,
    solanaWallet: solanaWalletAdapter,
    solanaBalance,
    solanaConnected,
    solanaConnecting,
    disconnectPhantomWallet,
    
    // General
    currentStep,
    setCurrentStep,
    
    // Utility functions
    getXrpBalance,
    getSolanaBalance,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet2 = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};