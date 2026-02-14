/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // WASM support for future Rust core
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

module.exports = nextConfig;
