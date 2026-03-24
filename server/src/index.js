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

import { createInterface } from 'node:readline';
import { createServer }    from 'node:http';
import { randomUUID }      from 'node:crypto';
import { fileURLToPath }   from 'node:url';
import { dirname, join }   from 'node:path';
import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
} from 'node:fs';

import { loadKnowledge }                                         from './knowledge.js';
import { buildKnowledgeIndexes, saveIndex, loadIndex }          from './vectorIndex.js';
import { consultBeforeBuild, reviewOutput, reportPattern,
         setUseVectorStore }                                     from './contextAssembler.js';
import { isSeeded }                                              from './vectorstore.js';

// ── Paths ─────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
// server/src/ → up two levels → design-mind/
const BASE_PATH  = join(__dirname, '..', '..');
const INDEX_DIR  = join(__dirname, '..', '.index');

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'consult_before_build',
    description:
      'Call this before generating any UI component or surface. Returns the most relevant blocks, ' +
      'rules, ontology references, and safety constraints for your stated intent. ' +
      'Use the returned context to guide generation — do not build from scratch. ' +
      'Key principle: if the returned block covers your intent via slot variation (different label, ' +
      'domain, icon, entity type), USE that block — do not create a new one.',
    inputSchema: {
      type: 'object',
      required: ['intent_description', 'component_type', 'domain', 'user_type'],
      properties: {
        intent_description: {
          type: 'string',
          description:
            'Plain language description of what you are about to build. ' +
            'Be specific about the user type, the data shown, and the actions available.',
        },
        component_type: {
          type: 'string',
          enum: ['card', 'row', 'banner', 'header', 'modal', 'drawer', 'form',
                 'table', 'list', 'badge', 'button', 'page', 'panel', 'other'],
          description: 'The component type being built.',
        },
        domain: {
          type: 'string',
          enum: ['clinical-alerts', 'patient-data', 'care-gaps', 'tasks',
                 'care-protocols', 'assessments', 'navigation', 'data-display', 'forms', 'admin', 'other'],
          description: 'The functional domain this component belongs to.',
        },
        user_type: {
          type: 'array',
          items: { type: 'string', enum: ['clinician', 'coordinator', 'patient', 'admin'] },
          description: 'The user type(s) this component serves.',
        },
        product_area: {
          type: 'string',
          description: 'Optional: which product area this is being built for.',
        },
      },
    },
  },
  {
    name: 'review_output',
    description:
      'Call this after generating UI to get structured feedback. Returns what honored the genome, ' +
      'what was borderline, what needs fixing, and any novel blocks to report.',
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
      required: ['pattern_name', 'description', 'intent_it_serves', 'why_existing_patterns_didnt_fit'],
      properties: {
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
      },
    },
  },
];

// ── Server state ──────────────────────────────────────────────────────────────

let kb           = null;
let patternIndex = null;
let ruleIndex    = null;

async function initialize() {
  process.stderr.write('[design-mind] Starting Design Mind MCP Server...\n');
  process.stderr.write(`[design-mind] Knowledge base: ${BASE_PATH}\n`);

  kb = loadKnowledge(BASE_PATH);

  const patternIndexPath = join(INDEX_DIR, 'blocks.json');
  const ruleIndexPath    = join(INDEX_DIR, 'rules.json');

  const cachedPatterns = loadIndex(patternIndexPath);
  const cachedRules    = loadIndex(ruleIndexPath);

  if (cachedPatterns && cachedRules) {
    process.stderr.write('[design-mind] Using cached indexes\n');
    patternIndex = cachedPatterns;
    ruleIndex    = cachedRules;
  } else {
    process.stderr.write('[design-mind] Building indexes (first run)...\n');
    const indexes = buildKnowledgeIndexes(kb);
    patternIndex  = indexes.patternIndex;
    ruleIndex     = indexes.ruleIndex;
    try {
      saveIndex(patternIndex, patternIndexPath);
      saveIndex(ruleIndex,    ruleIndexPath);
      process.stderr.write('[design-mind] Indexes saved to .index/\n');
    } catch (e) {
      process.stderr.write(`[design-mind] WARN: could not save indexes: ${e.message}\n`);
    }
  }

  const vectorsReady = isSeeded('dm_patterns') && isSeeded('dm_rules');
  if (vectorsReady) {
    setUseVectorStore(true);
    process.stderr.write('[design-mind] Vector search: local semantic (flat-file cosine)\n');
  } else {
    process.stderr.write('[design-mind] Vector search: TF-IDF fallback\n');
  }
}

// ── Tool dispatch ─────────────────────────────────────────────────────────────

