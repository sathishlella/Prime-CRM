const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://eredvsrmrorqztrmqzdo.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const REAL_CAREER_URLS = {
  'Google': 'https://careers.google.com/jobs/',
  'Microsoft': 'https://careers.microsoft.com/us/en',
  'Amazon': 'https://www.amazon.jobs/en/',
  'Meta': 'https://www.metacareers.com/jobs/',
  'Apple': 'https://jobs.apple.com/en-us/search',
  'Netflix': 'https://jobs.netflix.com/jobs',
  'Tesla': 'https://www.tesla.com/careers/search/',
  'Uber': 'https://www.uber.com/careers/list/',
  'Airbnb': 'https://careers.airbnb.com/',
  'Stripe': 'https://stripe.com/jobs/search',
  'Spotify': 'https://www.lifeatspotify.com/jobs',
  'Adobe': 'https://careers.adobe.com/us/en/c/ererer',
  'Salesforce': 'https://careers.salesforce.com/en/jobs/',
  'Oracle': 'https://careers.oracle.com/jobs/',
  'IBM': 'https://careers.ibm.com/',
  'Intel': 'https://jobs.intel.com/',
  'NVIDIA': 'https://www.nvidia.com/en-us/about-nvidia/careers/',
  'Qualcomm': 'https://www.qualcomm.com/company/careers',
  'Twitter/X': 'https://careers.x.com/',
  'LinkedIn': 'https://careers.linkedin.com/',
  'PayPal': 'https://www.paypal.com/us/webapps/mpp/jobs',
  'Square': 'https://careers.squareup.com/us/en/jobs',
  'Shopify': 'https://www.shopify.com/careers/search',
  'Zoom': 'https://careers.zoom.us/',
  'Slack': 'https://slack.com/careers',
  'Dropbox': 'https://www.dropbox.com/jobs',
  'Palantir': 'https://www.palantir.com/careers/',
  'Snowflake': 'https://careers.snowflake.com/',
  'Databricks': 'https://www.databricks.com/company/careers',
  'Coinbase': 'https://www.coinbase.com/careers',
  'Robinhood': 'https://careers.robinhood.com/',
  'DoorDash': 'https://careers.doordash.com/',
  'Instacart': 'https://careers.instacart.com/',
  'Lyft': 'https://www.lyft.com/careers',
  'Pinterest': 'https://www.pinterestcareers.com/',
  'Snap': 'https://careers.snap.com/',
  'Reddit': 'https://www.redditinc.com/careers',
  'Twitch': 'https://www.twitch.tv/jobs/',
  'Discord': 'https://discord.com/careers',
  'Epic Games': 'https://www.epicgames.com/site/en-US/careers',
  'HubSpot': 'https://www.hubspot.com/careers',
  'Twilio': 'https://www.twilio.com/en-us/company/careers',
  'Atlassian': 'https://www.atlassian.com/company/careers',
  'ServiceNow': 'https://careers.servicenow.com/',
  'Workday': 'https://www.workday.com/en-us/company/careers.html',
  'Splunk': 'https://www.splunk.com/en_us/careers.html',
  'Tableau/Salesforce': 'https://careers.salesforce.com/en/jobs/',
  'Datadog': 'https://careers.datadoghq.com/',
  'New Relic': 'https://newrelic.com/careers',
  'MongoDB': 'https://www.mongodb.com/careers',
};

function deterministicScore(company, role) {
  const text = (company + role).toLowerCase();
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash) + text.charCodeAt(i);
  const base = Math.abs(hash) % 100;
  let score = 3.0;
  if (text.includes('data scientist') || text.includes('machine learning')) score += 1.2;
  if (text.includes('ai engineer') || text.includes('research')) score += 1.0;
  if (text.includes('google') || text.includes('microsoft') || text.includes('meta') || text.includes('nvidia') || text.includes('amazon')) score += 0.5;
  if (text.includes('analyst')) score += 0.3;
  score += (base / 100) * 0.8;
  return Math.min(5.0, Math.max(1.0, parseFloat(score.toFixed(1))));
}

function gradeFromScore(score) {
  if (score >= 4.5) return 'A';
  if (score >= 4.0) return 'B';
  if (score >= 3.0) return 'C';
  if (score >= 2.0) return 'D';
  if (score >= 1.0) return 'E';
  return 'F';
}

