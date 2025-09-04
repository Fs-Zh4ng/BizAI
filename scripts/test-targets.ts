import path from 'path';
import { pathToFileURL } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env.local if present (Next.js often uses .env.local); otherwise load default .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

// Optional hardcoded keys for local debugging only.
// Replace the placeholder strings below with your real keys OR uncomment the explicit assignments.
// WARNING: Do NOT commit real API keys to version control.
const HARDCODED_APOLLO = process.env.APOLLO_API_KEY || 'REPLACE_WITH_YOUR_APOLLO_KEY';
const HARDCODED_OPENAI = process.env.OPENAI_API_KEY || 'REPLACE_WITH_YOUR_OPENAI_KEY';

// To force using hardcoded values for this run, either set the above constants directly
// or uncomment and place your key values here (not recommended to commit):
// process.env.APOLLO_API_KEY = 'your_real_apollo_key_here';
// process.env.OPENAI_API_KEY = 'your_real_openai_key_here';

// Apply the placeholders only if they've been replaced by you locally.
if (HARDCODED_APOLLO !== 'REPLACE_WITH_YOUR_APOLLO_KEY') process.env.APOLLO_API_KEY = HARDCODED_APOLLO;
if (HARDCODED_OPENAI !== 'REPLACE_WITH_YOUR_OPENAI_KEY') process.env.OPENAI_API_KEY = HARDCODED_OPENAI;

(async () => {
  console.log('--- Target Discovery Test ---');
  console.log('CWD:', process.cwd());
  console.log('APOLLO_API_KEY present:', !!process.env.APOLLO_API_KEY);
  console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
  console.log('NODE_ENV:', process.env.NODE_ENV || '');

  const description = process.env.TEST_BUSINESS_DESC || 'We build a SaaS analytics platform for e-commerce companies that helps stores increase conversion rates.';
  const audience = process.env.TEST_TARGET_AUDIENCE || 'Marketing managers, Head of Marketing, VP of Growth';
  const emailCount = (process.env.TEST_EMAIL_COUNT as any) || 'small';

  console.log('\nInput parameters:');
  console.log({ description, audience, emailCount });

  try {
    // Try a straightforward relative import first (works under ts-node).
    let mod: any;
    try {
      mod = await import('../src/lib/target-discovery');
    } catch (e) {
      // Fallback to absolute file URL using pathToFileURL (for environments that accept file:// imports)
      const modPath = path.resolve(process.cwd(), 'src/lib/target-discovery.ts');
      const modUrl = pathToFileURL(modPath).href;
      mod = await import(modUrl);
    }

    const TargetDiscovery = mod.TargetDiscovery;
    if (!TargetDiscovery) throw new Error('Failed to load TargetDiscovery from module');

    const targets: any[] = await TargetDiscovery.findTargets(description, audience, emailCount);

    console.log('\nFound targets:', targets.length);
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      console.log(`\n--- Target ${i + 1} ---`);
      console.log('name:', t.name);
      console.log('email:', t.email);
      console.log('company:', t.company);
      console.log('title:', t.title);
      console.log('linkedinUrl:', t.linkedinUrl);
      console.log('personalizationData (keys):', t.personalizationData ? Object.keys(t.personalizationData) : undefined);
      console.log('source:', t.personalizationData?.source);
    }

    // Quick checks to diagnose fallback reasons
    const hasApollo = targets.some((t: any) => t.personalizationData?.source === 'apollo');
    const hasAI = targets.some((t: any) => t.personalizationData?.source === 'ai-generated');
    console.log('\nDiagnosis:');
    console.log('Results include Apollo-generated contacts?', hasApollo);
    console.log('Results include AI-generated contacts?', hasAI);

    const emailsFound = targets.filter((t: any) => !!t.email).length;
    console.log('Number of targets with email addresses:', emailsFound);

    if (!hasApollo && !hasAI) {
      console.log('\nNo Apollo or AI results — script likely fell back to mock targets.');
      console.log('Check that APOLLO_API_KEY or OPENAI_API_KEY env vars are set and valid.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error during target discovery test:', err);
    process.exit(2);
  }
})();
