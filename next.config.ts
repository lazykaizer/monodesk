import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    webpackBuildWorker: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );
    config.resolve.alias = {
      ...config.resolve.alias,
      "node:fs": false,
      "node:path": false,
      "node:os": false,
      "node:https": false,
      "node:http": false,
      "node:stream": false,
      "node:zlib": false,
      "fs": false,
      "path": false,
      "os": false,
      "https": false,
      "http": false,
      "stream": false,
      "zlib": false,
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      https: false,
      http: false,
      stream: false,
      zlib: false,
    };

    return config;
  },
};

export default nextConfig;
