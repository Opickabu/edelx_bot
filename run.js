// run.js — Runway Desk Listing Calls Auto-Submit (Multi-Account)
// Usage: node run.js
// Author: OPICKABU
// Platform: Windows (PowerShell), Termux (Android), VPS (Linux)

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ============ PLATFORM CHECK ============
function checkPlatform() {
  const platform = os.platform();
  const isTermux = !!process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  const isLinux = platform === 'linux';
  const isWindows = platform === 'win32';

  if (!isWindows && !isLinux && !isTermux) {
    console.log('[ERROR] Platform tidak didukung!');
    console.log('[INFO] Didukung: Windows (PowerShell), Termux (Android), VPS (Linux)');
    process.exit(1);
  }

  const env = isTermux ? 'Termux (Android)' : isWindows ? 'Windows (PowerShell)' : 'Linux (VPS)';
  console.log(`[INFO] Platform: ${env} (${platform})`);
  return { isWindows, isLinux, isTermux, env };
}

// ============ CONFIG ============
const CONFIG = {
  accountsFile: path.join(__dirname, 'accounts.txt'),
  baseUrl: 'runway.edel.finance',
  checkInterval: 60000, // 1 minute
  delayBetweenAccounts: 10000, // 10s between accounts
};

// ============ BRANDING ============
const LOGO = `
  ██████╗ ██████╗ ██╗ ██████╗██╗  ██╗ █████╗ ██████╗ ██╗   ██╗
 ██╔═══██╗██╔══██╗██║██╔════╝██║ ██╔╝██╔══██╗██╔══██╗██║   ██║
 ██║   ██║██████╔╝██║██║     █████╔╝ ███████║██████╔╝██║   ██║
 ██║   ██║██╔═══╝ ██║██║     ██╔═██╗ ██╔══██║██╔══██╗██║   ██║
 ╚██████╔╝██║     ██║╚██████╗██║  ██╗██║  ██║██████╔╝╚██████╔╝
  ╚═════╝ ╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝
`;

