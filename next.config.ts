
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
  webpack: (config, { isServer, webpack }) => { // `webpack` is destructured from the context object
    if (!isServer) {
      // Ensure resolve and fallback objects exist
      config.resolve = config.resolve || {};
      config.resolve.fallback = config.resolve.fallback || {};

      // Standard fallbacks (should handle these)
      config.resolve.fallback.async_hooks = false;
      config.resolve.fallback['node:async_hooks'] = false;
      config.resolve.fallback.fs = false;
      config.resolve.fallback.tls = false;
      config.resolve.fallback.net = false;
      config.resolve.fallback.http2 = false;
      config.resolve.fallback.dns = false;
      config.resolve.fallback.child_process = false;
      config.resolve.fallback.perf_hooks = false;
      config.resolve.fallback['node:perf_hooks'] = false;

      // Add IgnorePlugin for node: prefixed modules and non-prefixed ones as a stronger measure
      if (webpack && webpack.IgnorePlugin) { // Check if webpack and IgnorePlugin are available
        config.plugins = config.plugins || []; // Ensure plugins array exists
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^node:async_hooks$/,
          })
        );
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^async_hooks$/, // For non-prefixed
          })
        );
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^node:perf_hooks$/,
          })
        );
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^perf_hooks$/, // For non-prefixed
          })
        );
      }
    }
    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
