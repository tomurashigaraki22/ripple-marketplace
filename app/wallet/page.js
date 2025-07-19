"use client"
import { useState } from "react"
import { Copy } from "lucide-react"

export default function WalletPage() {
  const [connectedWallet, setConnectedWallet] = useState(null)
  const [balance, setBalance] = useState({
    xrpb: 1250.75,
    xrp: 45.2,
    sol: 12.8,
    eth: 0.5,
  })

  const wallets = [
    {
      name: "XUMM",
      chain: "XRP Ledger",
      icon: "🔷",
      address: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      connected: connectedWallet === "xumm",
    },
    {
      name: "MetaMask",
      chain: "XRPL-EVM",
      icon: "🦊",
      address: "0x742d35Cc6634C0532925a3b8D4C9db96590b5b8e",
      connected: connectedWallet === "metamask",
    },
    {
      name: "Phantom",
      chain: "Solana",
      icon: "👻",
      address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      connected: connectedWallet === "phantom",
    },
  ]

  const handleConnect = (walletType) => {
    setConnectedWallet(walletType)
    alert(`Connected to ${walletType}! (Mock)`)
  }

  const handleDisconnect = () => {
    setConnectedWallet(null)
    alert("Wallet disconnected!")
  }

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address)
    alert("Address copied to clipboard!")
  }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Wallet Connection</h1>
          <p className="text-xl text-gray-300">Connect your wallet to start trading on RippleBids</p>
        </div>

        {/* Connected Wallet Status */}
        {connectedWallet && (
          <div className="card-glow p-6 rounded-lg mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold neon-text">Connected Wallet</h2>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                Disconnect
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Wallet Info</h3>
                <div className="space-y-2">
                  <p>
                    <span className="text-gray-400">Type:</span> {wallets.find((w) => w.connected)?.name}
                  </p>
                  <p>
                    <span className="text-gray-400">Chain:</span> {wallets.find((w) => w.connected)?.chain}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Address:</span>
                    <span className="font-mono text-sm">
                      {wallets.find((w) => w.connected)?.address.slice(0, 10)}...
                    </span>
                    <button
                      onClick={() => copyAddress(wallets.find((w) => w.connected)?.address)}
                      className="text-[#39FF14] hover:text-[#39FF14]/80"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Balances</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>XRPB:</span>
                    <span className="neon-text font-semibold">{balance.xrpb.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>XRP:</span>
                    <span>{balance.xrp.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SOL:</span>
                    <span>{balance.sol.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ETH:</span>
                    <span>{balance.eth.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {wallets.map((wallet) => (
            <div key={wallet.name} className={`card-glow p-6 rounded-lg ${wallet.connected ? "border-[#39FF14]" : ""}`}>
              <div className="text-center">
                <div className="text-4xl mb-4">{wallet.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{wallet.name}</h3>
                <p className="text-gray-400 mb-4">{wallet.chain}</p>

                {wallet.connected ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-[#39FF14]">
                      <div className="w-2 h-2 bg-[#39FF14] rounded-full"></div>
                      <span>Connected</span>
                    </div>
                    <div className="text-sm text-gray-400 font-mono">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(wallet.name.toLowerCase())}
                    className="w-full py-2 neon-border rounded-lg hover:neon-glow transition-all"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Chain Switcher */}
        <div className="card-glow p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Active Chain</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-[#39FF14] rounded-lg bg-[#39FF14]/10">
              <div className="text-center">
                <div className="text-2xl mb-2">🔷</div>
                <div className="font-semibold">XRP Ledger</div>
                <div className="text-sm text-gray-400">Active</div>
              </div>
            </button>
            <button className="p-4 border border-gray-600 rounded-lg hover:border-[#39FF14] transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-semibold">XRPL-EVM</div>
                <div className="text-sm text-gray-400">Switch</div>
              </div>
            </button>
            <button className="p-4 border border-gray-600 rounded-lg hover:border-[#39FF14] transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-2">🌟</div>
                <div className="font-semibold">Solana</div>
                <div className="text-sm text-gray-400">Switch</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
