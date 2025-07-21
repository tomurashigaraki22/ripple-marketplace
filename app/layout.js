import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import { AuthProvider } from "./context/AuthContext"
import { WalletProvider } from "./context/WalletContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "RippleBids - Blockchain Marketplace",
  description: "A futuristic, blockchain-powered marketplace on XRP Ledger, EVM, and Solana",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <AuthProvider>
          <WalletProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
