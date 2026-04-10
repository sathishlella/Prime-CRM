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
  ],
  negative: [
    "senior director",
    "vice president",
    "vp",
    "chief",
    "cto",
    "ceo",
    "cfo",
  ],
};

export const DEFAULT_TRACKED_COMPANIES: Array<{
  name: string;
  careers_url: string;
  api_slug?: string;
}> = [
  { name: "Google", careers_url: "https://careers.google.com/jobs/results/" },
  { name: "Microsoft", careers_url: "https://careers.microsoft.com/us/en/search-results" },
  { name: "Amazon", careers_url: "https://www.amazon.jobs/en/search" },
  { name: "Apple", careers_url: "https://jobs.apple.com/en-us/search" },
  { name: "Meta", careers_url: "https://www.metacareers.com/jobs" },
  { name: "Netflix", careers_url: "https://jobs.netflix.com/search" },
  { name: "Stripe", careers_url: "https://stripe.com/jobs/search", api_slug: "stripe" },
  { name: "Airbnb", careers_url: "https://careers.airbnb.com/" , api_slug: "airbnb" },
  { name: "Databricks", careers_url: "https://www.databricks.com/company/careers", api_slug: "databricks" },
  { name: "Snowflake", careers_url: "https://careers.snowflake.com/us/en/search-results", api_slug: "snowflakecomputing" },
  { name: "Salesforce", careers_url: "https://careers.salesforce.com/en/jobs/" },
  { name: "Adobe", careers_url: "https://careers.adobe.com/us/en/search-results" },
  { name: "LinkedIn", careers_url: "https://careers.linkedin.com/jobs" },
  { name: "Uber", careers_url: "https://www.uber.com/us/en/careers/list/", api_slug: "uber" },
  { name: "Lyft", careers_url: "https://www.lyft.com/careers", api_slug: "lyft" },
  { name: "Slack", careers_url: "https://slack.com/careers", api_slug: "slack" },
  { name: "Figma", careers_url: "https://www.figma.com/careers/", api_slug: "figma" },
  { name: "Notion", careers_url: "https://www.notion.so/careers", api_slug: "notion" },
  { name: "Vercel", careers_url: "https://vercel.com/careers", api_slug: "vercel" },
  { name: "Supabase", careers_url: "https://supabase.com/careers", api_slug: "supabase" },
  { name: "Coinbase", careers_url: "https://www.coinbase.com/careers/positions", api_slug: "coinbase" },
  { name: "Square", careers_url: "https://careers.squareup.com/us/en/jobs", api_slug: "square" },
  { name: "Shopify", careers_url: "https://www.shopify.com/careers/search", api_slug: "shopify" },
  { name: "HubSpot", careers_url: "https://www.hubspot.com/careers/jobs", api_slug: "hubspot" },
  { name: "Twilio", careers_url: "https://www.twilio.com/en-us/company/jobs", api_slug: "twilio" },
];
