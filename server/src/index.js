/**
 * index.js — Design Mind MCP Server
 *
 * Supports two transports, selected by the TRANSPORT env var:
 *
 *   TRANSPORT=stdio (default)
 *     Implements MCP over stdio (JSON-RPC 2.0, newline-delimited).
 *     Use for local Claude Code config.
 *
 *   TRANSPORT=sse
 *     Implements MCP over HTTP + SSE for hosted / public access.
 *     GET  /sse                    — open SSE stream
 *     POST /messages?sessionId=x  — send JSON-RPC message
 *     POST /candidates             — submit pattern candidate (API key required)
 *     GET  /candidates             — list candidates (API key required)
 *     GET  /health                 — health check
 *
 * Tools exposed:
 *   consult_before_build  — pre-generation context retrieval
 *   review_output         — post-generation critique
 *   report_pattern        — novel pattern candidate logging
 *
 * Local stdio usage:
 *   node src/index.js
 *
 * Claude Code MCP config for remote server:
 *   {
 *     "mcpServers": {
 *       "design-mind": {
 *         "type": "sse",
 *         "url": "https://your-deployment.railway.app/sse"
 *       }
 *     }
 *   }
 */

import { createInterface }        from 'node:readline';
import { createServer }           from 'node:http';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath }          from 'node:url';
import { dirname, join }          from 'node:path';
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync,
} from 'node:fs';

import { loadKnowledge }                                         from './knowledge.js';
import { consultBeforeBuild, reviewOutput, reportPattern }      from './contextAssembler.js';
import { check as checkPackage }                                from './packageChecker.js';
import { loadGenome }                                           from './genomeLoader.js';
import {
  buildBlocksManifest,
  buildSurfacesManifest,
  buildSafetyResource,
  buildOntologyResource,
  buildTokensResource,
  buildCopyVoiceResource,
  buildPrinciplesResource,
  buildTasteResource,
} from './resources/buildResources.js';

// ── Paths ─────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
// server/src/ → up two levels → design-mind/
const BASE_PATH  = join(__dirname, '..', '..');

// In SSE/HTTP mode stdout is free for logs; in stdio mode stdout carries the MCP protocol
// so we must use stderr there to avoid corrupting the JSON-RPC stream.
// console.log() is used (not process.stdout.write) because Railway's logging agent
// routes console.log output to severity="info"; raw fd writes can mis-route to "error".
const TRANSPORT_ENV = (process.env.TRANSPORT || 'stdio').toLowerCase();
const log    = TRANSPORT_ENV === 'stdio'
  ? msg => process.stderr.write(msg)
  : msg => console.log(msg.replace(/\n$/, ''));
const logErr = msg => process.stderr.write(msg);

// ── Build info ────────────────────────────────────────────────────────────────
// Read the git SHA from .git/HEAD at startup so every response can carry it.
// No execSync — pure file reads, works in any environment.
function readGitInfo(basePath) {
  try {
    const head = readFileSync(join(basePath, '.git', 'HEAD'), 'utf-8').trim();
    const sha = head.startsWith('ref: ')
      ? readFileSync(join(basePath, '.git', head.slice(5)), 'utf-8').trim().slice(0, 7)
      : head.slice(0, 7); // detached HEAD (e.g. on Railway / CI)
    const message = readFileSync(join(basePath, '.git', 'COMMIT_EDITMSG'), 'utf-8')
      .split('\n')[0].trim(); // first line only
    return { sha, message };
  } catch {
    return { sha: 'unknown', message: '' };
  }
}

function localTimestamp() {
  return new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12:    false,
  });
}

