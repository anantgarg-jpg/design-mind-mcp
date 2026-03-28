/**
 * LLM client for Design Mind MCP
 *
 * Two modes:
 *
 * 1. Gateway mode (recommended for production)
 *    Set OPENAI_BASE_URL + OPENAI_API_KEY.
 *    The gateway (e.g. TrueFoundry) serves all models through one OpenAI-compatible
 *    endpoint. Models are tried in priority order:
 *      ANTHROPIC_MODEL → OPENAI_MODEL → GEMINI_MODEL
 *    Defaults: claude-sonnet-4-5 → gpt-4o → gemini-2.0-flash
 *
 * 2. Direct provider mode (local / CI)
 *    Set ANTHROPIC_API_KEY, OPENAI_API_KEY (no BASE_URL), or GEMINI_API_KEY.
 *    Priority: Anthropic → OpenAI → Gemini
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

// Load .env from repo root if present — env vars take priority over file values
try {
  const envLines = readFileSync(join(repoRoot, '.env'), 'utf8').split('\n');
  for (const raw of envLines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch (_) { /* .env absent — fine */ }

const DESIGN_MIND_SYSTEM_PROMPT = readFileSync(
  join(repoRoot, 'agents', 'mind', 'system-prompt.md'),
  'utf8'
);

const CRITIC_SYSTEM_PROMPT = readFileSync(
  join(repoRoot, 'agents', 'critic', 'system-prompt.md'),
  'utf8'
);

function makeFallback(gap) {
  return {
    surface: { matched: false, confidence: 0, surface_id: null, import_instruction: null },
    layout: { source: 'generated', regions: [] },
    workflows: [],
    rules_applied: [],
    safety_applied: [],
    ontology_refs: [],
    confidence: 0,
    gaps: [gap],
  };
}

function extractJson(text) {
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try { return JSON.parse(stripped); } catch (_) {}
  const start = stripped.indexOf('{');
  const end   = stripped.lastIndexOf('}');
  if (start !== -1 && end > start) return JSON.parse(stripped.slice(start, end + 1));
  throw new SyntaxError(`No JSON object found in response: ${stripped.slice(0, 120)}`);
}

// ── Gateway mode ──────────────────────────────────────────────────────────────
// Single OpenAI-compatible endpoint (TrueFoundry etc.) serving multiple models.
// Models tried in priority order until one succeeds.

function isGatewayMode() {
  return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_BASE_URL);
}

function gatewayModelPriority() {
  const models = [];
  if (process.env.ANTHROPIC_MODEL) models.push(process.env.ANTHROPIC_MODEL);
  else                              models.push('claude-sonnet-4-5');
  if (process.env.OPENAI_MODEL)    models.push(process.env.OPENAI_MODEL);
  else                              models.push('gpt-4o');
  if (process.env.GEMINI_MODEL)    models.push(process.env.GEMINI_MODEL);
  // deduplicate while preserving order
  return [...new Set(models)];
}

async function gatewayCall(systemPrompt, userContent, label) {
  const client = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey:  process.env.OPENAI_API_KEY,
  });

  const models = gatewayModelPriority();
  let lastErr;

  for (const model of models) {
    process.stdout.write(`[llmClient] ${label} trying gateway model: ${model}\n`);
    try {
      const response = await client.chat.completions.create({
        model,
        max_tokens: 4096,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userContent },
        ],
        response_format: { type: 'json_object' },
      });

      const rawText = response.choices?.[0]?.message?.content ?? '';
      try {
        return extractJson(rawText);
      } catch (_) {
        // JSON parse failed — retry once with correction prompt
        process.stdout.write(`[llmClient] ${label} JSON parse failed on ${model} — retrying\n`);
        const retry = await client.chat.completions.create({
          model,
          max_tokens: 4096,
          temperature: 0,
          messages: [
            { role: 'system',    content: systemPrompt },
            { role: 'user',      content: userContent },
            { role: 'assistant', content: rawText },
            { role: 'user',      content: 'Your previous response was not valid JSON. Respond ONLY with the JSON object — no markdown, no prose.' },
          ],
        });
        return extractJson(retry.choices?.[0]?.message?.content ?? '');
      }
    } catch (err) {
      process.stderr.write(`[llmClient] ${label} model ${model} failed: ${err.message}\n`);
      lastErr = err;
      // continue to next model in priority list
    }
  }

  throw lastErr ?? new Error('All gateway models failed');
}

// ── Direct provider mode ──────────────────────────────────────────────────────

function getDirectProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY)    return 'openai';
  if (process.env.GEMINI_API_KEY)    return 'gemini';
  return null;
}

