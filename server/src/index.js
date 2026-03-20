/**
 * index.js — Design Mind MCP Server
 *
 * Implements the Model Context Protocol over stdio (JSON-RPC 2.0,
 * newline-delimited). Zero external dependencies — runs with Node.js ≥18.
 *
 * Tools exposed:
 *   consult_before_build  — pre-generation context retrieval
 *   review_output         — post-generation critique
 *   report_pattern        — novel pattern candidate logging
 *
 * Usage:
 *   node src/index.js
 *
 * Claude Code MCP config (~/.claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "design-mind": {
 *         "command": "node",
 *         "args": ["/absolute/path/to/design-mind/server/src/index.js"]
 *       }
 *     }
 *   }
 */

import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { loadKnowledge } from './knowledge.js';
import { buildKnowledgeIndexes, saveIndex, loadIndex } from './vectorIndex.js';
import { consultBeforeBuild, reviewOutput, reportPattern, setUseVectorStore } from './contextAssembler.js';
import { isSeeded } from './vectorstore.js';

// ── Paths ─────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// server/src/ → up two levels → design-mind/
const BASE_PATH = join(__dirname, '..', '..');
const INDEX_DIR = join(__dirname, '..', '.index');

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'consult_before_build',
    description:
      'Call this before generating any UI component or surface. Returns the most relevant patterns, ' +
      'rules, ontology references, and safety constraints for your stated intent. ' +
      'Use the returned context to guide generation — do not build from scratch.',
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
                 'navigation', 'data-display', 'forms', 'admin', 'other'],
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
      'what was borderline, what needs fixing, and any novel patterns to report.',
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
      'Call when you have built something novel that the genome does not cover. ' +
      'This logs the pattern to the candidates queue for human ratification.',
    inputSchema: {
      type: 'object',
      required: ['pattern_name', 'description', 'intent_it_serves', 'why_existing_patterns_didnt_fit'],
      properties: {
        pattern_name: {
          type: 'string',
          description: 'A short descriptive name for the pattern (e.g. "BulkActionToolbar").',
        },
        description: {
          type: 'string',
          description: 'What the pattern is and what problem it solves.',
        },
        intent_it_serves: {
          type: 'string',
          description: 'The user intent or job-to-be-done this pattern addresses.',
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
          description: 'Entities, states, or actions from the ontology this pattern touches.',
        },
      },
    },
  },
];

// ── MCP JSON-RPC protocol helpers ─────────────────────────────────────────────

