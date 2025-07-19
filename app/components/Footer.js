import Link from "next/link"
import { Twitter, Github, TextIcon as Telegram, DiscIcon as Discord } from "lucide-react"
import Image from "next/image"
import Logo from "../../public/logo.jpg"

export default function Footer() {
  return (
    <footer className="bg-black border-t border-[#39FF14]/20 py-12 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center">
                <Image src={Logo} alt="RippleBids Logo"/>
              </div>
              <span className="text-xl font-bold neon-text">RippleBids</span>
            </div>
            <p className="text-gray-400 mb-4">
              A futuristic, blockchain-powered marketplace built on XRP Ledger, EVM-compatible chains, and Solana.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-[#39FF14] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#39FF14] transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#39FF14] transition-colors">
                <Telegram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#39FF14] transition-colors">
                <Discord className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/marketplace" className="block text-gray-400 hover:text-[#39FF14] transition-colors">
                Marketplace
              </Link>
              <Link href="/membership" className="block text-gray-400 hover:text-[#39FF14] transition-colors">
                Membership
              </Link>
              <Link href="/portal" className="block text-gray-400 hover:text-[#39FF14] transition-colors">
                My Portal
              </Link>
              <Link href="/admin" className="block text-gray-400 hover:text-[#39FF14] transition-colors">
                Creator Portal
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <div className="space-y-2">
              <Link href="/faqs" className="block text-gray-400 hover:text-[#39FF14] transition-colors">
                FAQs
              </Link>
              <Link href="/docs" className="block text-gray-400 hover:text-[#39FF14] transition-colors">
                Documentation
              </Link>
              <Link href="/support" className="block text-gray-400 hover:text-[#39FF14] transition-colors">
                Support
              </Link>
              <Link href="/terms" className="block text-gray-400 hover:text-[#39FF14] transition-colors">
                Terms of Use
              </Link>
              <Link href="/privacy" className="block text-gray-400 hover:text-[#39FF14] transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[#39FF14]/20 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 RippleBids. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
