const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://eredvsrmrorqztrmqzdo.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TRACKED_COMPANIES = [
  { name: "Stripe", careers_url: "https://stripe.com/jobs/search", api_slug: "stripe" },
  { name: "Airbnb", careers_url: "https://careers.airbnb.com/", api_slug: "airbnb" },
];

const TITLE_FILTERS = {
  positive: ["engineer", "developer", "analyst", "scientist", "intern"],
  negative: ["senior director", "vice president", "vp", "chief"]
};

function matchesFilters(title, filters) {
  const t = title.toLowerCase();
  if (filters.negative.some(k => t.includes(k.toLowerCase()))) return false;
  if (filters.positive.length === 0) return true;
  return filters.positive.some(k => t.includes(k.toLowerCase()));
}

async function scan() {
  console.log('Starting standalone scanner test...');
  let found = 0, added = 0, filtered = 0;

  for (const company of TRACKED_COMPANIES) {
    try {
      console.log(`Fetching ${company.name}...`);
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company.api_slug}/jobs`);
      if (!res.ok) {
        console.log(`  API error: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const jobs = data.jobs || [];
      console.log(`  Found ${jobs.length} jobs`);

      for (const job of jobs) {
        found++;
        if (!matchesFilters(job.title, TITLE_FILTERS)) {
          filtered++;
          continue;
        }
        const { error } = await supabase.from('job_leads').insert({
          company_name: company.name,
          job_role: job.title,
          job_url: job.absolute_url,
          source: 'greenhouse',
        });
        if (error) {
          if (error.code !== '23505') console.log('  Insert error:', error.message);
        } else {
          added++;
        }
      }
    } catch (err) {
      console.log(`  Error for ${company.name}:`, err.message);
    }
  }

  console.log(`\nDone. Found: ${found}, Added: ${added}, Filtered: ${filtered}`);
}

scan().catch(console.error);