const _gitInfo = readGitInfo(BASE_PATH);
const BUILD_INFO = {
  commit:      _gitInfo.sha,
  commit_msg:  _gitInfo.message,
  started_at:  localTimestamp(),
};

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'consult_before_build',
    description:
      'Call this BEFORE generating any UI — once per surface or bounded section.\n\n' +
      'A surface is one coherent screen or section. Not an entire product, module, or PRD.\n' +
      'If building multiple surfaces, call this separately for each one as you begin.\n\n' +
      'Ensure you have read these MCP resources at session start:\n' +
      '  design-mind://blocks/manifest      — block palette\n' +
      '  design-mind://surfaces/manifest    — ratified surface patterns\n' +
      '  design-mind://genome/safety        — hard clinical rules\n' +
      '  design-mind://genome/ontology      — canonical entity names\n' +
      '  design-mind://genome/tokens        — token rules\n' +
      '  design-mind://genome/copy-voice    — copy rules\n' +
      '  design-mind://genome/principles    — product principles\n' +
      '  design-mind://genome/taste         — aesthetic identity\n\n' +
      'Returns:\n' +
      '  prior_builds — pre-ratification signal: what similar surfaces looked like\n' +
      '  before they became canonical patterns. May be empty.\n\n' +
      'The genome is in your context. You own the composition.\n' +
      'After generating, call review_output.',
    inputSchema: {
      type: 'object',
      required: ['intent_description'],
      properties: {
        intent_description: {
          type: 'string',
          description: 'Rich description of what to build — who uses it, what data it shows, what actions are available',
        },
        domain: {
          type: 'string',
          enum: ['clinical-alerts', 'patient-data', 'care-gaps', 'tasks',
                 'navigation', 'data-display', 'forms', 'admin', 'other'],
          description: 'Functional domain (optional — infer from codebase if possible)',
        },
        user_type: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['clinician', 'coordinator', 'patient', 'admin', 'data-engineer'],
          },
          description: 'User type(s) this component serves (optional)',
        },
        project_root: {
          type: 'string',
          description:
            'Absolute path to the consuming project root (where its package.json lives). ' +
            'If omitted, the server walks up from its working directory to find it.',
        },
        workflows: {
          type: 'array',
          description:
            'Optional workflow decompositions. Each represents a bounded UI section with ' +
            'a specific intent. When provided, the response maps blocks to each workflow ' +
            'individually. When omitted, the entire intent is treated as a single workflow.',
          items: {
            type: 'object',
            required: ['id', 'intent'],
            properties: {
              id: {
                type: 'string',
                description: 'Unique workflow identifier (e.g. "filter-header", "patient-list")',
              },
              intent: {
                type: 'string',
                description: 'What this workflow section does — be specific about data and actions',
              },
              region: {
                type: 'string',
                description: 'Optional: which layout region this workflow belongs to',
              },
            },
          },
        },
      },
    },
  },
  {
    name: 'review_output',
    description:
      'Call this after generating UI to get structured feedback. Returns what honored the genome, ' +
      'what was borderline (with taste_ref citations), what needs fixing, layout_compliance checks ' +
      '(5 fixed taste checks — always present), and any novel blocks to report.',
    inputSchema: {
      type: 'object',
      required: ['generated_output', 'original_intent'],
      properties: {
        generated_output: {
          type: 'string',
          description: 'The generated code or detailed description of the UI.',
        },
        original_intent: {
          type: 'string',
          description: 'The same intent_description passed to consult_before_build.',
        },
        context_used: {
          type: 'object',
          description: 'Optional: the context returned from consult_before_build.',
        },
      },
    },
  },
  {
    name: 'report_pattern',
    description:
      'Call ONLY when the STRUCTURE of the UI changes — new interaction model, different layout ' +
      'container, different slot arrangement, or a layout that cannot be expressed as an existing ' +
      'block variant. Do NOT call when only slot content changes (different label, domain, icon, ' +
      'token, or entity type). Changing what data fills a slot is free variation, not a new block. ' +
      'The single threshold question: "Am I changing structure or content?" Content = do not call. ' +
      'Structure = call this tool and log the candidate for human ratification.',
    inputSchema: {
      type: 'object',
      required: ['pattern_name', 'description', 'intent_it_serves', 'why_existing_patterns_didnt_fit', 'closest_match_block_id'],
      properties: {
        closest_match_block_id: {
          type: 'string',
          description:
            'The ID of the block from consult_before_build that came closest to covering this intent. ' +
            'Used to generate the structural probe that gates submission. ' +
            'If no block matched at all, pass "none".',
        },
        pattern_name: {
          type: 'string',
          description: 'A short descriptive name for the block (e.g. "BulkActionToolbar").',
        },
        type: {
          type: 'string',
          enum: ['primitive', 'composite', 'domain', 'surface'],
          description: 'Block level (primitive / composite / domain) or surface.',
        },
        description: {
          type: 'string',
          description: 'What the block is and what problem it solves.',
        },
        intent_it_serves: {
          type: 'string',
          description: 'The user intent or job-to-be-done this block addresses.',
        },
        implementation_ref: {
          type: 'string',
          description: 'Optional: file path or PR link to the implementation.',
        },
        why_existing_patterns_didnt_fit: {
          type: 'string',
          description: 'What you looked for in consult_before_build and why none matched.',
        },
        ontology_refs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Entities, states, or actions from the ontology this block touches.',
        },
        preview_code: {
          type: 'string',
          description:
            'Optional but strongly encouraged: a self-contained React component that visually ' +
            'previews this pattern. Must be a complete TypeScript/TSX file with a default export ' +
            '(React.FC). Allowed imports: react, lucide-react, and Tailwind classes only. No imports ' +
            'from the client project or @innovaccer/ui-assets. Write a faithful visual approximation ' +
            'of the pattern using realistic placeholder data.',
        },
      },
    },
  },
  {
    name: 'ping',
    description:
      'Returns server build info — commit SHA, start time, and search mode. ' +
      'Call this to confirm which build is running and whether the server is healthy.',
    inputSchema: { type: 'object', properties: {} },
  },
];

