"use client"

import React, { createContext, useState, useContext, useEffect } from 'react';
import { XummPkce } from 'xumm-oauth2-pkce';

const XRPLContext = createContext(null);

const LOCAL_KEY = 'xrpl_wallet';

export const XRPLProvider = ({ children }) => {
  const [xrpWalletAddress, setXrpWalletAddress] = useState(null);
  const [xrplWallet, setXrplWallet] = useState(null);
  const [xrpBalance, setXrpBalance] = useState(0);
  const [xrpbBalance, setXrpbBalance] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

  // Initialize XUMM for mainnet
  const xumm = new XummPkce('6f42c09e-9637-49f2-8d90-d79f89b9d437', {
    redirectUrl: typeof window !== 'undefined' ? window.location.origin : '',
    rememberJwt: true,
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    implicit: true
  });

  // Utility function to get XRP balance (mainnet)
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

  // Utility function to get XRPB token balance
  const getXrpbBalance = async (address) => {
    try {
      // Replace with actual XRPB token details
      const XRPB_CURRENCY = 'XRPB';
      const XRPB_ISSUER = 'YOUR_XRPB_ISSUER_ADDRESS'; // Replace with actual issuer
      
      const response = await fetch(`https://api.xrpscan.com/api/v1/account/${address}/balances`);
      const data = await response.json();
      
      const xrpbToken = data.find(token => 
        token.currency === XRPB_CURRENCY && token.issuer === XRPB_ISSUER
      );
      
      return parseFloat(xrpbToken?.value || 0);
    } catch (error) {
      console.error('Error fetching XRPB balance:', error);
      return 0;
    }
  };

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

      // Fetch both XRP and XRPB balances
      const xrpBal = await getXrpBalance(state.me.account);
      const xrpbBal = await getXrpbBalance(state.me.account);
      
      setXrpBalance(xrpBal);
      setXrpbBalance(xrpbBal);
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
    setXrpbBalance(0);
    localStorage.removeItem(LOCAL_KEY);
    setCurrentStep(1);
  };

  // Initialize and handle XUMM events
  useEffect(() => {
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

        const xrpBal = await getXrpBalance(state.me.account);
        const xrpbBal = await getXrpbBalance(state.me.account);
        
        setXrpBalance(xrpBal);
        setXrpbBalance(xrpbBal);
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
        
        // Fetch current balances
        getXrpBalance(walletData.address).then(setXrpBalance);
        getXrpbBalance(walletData.address).then(setXrpbBalance);
      } catch (error) {
        console.error("Error loading saved wallet:", error);
        localStorage.removeItem(LOCAL_KEY);
      }
    }

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

  const value = {
    xrpWalletAddress,
    xrplWallet,
    xrpBalance,
    xrpbBalance,
    connectXrpWallet,
    disconnectXrpWallet,
    currentStep,
    setCurrentStep,
    getXrpBalance,
    getXrpbBalance,
  };

  return (
    <XRPLContext.Provider value={value}>
      {children}
    </XRPLContext.Provider>
  );
};

export const useXRPL = () => {
  const context = useContext(XRPLContext);
  if (!context) {
    throw new Error('useXRPL must be used within an XRPLProvider');
  }
  return context;
};