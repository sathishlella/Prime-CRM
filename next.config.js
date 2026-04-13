const { withSentryConfig } = require("@sentry/nextjs");

const isDev = process.env.NODE_ENV === "development";

// Static CSP (no nonce — applied via next.config.js headers).
// When all inline scripts are nonce-tagged via middleware, remove 'unsafe-inline'
// from script-src and move to the middleware-based buildCspHeader() helper.
const staticCsp = [
  "default-src 'self'",
  // unsafe-eval only in dev (webpack HMR). Removed in production.
  isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.groq.com https://*.sentry.io https://o4511213641334784.ingest.sentry.io",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    serverComponentsExternalPackages: ["@sparticuz/chromium", "playwright-core"],
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options",               value: "DENY" },
        { key: "X-Content-Type-Options",        value: "nosniff" },
        { key: "X-DNS-Prefetch-Control",        value: "off" },
        { key: "Referrer-Policy",               value: "strict-origin-when-cross-origin" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
        },
        { key: "Content-Security-Policy", value: staticCsp },
      ],
    },
  ],
};

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG || "o4511213641334784",
  project: process.env.SENTRY_PROJECT || "prime-crm",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