// ── MCP Resources ─────────────────────────────────────────────────────────────

const RESOURCES = [
  {
    uri:         'design-mind://blocks/manifest',
    name:        'Block palette manifest',
    description: 'All ratified genome blocks. Each entry: id, level, import_instruction, when, not_when, family_invariants. Read at session start. Import from @innovaccer/ui-assets using import_instruction. Replaced by design-mind://blocks/search when genome exceeds ~120 blocks.',
    mimeType:    'application/json',
  },
  {
    uri:         'design-mind://surfaces/manifest',
    name:        'Ratified surface patterns',
    description: 'Canonical structural patterns for known surfaces. Mirrors blocks manifest. Starts empty — populates as patterns ratify. If a surface entry exists for your intent, treat its canonical_structure as a strong structural reference.',
    mimeType:    'application/json',
  },
  {
    uri:         'design-mind://genome/safety',
    name:        'Clinical safety constraints',
    description: 'Hard clinical rules. Non-negotiable. Apply to all UI on this platform.',
    mimeType:    'text/plain',
  },
  {
    uri:         'design-mind://genome/ontology',
    name:        'Clinical ontology',
    description: 'Canonical entity names, state definitions, action labels. Use these exactly — never synonyms.',
    mimeType:    'text/plain',
  },
  {
    uri:         'design-mind://genome/tokens',
    name:        'Token rules',
    description: 'What you can never do with colors, spacing, and typography. Read before generating any styled UI.',
    mimeType:    'text/plain',
  },
  {
    uri:         'design-mind://genome/copy-voice',
    name:        'Copy and voice rules',
    description: 'Clinical tone, tense, entity references, number formatting, confirmation dialog structure.',
    mimeType:    'text/plain',
  },
  {
    uri:         'design-mind://genome/principles',
    name:        'Product principles',
    description: 'The eight product principles that govern every surface. Action over information. Honest about uncertainty.',
    mimeType:    'text/plain',
  },
  {
    uri:         'design-mind://genome/taste',
    name:        'Aesthetic identity and design dials',
    description: 'Design variance, motion intensity, visual density baselines. Typography, color, layout, what we never do.',
    mimeType:    'text/plain',
  },
  // ── Search stubs — not yet active ─────────────────────────────────────────
  // Activate when blocks manifest exceeds ~15K tokens (~120 blocks).
  {
    uri:         'design-mind://blocks/search',
    name:        'Block search (stub)',
    description: 'NOT YET ACTIVE. Future: search blocks by intent. Use design-mind://blocks/manifest for now.',
    mimeType:    'application/json',
  },
  {
    uri:         'design-mind://surfaces/search',
    name:        'Surface search (stub)',
    description: 'NOT YET ACTIVE. Future: search surfaces by intent. Use design-mind://surfaces/manifest for now.',
    mimeType:    'application/json',
  },
];

