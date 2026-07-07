#!/usr/bin/env node
const http = require('http');
const { URL } = require('url');

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

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      };

      if (body) {
        reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
      }

      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            statusText: res.statusMessage,
            body: data
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (body) {
        req.write(body);
      }
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Checking Piston instance at ${PISTON_URL}...`);
  
  // 1. Wait for Piston to start
  let connected = false;
  let res;
  for (let i = 0; i < 30; i++) {
    try {
      res = await request(`${PISTON_URL}/api/v2/packages`);
      if (res.ok) {
        connected = true;
        break;
      }
    } catch (e) {
      // Ignore and retry
    }
    await sleep(1000);
  }

  if (!connected) {
    console.error('Failed to connect to Piston API after 30 seconds.');
    process.exit(1);
  }

  // 2. Parse available packages
  let packages;
  try {
    packages = JSON.parse(res.body);
  } catch (err) {
    console.error('Failed to parse packages response as JSON:', err);
    process.exit(1);
  }

  console.log(`Found ${packages.length} packages in Piston index.`);

  // 3. Find latest version of target languages that are not installed
  const toInstall = [];
  for (const lang of TARGET_LANGUAGES) {
    // Find all versions of this language
    const matches = packages.filter(pkg => 
      pkg.language.toLowerCase() === lang.toLowerCase() || 
      (pkg.aliases && pkg.aliases.some(a => a.toLowerCase() === lang.toLowerCase()))
    );
    
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

    // Pick the first version to install (Piston repository matches are usually sorted newest-first or we take the first)
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
      const postRes = await request(`${PISTON_URL}/api/v2/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, JSON.stringify({
        language: pkg.language,
        version: pkg.version
      }));

      if (postRes.ok) {
        console.log(`Successfully installed ${pkg.language} (${pkg.version}).`);
      } else {
        console.error(`Failed to install ${pkg.language}: ${postRes.body}`);
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