// ============ ACCOUNT LOADER ============
function loadAccounts() {
  if (!fs.existsSync(CONFIG.accountsFile)) {
    console.log('[ERROR] accounts.txt not found!');
    return [];
  }
  const lines = fs.readFileSync(CONFIG.accountsFile, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
  return lines;
}

// ============ HTTP HELPER ============
function request(method, path, cookie, body = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'accept': 'application/json',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      'cookie': cookie,
    };
    if (body) headers['content-type'] = 'application/json';

    const options = {
      hostname: CONFIG.baseUrl,
      port: 443,
      path: path,
      method: method,
      headers: headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ error: 'Invalid JSON', raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ============ MAIN LOGIC ============
async function getListingRound(cookie) {
  return request('GET', '/listing-round', cookie);
}

async function prepareRound(cookie) {
  return request('POST', '/listing-round', cookie, {});
}

async function submitPicks(cookie, previewId, picks) {
  return request('POST', '/listing-round/submit', cookie, { previewId, picks });
}

function getRandomPick(option) {
  const pickA = Math.random() < 0.5;
  return {
    listingDecisionId: option.listingDecisionId,
    assetId: pickA ? option.assetAId : option.assetBId,
  };
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function maskCookie(cookie) {
  // Show first 20 chars only
  const session = cookie.match(/edel_session=([^;]+)/);
  if (session) return session[1].substring(0, 20) + '...';
  return cookie.substring(0, 20) + '...';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processAccount(cookie, index, total) {
  const tag = `[ACC ${index + 1}/${total}]`;
  const masked = maskCookie(cookie);

  console.log(`\n${tag} Processing: ${masked}`);

  const data = await getListingRound(cookie);

  if (data.error) {
    console.log(`${tag} [ERROR] ${data.error.code}: ${data.error.message}`);
    return { status: 'error', nextWindow: null };
  }

  const { preview, round, currentWindow, actions } = data;
  const nextWindow = currentWindow?.timing?.nextRoundStartsAt ? new Date(currentWindow.timing.nextRoundStartsAt) : null;

  // Show status
  if (round) {
    console.log(`${tag} [STATUS] ${round.status} | [STAKE] ${round.stakeAmount.units / 1e10} EDELx`);
  }

  // Check timing
  if (currentWindow?.timing) {
    const closesAt = new Date(currentWindow.timing.selectionClosesAt);
    const timeLeft = closesAt - new Date();
    console.log(`${tag} [TIME] Closes in: ${formatTime(timeLeft)}`);
  }

  // Already submitted
  if (round?.status === 'SUBMITTED') {
    console.log(`${tag} [OK] Already submitted.`);
    return { status: 'submitted', nextWindow };
  }

  // If no preview but prepareRound is available, claim the round first
  if ((!preview || !preview.options || preview.options.length === 0) && actions?.prepareRound?.enabled) {
    console.log(`${tag} [PREPARE] Claiming round...`);
    const prepResult = await prepareRound(cookie);
    if (prepResult.error) {
      console.log(`${tag} [PREPARE] ${prepResult.error.code}: ${prepResult.error.message}`);
      if (prepResult.error.code === 'FIXTURE_CYCLE_EXHAUSTED') {
        console.log(`${tag} [WAIT] No active listing calls available.`);
        return { status: 'no_listings', nextWindow };
      }
      return { status: 'error', nextWindow };
    }
    console.log(`${tag} [PREPARE] Round claimed! Waiting 5s before submit...`);
    await sleep(5000);
    const refreshed = await getListingRound(cookie);
    if (refreshed.preview && refreshed.preview.options && refreshed.preview.options.length > 0) {
      const ok = await submitFromPreview(tag, cookie, refreshed.preview);
      return { status: ok ? 'submitted' : 'error', nextWindow };
    } else if (refreshed.round?.status === 'SUBMITTED') {
      console.log(`${tag} [OK] Already submitted after prepare.`);
      return { status: 'submitted', nextWindow };
    } else {
      console.log(`${tag} [WAIT] Prepared but no preview yet.`);
      return { status: 'no_listings', nextWindow };
    }
  }

  // If preview exists, submit
  if (preview && preview.options && preview.options.length > 0) {
    const ok = await submitFromPreview(tag, cookie, preview);
    return { status: ok ? 'submitted' : 'error', nextWindow };
  } else {
    console.log(`${tag} [WAIT] No active calls.`);
    return { status: 'no_listings', nextWindow };
  }
}

async function submitFromPreview(tag, cookie, preview) {
  console.log(`${tag} [FOUND] ${preview.options.length} listing calls!`);

  const picks = preview.options.map(opt => getRandomPick(opt));

  console.log(`${tag} [PICKS]`);
  picks.forEach((pick, i) => {
    console.log(`${tag}   Call ${i + 1}: ${pick.assetId.replace('asset-', '')}`);
  });

  const result = await submitPicks(cookie, preview.id, picks);

  if (result.error) {
    console.log(`${tag} [ERROR] Submit: ${result.error.code} - ${result.error.message}`);
  } else {
    console.log(`${tag} [SUCCESS] Submitted! ✓`);
  }
  return !result.error;
}

async function processAllAccounts() {
  const now = new Date();
  console.log(`\n${'='.repeat(50)}`);
  console.log(`[${now.toISOString()}] Checking all accounts...`);
  console.log(`${'='.repeat(50)}`);

  const accounts = loadAccounts();
  if (accounts.length === 0) {
    console.log('[ERROR] No accounts found in accounts.txt!');
    return { allDone: false, sleepUntil: null };
  }

  console.log(`[INFO] ${accounts.length} account(s) loaded\n`);

  let allDone = true;
  let earliestNext = null;

  for (let i = 0; i < accounts.length; i++) {
    const result = await processAccount(accounts[i], i, accounts.length);

    if (result.status === 'error') allDone = false;
    if (result.status === 'no_listings' || result.status === 'submitted') {
      if (result.nextWindow && (!earliestNext || result.nextWindow < earliestNext)) {
        earliestNext = result.nextWindow;
      }
    }
    if (i < accounts.length - 1) {
      await sleep(CONFIG.delayBetweenAccounts);
    }
  }

  return { allDone, sleepUntil: earliestNext };
}

// ============ MAIN LOOP ============
async function main() {
  console.log(LOGO);
  console.log('  Runway Desk — Listing Calls Auto-Submit');
  console.log('  Multi-Account Edition');
  console.log('  =========================================\n');

  const platform = checkPlatform();
  console.log('');

  while (true) {
    const { allDone, sleepUntil } = await processAllAccounts();

    if (allDone && sleepUntil) {
      // Sleep until 1 minute before next window
      const wakeAt = new Date(sleepUntil.getTime() - 60000);
      const sleepMs = wakeAt - new Date();
      if (sleepMs > 0) {
        console.log(`\n[DONE] All accounts processed. Sleeping until ${wakeAt.toISOString()} (${formatTime(sleepMs)})...`);
        await sleep(sleepMs);
        continue;
      }
    }

    // Fallback: check every 60s
    console.log(`\n[LOOP] Checking again in ${CONFIG.checkInterval / 1000}s...`);
    await sleep(CONFIG.checkInterval);
  }
}

main().catch(console.error);