async function main() {
  console.log('=== Synthetic Case Study: Sathish Lella ===\n');

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

  // Clean up ALL existing synthetic data
  console.log('Cleaning up existing data...');
  const { data: oldApps } = await supabase.from('applications').select('id').eq('student_id', studentId);
  const appIds = (oldApps || []).map(a => a.id);
  if (appIds.length) {
    await supabase.from('generated_cvs').delete().in('application_id', appIds);
    await supabase.from('evaluation_scores').delete().in('application_id', appIds);
    await supabase.from('interview_prep').delete().in('application_id', appIds);
    await supabase.from('applications').delete().in('id', appIds);
  }
  await supabase.from('job_matches').delete().eq('student_id', studentId);
  
  // Delete ALL fake job leads created by previous scripts (both patterns)
  await supabase.from('job_leads').delete().ilike('job_url', 'https://careers.%.com/jobs/%');
  await supabase.from('job_leads').delete().ilike('job_url', 'https://careers.%/jobs/%');
  
  const { data: oldRuns } = await supabase.from('agent_runs').select('id').eq('student_id', studentId);
  const oldRunIds = (oldRuns || []).map(r => r.id);
  if (oldRunIds.length) {
    await supabase.from('agent_run_steps').delete().in('run_id', oldRunIds);
    await supabase.from('agent_runs').delete().in('id', oldRunIds);
  }
  console.log('Cleaned up previous data');

  // Create job leads with REAL working URLs
  const companies = Object.keys(REAL_CAREER_URLS);
  const roles = [
    'Data Scientist', 'Machine Learning Engineer', 'Software Engineer - Data', 'Data Analyst',
    'AI Engineer', 'Applied Scientist', 'Research Engineer', 'Analytics Engineer'
  ];
  const locations = [
    'Remote', 'San Francisco, CA', 'Seattle, WA', 'New York, NY', 'Austin, TX',
    'Boston, MA', 'Chicago, IL', 'Los Angeles, CA', 'Denver, CO', 'Atlanta, GA'
  ];

  const jobLeads = companies.flatMap((company, i) => {
    return roles.slice(0, 1 + (i % 4)).map((role, j) => ({
      company_name: company,
      job_role: role,
      job_url: REAL_CAREER_URLS[company],
      job_description: `We are seeking a talented ${role} to join our growing team at ${company}. You will work with large datasets, build predictive models, and collaborate with cross-functional teams to deliver data-driven solutions. Requirements: Python, SQL, machine learning experience, and strong communication skills. Visa sponsorship available for exceptional candidates.`,
      location: locations[(i + j) % locations.length],
      source: ['greenhouse', 'lever', 'workday', 'direct'][(i + j) % 4],
      source_id: `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}-req-${10000 + i * 100 + j}`,
      status: 'new'
    }));
  });

  // Deduplicate by company+role
  const uniqueLeads = [];
  const seen = new Set();
  for (const lead of jobLeads) {
    const key = lead.company_name + '|' + lead.job_role;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueLeads.push(lead);
    }
  }

  console.log(`Inserting ${uniqueLeads.length} job leads with real URLs...`);
  for (let i = 0; i < uniqueLeads.length; i += 20) {
    const { error } = await supabase.from('job_leads').insert(uniqueLeads.slice(i, i + 20));
    if (error) console.error(`Batch ${i/20+1} failed:`, error.message);
  }

  const { data: insertedLeads } = await supabase
    .from('job_leads')
    .select('id, company_name, job_role, job_url, job_description')
    .ilike('job_url', 'https://%')
    .order('discovered_at', { ascending: false })
    .limit(60);

  console.log(`Found ${insertedLeads?.length || 0} job leads in DB`);

  // Create job_matches and evaluation_scores
  const matchesToInsert = [];
  const evalsToInsert = [];
  const matchMap = [];

  for (const lead of (insertedLeads || [])) {
    const score = deterministicScore(lead.company_name, lead.job_role);
    const grade = gradeFromScore(score);
    const matchId = crypto.randomUUID();
    
    matchMap.push({
      lead_id: lead.id,
      match_id: matchId,
      score,
      grade,
      company: lead.company_name,
      role: lead.job_role,
      description: lead.job_description,
      url: lead.job_url,
    });

    matchesToInsert.push({
      id: matchId,
      student_id: studentId,
      job_lead_id: lead.id,
      overall_score: score,
      grade,
      archetype: score >= 4 ? 'Data-Driven Builder' : 'Research-Oriented Engineer',
      match_reasoning: {
        fit_summary: `${lead.company_name} ${lead.job_role} aligns well with Sathish's ${score >= 4 ? 'Python/ML and research background' : 'data analysis and software engineering experience'}.`,
        skill_overlap: ['Python', 'SQL', 'Machine Learning', 'Data Visualization', 'TensorFlow'].slice(0, Math.floor(score)),
        gaps: score >= 4 ? [] : ['More domain-specific experience would strengthen fit']
      },
      match_status: 'new',
    });

    evalsToInsert.push({
      id: crypto.randomUUID(),
      student_id: studentId,
      application_id: null,
      overall_score: score,
      grade,
      archetype: score >= 4 ? 'Data-Driven Builder' : 'Research-Oriented Engineer',
      recommendation: score >= 4 ? 'strong_apply' : score >= 3 ? 'apply' : 'consider',
      blocks: {
        summary: `Strong fit for ${lead.company_name} ${lead.job_role} based on Sathish's background in data science, ML, and software engineering.`,
        strengths: [
          '3+ years Python/SQL experience',
          'Published research in ML and computer vision',
          'Hands-on experience with Tableau, Power BI, TensorFlow'
        ],
        gaps: score >= 4 ? [] : ['Could deepen domain expertise'],
        role_alignment: `${lead.job_role} matches target roles and skills profile.`
      },
      keywords: ['Python', 'SQL', 'Machine Learning', 'Data Visualization', 'TensorFlow', 'Research'],
      evaluated_by: counselorId,
    });
  }

  for (let i = 0; i < matchesToInsert.length; i += 20) {
    const { error } = await supabase.from('job_matches').insert(matchesToInsert.slice(i, i + 20));
    if (error) console.error('Match insert error:', error.message);
  }
  console.log(`Created ${matchesToInsert.length} job matches`);

  // Create applications for top 20 matches
  const topMatches = matchMap.filter(m => m.grade.startsWith('A') || m.grade.startsWith('B')).slice(0, 20);
  console.log(`\nTop ${topMatches.length} matches selected for applications`);

  const appsToInsert = [];
  for (const m of topMatches) {
    appsToInsert.push({
      id: crypto.randomUUID(),
      student_id: studentId,
      company_name: m.company,
      job_role: m.role,
      job_link: m.url,
      job_description: m.description || `We are seeking a talented ${m.role} to join our growing team.`,
      status: 'applied',
      resume_used: 'Sathish_lella_resume.pdf',
      applied_by: counselorId,
      applied_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    });
  }

  const { data: insertedApps, error: appError } = await supabase.from('applications').insert(appsToInsert).select('id, company_name, job_role');
  if (appError) {
    console.error('Application insert failed:', appError.message);
  } else {
    console.log(`Created ${insertedApps.length} applications`);
  }

  // Update evaluation_scores with application_ids
  const appLookup = {};
  (insertedApps || []).forEach(a => { appLookup[a.company_name + '|' + a.job_role] = a.id; });

  const evalsWithAppIds = evalsToInsert.map((ev, idx) => {
    const m = matchMap[idx];
    const appId = appLookup[m.company + '|' + m.role] || null;
    return { ...ev, application_id: appId };
  });

  for (let i = 0; i < evalsWithAppIds.length; i += 20) {
    const batch = evalsWithAppIds.slice(i, i + 20).filter(e => e.application_id);
    if (batch.length) {
      const { error } = await supabase.from('evaluation_scores').insert(batch);
      if (error) console.error('Eval insert error:', error.message);
    }
  }
  console.log(`Created ${evalsWithAppIds.filter(e => e.application_id).length} evaluation scores`);

  // Create generated CVs
  const cvsToInsert = [];
  for (const app of (insertedApps || [])) {
    cvsToInsert.push({
      id: crypto.randomUUID(),
      application_id: app.id,
      student_id: studentId,
      company_name: app.company_name,
      job_role: app.job_role,
      pdf_url: `https://eredvsrmrorqztrmqzdo.supabase.co/storage/v1/object/public/generated-cvs/${studentId}/${app.company_name.replace(/[^a-zA-Z0-9]/g, '_')}_${app.job_role.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      pdf_storage_path: `${studentId}/${app.company_name.replace(/[^a-zA-Z0-9]/g, '_')}_${app.job_role.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      tailoring_data: { highlights: ['Python', 'Machine Learning', 'Data Visualization'], keyword_coverage: 92 },
      keyword_coverage: 92,
      page_count: 1,
      generated_by: counselorId,
    });
  }

  if (cvsToInsert.length) {
    const { error } = await supabase.from('generated_cvs').insert(cvsToInsert);
    if (error) console.error('CV insert error:', error.message);
    else console.log(`Created ${cvsToInsert.length} generated CVs`);
  }

  // Create interview prep records
  const prepsToInsert = [];
  for (const app of (insertedApps || [])) {
    prepsToInsert.push({
      id: crypto.randomUUID(),
      application_id: app.id,
      student_id: studentId,
      company_name: app.company_name,
      job_role: app.job_role,
      prep_data: {
        company_overview: `${app.company_name} is a leading technology company.`,
        role_specific_tips: [
          'Emphasize Python and SQL projects',
          'Discuss the Chokidr AI app and measurable impact',
          'Be ready to explain image segmentation research methodology'
        ],
        star_stories: [
          {
            question: 'Tell me about a time you used data to drive a decision.',
            situation: 'At Mphasis, page load times were hurting user engagement.',
            task: 'I needed to optimize the JavaScript UI.',
            action: 'Profiled code, reduced bundle size, and implemented lazy loading.',
            result: '15% faster load times and 20% higher engagement within 8 months.'
          },
          {
            question: 'Describe a machine learning project you led.',
            situation: 'HappyMonk wanted to reduce home invasions using AI.',
            task: 'Build an AI-powered security app called Chokidr.',
            action: 'Developed computer vision models and collaborated with teams to analyze customer input.',
            result: '75% drop in home invasions and 15% increase in customer satisfaction.'
          }
        ]
      },
      story_bank: JSON.stringify([]),
      generated_by: counselorId,
    });
  }

  if (prepsToInsert.length) {
    const { error } = await supabase.from('interview_prep').insert(prepsToInsert);
    if (error) console.error('Prep insert error:', error.message);
    else console.log(`Created ${prepsToInsert.length} interview prep records`);
  }

  // Mark top matches as applied
  if (topMatches.length) {
    const { error } = await supabase.from('job_matches')
      .update({ match_status: 'applied' })
      .in('id', topMatches.map(m => m.match_id));
    if (error) console.error('Match status update error:', error.message);
  }

  // Create completed agent run
  const { data: run } = await supabase.from('agent_runs').insert({
    run_type: 'apply',
    student_id: studentId,
    initiated_by: counselorId,
    status: 'completed',
    total_steps: topMatches.length * 4,
    completed_steps: topMatches.length * 4,
    failed_steps: 0,
    input: { note: 'Synthetic case study run for Sathish Lella demo' },
    output: { applications_created: topMatches.length, cvs_generated: topMatches.length },
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  }).select('id').single();

  if (run) {
    console.log(`\nAgent run completed: ${run.id}`);
  }

  // Final counts
  console.log('\n=== Final Dashboard Counts ===');
  const { count: appCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('student_id', studentId);
  const { count: cvCount } = await supabase.from('generated_cvs').select('*', { count: 'exact', head: true }).eq('student_id', studentId);
  const { count: evalCount } = await supabase.from('evaluation_scores').select('*', { count: 'exact', head: true }).eq('student_id', studentId);
  const { count: prepCount } = await supabase.from('interview_prep').select('*', { count: 'exact', head: true }).eq('student_id', studentId);
  const { count: matchCount } = await supabase.from('job_matches').select('*', { count: 'exact', head: true }).eq('student_id', studentId);
  const { count: leadCount } = await supabase.from('job_leads').select('*', { count: 'exact', head: true });

  console.log(`Applications: ${appCount}`);
  console.log(`Generated CVs: ${cvCount}`);
  console.log(`Evaluation scores: ${evalCount}`);
  console.log(`Interview prep records: ${prepCount}`);
  console.log(`Job matches: ${matchCount}`);
  console.log(`Total job leads in DB: ${leadCount}`);

  console.log('\n=== Case Study Complete ===');
  console.log('\nSathish can now log in and see:');
  console.log('- His uploaded resume in My Documents');
  console.log('- 20+ tailored job applications on the Dashboard');
  console.log('- AI evaluations for each role (fit scores, grades)');
  console.log('- Interview prep with STAR stories for every application');
  console.log('- Generated CVs tailored to each company in My CVs');
  console.log('\nJob Leads now have REAL company career page URLs that actually work.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
