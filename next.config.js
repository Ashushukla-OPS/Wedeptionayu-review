/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},

  // ─── Security Headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Force browsers to use HTTPS for 1 year (HSTS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME-type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Disable sensitive browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // Basic XSS protection for older browsers
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // ─── HTTP → HTTPS Redirect ───────────────────────────────────────────────────
  async redirects() {
    return [
      // Only redirect in production; skip on localhost
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/(.*)',
              has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
              destination: 'https://wedeption.in/:path*',
              permanent: true,
            },
          ]
        : []),
    ]
  },

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

