"use client"
import { useState } from "react"
import { ChevronDown, ChevronUp, Search, Book, HelpCircle, MessageCircle } from "lucide-react"

export default function FAQsPage() {
  const [openFAQ, setOpenFAQ] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  const faqCategories = [
    {
      title: "Getting Started",
      icon: <Book className="w-6 h-6" />,
      faqs: [
        {
          question: "What is RippleBids?",
          answer:
            "RippleBids is a decentralized marketplace built on XRP Ledger, EVM-compatible chains (XRPL-EVM), and Solana. It allows users to buy, sell, and trade digital assets using XRPB tokens.",
        },
        {
          question: "How do I get started on RippleBids?",
          answer:
            "To get started: 1) Connect your wallet (XUMM, MetaMask, or Phantom), 2) Claim or buy XRPB tokens, 3) Browse the marketplace and start bidding on items you like.",
        },
        {
          question: "What wallets are supported?",
          answer:
            "We support XAMAN for XRP Ledger, MetaMask for XRPL-EVM chains, and Phantom for Solana. Each wallet connects to its respective blockchain network.",
        },
      ],
    },
    {
      title: "XRPB Token",
      icon: <HelpCircle className="w-6 h-6" />,
      faqs: [
        {
          question: "What is XRPB token?",
          answer:
            "XRPB is the native utility token of RippleBids. It&rsquo;s used for purchases, membership rewards, staking access, and unlocking premium features across the platform.",
        },
        {
          question: "How can I get XRPB tokens?",
          answer:
            "You can get XRPB tokens through: 1) Our airdrop program, 2) Purchasing directly on the platform, 3) Earning through staking rewards, 4) Trading on supported exchanges.",
        },
        {
          question: "What can I do with XRPB tokens?",
          answer:
            "XRPB tokens can be used to: purchase NFTs and digital assets, upgrade membership tiers, stake for rewards, access premium features, and participate in governance voting.",
        },
      ],
    },
    {
      title: "Trading & Marketplace",
      icon: <MessageCircle className="w-6 h-6" />,
      faqs: [
        {
          question: "How do I place a bid?",
          answer:
            "To place a bid: 1) Navigate to the item you want, 2) Enter your bid amount (must be higher than current bid), 3) Confirm the transaction in your wallet, 4) Wait for confirmation.",
        },
        {
          question: "What are the trading fees?",
          answer:
            "Trading fees vary by membership tier: Free tier (2.5%), Pro tier (1.5%), Premium tier (0.5%). Fees are automatically deducted from transactions.",
        },
        {
          question: "Can I cancel a bid?",
          answer:
            "Bids cannot be cancelled once placed, as they are recorded on the blockchain. Make sure you&rsquo;re comfortable with your bid amount before confirming.",
        },
      ],
    },
    {
      title: "Membership Tiers",
      icon: <Book className="w-6 h-6" />,
      faqs: [
        {
          question: "What are the membership tiers?",
          answer:
            "We offer three tiers: Free (basic access), Pro (100 XRPB/month with reduced fees and priority support), and Premium (500 XRPB/month with lowest fees and exclusive features).",
        },
        {
          question: "How do I upgrade my membership?",
          answer:
            "Visit the Membership page, select your desired tier, and pay with XRPB tokens (10% discount) or USDT. Your benefits activate immediately after payment confirmation.",
        },
        {
          question: "Can I downgrade my membership?",
          answer:
            "Yes, you can downgrade at any time. Changes take effect at the end of your current billing cycle, and you&rsquo;ll retain benefits until then.",
        },
      ],
    },
  ]

  const filteredFAQs = faqCategories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.faqs.length > 0)

  const toggleFAQ = (categoryIndex, faqIndex) => {
    const key = `${categoryIndex}-${faqIndex}`
    setOpenFAQ(openFAQ === key ? null : key)
  }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-300">Find answers to common questions about RippleBids</p>
        </div>

        {/* Search */}
        <div className="card-glow p-6 rounded-lg mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full pl-10 pr-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:border-[#39FF14] focus:outline-none"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {filteredFAQs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="card-glow p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-[#39FF14]">{category.icon}</div>
                <h2 className="text-2xl font-bold">{category.title}</h2>
              </div>

              <div className="space-y-4">
                {category.faqs.map((faq, faqIndex) => {
                  const isOpen = openFAQ === `${categoryIndex}-${faqIndex}`
                  return (
                    <div key={faqIndex} className="border border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFAQ(categoryIndex, faqIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                      >
                        <span className="font-semibold">{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-[#39FF14]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-6 py-4 bg-black/30 border-t border-gray-700">
                          <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {searchTerm && filteredFAQs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No FAQs found matching your search.</p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 px-6 py-2 neon-border rounded-lg hover:neon-glow transition-all"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Contact Support */}
        <div className="card-glow p-8 rounded-lg mt-12 text-center">
          <h3 className="text-2xl font-bold mb-4">Still Need Help?</h3>
          <p className="text-gray-300 mb-6">Can&rsquo;t find what you&rsquo;re looking for? Our support team is here to help.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-[#39FF14] text-black rounded-lg font-semibold hover:neon-glow transition-all">
              Contact Support
            </button>
            <button className="px-6 py-3 neon-border rounded-lg font-semibold hover:neon-glow transition-all">
              Join Discord
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="card-glow p-6 rounded-lg text-center">
            <Book className="w-8 h-8 text-[#39FF14] mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Documentation</h4>
            <p className="text-sm text-gray-400 mb-4">Comprehensive guides and tutorials</p>
            <button className="text-[#39FF14] hover:underline">Read Docs</button>
          </div>

          <div className="card-glow p-6 rounded-lg text-center">
            <HelpCircle className="w-8 h-8 text-[#39FF14] mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Wallet Setup</h4>
            <p className="text-sm text-gray-400 mb-4">Learn how to connect your wallet</p>
            <button className="text-[#39FF14] hover:underline">Setup Guide</button>
          </div>

          <div className="card-glow p-6 rounded-lg text-center">
            <MessageCircle className="w-8 h-8 text-[#39FF14] mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Community</h4>
            <p className="text-sm text-gray-400 mb-4">Join our community discussions</p>
            <button className="text-[#39FF14] hover:underline">Join Now</button>
          </div>
        </div>
      </div>
    </div>
  )
}
