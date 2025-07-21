"use client"

import React, { createContext, useState, useContext } from 'react';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [xrpWalletAddress, setXrpWalletAddress] = useState(null);
  const [metamaskWalletAddress, setMetamaskWalletAddress] = useState(null);
  const [xrplevmWalletAddress, setXrplevmWalletAddress] = useState(null);

  const connectXrpWallet = async () => {
    // Implement XRP wallet connection logic here
    // Example: setXrpWalletAddress("rExampleXrpAddress");
  };

  const disconnectXrpWallet = () => {
    setXrpWalletAddress(null);
  };

  const connectMetamaskWallet = async () => {
    // Implement MetaMask connection logic here
    // Example:
    // const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    // setMetamaskWalletAddress(accounts[0]);
  };

  const disconnectMetamaskWallet = () => {
    setMetamaskWalletAddress(null);
  };

  const connectXrplevmWallet = async () => {
    // Implement XRPL EVM wallet connection logic here
    // Example: setXrplevmWalletAddress("0xExampleXrplevmAddress");
  };

  const disconnectXrplevmWallet = () => {
    setXrplevmWalletAddress(null);
  };

  return (
    <WalletContext.Provider value={{
      xrpWalletAddress,
      connectXrpWallet,
      disconnectXrpWallet,
      metamaskWalletAddress,
      connectMetamaskWallet,
      disconnectMetamaskWallet,
      xrplevmWalletAddress,
      connectXrplevmWallet,
      disconnectXrplevmWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);