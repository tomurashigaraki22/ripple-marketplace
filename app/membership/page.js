import Link from "next/link"
import { Check, Star, Crown, Zap, Sparkles, ArrowRight } from "lucide-react"

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
      buttonClass: "bg-black/40 backdrop-blur-xl border border-gray-600 text-gray-400 cursor-not-allowed",
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
      buttonClass: "bg-gradient-to-r from-[#39FF14] to-emerald-400 text-black hover:shadow-[0_0_40px_rgba(57,255,20,0.6)] transform hover:scale-105",
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
      buttonClass: "bg-black/40 backdrop-blur-xl border-2 border-[#39FF14]/50 text-[#39FF14] hover:border-[#39FF14] hover:shadow-[0_0_30px_rgba(57,255,20,0.3)] transform hover:scale-105",
      popular: false,
    },
  ]

  const benefits = [
    {
      title: "Lower Transaction Fees",
      description: "Save money on every transaction with reduced fees for Pro and Premium members",
      icon: <Zap className="w-8 h-8" />,
    },
    {
      title: "Exclusive NFT Drops",
      description: "Get early access to limited edition NFTs and exclusive marketplace items",
      icon: <Sparkles className="w-8 h-8" />,
    },
    {
      title: "Higher Staking Returns",
      description: "Earn more XRPB tokens through enhanced staking rewards for premium members",
      icon: <Star className="w-8 h-8" />,
    },
    {
      title: "Priority Support",
      description: "24/7 priority customer support with dedicated account management",
      icon: <Crown className="w-8 h-8" />,
    },
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(57,255,20,0.1),transparent_50%)] animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#39FF14] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 mt-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white via-[#39FF14] to-white bg-clip-text text-transparent leading-tight">
                Membership Tiers
              </h1>
              <div className="flex justify-center mb-6">
                <Sparkles className="w-8 h-8 text-[#39FF14] animate-pulse" />
              </div>
            </div>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-light leading-relaxed">
              Unlock exclusive benefits, lower fees, and <span className="text-[#39FF14] font-semibold">premium features</span> with XRPB membership tiers
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`group relative p-8 bg-black/40 backdrop-blur-xl border rounded-3xl transition-all duration-500 transform hover:scale-105 ${
                  tier.popular 
                    ? "border-[#39FF14]/60 hover:shadow-[0_0_50px_rgba(57,255,20,0.3)] scale-105" 
                    : "border-[#39FF14]/20 hover:border-[#39FF14]/40 hover:shadow-[0_0_30px_rgba(57,255,20,0.2)]"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#39FF14] to-emerald-400 text-black px-6 py-2 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(57,255,20,0.4)]">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                      tier.popular 
                        ? "bg-gradient-to-br from-[#39FF14] to-emerald-400 text-black shadow-[0_0_30px_rgba(57,255,20,0.5)]" 
                        : "bg-gradient-to-br from-[#39FF14]/20 to-emerald-400/20 text-[#39FF14] group-hover:shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                    }`}>
                      {tier.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-[#39FF14] transition-colors duration-300">{tier.name}</h3>
                    <div className="text-3xl font-black bg-gradient-to-r from-[#39FF14] to-emerald-400 bg-clip-text text-transparent mb-4">{tier.price}</div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-gradient-to-br from-[#39FF14] to-emerald-400 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                        <span className="text-gray-300 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${tier.buttonClass}`}>
                    {tier.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="relative mb-20">
            <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/10 to-emerald-400/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-black/60 backdrop-blur-xl border border-[#39FF14]/30 p-12 rounded-3xl">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-[#39FF14] bg-clip-text text-transparent">Membership Benefits</h2>
                <p className="text-xl text-gray-300 leading-relaxed">Discover what makes RippleBids membership special</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="group text-center p-6 bg-black/40 backdrop-blur-xl border border-[#39FF14]/20 rounded-2xl hover:border-[#39FF14]/40 transition-all duration-300 transform hover:scale-105">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14]/20 to-emerald-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#39FF14] group-hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-300">
                      {benefit.icon}
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-white group-hover:text-[#39FF14] transition-colors duration-300">{benefit.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/10 to-emerald-400/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-black/60 backdrop-blur-xl border border-[#39FF14]/30 p-12 rounded-3xl">
              <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-white to-[#39FF14] bg-clip-text text-transparent">Payment Options</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="group text-center p-8 bg-black/40 backdrop-blur-xl border border-[#39FF14]/20 rounded-2xl hover:border-[#39FF14]/40 transition-all duration-300 transform hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14] to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(57,255,20,0.3)]">
                    <span className="text-2xl">🪙</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-[#39FF14] transition-colors duration-300">Pay with XRPB</h3>
                  <p className="text-gray-400 mb-4 leading-relaxed">Use your XRPB tokens for membership upgrades</p>
                  <div className="text-[#39FF14] font-bold text-lg">10% Discount</div>
                </div>

                <div className="group text-center p-8 bg-black/40 backdrop-blur-xl border border-[#39FF14]/20 rounded-2xl hover:border-[#39FF14]/40 transition-all duration-300 transform hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14]/20 to-emerald-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#39FF14] group-hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-300">
                    <span className="text-2xl">💵</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-[#39FF14] transition-colors duration-300">Pay with USDT</h3>
                  <p className="text-gray-400 mb-4 leading-relaxed">Pay with USDT across all supported chains</p>
                  <div className="text-gray-400 font-semibold">Standard Pricing</div>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href="/wallet"
                  className="group relative inline-flex items-center px-12 py-6 bg-gradient-to-r from-[#39FF14] to-emerald-400 text-black rounded-2xl font-bold text-xl hover:shadow-[0_0_50px_rgba(57,255,20,0.6)] transition-all duration-300 transform hover:scale-105 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#39FF14] to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></span>
                  <span className="relative flex items-center gap-3">
                    Connect Wallet to Upgrade
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
