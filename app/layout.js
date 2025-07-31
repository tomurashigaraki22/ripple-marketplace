import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import { AuthProvider } from "./context/AuthContext"
import { XRPLProvider } from "./context/XRPLContext"
import { PhantomProvider } from "./context/PhantomContext"
import { MetamaskProvider } from "./context/MetamaskContext"
import ConditionalNavbar from "./components/ConditionalNavbar"
import ConditionalFooter from "./components/ConditionalFooter"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "RippleBids - Blockchain Marketplace",
  description: "A futuristic, blockchain-powered marketplace on XRP Ledger, EVM, and Solana",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <XRPLProvider>
            <MetamaskProvider>
              <PhantomProvider>
                <ConditionalNavbar />
                {children}
                <ConditionalFooter />
              </PhantomProvider>
            </MetamaskProvider>
          </XRPLProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