const RESOURCE_BUILDERS = {
  'design-mind://blocks/manifest':   g => JSON.stringify(buildBlocksManifest(g),   null, 2),
  'design-mind://surfaces/manifest': g => JSON.stringify(buildSurfacesManifest(g), null, 2),
  'design-mind://genome/safety':     g => buildSafetyResource(g),
  'design-mind://genome/ontology':   g => buildOntologyResource(g),
  'design-mind://genome/tokens':     g => buildTokensResource(g),
  'design-mind://genome/copy-voice': g => buildCopyVoiceResource(g),
  'design-mind://genome/principles': g => buildPrinciplesResource(g),
  'design-mind://genome/taste':      g => buildTasteResource(g),
  'design-mind://blocks/search':     () => JSON.stringify({ status: 'not_yet_active', use_instead: 'design-mind://blocks/manifest' }),
  'design-mind://surfaces/search':   () => JSON.stringify({ status: 'not_yet_active', use_instead: 'design-mind://surfaces/manifest' }),
};

// ── Server state ──────────────────────────────────────────────────────────────

let kb           = null;
let patternIndex = null;
let ruleIndex    = null;

async function initialize() {
  log('[design-mind] Starting Design Mind MCP Server...\n');
  log(`[design-mind] Knowledge base: ${BASE_PATH}\n`);

  kb = loadKnowledge(BASE_PATH);
  patternIndex = kb.patterns;
  ruleIndex    = kb.rules;

  // ── Env / API-key check ──────────────────────────────────────────────────────
  const envPath = join(BASE_PATH, '.env');
  const hasEnv  = existsSync(envPath);
  const hasKey  = !!(
    process.env.ANTHROPIC_API_KEY ||
    (process.env.OPENAI_API_KEY && process.env.OPENAI_BASE_URL) ||
    process.env.OPENROUTER_API_KEY ||
    process.env.GEMINI_API_KEY
  );

  if (!hasEnv) {
    logErr('\n' +
      '╔══════════════════════════════════════════════════════════════╗\n' +
      '║  ⚠  .env file not found                                    ║\n' +
      '║                                                             ║\n' +
      '║  LLM reasoning is DISABLED — tools will return              ║\n' +
      '║  retrieval-only results without layout generation.          ║\n' +
      '║                                                             ║\n' +
      '║  To fix:  cp .env.example .env                              ║\n' +
      '║           Then add your API key (see .env.example)          ║\n' +
      '╚══════════════════════════════════════════════════════════════╝\n\n');
  } else if (!hasKey) {
    logErr('\n' +
      '╔══════════════════════════════════════════════════════════════╗\n' +
      '║  ⚠  No LLM API key found in .env                           ║\n' +
      '║                                                             ║\n' +
      '║  LLM reasoning is DISABLED — tools will return              ║\n' +
      '║  retrieval-only results without layout generation.          ║\n' +
      '║                                                             ║\n' +
      '║  Add one of: ANTHROPIC_API_KEY, OPENAI_API_KEY +            ║\n' +
      '║  OPENAI_BASE_URL, OPENROUTER_API_KEY, or GEMINI_API_KEY    ║\n' +
      '╚══════════════════════════════════════════════════════════════╝\n\n');
  }
}

// ── Hot-reload (local dev only — disabled in production) ──────────────────────
//
// Polls mtime of genome directories and key files every HOT_RELOAD_INTERVAL ms
// (default 2000). When a change is detected, re-runs loadKnowledge and
// swaps the module-level refs atomically.
//
// Not enabled when NODE_ENV=production (Railway) — files don't change in a
// running container and the poll overhead is unnecessary.
// Force-enable with HOT_RELOAD=true; force-disable with HOT_RELOAD=false.

