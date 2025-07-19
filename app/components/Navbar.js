"use client"
import { useState } from "react"
import Link from "next/link"
import { Menu, X, Wallet, User, ShoppingBag } from "lucide-react"
import Image from "next/image"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-[#39FF14]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand (always left) */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={require("../../public/logo.jpg")}
                alt="RippleBids Logo"
                width={32}
                height={32}
              />
            </div>
            <span className="text-xl font-bold neon-text text-white">RippleBids</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/marketplace" className="hover:text-[#39FF14] transition-colors">
              Marketplace
            </Link>
            <Link href="/membership" className="hover:text-[#39FF14] transition-colors">
              Membership
            </Link>
            <Link href="/portal" className="hover:text-[#39FF14] transition-colors">
              My Portal
            </Link>
            <Link href="/faqs" className="hover:text-[#39FF14] transition-colors">
              FAQs
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/wallet"
              className="flex items-center space-x-2 px-4 py-2 neon-border rounded-lg hover:neon-glow transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-[#39FF14] text-black rounded-lg hover:bg-[#39FF14]/80 transition-colors"
            >
              Login
            </Link>
          </div>

          {/* Mobile menu button (always right) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2 ml-auto"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            isOpen ? "max-h-screen py-4 space-y-4" : "max-h-0"
          }`}
        >
          <Link href="/marketplace" className="block hover:text-[#39FF14] transition-colors">
            Marketplace
          </Link>
          <Link href="/membership" className="block hover:text-[#39FF14] transition-colors">
            Membership
          </Link>
          <Link href="/portal" className="block hover:text-[#39FF14] transition-colors">
            My Portal
          </Link>
          <Link href="/faqs" className="block hover:text-[#39FF14] transition-colors">
            FAQs
          </Link>
          <div className="pt-4 space-y-2">
            <Link
              href="/wallet"
              className="block w-full text-center px-4 py-2 neon-border rounded-lg"
            >
              Connect Wallet
            </Link>
            <Link
              href="/login"
              className="block w-full text-center px-4 py-2 bg-[#39FF14] text-black rounded-lg"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-[#39FF14]/20 px-4 py-2">
        <div className="flex justify-around items-center text-white">
          <Link href="/marketplace" className="flex flex-col items-center space-y-1 p-2">
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs">Market</span>
          </Link>
          <Link href="/wallet" className="flex flex-col items-center space-y-1 p-2">
            <Wallet className="w-5 h-5" />
            <span className="text-xs">Wallet</span>
          </Link>
          <Link href="/portal" className="flex flex-col items-center space-y-1 p-2">
            <User className="w-5 h-5" />
            <span className="text-xs">Portal</span>
          </Link>
        </div>
      </div> */}
    </nav>
  )
}