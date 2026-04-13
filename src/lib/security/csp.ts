/**
 * Content Security Policy builder.
 *
 * Usage (middleware or route handler):
 *   const { nonce, cspHeader } = buildCsp();
 *   response.headers.set("Content-Security-Policy", cspHeader);
 *   response.headers.set("x-nonce", nonce); // for layout to forward to <Script>
 *
 * The nonce is a per-request cryptographically random base64 string.
 * Each HTML response gets a unique nonce, so replay attacks on injected
 * scripts are blocked even if the page content is cached.
 *
 * NEXT.JS WIRING (future — when you need nonce on inline scripts):
 *   1. Call buildCsp() in middleware, store nonce in x-nonce response header.
 *   2. In root layout.tsx, read `headers().get("x-nonce")` and pass it to
 *      `<Script nonce={nonce} strategy="afterInteractive" />`.
 *   3. The browser will only execute scripts whose nonce matches the header.
 *
 * Current status: the nonce is generated and the header is built, but the
 * root layout does not yet thread the nonce into <Script> tags. Until it
 * does, 'unsafe-inline' remains in script-src as a fallback. Remove
 * 'unsafe-inline' only after all inline scripts are nonce-tagged.
 */

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
}

export interface CspOptions {
  nonce: string;
  /** Set to true in development to allow 'unsafe-eval' (needed by webpack HMR). */
  isDev?: boolean;
}

/**
 * Returns the full CSP directive string for the given nonce.
 */
export function buildCspHeader({ nonce, isDev = false }: CspOptions): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    // unsafe-inline kept until all inline scripts are nonce-tagged
    "'unsafe-inline'",
    // unsafe-eval only in dev (webpack HMR / fast-refresh)
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co",
    [
      "connect-src",
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://api.anthropic.com",
      "https://api.groq.com",
      "https://*.sentry.io",
      "https://o4511213641334784.ingest.sentry.io",
    ].join(" "),
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

/**
 * All non-CSP security response headers.
 * Applied unconditionally regardless of nonce.
 */
export const SECURITY_HEADERS: Array<{ key: string; value: string }> = [
  { key: "X-Frame-Options",               value: "DENY" },
  { key: "X-Content-Type-Options",        value: "nosniff" },
  { key: "X-DNS-Prefetch-Control",        value: "off" },
  { key: "Referrer-Policy",               value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    // 2-year max-age, include subdomains, opt in to preload list
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
  },
];