function startHotReload(basePath) {
  const forceOn  = process.env.HOT_RELOAD === 'true';
  const forceOff = process.env.HOT_RELOAD === 'false';
  const inProd   = process.env.NODE_ENV   === 'production';
  if (forceOff || (inProd && !forceOn)) return;

  const POLL_MS   = parseInt(process.env.HOT_RELOAD_INTERVAL || '2000', 10);
  const DEBOUNCE  = 400; // ms to wait after first change before reloading

  // Paths to poll for mtime changes. On Linux, fs.watch is not recursive so
  // we snapshot directory-level mtimes rather than using inotify.
  const pollTargets = [
    join(basePath, 'genome', 'rules'),
    join(basePath, 'genome', 'taste.md'),
    join(basePath, 'genome', 'principles.md'),
    join(basePath, 'blocks'),
    join(basePath, 'ontology'),
    join(basePath, 'safety', 'hard-constraints.md'),
  ];

  // Expand rules directory to individual file paths (catches version/confidence edits)
  function expandTargets() {
    const paths = [...pollTargets];
    const rulesDir = join(basePath, 'genome', 'rules');
    try {
      for (const f of readdirSync(rulesDir)) {
        if (f.endsWith('.rule.md')) paths.push(join(rulesDir, f));
      }
    } catch { /* rules dir may not exist yet */ }
    return paths;
  }

  function snapshotMtimes(paths) {
    const snap = {};
    for (const p of paths) {
      try { snap[p] = statSync(p).mtimeMs; } catch { snap[p] = 0; }
    }
    return snap;
  }

  let targets    = expandTargets();
  let lastSnap   = snapshotMtimes(targets);
  let reloadTimer = null;

  async function doReload() {
    log('[design-mind] Hot-reload: genome change detected — reloading knowledge base...');
    try {
      const newKb = loadKnowledge(basePath);
      // Atomic swap — in-flight tool calls finish against old refs
      kb           = newKb;
      patternIndex = newKb.patterns;
      ruleIndex    = newKb.rules;
      // Refresh poll targets in case rule files were added/removed
      targets  = expandTargets();
      lastSnap = snapshotMtimes(targets);
      log(
        `[design-mind] Hot-reload: done — ` +
        `${newKb.patterns.length} patterns, ${newKb.rules.length} rules, ` +
        `loaded_at=${newKb._loadedAt}`
      );
    } catch (err) {
      logErr(`[design-mind] Hot-reload: FAILED — ${err.message}\n`);
      // Keep stale kb — better than null
    }
    reloadTimer = null;
  }

  setInterval(() => {
    const current = snapshotMtimes(targets);
    let changed = false;
    for (const p of targets) {
      if (current[p] !== lastSnap[p]) { changed = true; break; }
    }
    if (!changed) return;

    lastSnap = current; // update immediately so we don't double-trigger
    if (reloadTimer) return; // debounce — reload already scheduled
    reloadTimer = setTimeout(doReload, DEBOUNCE);
  }, POLL_MS);

  log(`[design-mind] Hot-reload: active (polling every ${POLL_MS}ms, NODE_ENV=${process.env.NODE_ENV || 'dev'})`);
}

// ── Tool dispatch ─────────────────────────────────────────────────────────────

