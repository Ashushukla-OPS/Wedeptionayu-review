/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  webpack: (config, { isServer, webpack }) => {
    // Fix for node-fetch and encoding issues in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        encoding: false,
        'node-fetch': false,
        'utf-8-validate': false,
        'bufferutil': false,
      }
      
      // Ignore node-fetch in client bundle
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^node-fetch$/,
        })
      )
    }
    
    return config
  },
}

module.exports = nextConfig
