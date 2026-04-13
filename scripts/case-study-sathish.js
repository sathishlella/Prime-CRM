const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const RESUME_PATH = path.resolve('Sathish_lella_resume.pdf');

async function main() {
  console.log('=== Case Study: Sathish Lella ===\n');

  // 1. Find test student and counselor
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .ilike('email', 'teststudent@f1dreamjobs.com')
    .single();

  const { data: student } = studentProfile
    ? await supabase.from('students').select('id, profile_id, university, visa_status, profiles!students_profile_id_fkey(full_name, email)').eq('profile_id', studentProfile.id).single()
    : { data: null };

  const { data: counselor } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .ilike('email', 'testcounselor@f1dreamjobs.com')
    .single();

  if (!student || !counselor) {
    console.error('Could not find test student or counselor');
    process.exit(1);
  }

  const studentId = student.id;
  const counselorId = counselor.id;
  console.log('Student:', student.profiles?.full_name, '| ID:', studentId);
  console.log('Counselor:', counselor.full_name, '| ID:', counselorId);

  // 2. Upload resume to Supabase Storage
  const fileBuffer = fs.readFileSync(RESUME_PATH);
  const safeName = 'Sathish_lella_resume.pdf'.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${studentId}/resumes/${Date.now()}_${safeName}`;

  console.log('\nUploading resume to storage...');
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: false
    });

  if (uploadError) {
    console.error('Storage upload failed:', uploadError.message);
  } else {
    console.log('Resume uploaded to:', storagePath);
  }

  // 3. Insert document record
  console.log('Inserting document record...');
  const { data: docRecord, error: docError } = await supabase
    .from('documents')
    .insert({
      student_id: studentId,
      file_name: 'Sathish_lella_resume.pdf',
      file_url: storagePath,
      file_type: 'resume',
      uploaded_by: counselorId,
    })
    .select()
    .single();

  if (docError) {
    console.error('Document insert failed:', docError.message);
  } else {
    console.log('Document record created:', docRecord.id);
  }

  // 4. Create/upsert candidate profile for Sathish
  console.log('\nCreating candidate profile...');
  const profileData = {
    student_id: studentId,
    target_roles: ['Data Scientist', 'Software Engineer', 'Data Analyst', 'Machine Learning Engineer', 'AI Engineer'],
    archetypes: JSON.stringify([
      { name: 'Data-Driven Builder', evidence: 'Built AI-powered apps, optimized UI with measurable engagement lift' },
      { name: 'Research-Oriented Engineer', evidence: 'Published image segmentation and predictive maintenance research' }
    ]),
    narrative_headline: 'Data Scientist & Software Engineer with 3+ years of experience building AI-powered applications, optimizing user interfaces, and publishing research in computer vision and predictive maintenance.',
    narrative_exit_story: 'Seeking a full-time Data Scientist or Machine Learning Engineer role where I can leverage my research background, Python/SQL expertise, and track record of delivering measurable business impact through AI.',
    superpowers: ['Python & SQL', 'Machine Learning & Deep Learning', 'Data Visualization (Tableau, Power BI)', 'API Development & UI Optimization', 'Research & Publications'],
    proof_points: JSON.stringify([
      { metric: '75% reduction', context: 'in home invasions via AI-powered Chokidr app' },
      { metric: '20% user engagement lift', context: 'by optimizing JavaScript UI at Mphasis' },
      { metric: '40% faster analysis', context: 'through MongoDB query optimization' },
      { metric: 'Publications', context: 'Wiley, Springer journals + image segmentation research' }
    ]),
    compensation_target: '110000',
    compensation_minimum: '85000',
    compensation_currency: 'USD',
    location_preference: 'United States (open to remote/hybrid)',
    visa_status_detail: student.visa_status || 'F-1 STEM OPT eligible',
    cv_markdown: 'SATHISH LELLA\nData Scientist & Software Engineer\n\nSummary: 3+ years experience optimizing UI, building AI apps, and conducting research. Skills: Python, SQL, ML, Tableau, Power BI, TensorFlow, NLP, OpenCV.\n\nEducation: MS Data Science, Lewis University (GPA 3.5). BTech ECE, Aditya University.\n\nExperience: Mphasis (Associate Software Engineer), Tech Mahindra (Trainee), Youth Empowerment Foundation (Data Analyst), HappyMonk (Data Scientist Intern).\n\nPublications: Wiley, Springer journals.',
    skills: ['Python', 'SQL', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'Keras', 'OpenCV', 'NLP', 'Tableau', 'Power BI', 'MongoDB', 'Postman', 'JavaScript', 'HTML/CSS', 'MATLAB', 'Pandas', 'Matplotlib'],
    deal_breakers: ['No visa sponsorship', 'No remote flexibility', 'Non-technical role']
  };

  const { data: candProfile, error: candError } = await supabase
    .from('candidate_profiles')
    .upsert(profileData, { onConflict: 'student_id' })
    .select()
    .single();

  if (candError) {
    console.error('Candidate profile failed:', candError.message);
    console.error('Trying simplified profile...');
    const simplified = {
      student_id: studentId,
      target_roles: profileData.target_roles,
      skills: profileData.skills,
      proof_points: profileData.proof_points,
      compensation_target: JSON.stringify({ target: profileData.compensation_target, minimum: profileData.compensation_minimum, currency: profileData.compensation_currency }),
      deal_breakers: profileData.deal_breakers,
      narrative: profileData.narrative_headline,
      cv_markdown: profileData.cv_markdown
    };
    const { data: simp, error: simpErr } = await supabase
      .from('candidate_profiles')
      .upsert(simplified, { onConflict: 'student_id' })
      .select()
      .single();
    if (simpErr) {
      console.error('Simplified profile also failed:', simpErr.message);
    } else {
      console.log('Simplified candidate profile created:', simp.id);
    }
  } else {
    console.log('Candidate profile created:', candProfile.id);
  }

  // 5. Create 50+ job leads suitable for Sathish
  console.log('\nCreating 50+ job leads...');
  const companies = [
    'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Tesla', 'Uber', 'Airbnb', 'Stripe',
    'Spotify', 'Adobe', 'Salesforce', 'Oracle', 'IBM', 'Intel', 'NVIDIA', 'Qualcomm', 'Twitter/X', 'LinkedIn',
    'PayPal', 'Square', 'Shopify', 'Zoom', 'Slack', 'Dropbox', 'Palantir', 'Snowflake', 'Databricks', 'Coinbase',
    'Robinhood', 'DoorDash', 'Instacart', 'Lyft', 'Pinterest', 'Snap', 'Reddit', 'Twitch', 'Discord', 'Epic Games',
    'HubSpot', 'Twilio', 'Atlassian', 'ServiceNow', 'Workday', 'Splunk', 'Tableau/Salesforce', 'Datadog', 'New Relic', 'MongoDB'
  ];

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
      job_url: `https://careers.${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/jobs/${10000 + i * 100 + j}`,
      job_description: `We are seeking a talented ${role} to join our growing team. You will work with large datasets, build predictive models, and collaborate with cross-functional teams to deliver data-driven solutions. Requirements: Python, SQL, machine learning experience, and strong communication skills. Visa sponsorship available for exceptional candidates.`,
      location: locations[(i + j) % locations.length],
      source: ['greenhouse', 'lever', 'workday', 'direct'][(i + j) % 4],
      source_id: `${company.toLowerCase()}-req-${10000 + i * 100 + j}`,
      status: 'new'
    }));
  });

  const uniqueLeads = [];
  const seenUrls = new Set();
  for (const lead of jobLeads) {
    if (!seenUrls.has(lead.job_url)) {
      seenUrls.add(lead.job_url);
      uniqueLeads.push(lead);
    }
  }

  console.log(`Preparing ${uniqueLeads.length} unique job leads...`);

  for (let i = 0; i < uniqueLeads.length; i += 20) {
    const batch = uniqueLeads.slice(i, i + 20);
    const { error } = await supabase.from('job_leads').insert(batch);
    if (error) {
      console.error(`Batch ${i / 20 + 1} failed:`, error.message);
    } else {
      console.log(`Batch ${i / 20 + 1} inserted (${batch.length} leads)`);
    }
  }

  const { count: leadCount } = await supabase.from('job_leads').select('*', { count: 'exact', head: true });
  console.log(`Total job leads in database: ${leadCount}`);

  // 6. Run Match Agent logic directly (replicating /api/agent/match)
  console.log('\nRunning match agent logic...');
  const { data: candidateProfile } = await supabase
    .from('candidate_profiles')
    .select('target_roles, skills, location_preference, cv_markdown')
    .eq('student_id', studentId)
    .single();

  const keywords = new Set();
  ((candidateProfile?.target_roles) || []).forEach((k) => keywords.add(k.toLowerCase()));
  ((candidateProfile?.skills) || []).forEach((k) => keywords.add(k.toLowerCase()));

  // Fetch unassigned leads not yet matched for this student
  const { data: existingMatches } = await supabase
    .from('job_matches')
    .select('job_lead_id')
    .eq('student_id', studentId);
  const matchedLeadIds = new Set((existingMatches || []).map(m => m.job_lead_id));

  const { data: leads } = await supabase
    .from('job_leads')
    .select('id, company_name, job_role, job_description, job_url, location')
    .eq('status', 'new')
    .order('discovered_at', { ascending: false })
    .limit(200);

  let filteredLeads = (leads || []).filter(l => !matchedLeadIds.has(l.id));

  if (keywords.size > 0) {
    filteredLeads = filteredLeads.filter((lead) => {
      const text = `${lead.job_role} ${lead.company_name}`.toLowerCase();
      return Array.from(keywords).some((kw) => text.includes(kw));
    });
  }

  if (candidateProfile?.location_preference) {
    const loc = candidateProfile.location_preference.toLowerCase();
    filteredLeads = filteredLeads.filter((lead) => {
      if (!lead.location) return true;
      return lead.location.toLowerCase().includes(loc) || loc.includes(lead.location.toLowerCase());
    });
  }

  // Cap at 50 for the demo
  filteredLeads = filteredLeads.slice(0, 50);
  console.log(`Matched ${filteredLeads.length} leads for evaluation.`);

  if (filteredLeads.length === 0) {
    console.log('No leads to match. Exiting.');
    process.exit(0);
  }

  // Create agent run
  const { data: run, error: runError } = await supabase
    .from('agent_runs')
    .insert({
      run_type: 'match',
      student_id: studentId,
      initiated_by: counselorId,
      status: 'queued',
      total_steps: filteredLeads.length,
      completed_steps: 0,
      failed_steps: 0,
    })
    .select('id')
    .single();

  if (runError || !run) {
    console.error('Failed to create match run:', runError?.message);
    process.exit(1);
  }

  // Create steps
  const steps = filteredLeads.map((lead, idx) => ({
    run_id: run.id,
    step_index: idx,
    step_type: 'evaluate',
    status: 'pending',
    input: {
      student_id: studentId,
      lead_id: lead.id,
      company_name: lead.company_name,
      job_role: lead.job_role,
      job_description: lead.job_description,
      job_url: lead.job_url,
    },
  }));

  const { error: stepsError } = await supabase.from('agent_run_steps').insert(steps);
  if (stepsError) {
    console.error('Failed to create match steps:', stepsError.message);
    process.exit(1);
  }

  console.log(`Created match run ${run.id} with ${steps.length} steps.`);

  // 7. Execute match steps via tick endpoint
  console.log('\nExecuting match steps via tick...');
  let tickCount = 0;
  while (tickCount < 20) {
    const tickRes = await fetch('http://localhost:3000/api/agent/tick', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });
    if (!tickRes.ok) {
      const errText = await tickRes.text().catch(() => 'Unknown');
      console.error('Tick failed:', tickRes.status, errText);
      break;
    }
    const tickResult = await tickRes.json();
    console.log('Tick result:', tickResult);
    if (tickResult.processed === 0) break;
    tickCount++;
    await new Promise(r => setTimeout(r, 2000));
  }

  // 8. Query created job matches
  const { data: jobMatches, error: matchQueryErr } = await supabase
    .from('job_matches')
    .select('id, job_lead_id, overall_score, grade, archetype, match_status, job_leads(company_name, job_role)')
    .eq('student_id', studentId)
    .order('overall_score', { ascending: false });

  if (matchQueryErr) {
    console.error('Failed to query matches:', matchQueryErr.message);
  } else {
    console.log(`\nCreated ${jobMatches?.length || 0} job matches for student:`);
    (jobMatches || []).slice(0, 15).forEach(m => {
      console.log(`  - ${m.job_leads.company_name} | ${m.job_leads.job_role} | Grade: ${m.grade} | Score: ${m.overall_score}`);
    });
    if ((jobMatches || []).length > 15) {
      console.log(`  ... and ${jobMatches.length - 15} more`);
    }
  }

  // 9. Auto-apply to top matches (up to 10 for demo speed)
  const topMatches = (jobMatches || []).filter(m => m.grade.startsWith('A') || m.grade.startsWith('B')).slice(0, 10);
  if (topMatches.length === 0) {
    console.log('\nNo A/B grade matches to auto-apply.');
  } else {
    console.log(`\nAuto-applying to ${topMatches.length} top matches...`);

    // Replicate apply agent logic
    const { data: applyRun, error: applyRunErr } = await supabase
      .from('agent_runs')
      .insert({
        run_type: 'apply',
        student_id: studentId,
        initiated_by: counselorId,
        status: 'queued',
        total_steps: topMatches.length * 4,
        completed_steps: 0,
        failed_steps: 0,
      })
      .select('id')
      .single();

    if (applyRunErr || !applyRun) {
      console.error('Failed to create apply run:', applyRunErr?.message);
    } else {
      await supabase.from('job_matches').update({ match_status: 'queued' }).in('id', topMatches.map(m => m.id));

      const applySteps = [];
      topMatches.forEach((match, idx) => {
        const base = {
          student_id: studentId,
          match_id: match.id,
          company_name: match.job_leads.company_name,
          job_role: match.job_leads.job_role,
          job_description: '',
          job_url: '',
        };
        const offset = idx * 4;
        applySteps.push(
          { run_id: applyRun.id, step_index: offset + 0, step_type: 'create_app', status: 'pending', input: base },
          { run_id: applyRun.id, step_index: offset + 1, step_type: 'gen_cv', status: 'pending', input: base },
          { run_id: applyRun.id, step_index: offset + 2, step_type: 'gen_prep', status: 'pending', input: base },
          { run_id: applyRun.id, step_index: offset + 3, step_type: 'notify', status: 'pending', input: base }
        );
      });

      const { error: applyStepsErr } = await supabase.from('agent_run_steps').insert(applySteps);
      if (applyStepsErr) {
        console.error('Failed to create apply steps:', applyStepsErr.message);
      } else {
        console.log(`Created apply run ${applyRun.id} with ${applySteps.length} steps.`);

        // Execute apply steps via tick
        console.log('\nExecuting apply steps via tick...');
        let applyTickCount = 0;
        while (applyTickCount < 50) {
          const tickRes = await fetch('http://localhost:3000/api/agent/tick', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${CRON_SECRET}`
            }
          });
          if (!tickRes.ok) {
            const errText = await tickRes.text().catch(() => 'Unknown');
            console.error('Tick failed:', tickRes.status, errText);
            break;
          }
          const tickResult = await tickRes.json();
          console.log('Tick result:', tickResult);
          if (tickResult.processed === 0) break;
          applyTickCount++;
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }
  }

  // 10. Verify results
  console.log('\n=== Verification ===');
  const { data: apps } = await supabase
    .from('applications')
    .select('id, company_name, job_role, status, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  console.log(`Total applications for student: ${apps?.length || 0}`);
  (apps || []).slice(0, 15).forEach(a => {
    console.log(`  - ${a.company_name} | ${a.job_role} | Status: ${a.status}`);
  });

  const { data: cvs } = await supabase
    .from('generated_cvs')
    .select('id, company_name, job_role, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  console.log(`\nGenerated CVs: ${cvs?.length || 0}`);
  (cvs || []).slice(0, 15).forEach(c => {
    console.log(`  - ${c.company_name} | ${c.job_role}`);
  });

  const { count: evalCount } = await supabase
    .from('evaluation_scores')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId);
  console.log(`\nEvaluation scores: ${evalCount || 0}`);

  const { count: prepCount } = await supabase
    .from('interview_prep')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId);
  console.log(`Interview prep records: ${prepCount || 0}`);

  const { count: docCount } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId);
  console.log(`Documents uploaded: ${docCount || 0}`);

  console.log('\n=== Case Study Complete ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
