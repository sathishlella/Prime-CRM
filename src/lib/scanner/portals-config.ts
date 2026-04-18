export const DEFAULT_TITLE_FILTERS = {
  positive: [
    "engineer",
    "developer",
    "analyst",
    "scientist",
    "architect",
    "manager",
    "designer",
    "intern",
    "associate",
    "specialist",
    "consultant",
    "coordinator",
    "researcher",
    "quantitative",
    "data",
    "product",
    "program",
    "technical",
  ],
  negative: [
    "senior director",
    "vice president",
    "vp",
    "chief",
    "cto",
    "ceo",
    "cfo",
    "svp",
    "evp",
    "partner",
    "principal engineer",
    "distinguished",
    "fellow",
  ],
};

export const DEFAULT_TRACKED_COMPANIES: Array<{
  name: string;
  careers_url: string;
  api_slug?: string;
}> = [
  // ── Tier 1 Tech (Big Tech) ───────────────────────────────────────────────
  { name: "Google", careers_url: "https://careers.google.com/jobs/results/" },
  { name: "Microsoft", careers_url: "https://careers.microsoft.com/us/en/search-results" },
  { name: "Amazon", careers_url: "https://www.amazon.jobs/en/search" },
  { name: "Apple", careers_url: "https://jobs.apple.com/en-us/search" },
  { name: "Meta", careers_url: "https://www.metacareers.com/jobs" },
  { name: "Netflix", careers_url: "https://jobs.netflix.com/search" },
  { name: "Salesforce", careers_url: "https://careers.salesforce.com/en/jobs/" },
  { name: "Adobe", careers_url: "https://careers.adobe.com/us/en/search-results" },
  { name: "LinkedIn", careers_url: "https://careers.linkedin.com/jobs" },

  // ── AI / ML Companies ────────────────────────────────────────────────────
  { name: "OpenAI", careers_url: "https://openai.com/careers", api_slug: "openai" },
  { name: "Anthropic", careers_url: "https://www.anthropic.com/careers", api_slug: "anthropic" },
  { name: "Scale AI", careers_url: "https://scale.com/careers", api_slug: "scaleai" },
  { name: "Cohere", careers_url: "https://cohere.com/careers", api_slug: "cohere" },
  { name: "Perplexity AI", careers_url: "https://www.perplexity.ai/careers", api_slug: "perplexityai" },
  { name: "Mistral AI", careers_url: "https://mistral.ai/en-US/company/careers", api_slug: "mistralai" },
  { name: "Hugging Face", careers_url: "https://apply.workable.com/huggingface/", api_slug: "huggingface" },
  { name: "Together AI", careers_url: "https://www.together.ai/careers", api_slug: "togetherai" },
  { name: "Runway", careers_url: "https://runwayml.com/careers", api_slug: "runwayml" },
  { name: "Weights & Biases", careers_url: "https://wandb.ai/site/careers", api_slug: "wandb" },

  // ── Cloud / Infrastructure ───────────────────────────────────────────────
  { name: "Cloudflare", careers_url: "https://www.cloudflare.com/careers/jobs/", api_slug: "cloudflare" },
  { name: "Datadog", careers_url: "https://careers.datadoghq.com/", api_slug: "datadoghq" },
  { name: "HashiCorp", careers_url: "https://www.hashicorp.com/jobs", api_slug: "hashicorp" },
  { name: "PagerDuty", careers_url: "https://careers.pagerduty.com/", api_slug: "pagerduty" },
  { name: "New Relic", careers_url: "https://newrelic.com/about/careers", api_slug: "newrelic" },
  { name: "Splunk", careers_url: "https://www.splunk.com/en_us/careers.html", api_slug: "splunk" },
  { name: "Grafana Labs", careers_url: "https://grafana.com/about/careers/", api_slug: "grafanalabs" },
  { name: "Fastly", careers_url: "https://www.fastly.com/about/careers", api_slug: "fastly" },
  { name: "DigitalOcean", careers_url: "https://www.digitalocean.com/careers", api_slug: "digitalocean" },
  { name: "Vercel", careers_url: "https://vercel.com/careers", api_slug: "vercel" },
  { name: "Supabase", careers_url: "https://supabase.com/careers", api_slug: "supabase" },

  // ── Data / Analytics ─────────────────────────────────────────────────────
  { name: "Databricks", careers_url: "https://www.databricks.com/company/careers", api_slug: "databricks" },
  { name: "Snowflake", careers_url: "https://careers.snowflake.com/us/en/search-results", api_slug: "snowflakecomputing" },
  { name: "dbt Labs", careers_url: "https://www.getdbt.com/dbt-labs/open-roles", api_slug: "dbtlabs" },
  { name: "Fivetran", careers_url: "https://www.fivetran.com/careers", api_slug: "fivetran" },
  { name: "Airbyte", careers_url: "https://airbyte.com/careers", api_slug: "airbyte" },
  { name: "Amplitude", careers_url: "https://amplitude.com/careers", api_slug: "amplitude" },
  { name: "Mixpanel", careers_url: "https://mixpanel.com/jobs/", api_slug: "mixpanel" },
  { name: "Monte Carlo", careers_url: "https://www.montecarlodata.com/careers/", api_slug: "montecarlodata" },
  { name: "Starburst", careers_url: "https://www.starburst.io/careers/", api_slug: "starburst" },

  // ── Fintech ──────────────────────────────────────────────────────────────
  { name: "Stripe", careers_url: "https://stripe.com/jobs/search", api_slug: "stripe" },
  { name: "Coinbase", careers_url: "https://www.coinbase.com/careers/positions", api_slug: "coinbase" },
  { name: "Square", careers_url: "https://careers.squareup.com/us/en/jobs", api_slug: "square" },
  { name: "Robinhood", careers_url: "https://careers.robinhood.com/", api_slug: "robinhood" },
  { name: "Plaid", careers_url: "https://plaid.com/careers/", api_slug: "plaid" },
  { name: "Brex", careers_url: "https://www.brex.com/careers", api_slug: "brex" },
  { name: "Affirm", careers_url: "https://www.affirm.com/careers", api_slug: "affirm" },
  { name: "Chime", careers_url: "https://careers.chime.com/", api_slug: "chime" },
  { name: "Marqeta", careers_url: "https://www.marqeta.com/company/careers", api_slug: "marqeta" },
  { name: "Rippling", careers_url: "https://www.rippling.com/careers", api_slug: "rippling" },
  { name: "Mercury", careers_url: "https://mercury.com/about/careers", api_slug: "mercury" },

  // ── SaaS / Productivity ──────────────────────────────────────────────────
  { name: "Slack", careers_url: "https://slack.com/careers", api_slug: "slack" },
  { name: "Notion", careers_url: "https://www.notion.so/careers", api_slug: "notion" },
  { name: "Figma", careers_url: "https://www.figma.com/careers/", api_slug: "figma" },
  { name: "Asana", careers_url: "https://asana.com/jobs", api_slug: "asana" },
  { name: "HubSpot", careers_url: "https://www.hubspot.com/careers/jobs", api_slug: "hubspot" },
  { name: "Zendesk", careers_url: "https://jobs.zendesk.com/us/en/", api_slug: "zendesk" },
  { name: "Intercom", careers_url: "https://www.intercom.com/careers", api_slug: "intercom" },
  { name: "Calendly", careers_url: "https://careers.calendly.com/", api_slug: "calendly" },
  { name: "Airtable", careers_url: "https://airtable.com/careers", api_slug: "airtable" },
  { name: "Monday.com", careers_url: "https://monday.com/careers", api_slug: "mondaydotcom" },
  { name: "Lattice", careers_url: "https://lattice.com/careers", api_slug: "lattice" },
  { name: "Gusto", careers_url: "https://gusto.com/about/careers", api_slug: "gusto" },
  { name: "Twilio", careers_url: "https://www.twilio.com/en-us/company/jobs", api_slug: "twilio" },
  { name: "SendGrid", careers_url: "https://sendgrid.com/en-us/careers", api_slug: "sendgrid" },

  // ── Cybersecurity ─────────────────────────────────────────────────────────
  { name: "CrowdStrike", careers_url: "https://careers.crowdstrike.com/", api_slug: "crowdstrike" },
  { name: "Okta", careers_url: "https://www.okta.com/company/careers/", api_slug: "okta" },
  { name: "SentinelOne", careers_url: "https://www.sentinelone.com/careers/", api_slug: "sentinelone" },
  { name: "Wiz", careers_url: "https://www.wiz.io/careers", api_slug: "wizsecurity" },
  { name: "Snyk", careers_url: "https://snyk.io/careers/", api_slug: "snyk" },
  { name: "Lacework", careers_url: "https://www.lacework.com/careers/", api_slug: "lacework" },

  // ── Developer Tools ───────────────────────────────────────────────────────
  { name: "GitHub", careers_url: "https://github.com/about/careers", api_slug: "github" },
  { name: "GitLab", careers_url: "https://about.gitlab.com/jobs/all-jobs/", api_slug: "gitlab" },
  { name: "Hashnode", careers_url: "https://hashnode.com/careers", api_slug: "hashnode" },
  { name: "LaunchDarkly", careers_url: "https://launchdarkly.com/careers/", api_slug: "launchdarkly" },
  { name: "Retool", careers_url: "https://retool.com/careers", api_slug: "retool" },

  // ── Ride-share / Delivery / Marketplace ──────────────────────────────────
  { name: "Uber", careers_url: "https://www.uber.com/us/en/careers/list/", api_slug: "uber" },
  { name: "Lyft", careers_url: "https://www.lyft.com/careers", api_slug: "lyft" },
  { name: "DoorDash", careers_url: "https://careers.doordash.com/", api_slug: "doordash" },
  { name: "Instacart", careers_url: "https://instacart.careers/current-openings/", api_slug: "instacart" },
  { name: "Airbnb", careers_url: "https://careers.airbnb.com/", api_slug: "airbnb" },
  { name: "Etsy", careers_url: "https://careers.etsy.com/", api_slug: "etsy" },
  { name: "Wayfair", careers_url: "https://www.wayfair.com/careers/jobs", api_slug: "wayfair" },

  // ── Media / Social ───────────────────────────────────────────────────────
  { name: "Pinterest", careers_url: "https://www.pinterestcareers.com/en/jobs/", api_slug: "pinterest" },
  { name: "Snap", careers_url: "https://careers.snap.com/jobs", api_slug: "snap" },
  { name: "Reddit", careers_url: "https://www.redditinc.com/careers", api_slug: "reddit" },
  { name: "Spotify", careers_url: "https://www.lifeatspotify.com/jobs", api_slug: "spotify" },
  { name: "Twitch", careers_url: "https://www.twitch.tv/jobs", api_slug: "twitch" },
  { name: "Discord", careers_url: "https://discord.com/careers", api_slug: "discord" },
  { name: "Duolingo", careers_url: "https://careers.duolingo.com/", api_slug: "duolingo" },

  // ── Cloud Storage / Productivity ─────────────────────────────────────────
  { name: "Dropbox", careers_url: "https://jobs.dropbox.com/teams", api_slug: "dropbox" },
  { name: "Box", careers_url: "https://careers.box.com/us/en/", api_slug: "boxinc" },
  { name: "Zoom", careers_url: "https://careers.zoom.us/jobs", api_slug: "zoom" },

  // ── Healthcare Tech ───────────────────────────────────────────────────────
  { name: "Oscar Health", careers_url: "https://www.hioscar.com/about/careers", api_slug: "oscar" },
  { name: "Hims & Hers", careers_url: "https://www.forhims.com/careers", api_slug: "hims" },
  { name: "Noom", careers_url: "https://www.noom.com/about/careers/", api_slug: "noom" },
  { name: "Headway", careers_url: "https://headway.co/careers", api_slug: "headway" },

  // ── Autonomous / Robotics / Hardware ─────────────────────────────────────
  { name: "Waymo", careers_url: "https://waymo.com/careers/" },
  { name: "Cruise", careers_url: "https://getcruise.com/careers/jobs/", api_slug: "cruise" },
  { name: "Nuro", careers_url: "https://nuro.ai/careers", api_slug: "nuro" },
  { name: "Aurora", careers_url: "https://aurora.tech/jobs", api_slug: "aurora" },
  { name: "Aescape", careers_url: "https://www.aescape.com/careers", api_slug: "aescape" },

  // ── E-commerce / Retail Tech ─────────────────────────────────────────────
  { name: "Shopify", careers_url: "https://www.shopify.com/careers/search", api_slug: "shopify" },
  { name: "Carvana", careers_url: "https://www.carvana.com/careers", api_slug: "carvana" },
  { name: "Faire", careers_url: "https://www.faire.com/careers", api_slug: "faire" },
  { name: "StockX", careers_url: "https://stockx.com/about/careers/", api_slug: "stockx" },

  // ── EdTech ───────────────────────────────────────────────────────────────
  { name: "Coursera", careers_url: "https://careers.coursera.org/", api_slug: "coursera" },
  { name: "Udemy", careers_url: "https://about.udemy.com/careers/", api_slug: "udemy" },
  { name: "Chegg", careers_url: "https://jobs.chegg.com/", api_slug: "chegg" },
  { name: "Khan Academy", careers_url: "https://www.khanacademy.org/careers", api_slug: "khanacademy" },

  // ── Space / Deep Tech ────────────────────────────────────────────────────
  { name: "SpaceX", careers_url: "https://www.spacex.com/careers/search/" },
  { name: "Anduril", careers_url: "https://www.anduril.com/careers/", api_slug: "anduril" },
  { name: "Palantir", careers_url: "https://jobs.lever.co/palantir" },
];
