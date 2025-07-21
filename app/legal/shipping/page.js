export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Shipping Policy</h1>
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Shipping Methods</h2>
            <div className="card-glow p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Standard Shipping</h3>
              <p className="text-gray-300 mb-4">Delivery within 5-7 business days</p>
              <ul className="list-disc pl-6 text-gray-300">
                <li>Tracking provided</li>
                <li>Insurance included</li>
                <li>Signature required for items over 1000 XRPB</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Shipping Fees</h2>
            <p className="text-gray-300 mb-4">
              Shipping fees are calculated based on:
            </p>
            <ul className="list-disc pl-6 text-gray-300">
              <li>Item weight and dimensions</li>
              <li>Shipping destination</li>
              <li>Selected shipping method</li>
              <li>Insurance value</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Crypto Payment for Shipping</h2>
            <p className="text-gray-300 mb-4">
              All shipping fees can be paid using:
            </p>
            <ul className="list-disc pl-6 text-gray-300">
              <li>XRPB Tokens</li>
              <li>XRP</li>
              <li>ETH (on XRPL-EVM)</li>
              <li>SOL</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}