async function handleToolCall(toolName, toolArgs) {
  if (!kb || !patternIndex || !ruleIndex) {
    throw new Error('Server not yet initialized — please retry in a moment');
  }
  switch (toolName) {
    case 'consult_before_build': {
      const pkgWarnings = await checkPackage(toolArgs.project_root);
      const result = await consultBeforeBuild(toolArgs, kb, patternIndex, ruleIndex, kb.surfaces);
      // Change 11 — ensure commit is a valid, closed JSON string (never raw-concatenated)
      result._server = { commit: String(BUILD_INFO.commit ?? 'unknown') };
      if (pkgWarnings.length > 0) result._package_warnings = pkgWarnings;
      return result;
    }
    case 'review_output':
      return await reviewOutput(toolArgs, kb, patternIndex);
    case 'report_pattern':
      return await reportPattern(toolArgs, BASE_PATH);
    case 'ping': {
      const shortHash = str =>
        createHash('sha256').update(str || '').digest('hex').slice(0, 8);
      const tokenRule   = kb?.rules?.find(r => r.id === 'styling-tokens');
      const genomeRules = (kb?.rules || []).map(r => ({
        id:         r.id,
        version:    r.version    || '1.0.0',
        confidence: r.confidence ?? 0.9,
        status:     'active',
      }));
      return {
        server:         'design-mind-mcp',
        commit:         BUILD_INFO.commit,
        commit_msg:     BUILD_INFO.commit_msg,
        started_at:     BUILD_INFO.started_at,
        kb_loaded_at:   kb?._loadedAt ?? null,
        knowledge_base: BASE_PATH,
        kb_stats: {
          patterns:           kb?.patterns?.length            ?? 0,
          surfaces:           kb?.surfaces?.length            ?? 0,
          rules:              kb?.rules?.length               ?? 0,
          safety_constraints: kb?.safety?.constraints?.length ?? 0,
          ontology_keys:      Object.keys(kb?.ontology ?? {}),
          taste_hash:         shortHash(kb?.taste),
          principles_hash:    shortHash(kb?.principles),
        },
        genome_rules:       genomeRules,
        token_set_version:  tokenRule?.version ?? 'unknown',
      };
    }
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// ── MCP message handler (reply-function based, safe for concurrent HTTP reqs) ──

function handleMessage(message, reply) {
  const { method, params, id } = message;
  const isNotification = id === undefined || id === null;

  const sendResult = (rid, result) =>
    reply({ jsonrpc: '2.0', id: rid, result });

  const sendError = (rid, code, msg, data = undefined) => {
    const error = { code, message: msg };
    if (data !== undefined) error.data = data;
    reply({ jsonrpc: '2.0', id: rid, error });
  };

  try {
    switch (method) {
      case 'initialize': {
        const clientVersion = params?.protocolVersion || '2024-11-05';
        sendResult(id, {
          protocolVersion: clientVersion,
          capabilities: {
            tools:     { listChanged: false },
            resources: { subscribe: false, listChanged: false },
          },
          serverInfo: { name: 'design-mind', version: `1.0.0-${BUILD_INFO.commit}` },
        });
        break;
      }

      case 'notifications/initialized':
        log('[design-mind] Client initialized\n');
        break;

      case 'tools/list':
        sendResult(id, { tools: TOOLS });
        break;

      case 'tools/call': {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        log(`[design-mind] Tool call: ${toolName}\n`);

        handleToolCall(toolName, toolArgs)
          .then(result => {
            sendResult(id, {
              content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            });
          })
          .catch(toolErr => {
            logErr(`[design-mind] Tool error: ${toolErr.message}\n`);
            sendResult(id, {
              content: [{ type: 'text', text: `Error: ${toolErr.message}` }],
              isError: true,
            });
          });
        break;
      }

      case 'resources/list':
        sendResult(id, { resources: RESOURCES });
        break;

      case 'resources/read': {
        const uri = params?.uri;
        const builder = RESOURCE_BUILDERS[uri];
        if (!builder) {
          sendError(id, -32602, `Unknown resource: ${uri}`);
          break;
        }
        try {
          const genome = loadGenome();
          const text   = builder(genome);
          const mime   = RESOURCES.find(r => r.uri === uri)?.mimeType ?? 'text/plain';
          sendResult(id, {
            contents: [{ uri, mimeType: mime, text }],
          });
        } catch (err) {
          logErr(`[design-mind] Resource read error (${uri}): ${err.message}\n`);
          sendError(id, -32603, `Failed to read resource: ${err.message}`);
        }
        break;
      }

      case 'prompts/list':
        sendResult(id, { prompts: [] });
        break;

      case 'ping':
        if (!isNotification) sendResult(id, {});
        break;

      default:
        if (!isNotification) sendError(id, -32601, `Method not found: ${method}`);
        break;
    }
  } catch (err) {
    logErr(`[design-mind] Unexpected error handling ${method}: ${err.message}\n`);
    if (!isNotification && id !== undefined) {
      sendError(id, -32603, 'Internal error', err.message);
    }
  }
}

// ── Stdio transport ───────────────────────────────────────────────────────────

function startStdio() {
  log('[design-mind] Transport: stdio — listening on stdin\n');

  const reply = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');

  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let message;
    try { message = JSON.parse(trimmed); } catch {
      logErr(`[design-mind] WARN: could not parse message: ${trimmed.substring(0, 100)}\n`);
      return;
    }
    handleMessage(message, reply);
  });

  rl.on('close', () => {
    log('[design-mind] stdin closed — server shutting down\n');
    process.exit(0);
  });
}

// ── Candidate API helpers (used in HTTP mode) ─────────────────────────────────

function compositeText(name = '', description = '', intent = '') {
  return [name, name, name, description, intent].join(' ').toLowerCase();
}

function stringSimilarity(a, b) {
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 2));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

