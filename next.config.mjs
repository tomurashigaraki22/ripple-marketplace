/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
    domains: [
      'i.seadn.io',         // For OpenSea images
      'lh3.googleusercontent.com', // Common NFT CDN
      'ipfs.io',            // IPFS links
      'cdn.mintbase.xyz',   // Mintbase, if needed
      'arweave.net',
      'airnfts.s3.amazonaws.com',
      'img-cdn.magiceden.dev',
      'learn.mudrex.com',
      'static01.nyt.com',
      'miro.medium.com',
      'encrypted-tbn0.gstatic.com',
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
