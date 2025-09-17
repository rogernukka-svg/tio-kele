/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: { appDir: true },

  webpack: (config, { isServer }) => {
    // En el cliente no necesitamos 'ws' ni sus dependencias opcionales.
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        ws: false,
        'utf-8-validate': false,
        bufferutil: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
