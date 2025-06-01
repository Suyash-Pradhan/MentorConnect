
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'medium.com', // Added medium.com
        port: '',
        pathname: '/**',
      }
    ],
  },
  experimental: {
    allowedDevOrigins: [
        "https://6000-firebase-studio-1747927102257.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev",
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent 'async_hooks' from being bundled on the client, as it's a Node.js built-in
      config.resolve.fallback = {
        ...config.resolve.fallback, // Spread existing fallbacks
        async_hooks: false,
      };
    }
    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
