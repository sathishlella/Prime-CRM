export const DEFAULT_TITLE_FILTERS = {
  positive: [
    "engineer","developer","analyst","scientist","architect","manager","designer",
    "intern","associate","specialist","consultant","coordinator","researcher",
    "quantitative","data","product","program","technical","sre","security",
    "support","solutions","administrator","lead",
  ],
  negative: [
    "senior director","vice president","vp","chief","cto","ceo","cfo","svp","evp",
    "partner","distinguished","fellow",
  ],
};

/**
 * Greenhouse companies — all slugs LIVE-VERIFIED against
 * boards-api.greenhouse.io on 2026-04-18.
 *
 * Only keep slugs that return HTTP 200. When adding new ones, test first:
 *   curl -s -o /dev/null -w "%{http_code}" https://boards-api.greenhouse.io/v1/boards/<slug>/jobs
 */
export const GREENHOUSE_COMPANIES: Array<{ name: string; api_slug: string }> = [
  // AI / ML
  { name: "Anthropic", api_slug: "anthropic" },
  { name: "Scale AI", api_slug: "scaleai" },
  { name: "Together AI", api_slug: "togetherai" },

  // Cloud / Infra
  { name: "Cloudflare", api_slug: "cloudflare" },
  { name: "PagerDuty", api_slug: "pagerduty" },
  { name: "New Relic", api_slug: "newrelic" },
  { name: "Grafana Labs", api_slug: "grafanalabs" },
  { name: "Fastly", api_slug: "fastly" },
  { name: "Vercel", api_slug: "vercel" },

  // Data / Analytics
  { name: "Databricks", api_slug: "databricks" },
  { name: "Fivetran", api_slug: "fivetran" },
  { name: "Amplitude", api_slug: "amplitude" },
  { name: "Mixpanel", api_slug: "mixpanel" },
  { name: "Starburst", api_slug: "starburst" },
  { name: "Hightouch", api_slug: "hightouch" },

  // Fintech / Payments
  { name: "Stripe", api_slug: "stripe" },
  { name: "Block (Square)", api_slug: "block" },
  { name: "Coinbase", api_slug: "coinbase" },
  { name: "Robinhood", api_slug: "robinhood" },
  { name: "Brex", api_slug: "brex" },
  { name: "Chime", api_slug: "chime" },
  { name: "Mercury", api_slug: "mercury" },
  { name: "Ramp", api_slug: "rampnetwork" },
  { name: "Gemini", api_slug: "gemini" },
  { name: "Checkr", api_slug: "checkr" },
  { name: "CLEAR", api_slug: "clear" },
  { name: "Earnin", api_slug: "earnin" },

  // SaaS / Productivity
  { name: "Figma", api_slug: "figma" },
  { name: "Asana", api_slug: "asana" },
  { name: "HubSpot", api_slug: "hubspot" },
  { name: "Intercom", api_slug: "intercom" },
  { name: "Calendly", api_slug: "calendly" },
  { name: "Airtable", api_slug: "airtable" },
  { name: "Lattice", api_slug: "lattice" },
  { name: "Gusto", api_slug: "gusto" },
  { name: "Twilio", api_slug: "twilio" },
  { name: "Justworks", api_slug: "justworks" },
  { name: "Gong", api_slug: "gongio" },

  // Cybersecurity
  { name: "Okta", api_slug: "okta" },
  { name: "Wiz", api_slug: "wizinc" },
  { name: "Abnormal Security", api_slug: "abnormalsecurity" },
  { name: "Bitwarden", api_slug: "bitwarden" },

  // Dev Tools
  { name: "GitLab", api_slug: "gitlab" },
  { name: "LaunchDarkly", api_slug: "launchdarkly" },
  { name: "CircleCI", api_slug: "circleci" },
  { name: "Buildkite", api_slug: "buildkite" },
  { name: "Postman", api_slug: "postman" },
  { name: "StackBlitz", api_slug: "stackblitz" },

  // Marketplace / Gig
  { name: "Lyft", api_slug: "lyft" },
  { name: "Airbnb", api_slug: "airbnb" },
  { name: "Instacart", api_slug: "instacart" },
  { name: "Faire", api_slug: "faire" },
  { name: "Upwork", api_slug: "upwork" },
  { name: "StockX", api_slug: "stockx" },
  { name: "GOAT", api_slug: "goatgroup" },
  { name: "Poshmark", api_slug: "poshmark" },

  // Media / Social
  { name: "Pinterest", api_slug: "pinterest" },
  { name: "Reddit", api_slug: "reddit" },
  { name: "Twitch", api_slug: "twitch" },
  { name: "Discord", api_slug: "discord" },
  { name: "Duolingo", api_slug: "duolingo" },
  { name: "Medium", api_slug: "medium" },

  // Cloud Storage / Comms
  { name: "Dropbox", api_slug: "dropbox" },
  { name: "Box", api_slug: "boxinc" },

  // Healthcare Tech
  { name: "Oscar Health", api_slug: "oscar" },
  { name: "Headway", api_slug: "headway" },
  { name: "Komodo Health", api_slug: "komodohealth" },

  // Autonomous / Aerospace
  { name: "Nuro", api_slug: "nuro" },
  { name: "Applied Intuition", api_slug: "appliedintuition" },
  { name: "SpaceX", api_slug: "spacex" },

  // EdTech / Other
  { name: "Carvana", api_slug: "carvana" },
  { name: "Coursera", api_slug: "coursera" },
  { name: "Udemy", api_slug: "udemy" },
  { name: "Khan Academy", api_slug: "khanacademy" },
  { name: "Guild Education", api_slug: "guild" },
];

/**
 * Lever companies — live-verified against api.lever.co on 2026-04-18.
 */
export const LEVER_COMPANIES: Array<{ name: string; lever_slug: string }> = [
  { name: "Netflix", lever_slug: "netflix" },
  { name: "Palantir", lever_slug: "palantir" },
  { name: "Attentive", lever_slug: "attentive" },
  { name: "Clari", lever_slug: "clari" },
  { name: "Wealthfront", lever_slug: "wealthfront" },
];

/**
 * Non-API career pages — HTML scraping fallback.
 * Aggregators (Remotive + optional Adzuna) cover far more, so this is minimal.
 */
export const DIRECT_COMPANIES: Array<{ name: string; careers_url: string }> = [
  { name: "Google", careers_url: "https://careers.google.com/jobs/results/" },
  { name: "Microsoft", careers_url: "https://careers.microsoft.com/us/en/search-results" },
  { name: "Amazon", careers_url: "https://www.amazon.jobs/en/search" },
  { name: "Apple", careers_url: "https://jobs.apple.com/en-us/search" },
  { name: "Meta", careers_url: "https://www.metacareers.com/jobs" },
];

/** Legacy export for backwards compatibility. */
export const DEFAULT_TRACKED_COMPANIES: Array<{
  name: string;
  careers_url: string;
  api_slug?: string;
}> = [
  ...GREENHOUSE_COMPANIES.map((c) => ({
    name: c.name,
    careers_url: `https://boards.greenhouse.io/${c.api_slug}`,
    api_slug: c.api_slug,
  })),
  ...DIRECT_COMPANIES,
];