function sendMessage(obj) {
  // MCP over stdio: newline-delimited JSON on stdout
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function sendResult(id, result) {
  sendMessage({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message, data = undefined) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  sendMessage({ jsonrpc: '2.0', id, error });
}

// ── Server state ──────────────────────────────────────────────────────────────

let kb = null;
let patternIndex = null;
let ruleIndex = null;

async function initialize() {
  process.stderr.write('[design-mind] Starting Design Mind MCP Server...\n');
  process.stderr.write(`[design-mind] Knowledge base: ${BASE_PATH}\n`);

  // Load knowledge base
  kb = loadKnowledge(BASE_PATH);

  // Try loading cached indexes
  const patternIndexPath = join(INDEX_DIR, 'patterns.json');
  const ruleIndexPath = join(INDEX_DIR, 'rules.json');

  const cachedPatterns = loadIndex(patternIndexPath);
  const cachedRules = loadIndex(ruleIndexPath);

  if (cachedPatterns && cachedRules) {
    process.stderr.write('[design-mind] Using cached indexes\n');
    patternIndex = cachedPatterns;
    ruleIndex = cachedRules;
  } else {
    process.stderr.write('[design-mind] Building indexes (first run)...\n');
    const indexes = buildKnowledgeIndexes(kb);
    patternIndex = indexes.patternIndex;
    ruleIndex = indexes.ruleIndex;
    // Save for next run
    try {
      saveIndex(patternIndex, patternIndexPath);
      saveIndex(ruleIndex, ruleIndexPath);
      process.stderr.write('[design-mind] Indexes saved to .index/\n');
    } catch (e) {
      process.stderr.write(`[design-mind] WARN: could not save indexes: ${e.message}\n`);
    }
  }

  // ── Vector store availability check ───────────────────────────────────────
  const vectorsReady = isSeeded('dm_patterns') && isSeeded('dm_rules');
  if (vectorsReady) {
    setUseVectorStore(true);
    process.stderr.write('[design-mind] Vector search: local semantic (flat-file cosine)\n');
  } else {
    process.stderr.write('[design-mind] Vector search: TF-IDF fallback\n');
    process.stderr.write('[design-mind]   To enable semantic search: cd server && node src/seed-vectors.js\n');
  }

  process.stderr.write('[design-mind] Ready — listening for MCP messages on stdin\n');
}

// ── Tool dispatch ─────────────────────────────────────────────────────────────

async function handleToolCall(toolName, toolArgs) {
  if (!kb || !patternIndex || !ruleIndex) {
    throw new Error('Server not yet initialized — please retry in a moment');
  }

  switch (toolName) {
    case 'consult_before_build':
      return await consultBeforeBuild(toolArgs, kb, patternIndex, ruleIndex);

    case 'review_output':
      return await reviewOutput(toolArgs, kb, patternIndex);

    case 'report_pattern':
      return await reportPattern(toolArgs, BASE_PATH);

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// ── MCP message handler ───────────────────────────────────────────────────────

function handleMessage(message) {
  const { jsonrpc, method, params, id } = message;

  // Notifications have no id — don't respond
  const isNotification = id === undefined || id === null;

  try {
    switch (method) {
      // ── Initialize ────────────────────────────────────────────────────────
      case 'initialize': {
        const clientVersion = params?.protocolVersion || '2024-11-05';
        sendResult(id, {
          protocolVersion: clientVersion,
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: 'design-mind',
            version: '1.0.0',
          },
        });
        break;
      }

      // ── Initialized notification ──────────────────────────────────────────
      case 'notifications/initialized': {
        // No response for notifications
        process.stderr.write('[design-mind] Client initialized\n');
        break;
      }

      // ── Tools list ────────────────────────────────────────────────────────
      case 'tools/list': {
        sendResult(id, { tools: TOOLS });
        break;
      }

      // ── Tool call ─────────────────────────────────────────────────────────
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

      // ── Resources / Prompts (not implemented — send empty lists) ──────────
      case 'resources/list':
        sendResult(id, { resources: [] });
        break;
      case 'prompts/list':
        sendResult(id, { prompts: [] });
        break;

      // ── Ping ──────────────────────────────────────────────────────────────
      case 'ping':
        if (!isNotification) sendResult(id, {});
        break;

      // ── Unknown ───────────────────────────────────────────────────────────
      default: {
        if (!isNotification) {
          sendError(id, -32601, `Method not found: ${method}`);
        }
        break;
      }
    }
  } catch (err) {
    process.stderr.write(`[design-mind] Unexpected error handling ${method}: ${err.message}\n`);
    if (!isNotification && id !== undefined) {
      sendError(id, -32603, 'Internal error', err.message);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Initialize knowledge base and indexes
  await initialize();

  // Read newline-delimited JSON from stdin
  const rl = createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
    terminal: false,
  });

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let message;
    try {
      message = JSON.parse(trimmed);
    } catch {
      process.stderr.write(`[design-mind] WARN: could not parse message: ${trimmed.substring(0, 100)}\n`);
      return;
    }

    handleMessage(message);
  });

  rl.on('close', () => {
    process.stderr.write('[design-mind] stdin closed — server shutting down\n');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    process.stderr.write('[design-mind] SIGTERM received — server shutting down\n');
    process.exit(0);
  });
}

main().catch(err => {
  process.stderr.write(`[design-mind] Fatal error: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
