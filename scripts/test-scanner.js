/**
 * Live scanner test — runs all 4 aggregator sources against real APIs
 * and prints how many 24h-fresh US jobs each source returns. No DB writes.
 *
 * Run:  node scripts/test-scanner.js
 */

const FRESH_HOURS = 24;

// Full verified Greenhouse list (mirrors src/lib/scanner/portals-config.ts)
const GREENHOUSE = [
  "anthropic","scaleai","togetherai","cloudflare","pagerduty","newrelic",
  "grafanalabs","fastly","vercel","databricks","fivetran","amplitude",
  "mixpanel","starburst","hightouch","stripe","block","coinbase","robinhood",
  "brex","chime","mercury","rampnetwork","gemini","checkr","clear","earnin",
  "figma","asana","hubspot","intercom","calendly","airtable","lattice","gusto",
  "twilio","justworks","gongio","okta","wizinc","abnormalsecurity","bitwarden",
  "gitlab","launchdarkly","circleci","buildkite","postman","stackblitz",
  "lyft","airbnb","instacart","faire","upwork","stockx","goatgroup","poshmark",
  "pinterest","reddit","twitch","discord","duolingo","medium","dropbox","boxinc",
  "oscar","headway","komodohealth","nuro","appliedintuition","spacex",
  "carvana","coursera","udemy","khanacademy","guild",
];
const LEVER = ["netflix","palantir","attentive","clari","wealthfront"];

// location helpers (mirrors src/lib/scanner/location.ts)
const US_KEYWORDS = [
  "united states","usa","u.s.a","u.s."," us ","us,","us-",
  "california","new york","texas","washington","massachusetts","illinois",
  "colorado","florida","georgia","pennsylvania","virginia","north carolina",
  "new jersey","oregon","arizona","nevada","minnesota","ohio","michigan",
  "san francisco","san jose","los angeles","seattle","chicago","austin",
  "boston","denver","atlanta","miami","san diego","menlo park","mountain view",
  "palo alto","sunnyvale","cambridge","dallas","houston",
  " ca,"," ny,"," tx,"," wa,"," il,"," fl,"," co,"," ma,"," ga,",
];
const NON_US = [
  "canada","toronto","vancouver","london","berlin","paris","india","bangalore",
  "hyderabad","mumbai","sydney","singapore","tokyo","beijing","shanghai",
  "amsterdam","dublin","madrid","barcelona","tel aviv","dubai","mexico city",
  "emea","apac","latam","europe","asia",
];
const REMOTE = ["remote","anywhere","worldwide","wfh"];

function isUS(loc) {
  if (!loc) return true;
  const l = ` ${loc.toLowerCase()} `;
  if (NON_US.some((k) => l.includes(k))) {
    if (US_KEYWORDS.some((k) => l.includes(k))) return true;
    return false;
  }
  if (US_KEYWORDS.some((k) => l.includes(k))) return true;
  if (REMOTE.some((k) => l.includes(k))) return true;
  return true;
}
function isFresh(dateStr, hours) {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  if (isNaN(t)) return false;
  return Date.now() - t <= hours * 3600 * 1000;
}

async function testGreenhouse() {
  let total = 0, fresh = 0, usFresh = 0;
  const companyStats = {};
  const samples = [];

  const results = await Promise.all(
    GREENHOUSE.map(async (slug) => {
      try {
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
        if (!res.ok) return { slug, status: res.status, jobs: [] };
        const data = await res.json();
        return { slug, status: 200, jobs: data.jobs || [] };
      } catch (e) {
        return { slug, status: -1, jobs: [] };
      }
    })
  );

  for (const { slug, status, jobs } of results) {
    if (status !== 200) {
      console.log(`   ✗ ${slug}: HTTP ${status}`);
      continue;
    }
    total += jobs.length;
    let sf = 0;
    for (const j of jobs) {
      const stamp = j.updated_at || j.first_published;
      if (isFresh(stamp, FRESH_HOURS)) {
        fresh++;
        if (isUS(j.location?.name)) {
          usFresh++;
          sf++;
          if (samples.length < 5) samples.push(`${slug}: ${j.title} (${j.location?.name})`);
        }
      }
    }
    companyStats[slug] = sf;
  }

  console.log(`\n[Greenhouse] ${GREENHOUSE.length} companies (parallel fetch)`);
  console.log(`   total jobs across all boards: ${total}`);
  console.log(`   fresh (<${FRESH_HOURS}h): ${fresh}`);
  console.log(`   US + fresh: ${usFresh}`);
  const top = Object.entries(companyStats)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  if (top.length) {
    console.log(`   top companies: ${top.map(([s, n]) => `${s}(${n})`).join(", ")}`);
  }
  samples.slice(0, 3).forEach((s) => console.log(`     • ${s}`));
  return usFresh;
}

