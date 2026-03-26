// TEMPORARY: Gemini and OpenRouter fallbacks added for testing without an Anthropic key.
// Priority: ANTHROPIC_API_KEY → OPENROUTER_API_KEY → GEMINI_API_KEY → keyword fallback
// Remove non-Anthropic support once Anthropic key is available.

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
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

// Extracts a JSON object from a model response that may contain prose or markdown
function extractJson(text) {
  // Strip markdown code fences
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  // Try direct parse first
  try { return JSON.parse(stripped); } catch (_) {}
  // Find first { ... last } and parse that
  const start = stripped.indexOf('{');
  const end   = stripped.lastIndexOf('}');
  if (start !== -1 && end > start) {
    return JSON.parse(stripped.slice(start, end + 1));
  }
  throw new SyntaxError(`No JSON object found in response: ${stripped.slice(0, 120)}`);
}

// ── Provider detection ────────────────────────────────────────────────────────

function getProvider() {
  if (process.env.ANTHROPIC_API_KEY)                           return 'anthropic';
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_BASE_URL) return 'openai';
  if (process.env.OPENROUTER_API_KEY)                          return 'openrouter';
  if (process.env.GEMINI_API_KEY)                              return 'gemini';
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

// ── OpenAI-compatible helpers (covers TrueFoundry, Azure, etc.) ───────────────

async function openaiCall(systemPrompt, userContent, label) {
  const client = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey:  process.env.OPENAI_API_KEY,
  });
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  process.stdout.write(`[llmClient] ${label} using OpenAI-compatible endpoint (model: ${model})\n`);

  let response;
  try {
    response = await client.chat.completions.create({
      model,
      max_tokens: 4096,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent },
      ],
      response_format: { type: 'json_object' },
    });
  } catch (err) {
    process.stderr.write(`[llmClient] ${label} OpenAI-compatible error: ${err.message}\n`);
    throw err;
  }

  const rawText = response.choices?.[0]?.message?.content ?? '';
  try {
    return extractJson(rawText);
  } catch (_) {
    // Retry once with explicit JSON correction instruction
    process.stdout.write(`[llmClient] ${label} JSON parse failed — retrying with correction prompt\n`);
    let retryResponse;
    try {
      retryResponse = await client.chat.completions.create({
        model,
        max_tokens: 4096,
        temperature: 0,
        messages: [
          { role: 'system',    content: systemPrompt },
          { role: 'user',      content: userContent },
          { role: 'assistant', content: rawText },
          { role: 'user',      content: 'Your previous response was not valid JSON. Respond ONLY with the JSON object — no markdown, no prose, no explanation.' },
        ],
      });
    } catch (err) {
      process.stderr.write(`[llmClient] ${label} OpenAI-compatible retry error: ${err.message}\n`);
      throw err;
    }
    return extractJson(retryResponse.choices?.[0]?.message?.content ?? '');
  }
}

// ── OpenRouter helpers (TEMPORARY) ────────────────────────────────────────────

async function openRouterCall(systemPrompt, userContent, label) {
  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  process.stdout.write(`[llmClient] ${label} using OpenRouter (temporary — no Anthropic key)\n`);

  let response;
  try {
    response = await client.chat.completions.create({
      model: 'anthropic/claude-sonnet-4-5',
      max_tokens: 2500,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent },
      ],
      response_format: { type: 'json_object' },
    });
  } catch (err) {
    process.stderr.write(`[llmClient] ${label} OpenRouter error: ${err.message}\n`);
    throw err;
  }

  const rawText = response.choices?.[0]?.message?.content ?? '';
  return JSON.parse(rawText);
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
    `REMINDER: Respond with ONLY the JSON object. No questions, no prose, no explanation.`,
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

    if (provider === 'openai') {
      return await openaiCall(DESIGN_MIND_SYSTEM_PROMPT, userContent, 'callDesignMind');
    }

    if (provider === 'openrouter') {
      return await openRouterCall(DESIGN_MIND_SYSTEM_PROMPT, userContent, 'callDesignMind');
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

    if (provider === 'openai') {
      return await openaiCall(CRITIC_SYSTEM_PROMPT, userContent, 'callCritic');
    }

    if (provider === 'openrouter') {
      return await openRouterCall(CRITIC_SYSTEM_PROMPT, userContent, 'callCritic');
    }

    if (provider === 'gemini') {
      return await geminiCall(CRITIC_SYSTEM_PROMPT, userContent, 'callCritic');
    }
  } catch (err) {
    process.stderr.write(`[llmClient] callCritic failed: ${err.message}\n`);
    return makeFallback(`Critic API error: ${err.message}`);
  }
}
