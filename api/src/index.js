/**
 * Design Mind Candidate API
 *
 * Receives pattern candidate submissions from any MCP consumer and stores them
 * centrally for human ratification. Optionally notifies via Slack webhook.
 *
 * POST /candidates  — submit a new pattern candidate
 * GET  /candidates  — list all submitted candidates (internal use)
 *
 * Auth: static API key in X-Api-Key header.
 * The key is bundled with the MCP package — consumers don't configure it.
 *
 * Env vars:
 *   PORT               — default 3456
 *   API_KEY            — required, rejects requests without it
 *   SLACK_WEBHOOK_URL  — optional, posts a Slack message per new candidate
 */

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, '..', 'data', 'candidates.jsonl');
const DATA_DIR   = join(__dirname, '..', 'data');

const PORT     = parseInt(process.env.PORT || '3456', 10);
const API_KEY  = process.env.API_KEY || 'dm-local-dev-key';
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || '';

// ── Similarity helpers ────────────────────────────────────────────────────────

function compositeText(pattern_name = '', description = '', intent_it_serves = '') {
  return [pattern_name, pattern_name, pattern_name, description, intent_it_serves]
    .join(' ')
    .toLowerCase();
}

function stringSimilarity(a, b) {
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 2));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

// ── Storage ───────────────────────────────────────────────────────────────────

function ensureStore() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(STORE_PATH)) writeFileSync(STORE_PATH, '', 'utf-8');
}

function appendCandidate(record) {
  ensureStore();
  writeFileSync(STORE_PATH, JSON.stringify(record) + '\n', { flag: 'a', encoding: 'utf-8' });
}

function loadCandidates() {
  ensureStore();
  return readFileSync(STORE_PATH, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

// Deduplicate by pattern_name similarity and count frequency
function withFrequency(candidates) {
  const freq = {};
  for (const c of candidates) {
    const key = c.pattern_name?.toLowerCase().trim();
    if (!key) continue;
    freq[key] = (freq[key] || 0) + 1;
  }
  return candidates.map(c => ({
    ...c,
    frequency_count: freq[c.pattern_name?.toLowerCase().trim()] || 1,
  }));
}

// ── Slack notification ─────────────────────────────────────────────────────────

async function notifySlack(candidate) {
  if (!SLACK_WEBHOOK) return;
  const freq = candidate.frequency_count || 1;
  const urgency = freq >= 3 ? '🔥 *Ready for ratification*' : freq === 2 ? '👀 *Needs more signal*' : '📋 Logged';

  const body = JSON.stringify({
    text: `${urgency} — new pattern candidate`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${candidate.pattern_name}*\n${urgency} · reported ${freq}x\n\n${candidate.description}`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Intent*\n${candidate.intent_it_serves}` },
          { type: 'mrkdwn', text: `*Submitted by*\n${candidate.submitted_by || 'unknown project'}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Why existing patterns didn't fit*\n${candidate.why_existing_patterns_didnt_fit}`,
        },
      },
    ],
  });

  try {
    const url = new URL(SLACK_WEBHOOK);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const { request } = await import('node:https');
    await new Promise((resolve, reject) => {
      const req = request(options, res => {
        res.resume();
        res.on('end', resolve);
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  } catch (err) {
    console.error('[api] Slack notification failed:', err.message);
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

// ── Request handler ───────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Auth — every request requires a valid API key
  if (req.headers['x-api-key'] !== API_KEY) {
    return send(res, 401, { error: 'Invalid or missing API key' });
  }

  // POST /candidates — submit a candidate
  if (req.method === 'POST' && url.pathname === '/candidates') {
    const body = await readBody(req);

    const required = ['pattern_name', 'description', 'intent_it_serves', 'why_existing_patterns_didnt_fit'];
    for (const field of required) {
      if (!body[field]) return send(res, 400, { error: `Missing required field: ${field}` });
    }

    // Check for similar existing candidates using composite similarity
    // (name × 3 + description + intent) so patterns with different names
    // but the same underlying concept (e.g. SdohAssessmentTab vs ClinicalAssessmentForm)
    // are recognised as duplicates and their frequency count is merged.
    const nameLower = body.pattern_name.toLowerCase().trim();
    const existing = loadCandidates();
    const incomingText = compositeText(body.pattern_name, body.description, body.intent_it_serves);
    const matches = existing.filter(c =>
      stringSimilarity(
        incomingText,
        compositeText(c.pattern_name, c.description, c.intent_it_serves)
      ) > 0.2
    );
    const frequency_count = matches.length + 1;
    const status = frequency_count >= 3 ? 'ready_for_ratification'
                 : frequency_count === 2 ? 'needs_more_signal'
                 : 'logged';

    const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const slug = nameLower.replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    const candidate_id = `${ts}-${slug}`;

    // Design Mind improvement: Change 3 — candidate decay tracking
    const today = new Date().toISOString().substring(0, 10);
    const submittingProject = body.submitted_by || 'unknown';

    // Build reporting_projects: merge existing reporters + this one
    const existingProjects = matches.length > 0
      ? (matches[matches.length - 1].reporting_projects || [])
      : [];
    const projectIdx = existingProjects.findIndex(p => p.project_id === submittingProject);
    let reporting_projects;
    if (projectIdx >= 0) {
      reporting_projects = existingProjects.map((p, i) =>
        i === projectIdx ? { ...p, last_active: today } : p
      );
    } else {
      reporting_projects = [...existingProjects, { project_id: submittingProject, last_active: today }];
    }

    const record = {
      candidate_id,
      pattern_name:                     body.pattern_name,
      description:                      body.description,
      intent_it_serves:                 body.intent_it_serves,
      why_existing_patterns_didnt_fit:  body.why_existing_patterns_didnt_fit,
      ontology_refs:                    body.ontology_refs || [],
      implementation_ref:               body.implementation_ref || null,
      submitted_by:                     submittingProject,
      submitted_at:                     new Date().toISOString(),
      frequency_count,
      frequency:                        frequency_count,
      reporting_projects,
      status,
    };

    appendCandidate(record);
    console.log(`[api] Candidate received: ${candidate_id} (${status}, ${frequency_count}x)`);

    // Fire-and-forget Slack notification
    notifySlack(record).catch(() => {});

    return send(res, 201, { candidate_id, status, frequency_count });
  }

  // GET /candidates — list all (internal/maintainer use)
  if (req.method === 'GET' && url.pathname === '/candidates') {
    const candidates = withFrequency(loadCandidates());
    return send(res, 200, { candidates, total: candidates.length });
  }

  send(res, 404, { error: 'Not found' });
}

// ── Start ─────────────────────────────────────────────────────────────────────

ensureStore();
const server = createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    console.error('[api] Unhandled error:', err);
    send(res, 500, { error: 'Internal server error' });
  });
});

server.listen(PORT, () => {
  console.log(`[design-mind-api] Listening on port ${PORT}`);
  console.log(`[design-mind-api] Slack notifications: ${SLACK_WEBHOOK ? 'enabled' : 'disabled'}`);
});
