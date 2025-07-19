/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
    domains: [
      'i.seadn.io',         // For OpenSea images
      'lh3.googleusercontent.com', // Common NFT CDN
      'ipfs.io',            // IPFS links
      'cdn.mintbase.xyz',   // Mintbase, if needed
      'arweave.net'         // Arweave-hosted NFTs
    ],
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  }
};

export default nextConfig;