async function testRemotive() {
  const cats = ["software-dev","data","design","product","devops","marketing","sales"];
  let total = 0, fresh = 0, usFresh = 0;
  const samples = [];
  for (const cat of cats) {
    try {
      const res = await fetch(`https://remotive.com/api/remote-jobs?category=${cat}&limit=100`);
      if (!res.ok) continue;
      const data = await res.json();
      const jobs = data.jobs || [];
      total += jobs.length;
      for (const j of jobs) {
        if (isFresh(j.publication_date, FRESH_HOURS)) {
          fresh++;
          if (isUS(j.candidate_required_location)) {
            usFresh++;
            if (samples.length < 3) samples.push(`${j.company_name}: ${j.title} (${j.candidate_required_location})`);
          }
        }
      }
    } catch {}
  }
  console.log(`\n[Remotive] ${cats.length} categories`);
  console.log(`   total jobs: ${total}`);
  console.log(`   fresh (<${FRESH_HOURS}h): ${fresh}`);
  console.log(`   US + fresh: ${usFresh}`);
  samples.forEach((s) => console.log(`     • ${s}`));
  return usFresh;
}

async function testLever() {
  let total = 0, fresh = 0, usFresh = 0;
  const samples = [];
  for (const slug of LEVER) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json&limit=100`);
      if (!res.ok) { console.log(`   ✗ ${slug}: HTTP ${res.status}`); continue; }
      const list = await res.json();
      if (!Array.isArray(list)) continue;
      total += list.length;
      for (const p of list) {
        const iso = p.createdAt ? new Date(p.createdAt).toISOString() : null;
        if (isFresh(iso, FRESH_HOURS)) {
          fresh++;
          const loc = p.categories?.location;
          if (isUS(loc)) {
            usFresh++;
            if (samples.length < 3) samples.push(`${slug}: ${p.text} (${loc})`);
          }
        }
      }
    } catch {}
  }
  console.log(`\n[Lever] ${LEVER.length} companies`);
  console.log(`   total jobs: ${total}`);
  console.log(`   fresh (<${FRESH_HOURS}h): ${fresh}`);
  console.log(`   US + fresh: ${usFresh}`);
  samples.forEach((s) => console.log(`     • ${s}`));
  return usFresh;
}

async function testAdzuna() {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) {
    console.log(`\n[Adzuna] SKIPPED — set ADZUNA_APP_ID + ADZUNA_APP_KEY env vars`);
    console.log(`   Free: https://developer.adzuna.com  (250 req/day, 1M+ US jobs)`);
    console.log(`   When set, scanner pulls ~1,000-5,000 additional fresh US jobs per run`);
    return 0;
  }
  const queries = ["software engineer","data scientist","product manager","backend","frontend"];
  let total = 0;
  for (const q of queries) {
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${id}&app_key=${key}&results_per_page=50&max_days_old=1&what=${encodeURIComponent(q)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) { console.log(`   ✗ Adzuna "${q}": HTTP ${res.status}`); continue; }
      const data = await res.json();
      total += (data.results || []).length;
    } catch {}
  }
  console.log(`\n[Adzuna] ${queries.length} search queries`);
  console.log(`   US + fresh (<24h): ${total}`);
  return total;
}

(async () => {
  console.log(`=== Scanner live test — freshness window: ${FRESH_HOURS}h ===`);
  console.log(`Config: ${GREENHOUSE.length} Greenhouse + ${LEVER.length} Lever companies + Remotive + Adzuna`);
  const t0 = Date.now();
  const [gh, rm, lv, ad] = await Promise.all([
    testGreenhouse(),
    testRemotive(),
    testLever(),
    testAdzuna(),
  ]);
  const total = gh + rm + lv + ad;
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`TOTAL 24h-fresh US jobs: ${total}`);
  console.log(`   Greenhouse: ${gh}`);
  console.log(`   Remotive:   ${rm}`);
  console.log(`   Lever:      ${lv}`);
  console.log(`   Adzuna:     ${ad}${ad === 0 ? " (not configured)" : ""}`);
  console.log(`Scan time: ${elapsed}s (parallelized)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (total === 0) { console.error(`\n✗ FAILURE: no jobs returned`); process.exit(1); }
  console.log(`\n✓ PASS: scanner delivered ${total} fresh US jobs in a single pass`);
})();