function makeCandidateStore(baseDir) {
  const dataDir   = join(baseDir, 'api', 'data');
  const storePath = join(dataDir, 'candidates.jsonl');

  const ensureStore = () => {
    if (!existsSync(dataDir))   mkdirSync(dataDir,  { recursive: true });
    if (!existsSync(storePath)) writeFileSync(storePath, '', 'utf-8');
  };

  const append = (record) => {
    ensureStore();
    writeFileSync(storePath, JSON.stringify(record) + '\n', { flag: 'a', encoding: 'utf-8' });
  };

  const load = () => {
    ensureStore();
    return readFileSync(storePath, 'utf-8')
      .split('\n').filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  };

  return { append, load };
}

async function notifySlack(webhookUrl, candidate) {
  if (!webhookUrl) return;
  const freq    = candidate.frequency_count || 1;
  const urgency = freq >= 3 ? '🔥 *Ready for ratification*'
                : freq === 2 ? '👀 *Needs more signal*'
                : '📋 Logged';
  const body = JSON.stringify({
    text: `${urgency} — new pattern candidate`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `*${candidate.pattern_name}*\n${urgency} · reported ${freq}x\n\n${candidate.description}` } },
      { type: 'section', fields: [
        { type: 'mrkdwn', text: `*Intent*\n${candidate.intent_it_serves}` },
        { type: 'mrkdwn', text: `*Submitted by*\n${candidate.submitted_by || 'unknown project'}` },
      ]},
      { type: 'section', text: { type: 'mrkdwn', text: `*Why existing patterns didn't fit*\n${candidate.why_existing_patterns_didnt_fit}` } },
    ],
  });
  try {
    const url     = new URL(webhookUrl);
    const { request } = await import('node:https');
    await new Promise((resolve, reject) => {
      const req = request({
        hostname: url.hostname,
        path:     url.pathname + url.search,
        method:   'POST',
        headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      }, res => { res.resume(); res.on('end', resolve); });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  } catch (err) {
    logErr(`[design-mind] Slack notification failed: ${err.message}\n`);
  }
}

// ── SSE / HTTP transport ──────────────────────────────────────────────────────

function startHttp(port) {
  const sessions      = new Map(); // sessionId → SSE response
  // Accept either API_KEY or DESIGN_MIND_API_KEY so the server-side guard
  // and the contextAssembler client-side key can be set with a single env var.
  const API_KEY = process.env.API_KEY || process.env.DESIGN_MIND_API_KEY || 'dm-local-dev-key';
  const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || '';
  const store         = makeCandidateStore(BASE_PATH);

  const sendJson = (res, status, body) => {
    const json = JSON.stringify(body);
    res.writeHead(status, {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(json),
    });
    res.end(json);
  };

  const readBody = (req) => new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
    req.on('error', reject);
  });

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);

    // CORS — allow any origin so Claude Code on any machine can connect
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // ── Health check ──────────────────────────────────────────────────────────
    if (url.pathname === '/health') {
      return sendJson(res, 200, { status: 'ok', server: 'design-mind-mcp', version: '1.0.0' });
    }

    // ── MCP SSE — open stream ─────────────────────────────────────────────────
    if (req.method === 'GET' && url.pathname === '/sse') {
      const sessionId = randomUUID();
      res.writeHead(200, {
        'Content-Type':    'text/event-stream',
        'Cache-Control':   'no-cache',
        'Connection':      'keep-alive',
        'X-Accel-Buffering': 'no', // disable Nginx/Railway buffering
      });
      // Must be an absolute URL — Claude Code connects from a remote machine and
      // cannot resolve a relative path back to the Railway domain.
      // PUBLIC_URL env var takes priority (set this on Railway).
      // Locally, detect http vs https from x-forwarded-proto header (defaults to http).
      const proto = req.headers['x-forwarded-proto'] || 'http';
      const publicBase = (process.env.PUBLIC_URL || `${proto}://${req.headers.host}`).replace(/\/$/, '');
      res.write(`event: endpoint\ndata: ${publicBase}/messages?sessionId=${sessionId}\n\n`);
      sessions.set(sessionId, res);

      // Heartbeat — Railway's proxy kills idle SSE connections after ~60s.
      // Send a no-op comment every 30s to keep the connection alive for all clients.
      const heartbeat = setInterval(() => {
        if (!res.writableEnded) res.write(': ping\n\n');
      }, 30_000);

      req.on('close', () => {
        clearInterval(heartbeat);
        sessions.delete(sessionId);
        log(`[design-mind] SSE session closed: ${sessionId}\n`);
      });
      log(`[design-mind] SSE session opened: ${sessionId}\n`);
      return;
    }

    // ── MCP messages — receive from client ────────────────────────────────────
    if (req.method === 'POST' && url.pathname === '/messages') {
      const sessionId = url.searchParams.get('sessionId');
      const sseRes    = sessions.get(sessionId);

      if (!sseRes) {
        return sendJson(res, 400, { error: 'Unknown or expired session' });
      }

      const reply = (obj) => sseRes.write(`data: ${JSON.stringify(obj)}\n\n`);

      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let message;
        try { message = JSON.parse(body); } catch {
          res.writeHead(400); res.end();
          return;
        }
        handleMessage(message, reply);
        res.writeHead(202); res.end();
      });
      return;
    }

    // ── Candidate API ─────────────────────────────────────────────────────────
    if (url.pathname === '/candidates') {
      if (req.headers['x-api-key'] !== API_KEY) {
        return sendJson(res, 401, { error: 'Invalid or missing API key' });
      }

      // POST /candidates — submit
      if (req.method === 'POST') {
        const body = await readBody(req);
        const required = ['pattern_name', 'description', 'intent_it_serves', 'why_existing_patterns_didnt_fit'];
        for (const field of required) {
          if (!body[field]) return sendJson(res, 400, { error: `Missing required field: ${field}` });
        }

        const existing = store.load();
        const incomingText = compositeText(body.pattern_name, body.description, body.intent_it_serves);
        const matches = existing.filter(c =>
          stringSimilarity(
            incomingText,
            compositeText(c.pattern_name, c.description, c.intent_it_serves),
          ) > 0.2,
        );
        const frequency_count = matches.length + 1;
        const status = frequency_count >= 3 ? 'ready_for_ratification'
                     : frequency_count === 2 ? 'needs_more_signal'
                     : 'logged';

        const ts   = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const slug = body.pattern_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);

        const record = {
          candidate_id:                    `${ts}-${slug}`,
          pattern_name:                    body.pattern_name,
          description:                     body.description,
          intent_it_serves:                body.intent_it_serves,
          why_existing_patterns_didnt_fit: body.why_existing_patterns_didnt_fit,
          ontology_refs:                   body.ontology_refs || [],
          implementation_ref:              body.implementation_ref || null,
          submitted_by:                    body.submitted_by || null,
          submitted_at:                    new Date().toISOString(),
          frequency_count,
          status,
        };

        store.append(record);
        log(`[design-mind] Candidate received: ${record.candidate_id} (${status}, ${frequency_count}x)\n`);
        notifySlack(SLACK_WEBHOOK, record).catch(() => {});

        return sendJson(res, 201, { candidate_id: record.candidate_id, status, frequency_count });
      }

      // GET /candidates — list
      if (req.method === 'GET') {
        const candidates = store.load();
        return sendJson(res, 200, { candidates, total: candidates.length });
      }
    }

    sendJson(res, 404, { error: 'Not found' });
  });

  // Explicit 0.0.0.0 — required in Docker/Railway so Railway's proxy can reach the server.
  // Without this, Node may bind to ::1 (IPv6 loopback) only in some container environments.
  server.listen(port, '0.0.0.0', () => {
    log(`[design-mind] Transport: HTTP/SSE — listening on port ${port}\n`);
    log(`[design-mind] MCP endpoint: http://localhost:${port}/sse\n`);
    log(`[design-mind] Health check: http://localhost:${port}/health\n`);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await initialize();
  startHotReload(BASE_PATH);

  const transport = (process.env.TRANSPORT || 'stdio').toLowerCase();

  if (transport === 'sse') {
    const port = parseInt(process.env.PORT || '8080', 10);
    startHttp(port);
  } else {
    startStdio();
  }

  process.on('SIGTERM', () => {
    log('[design-mind] SIGTERM received — shutting down\n');
    process.exit(0);
  });
}

main().catch(err => {
  logErr(`[design-mind] Fatal error: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
