"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Search, Book, HelpCircle, MessageCircle } from "lucide-react"
import Link from "next/link"

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
            "XRPB is the native utility token of RippleBids. It's used for purchases, membership rewards, staking access, and unlocking premium features across the platform.",
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
      title: "Tokenomics",
      icon: <MessageCircle className="w-6 h-6" />,
      faqs: [
        {
          question: "What is the XRPB token allocation across different blockchains?",
          answer:
            "XRPB tokens are distributed across three blockchains: <br/><br/><strong>XRPB EVM (3,029,940,000 tokens):</strong><br/>• DEX/Pre-Sale: 20% (600M tokens)<br/>• Community: 15% (450M tokens)<br/>• Marketing/Development: 11.67% (350M tokens)<br/>• Burn: 11.83% (355M tokens)<br/>• Locked Liquidity: 10.67% (300M tokens)<br/>• Board Holdings: 22% (665M tokens total)<br/>• Other allocations: Treasury, Payroll, Grants, Vested Liquidity<br/><br/><strong>XRPBL (100,000,000 tokens):</strong><br/>• Public Ecosystem: 90% (90M tokens)<br/>• Company Holdings: 10% (10M tokens)<br/><br/><strong>XRPB-SOL (999,939,600 tokens):</strong><br/>• Public Ecosystem: 94.23% (942M tokens)<br/>• Company Holdings: 5.72% (57M tokens)",
        },
        {
          question: "How are XRPB tokens used for governance and development?",
          answer:
            "XRPB tokens allocated for governance include board holdings for CEO (8.33%), CFO (5.5%), COO (5.5%), and CMO (5.5%). Development and marketing allocations range from 9.71% to 25% depending on the blockchain, ensuring continuous platform improvement and growth.",
        },
        {
          question: "What percentage of tokens are locked or reserved?",
          answer:
            "Token security measures include: Locked Liquidity (10.67% on XRPB EVM, 20% on XRPBL, 68.14% on XRPB-SOL), Vested Liquidity (2.67% on XRPB EVM), and Reserve allocations (2.87-5%) for emergency use across all chains.",
        },
        {
          question: "How does the burn mechanism work?",
          answer:
            "XRPB EVM has 11.83% (354,990,000 tokens) allocated for deflationary burns. This mechanism helps reduce the total supply over time, potentially increasing the value of remaining tokens in circulation.",
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
            "We offer three tiers: Free (basic access), Pro (25 $/month with reduced fees and priority support), and Premium (50 $/month with lowest fees and exclusive features).",
        },
        {
          question: "How do I upgrade my membership?",
          answer:
            "Visit the Membership page, select your desired tier, and pay with XRPB tokens. Your benefits activate immediately after payment confirmation.",
        },
        {
          question: "Can I downgrade my membership?",
          answer:
            "Yes, you can downgrade at any time. Changes take effect at the end of your current billing cycle, and you'll retain benefits until then.",
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
                          <div 
                            className="text-gray-300 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                          />
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
            <a 
              href="mailto:support@ripplebids.com"
              className="px-6 py-3 bg-[#39FF14] text-black rounded-lg font-semibold hover:neon-glow transition-all"
            >
              Contact Support
            </a>
            <a 
              href="https://discord.gg/NDz7zWuG"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 neon-border rounded-lg font-semibold hover:neon-glow transition-all"
            >
              Join Discord
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="card-glow p-6 rounded-lg text-center">
            <MessageCircle className="w-8 h-8 text-[#39FF14] mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Community</h4>
            <p className="text-sm text-gray-400 mb-4">Join our community discussions</p>
            <a 
              href="https://discord.gg/NDz7zWuG"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#39FF14] hover:underline"
            >
              Join Now
            </a>
          </div>

          <div className="card-glow p-6 rounded-lg text-center">
            <Book className="w-8 h-8 text-[#39FF14] mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Terms of Service</h4>
            <p className="text-sm text-gray-400 mb-4">Read our terms and conditions</p>
            <Link href="/legal/terms" className="text-[#39FF14] hover:underline">
              Read Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
