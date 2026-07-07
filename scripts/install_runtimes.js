#!/usr/bin/env node

const PISTON_URL = process.env.PISTON_URL || 'http://127.0.0.1:2000';

const TARGET_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'php',
  'c++',
  'c',
  'csharp',
  'java',
  'kotlin',
  'swift',
  'go',
  'rust',
  'scala',
  'haskell',
  'bash',
  'sqlite3',
  'r',
  'julia',
  'dart',
  'perl',
  'ruby'
];

async function main() {
  console.log(`Checking Piston instance at ${PISTON_URL}...`);
  
  // 1. Wait for Piston to start
  let connected = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${PISTON_URL}/api/v2/packages`);
      if (res.ok) {
        connected = true;
        break;
      }
    } catch (e) {
      // Ignore and retry
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (!connected) {
    console.error('Failed to connect to Piston API after 30 seconds.');
    process.exit(1);
  }

  // 2. Fetch available packages
  const res = await fetch(`${PISTON_URL}/api/v2/packages`);
  if (!res.ok) {
    console.error(`Failed to fetch packages list from Piston: ${res.statusText}`);
    process.exit(1);
  }

  const packages = await res.json();
  console.log(`Found ${packages.length} packages in Piston index.`);

  // 3. Find latest version of target languages that are not installed
  const toInstall = [];
  for (const lang of TARGET_LANGUAGES) {
    // Find all versions of this language
    const matches = packages.filter(pkg => pkg.language.toLowerCase() === lang.toLowerCase() || pkg.aliases?.some(a => a.toLowerCase() === lang.toLowerCase()));
    if (matches.length === 0) {
      console.log(`Language "${lang}" not found in Piston repository.`);
      continue;
    }

    // Check if any version is already installed
    const alreadyInstalled = matches.find(pkg => pkg.installed);
    if (alreadyInstalled) {
      console.log(`Language "${lang}" is already installed (version: ${alreadyInstalled.version}).`);
      continue;
    }

    // Pick the first version to install (Piston repository matches are usually sorted or we take the first)
    const targetPkg = matches[0];
    toInstall.push(targetPkg);
  }

  if (toInstall.length === 0) {
    console.log('All target languages are already installed.');
    return;
  }

  console.log(`Installing ${toInstall.length} packages: ${toInstall.map(p => `${p.language}-${p.version}`).join(', ')}...`);

  for (const pkg of toInstall) {
    try {
      console.log(`Installing ${pkg.language} (${pkg.version})...`);
      const postRes = await fetch(`${PISTON_URL}/api/v2/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: pkg.language,
          version: pkg.version
        })
      });

      if (postRes.ok) {
        console.log(`Successfully installed ${pkg.language} (${pkg.version}).`);
      } else {
        const errText = await postRes.text();
        console.error(`Failed to install ${pkg.language}: ${errText}`);
      }
    } catch (e) {
      console.error(`Error installing ${pkg.language}:`, e.message);
    }
  }

  console.log('Piston installation script completed.');
}

main().catch(err => {
  console.error('Fatal error in install script:', err);
  process.exit(1);
});
