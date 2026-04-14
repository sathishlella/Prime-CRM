const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://eredvsrmrorqztrmqzdo.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CRON_SECRET = process.env.CRON_SECRET || 'generate-a-random-32-char-string';

if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TRACKED_COMPANIES = [
  { name: "Stripe", careers_url: "https://stripe.com/jobs/search", api_slug: "stripe" },
  { name: "Airbnb", careers_url: "https://careers.airbnb.com/", api_slug: "airbnb" },
  { name: "Databricks", careers_url: "https://www.databricks.com/company/careers", api_slug: "databricks" },
  { name: "Snowflake", careers_url: "https://careers.snowflake.com/us/en/search-results", api_slug: "snowflakecomputing" },
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

const TITLE_FILTERS = {
  positive: [
    "engineer", "developer", "analyst", "scientist", "architect",
    "manager", "designer", "intern", "associate", "specialist", "consultant"
  ],
  negative: [
    "senior director", "vice president", "vp", "chief", "cto", "ceo", "cfo"
  ]
};

async function main() {
  console.log('=== Real Pipeline: Sathish Lella ===\n');

  // 1. Find student and counselor
  const { data: studentProfile } = await supabase.from('profiles').select('id').ilike('email', 'teststudent@f1dreamjobs.com').single();
  const { data: student } = studentProfile
    ? await supabase.from('students').select('id, visa_status, university').eq('profile_id', studentProfile.id).single()
    : { data: null };
  const { data: counselor } = await supabase.from('profiles').select('id').ilike('email', 'testcounselor@f1dreamjobs.com').single();

  if (!student || !counselor) {
    console.error('Missing student or counselor');
    process.exit(1);
  }
  const studentId = student.id;
  const counselorId = counselor.id;
  console.log('Student ID:', studentId);
  console.log('Counselor ID:', counselorId);

  // 2. Clean up ALL existing data
  console.log('\n--- Cleaning up existing data ---');
  const { data: oldApps } = await supabase.from('applications').select('id').eq('student_id', studentId);
  const appIds = (oldApps || []).map(a => a.id);
  if (appIds.length) {
    await supabase.from('generated_cvs').delete().in('application_id', appIds);
    await supabase.from('evaluation_scores').delete().in('application_id', appIds);
    await supabase.from('interview_prep').delete().in('application_id', appIds);
    await supabase.from('applications').delete().in('id', appIds);
  }
  await supabase.from('job_matches').delete().eq('student_id', studentId);
  await supabase.from('documents').delete().eq('student_id', studentId);
  await supabase.from('documents').delete().ilike('file_name', '%Sathish%');
  await supabase.from('job_leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('scan_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { data: oldRuns } = await supabase.from('agent_runs').select('id').eq('student_id', studentId);
  const oldRunIds = (oldRuns || []).map(r => r.id);
  if (oldRunIds.length) {
    await supabase.from('agent_run_steps').delete().in('run_id', oldRunIds);
    await supabase.from('agent_runs').delete().in('id', oldRunIds);
  }
  console.log('Cleaned up');

  // 3. Insert scanner config
  console.log('\n--- Seeding scanner config ---');
  for (const company of TRACKED_COMPANIES) {
    await supabase.from('scanner_config').insert({
      config_type: 'tracked_company',
      config_data: company,
      is_enabled: true,
      created_by: counselorId,
    });
  }
  await supabase.from('scanner_config').insert({
    config_type: 'title_filter',
    config_data: TITLE_FILTERS,
    is_enabled: true,
    created_by: counselorId,
  });
  console.log(`Added ${TRACKED_COMPANIES.length} tracked companies + title filters`);

  // 4. Run scanner directly (HTTP route times out; bypass it)
  console.log('\n--- Running scanner directly ---');
  const SCANNER_TITLE_FILTERS = {
    positive: [
      "engineer", "developer", "analyst", "scientist", "architect",
      "manager", "designer", "intern", "associate", "specialist", "consultant"
    ],
    negative: [
      "senior director", "vice president", "vp", "chief", "cto", "ceo", "cfo"
    ]
  };
  function matchesFilters(title, filters) {
    const t = title.toLowerCase();
    if (filters.negative.some(k => t.includes(k.toLowerCase()))) return false;
    if (filters.positive.length === 0) return true;
    return filters.positive.some(k => t.includes(k.toLowerCase()));
  }
  let found = 0, added = 0, filtered = 0;
  const greenhouseCompanies = TRACKED_COMPANIES.filter(c => c.api_slug);
  for (const company of greenhouseCompanies) {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company.api_slug}/jobs`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of data.jobs || []) {
        found++;
        if (!matchesFilters(job.title, SCANNER_TITLE_FILTERS)) { filtered++; continue; }
        const { error } = await supabase.from('job_leads').insert({
          company_name: company.name,
          job_role: job.title,
          job_url: job.absolute_url,
          source: 'greenhouse',
        });
        if (!error) added++;
      }
    } catch {}
  }
  const { count: leadCount } = await supabase.from('job_leads').select('*', { count: 'exact', head: true });
  console.log(`Scanner done. Found: ${found}, Added: ${added}, Filtered: ${filtered}. Total leads in DB: ${leadCount}`);

  if (!leadCount) {
    console.log('\nNo real jobs found.');
    process.exit(0);
  }

  // 5. Upload resume
  const fs = require('fs');
  const path = require('path');
  const RESUME_PATH = path.resolve('Sathish_lella_resume.pdf');
  const fileBuffer = fs.readFileSync(RESUME_PATH);
  const storagePath = `${studentId}/resumes/${Date.now()}_Sathish_lella_resume.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: false });
  if (!uploadError) {
    await supabase.from('documents').insert({
      student_id: studentId,
      file_name: 'Sathish_lella_resume.pdf',
      file_url: storagePath,
      file_type: 'resume',
      uploaded_by: counselorId,
    });
    console.log('Resume uploaded');
  }

  // 6. Create/upsert candidate profile
  const { error: candErr } = await supabase.from('candidate_profiles').upsert({
    student_id: studentId,
    target_roles: ['Data Scientist', 'Machine Learning Engineer', 'Software Engineer', 'Data Analyst', 'AI Engineer'],
    skills: ['Python', 'SQL', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'Keras', 'OpenCV', 'NLP', 'Tableau', 'Power BI', 'MongoDB', 'Postman', 'JavaScript', 'HTML/CSS', 'MATLAB', 'Pandas', 'Matplotlib'],
    cv_markdown: 'SATHISH LELLA - Data Scientist & Software Engineer. 3+ years experience. MS Data Science from Lewis University.',
    compensation_target: JSON.stringify({ target: '110000', minimum: '85000', currency: 'USD' }),
  }, { onConflict: 'student_id' });
  if (candErr) console.error('Candidate profile error:', candErr.message);
  else console.log('Candidate profile ready');

  // 7. Authenticate as counselor
  console.log('\n--- Authenticating counselor ---');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'testcounselor@f1dreamjobs.com',
    password: 'test123456'
  });
  if (authError || !authData.session) {
    console.error('Counselor login failed:', authError?.message);
    process.exit(1);
  }
  const accessToken = authData.session.access_token;
  console.log('Authenticated');

  // 8. Trigger match agent
  console.log('\n--- Triggering match agent ---');
  const matchRes = await fetch('http://localhost:3000/api/agent/match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ student_id: studentId })
  });
  if (!matchRes.ok) {
    const errText = await matchRes.text().catch(() => 'Unknown');
    console.error('Match agent failed:', matchRes.status, errText);
    process.exit(1);
  }
  const matchResult = await matchRes.json();
  console.log('Match agent result:', JSON.stringify(matchResult, null, 2));

  if (!matchResult.run_id) {
    console.log('No match run created (possibly no unassigned leads matched).');
    process.exit(0);
  }

  // 9. Execute match steps via tick
  console.log('\n--- Executing match steps ---');
  let tickCount = 0;
  while (tickCount < 40) {
    const tickRes = await fetch('http://localhost:3000/api/agent/tick', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
    });
    if (!tickRes.ok) {
      console.error('Tick failed:', tickRes.status);
      break;
    }
    const tickResult = await tickRes.json();
    console.log('Tick:', tickResult);
    if (tickResult.processed === 0) break;
    tickCount++;
    await new Promise(r => setTimeout(r, 3000));
  }

  // 10. Query real matches
  const { data: jobMatches } = await supabase
    .from('job_matches')
    .select('id, job_lead_id, overall_score, grade, archetype, match_status, job_leads(company_name, job_role, job_url)')
    .eq('student_id', studentId)
    .order('overall_score', { ascending: false });

  console.log(`\nCreated ${jobMatches?.length || 0} real job matches:`);
  (jobMatches || []).slice(0, 10).forEach(m => {
    console.log(`  - ${m.job_leads.company_name} | ${m.job_leads.job_role} | Grade: ${m.grade} | Score: ${m.overall_score}`);
  });
  if ((jobMatches || []).length > 10) {
    console.log(`  ... and ${jobMatches.length - 10} more`);
  }

  // 11. Auto-apply to top real matches
  const topMatches = (jobMatches || []).filter(m => m.grade.startsWith('A') || m.grade.startsWith('B') || m.grade.startsWith('C')).slice(0, 10);
  if (topMatches.length === 0) {
    console.log('\nNo A/B grade matches to auto-apply.');
    process.exit(0);
  }

  console.log(`\n--- Auto-applying to ${topMatches.length} top matches ---`);
  const applyRes = await fetch('http://localhost:3000/api/agent/apply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      student_id: studentId,
      job_match_ids: topMatches.map(m => m.id)
    })
  });
  if (!applyRes.ok) {
    const errText = await applyRes.text().catch(() => 'Unknown');
    console.error('Apply agent failed:', applyRes.status, errText);
    process.exit(1);
  }
  const applyResult = await applyRes.json();
  console.log('Apply agent result:', JSON.stringify(applyResult, null, 2));

  // 12. Execute apply steps via tick
  console.log('\n--- Executing apply steps ---');
  let applyTickCount = 0;
  while (applyTickCount < 80) {
    const tickRes = await fetch('http://localhost:3000/api/agent/tick', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
    });
    if (!tickRes.ok) {
      console.error('Tick failed:', tickRes.status);
      break;
    }
    const tickResult = await tickRes.json();
    console.log('Tick:', tickResult);
    if (tickResult.processed === 0) break;
    applyTickCount++;
    await new Promise(r => setTimeout(r, 4000));
  }

  // 13. Final verification
  console.log('\n=== Final Results ===');
  const { data: apps } = await supabase
    .from('applications')
    .select('id, company_name, job_role, status, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  console.log(`Applications: ${apps?.length || 0}`);
  (apps || []).slice(0, 10).forEach(a => {
    console.log(`  - ${a.company_name} | ${a.job_role} | Status: ${a.status}`);
  });

  const { data: cvs } = await supabase
    .from('generated_cvs')
    .select('id, company_name, job_role, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  console.log(`\nGenerated CVs: ${cvs?.length || 0}`);

  const { count: evalCount } = await supabase
    .from('evaluation_scores')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId);
  console.log(`Evaluation scores: ${evalCount || 0}`);

  const { count: prepCount } = await supabase
    .from('interview_prep')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId);
  console.log(`Interview prep records: ${prepCount || 0}`);

  const { count: docCount } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId);
  console.log(`Documents: ${docCount || 0}`);

  console.log('\n=== Real Pipeline Complete ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
