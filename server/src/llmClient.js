import Anthropic from '@anthropic-ai/sdk';
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

function makeClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function parseWithRetry(client, model, systemPrompt, messages, label) {
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
    process.stderr.write(`[llmClient] ${label} API error: ${err.message}\n`);
    throw err;
  }

  const rawText = response.content?.[0]?.text ?? '';

  // First parse attempt
  try {
    return JSON.parse(rawText);
  } catch (_) {
    // Retry once with an explicit JSON-only instruction
    const retryMessages = [
      ...messages,
      { role: 'assistant', content: rawText },
      {
        role: 'user',
        content:
          'Your previous response was not valid JSON. Respond ONLY with the JSON object, no markdown, no explanation.',
      },
    ];

    let retryResponse;
    try {
      retryResponse = await client.messages.create(makeParams(retryMessages));
    } catch (err) {
      process.stderr.write(`[llmClient] ${label} retry API error: ${err.message}\n`);
      throw err;
    }

    const retryText = retryResponse.content?.[0]?.text ?? '';
    return JSON.parse(retryText); // Let this throw if still invalid
  }
}

/**
 * Call the Design Mind agent.
 *
 * @param {{ genomeContext: string, intent: string, scope: string, domain?: string, userType?: string[] }} params
 * @returns {Promise<object>} Parsed JSON response from the model
 */
export async function callDesignMind({ genomeContext, intent, scope, domain, userType }) {
  const client = makeClient();
  if (!client) {
    process.stderr.write(
      '[llmClient] WARNING: ANTHROPIC_API_KEY not set — returning retrieval-only fallback\n'
    );
    return makeFallback('LLM not configured — returning retrieval-only results');
  }

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: genomeContext,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: [
            `Intent: ${intent}`,
            `Scope: ${scope}`,
            `Domain: ${domain || 'unspecified'}`,
            `User types: ${(userType || []).join(', ') || 'unspecified'}`,
          ].join('\n'),
        },
      ],
    },
  ];

  try {
    return await parseWithRetry(client, 'claude-sonnet-4-5', DESIGN_MIND_SYSTEM_PROMPT, messages, 'callDesignMind');
  } catch (err) {
    process.stderr.write(`[llmClient] callDesignMind failed: ${err.message}\n`);
    return makeFallback(`Design Mind API error: ${err.message}`);
  }
}

/**
 * Call the Critic agent.
 *
 * @param {{ generatedCode: string, originalIntent: string, genomeContext: string, autoCheckResults: unknown }} params
 * @returns {Promise<object>} Parsed JSON response from the model
 */
export async function callCritic({ generatedCode, originalIntent, genomeContext, autoCheckResults }) {
  const client = makeClient();
  if (!client) {
    process.stderr.write(
      '[llmClient] WARNING: ANTHROPIC_API_KEY not set — returning retrieval-only fallback\n'
    );
    return makeFallback('LLM not configured — returning retrieval-only results');
  }

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: genomeContext,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: JSON.stringify({
            generated_code: generatedCode,
            original_intent: originalIntent,
            auto_check_results: autoCheckResults,
          }),
        },
      ],
    },
  ];

  try {
    return await parseWithRetry(client, 'claude-sonnet-4-5', CRITIC_SYSTEM_PROMPT, messages, 'callCritic');
  } catch (err) {
    process.stderr.write(`[llmClient] callCritic failed: ${err.message}\n`);
    return makeFallback(`Critic API error: ${err.message}`);
  }
}