async function anthropicCall(systemPrompt, userContent, label, messages) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: { 'anthropic-beta': 'extended-cache-ttl-2025-04-11' },
  });
  const model = 'claude-sonnet-4-6';
  process.stdout.write(`[llmClient] ${label} using Anthropic direct (${model})\n`);

  const makeParams = (msgs) => ({ model, max_tokens: 4096, system: systemPrompt, messages: msgs });
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
    const retryResponse = await client.messages.create(makeParams([
      ...messages,
      { role: 'assistant', content: rawText },
      { role: 'user', content: 'Your previous response was not valid JSON. Respond ONLY with the JSON object, no markdown, no explanation.' },
    ]));
    return JSON.parse(retryResponse.content?.[0]?.text ?? '');
  }
}

async function openaiDirectCall(systemPrompt, userContent, label) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  process.stdout.write(`[llmClient] ${label} using OpenAI direct (${model})\n`);

  const response = await client.chat.completions.create({
    model, max_tokens: 4096, temperature: 0,
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
    response_format: { type: 'json_object' },
  });
  return extractJson(response.choices?.[0]?.message?.content ?? '');
}

async function geminiDirectCall(systemPrompt, userContent, label) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
    systemInstruction: systemPrompt,
  });
  process.stdout.write(`[llmClient] ${label} using Gemini direct\n`);
  const result = await model.generateContent(userContent);
  return JSON.parse(result.response.text());
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function callDesignMind({ genomeContext, intent, domain, userType, workflows }) {
  const dynamicParts = [
    `Intent: ${intent}`,
    `Domain: ${domain || 'unspecified'}`,
    `User types: ${(userType || []).join(', ') || 'unspecified'}`,
  ];
  if (workflows?.length > 0) dynamicParts.push(`Workflows:\n${JSON.stringify(workflows, null, 2)}`);
  dynamicParts.push('REMINDER: Respond with ONLY the JSON object. No questions, no prose, no explanation.');

  const userContent = [genomeContext, ...dynamicParts].join('\n\n');

  try {
    if (isGatewayMode()) {
      return await gatewayCall(DESIGN_MIND_SYSTEM_PROMPT, userContent, 'callDesignMind');
    }

    const provider = getDirectProvider();
    if (!provider) {
      process.stderr.write('[llmClient] WARNING: No API key configured — returning retrieval-only fallback\n');
      return makeFallback('LLM not configured — returning retrieval-only results');
    }

    if (provider === 'anthropic') {
      const messages = [{ role: 'user', content: [
        { type: 'text', text: genomeContext, cache_control: { type: 'extended' } },
        { type: 'text', text: dynamicParts.join('\n') },
      ]}];
      return await anthropicCall(DESIGN_MIND_SYSTEM_PROMPT, userContent, 'callDesignMind', messages);
    }
    if (provider === 'openai')  return await openaiDirectCall(DESIGN_MIND_SYSTEM_PROMPT, userContent, 'callDesignMind');
    if (provider === 'gemini')  return await geminiDirectCall(DESIGN_MIND_SYSTEM_PROMPT, userContent, 'callDesignMind');
  } catch (err) {
    process.stderr.write(`[llmClient] callDesignMind failed: ${err.message}\n`);
    return makeFallback(`Design Mind API error: ${err.message}`);
  }
}

export async function callCritic({ generatedCode, originalIntent, genomeContext, autoCheckResults, contextUsed }) {
  const reviewPayload = {
    generated_code: generatedCode,
    original_intent: originalIntent,
    auto_check_results: autoCheckResults,
    ...(contextUsed ? { consultation_context: contextUsed } : {}),
  };
  const userContent = [genomeContext, JSON.stringify(reviewPayload)].join('\n\n');

  try {
    if (isGatewayMode()) {
      return await gatewayCall(CRITIC_SYSTEM_PROMPT, userContent, 'callCritic');
    }

    const provider = getDirectProvider();
    if (!provider) {
      process.stderr.write('[llmClient] WARNING: No API key configured — returning retrieval-only fallback\n');
      return makeFallback('LLM not configured — returning retrieval-only results');
    }

    if (provider === 'anthropic') {
      const messages = [{ role: 'user', content: [
        { type: 'text', text: genomeContext, cache_control: { type: 'extended' } },
        { type: 'text', text: JSON.stringify(reviewPayload) },
      ]}];
      return await anthropicCall(CRITIC_SYSTEM_PROMPT, userContent, 'callCritic', messages);
    }
    if (provider === 'openai')  return await openaiDirectCall(CRITIC_SYSTEM_PROMPT, userContent, 'callCritic');
    if (provider === 'gemini')  return await geminiDirectCall(CRITIC_SYSTEM_PROMPT, userContent, 'callCritic');
  } catch (err) {
    process.stderr.write(`[llmClient] callCritic failed: ${err.message}\n`);
    return makeFallback(`Critic API error: ${err.message}`);
  }
}
