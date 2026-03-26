// TEMPORARY: Gemini fallback added for testing without an Anthropic key.
// Priority: ANTHROPIC_API_KEY → GEMINI_API_KEY → keyword fallback
// Remove Gemini support once Anthropic key is available.

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..'); // server/src -> server -> repo root

const DESIGN_MIND_SYSTEM_PROMPT = readFileSync(
  join(repoRoot, 'agents', 'mind', 'system-prompt.md'),
  'utf8'
);

const CRITIC_SYSTEM_PROMPT = readFileSync(
  join(repoRoot, 'agents', 'critic', 'system-prompt.md'),
  'utf8'
);

const FALLBACK_BUILD_MODE = { mode: 'block-composition', anchor: null };

function makeFallback(gap) {
  return {
    build_mode: FALLBACK_BUILD_MODE,
    selected_blocks: [],
    regions: [],
    rules_applied: [],
    confidence: 0,
    gaps: [gap],
  };
}

// ── Provider detection ────────────────────────────────────────────────────────

function getProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GEMINI_API_KEY)    return 'gemini';
  return null;
}

// ── Anthropic helpers ─────────────────────────────────────────────────────────

function makeAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function anthropicParseWithRetry(client, model, systemPrompt, messages, label) {
  const makeParams = (msgs) => ({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: msgs,
  });

  let response;
  try {
    response = await client.messages.create(makeParams(messages));
  } catch (err) {
    process.stderr.write(`[llmClient] ${label} Anthropic error: ${err.message}\n`);
    throw err;
  }

  const rawText = response.content?.[0]?.text ?? '';
  try {
    return JSON.parse(rawText);
  } catch (_) {
    const retryMessages = [
      ...messages,
      { role: 'assistant', content: rawText },
      { role: 'user', content: 'Your previous response was not valid JSON. Respond ONLY with the JSON object, no markdown, no explanation.' },
    ];
    let retryResponse;
    try {
      retryResponse = await client.messages.create(makeParams(retryMessages));
    } catch (err) {
      process.stderr.write(`[llmClient] ${label} Anthropic retry error: ${err.message}\n`);
      throw err;
    }
    return JSON.parse(retryResponse.content?.[0]?.text ?? '');
  }
}

// ── Gemini helpers (TEMPORARY) ────────────────────────────────────────────────

async function geminiCall(systemPrompt, userContent, label) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    // responseMimeType enforces JSON output natively — no retry needed
    generationConfig: { responseMimeType: 'application/json' },
    systemInstruction: systemPrompt,
  });

  process.stdout.write(`[llmClient] ${label} using Gemini (temporary — no Anthropic key)\n`);

  let result;
  try {
    result = await model.generateContent(userContent);
  } catch (err) {
    process.stderr.write(`[llmClient] ${label} Gemini error: ${err.message}\n`);
    throw err;
  }

  const rawText = result.response.text();
  return JSON.parse(rawText);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Call the Design Mind agent.
 */
export async function callDesignMind({ genomeContext, intent, scope, domain, userType }) {
  const provider = getProvider();

  if (!provider) {
    process.stderr.write('[llmClient] WARNING: No API key set — returning retrieval-only fallback\n');
    return makeFallback('LLM not configured — returning retrieval-only results');
  }

  const userContent = [
    genomeContext,
    `Intent: ${intent}`,
    `Scope: ${scope}`,
    `Domain: ${domain || 'unspecified'}`,
    `User types: ${(userType || []).join(', ') || 'unspecified'}`,
  ].join('\n\n');

  try {
    if (provider === 'anthropic') {
      const client = makeAnthropicClient();
      const messages = [{
        role: 'user',
        content: [
          { type: 'text', text: genomeContext, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: `Intent: ${intent}\nScope: ${scope}\nDomain: ${domain || 'unspecified'}\nUser types: ${(userType || []).join(', ') || 'unspecified'}` },
        ],
      }];
      return await anthropicParseWithRetry(client, 'claude-sonnet-4-5', DESIGN_MIND_SYSTEM_PROMPT, messages, 'callDesignMind');
    }

    if (provider === 'gemini') {
      return await geminiCall(DESIGN_MIND_SYSTEM_PROMPT, userContent, 'callDesignMind');
    }
  } catch (err) {
    process.stderr.write(`[llmClient] callDesignMind failed: ${err.message}\n`);
    return makeFallback(`Design Mind API error: ${err.message}`);
  }
}

/**
 * Call the Critic agent.
 */
export async function callCritic({ generatedCode, originalIntent, genomeContext, autoCheckResults }) {
  const provider = getProvider();

  if (!provider) {
    process.stderr.write('[llmClient] WARNING: No API key set — returning retrieval-only fallback\n');
    return makeFallback('LLM not configured — returning retrieval-only results');
  }

  const userContent = [
    genomeContext,
    JSON.stringify({ generated_code: generatedCode, original_intent: originalIntent, auto_check_results: autoCheckResults }),
  ].join('\n\n');

  try {
    if (provider === 'anthropic') {
      const client = makeAnthropicClient();
      const messages = [{
        role: 'user',
        content: [
          { type: 'text', text: genomeContext, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: JSON.stringify({ generated_code: generatedCode, original_intent: originalIntent, auto_check_results: autoCheckResults }) },
        ],
      }];
      return await anthropicParseWithRetry(client, 'claude-sonnet-4-5', CRITIC_SYSTEM_PROMPT, messages, 'callCritic');
    }

    if (provider === 'gemini') {
      return await geminiCall(CRITIC_SYSTEM_PROMPT, userContent, 'callCritic');
    }
  } catch (err) {
    process.stderr.write(`[llmClient] callCritic failed: ${err.message}\n`);
    return makeFallback(`Critic API error: ${err.message}`);
  }
}
