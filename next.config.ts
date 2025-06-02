
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

      // Standard fallbacks for both prefixed and non-prefixed
      config.resolve.fallback.async_hooks = false;
      config.resolve.fallback['node:async_hooks'] = false;
      config.resolve.fallback.fs = false;
      config.resolve.fallback['node:fs'] = false;
      config.resolve.fallback.tls = false;
      config.resolve.fallback.net = false;
      config.resolve.fallback['node:net'] = false;
      config.resolve.fallback.http2 = false;
      config.resolve.fallback.dns = false;
      config.resolve.fallback.child_process = false;
      config.resolve.fallback.perf_hooks = false;
      config.resolve.fallback['node:perf_hooks'] = false;
      config.resolve.fallback.buffer = false;
      config.resolve.fallback['node:buffer'] = false;
      config.resolve.fallback.https = false;
      config.resolve.fallback['node:https'] = false;
      config.resolve.fallback.http = false;
      config.resolve.fallback['node:http'] = false;
      config.resolve.fallback.path = false;
      config.resolve.fallback['node:path'] = false;
      config.resolve.fallback.process = false; // Added for process
      config.resolve.fallback['node:process'] = false; // Added for node:process


      // Add IgnorePlugin for node: prefixed modules ONLY
      if (webpack && webpack.IgnorePlugin) { // Check if webpack and IgnorePlugin are available
        config.plugins = config.plugins || []; // Ensure plugins array exists
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^node:async_hooks$/,
          })
        );
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^node:perf_hooks$/,
          })
        );
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^node:buffer$/,
          })
        );
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^node:fs$/,
          })
        );
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^node:https$/,
          })
        );
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^node:http$/,
          })
        );
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^node:net$/,
          })
        );
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^node:path$/,
          })
        );
        config.plugins.push(
          new webpack.IgnorePlugin({ // Added for node:process
            resourceRegExp: /^node:process$/,
          })
        );
      }
    }
    // Important: return the modified config
    return config;
  },
};

export default nextConfig;