async function handleToolCall(toolName, toolArgs) {
  if (!kb || !patternIndex || !ruleIndex) {
    throw new Error('Server not yet initialized — please retry in a moment');
  }
  switch (toolName) {
    case 'consult_before_build':
      return await consultBeforeBuild(toolArgs, kb, patternIndex, ruleIndex, kb.surfaces);
    case 'review_output':
      return await reviewOutput(toolArgs, kb, patternIndex);
    case 'report_pattern':
      return await reportPattern(toolArgs, BASE_PATH);
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
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'design-mind', version: '1.0.0' },
        });
        break;
      }

      case 'notifications/initialized':
        process.stderr.write('[design-mind] Client initialized\n');
        break;

      case 'tools/list':
        sendResult(id, { tools: TOOLS });
        break;

      case 'tools/call': {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        process.stderr.write(`[design-mind] Tool call: ${toolName}\n`);

        handleToolCall(toolName, toolArgs)
          .then(result => {
            sendResult(id, {
              content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            });
          })
          .catch(toolErr => {
            process.stderr.write(`[design-mind] Tool error: ${toolErr.message}\n`);
            sendResult(id, {
              content: [{ type: 'text', text: `Error: ${toolErr.message}` }],
              isError: true,
            });
          });
        break;
      }

      case 'resources/list':
        sendResult(id, { resources: [] });
        break;
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
    process.stderr.write(`[design-mind] Unexpected error handling ${method}: ${err.message}\n`);
    if (!isNotification && id !== undefined) {
      sendError(id, -32603, 'Internal error', err.message);
    }
  }
}

// ── Stdio transport ───────────────────────────────────────────────────────────

function startStdio() {
  process.stderr.write('[design-mind] Transport: stdio — listening on stdin\n');

  const reply = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');

  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let message;
    try { message = JSON.parse(trimmed); } catch {
      process.stderr.write(`[design-mind] WARN: could not parse message: ${trimmed.substring(0, 100)}\n`);
      return;
    }
    handleMessage(message, reply);
  });

  rl.on('close', () => {
    process.stderr.write('[design-mind] stdin closed — server shutting down\n');
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
    process.stderr.write(`[design-mind] Slack notification failed: ${err.message}\n`);
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
      res.write(`event: endpoint\ndata: /messages?sessionId=${sessionId}\n\n`);
      sessions.set(sessionId, res);
      req.on('close', () => {
        sessions.delete(sessionId);
        process.stderr.write(`[design-mind] SSE session closed: ${sessionId}\n`);
      });
      process.stderr.write(`[design-mind] SSE session opened: ${sessionId}\n`);
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
        process.stderr.write(`[design-mind] Candidate received: ${record.candidate_id} (${status}, ${frequency_count}x)\n`);
        notifySlack(SLACK_WEBHOOK, record).catch(() => {});

        return sendJson(res, 201, { candidate_id: record.candidate_id, status, frequency_count });
      }

      // GET /candidates — list
      if (req.method === 'GET') {
        const candidates = store.load();
        return sendJson(res, 200, { candidates, total: candidates.length });
      }
    }

    // ── Seed / re-index ─────────────────────────────────────────────────────
    if (req.method === 'POST' && url.pathname === '/seed') {
      try {
        process.stderr.write('[design-mind] /seed triggered via showcase UI\n');
        mkdirSync(INDEX_DIR, { recursive: true });
        const kb = loadKnowledge(BASE_PATH);
        const { patternIndex, ruleIndex } = buildKnowledgeIndexes(kb);
        saveIndex(patternIndex, join(INDEX_DIR, 'patterns.json'));
        saveIndex(ruleIndex,    join(INDEX_DIR, 'rules.json'));
        process.stderr.write(`[design-mind] Re-indexed: ${patternIndex.documents.length} patterns, ${ruleIndex.documents.length} rules\n`);
        return sendJson(res, 200, {
          status:   'ok',
          patterns: patternIndex.documents.length,
          rules:    ruleIndex.documents.length,
        });
      } catch (err) {
        process.stderr.write(`[design-mind] /seed error: ${err.message}\n`);
        return sendJson(res, 500, { error: err.message });
      }
    }

    sendJson(res, 404, { error: 'Not found' });
  });

  server.listen(port, () => {
    process.stderr.write(`[design-mind] Transport: HTTP/SSE — listening on port ${port}\n`);
    process.stderr.write(`[design-mind] MCP endpoint: http://localhost:${port}/sse\n`);
    process.stderr.write(`[design-mind] Health check: http://localhost:${port}/health\n`);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await initialize();

  const transport = (process.env.TRANSPORT || 'stdio').toLowerCase();

  if (transport === 'sse') {
    const port = parseInt(process.env.PORT || '8080', 10);
    startHttp(port);
  } else {
    startStdio();
  }

  process.on('SIGTERM', () => {
    process.stderr.write('[design-mind] SIGTERM received — shutting down\n');
    process.exit(0);
  });
}

main().catch(err => {
  process.stderr.write(`[design-mind] Fatal error: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
