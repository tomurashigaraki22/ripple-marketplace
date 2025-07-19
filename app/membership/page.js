import Link from "next/link"
import { Check, Star, Crown, Zap } from "lucide-react"

export default function MembershipPage() {
  const tiers = [
    {
      name: "Free",
      price: "Free",
      icon: <Star className="w-8 h-8" />,
      features: [
        "Basic marketplace access",
        "Standard transaction fees (2.5%)",
        "Community support",
        "Basic profile features",
        "Limited daily transactions (10)",
      ],
      buttonText: "Current Plan",
      buttonClass: "border border-gray-600 text-gray-400 cursor-not-allowed",
      popular: false,
    },
    {
      name: "Pro",
      price: "100 XRPB/month",
      icon: <Zap className="w-8 h-8" />,
      features: [
        "All Free features",
        "Reduced fees (1.5%)",
        "Priority customer support",
        "Advanced analytics",
        "Unlimited transactions",
        "Early access to new features",
        "Custom profile themes",
      ],
      buttonText: "Upgrade to Pro",
      buttonClass: "bg-[#39FF14] text-black hover:neon-glow",
      popular: true,
    },
    {
      name: "Premium",
      price: "500 XRPB/month",
      icon: <Crown className="w-8 h-8" />,
      features: [
        "All Pro features",
        "Lowest fees (0.5%)",
        "Dedicated account manager",
        "Exclusive drops access",
        "Higher staking returns (15% APY)",
        "White-label solutions",
        "API access",
        "Custom integrations",
      ],
      buttonText: "Upgrade to Premium",
      buttonClass: "neon-border hover:neon-glow",
      popular: false,
    },
  ]

  const benefits = [
    {
      title: "Lower Transaction Fees",
      description: "Save money on every transaction with reduced fees for Pro and Premium members",
      icon: "💰",
    },
    {
      title: "Exclusive NFT Drops",
      description: "Get early access to limited edition NFTs and exclusive marketplace items",
      icon: "🎨",
    },
    {
      title: "Higher Staking Returns",
      description: "Earn more XRPB tokens through enhanced staking rewards for premium members",
      icon: "📈",
    },
    {
      title: "Priority Support",
      description: "24/7 priority customer support with dedicated account management",
      icon: "🎧",
    },
  ]

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Membership Tiers</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Unlock exclusive benefits, lower fees, and premium features with XRPB membership tiers
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`card-glow p-8 rounded-lg relative ${tier.popular ? "border-[#39FF14] scale-105" : ""}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#39FF14] text-black px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="text-[#39FF14] mb-4">{tier.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="text-3xl font-bold neon-text mb-4">{tier.price}</div>
              </div>

              <div className="space-y-4 mb-8">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-[#39FF14] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-3 rounded-lg font-semibold transition-all ${tier.buttonClass}`}>
                {tier.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="gradient-bg p-12 rounded-lg mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Membership Benefits</h2>
            <p className="text-xl text-gray-300">Discover what makes RippleBids membership special</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Options */}
        <div className="card-glow p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Payment Options</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center p-6 border border-gray-600 rounded-lg">
              <div className="text-3xl mb-4">🪙</div>
              <h3 className="text-xl font-semibold mb-2">Pay with XRPB</h3>
              <p className="text-gray-400 mb-4">Use your XRPB tokens for membership upgrades</p>
              <div className="text-[#39FF14] font-semibold">10% Discount</div>
            </div>

            <div className="text-center p-6 border border-gray-600 rounded-lg">
              <div className="text-3xl mb-4">💵</div>
              <h3 className="text-xl font-semibold mb-2">Pay with USDT</h3>
              <p className="text-gray-400 mb-4">Pay with USDT across all supported chains</p>
              <div className="text-gray-400">Standard Pricing</div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/wallet"
              className="inline-flex items-center px-8 py-4 bg-[#39FF14] text-black rounded-lg font-semibold hover:neon-glow transition-all"
            >
              Connect Wallet to Upgrade
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
