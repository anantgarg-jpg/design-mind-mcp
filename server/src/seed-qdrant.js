/**
 * seed-qdrant.js — Embed and upsert the full Design Mind genome into Qdrant.
 *
 * Prerequisites:
 *   # Qdrant (pick one)
 *   docker run -p 6333:6333 qdrant/qdrant
 *
 *   # Ollama
 *   ollama serve
 *   ollama pull nomic-embed-text
 *
 * Usage:
 *   node src/seed-qdrant.js
 *   OLLAMA_URL=http://localhost:11434 QDRANT_URL=http://localhost:6333 node src/seed-qdrant.js
 *
 * What gets indexed:
 *   dm_patterns  — all pattern meta.yaml documents
 *   dm_rules     — all genome rule documents
 *
 * Re-run whenever knowledge base changes (new pattern, updated rule, etc.)
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { loadKnowledge } from './knowledge.js'
import { embed, isConfigured as isOllamaUp } from './embedder.js'
import { recreateCollection, upsert, isReachable as isQdrantUp } from './vectorstore.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const BASE_PATH = join(__dirname, '..', '..')

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Stable unsigned 32-bit integer ID from a string (djb2 hash).
 * Qdrant requires numeric or UUID point IDs.
 */
function stableId(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash >>> 0
  }
  return hash || 1
}

function formatArr(val) {
  if (!val) return ''
  if (Array.isArray(val)) return val.join('. ')
  return String(val)
}

/**
 * Dense text passage for a pattern — combines all high-signal fields.
 */
function patternEmbedText(p) {
  return [
    `Pattern: ${p.id}`,
    p.metadata?.summary || '',
    `When to use: ${formatArr(p.metadata?.when)}`,
    `Do not use when: ${formatArr(p.metadata?.not_when)}`,
    p.metadata?.because || '',
    p.metadata?.embedding_hint || '',
  ].filter(Boolean).join('\n')
}

/**
 * Dense text passage for a rule.
 */
function ruleEmbedText(r) {
  const m = r.metadata || {}
  return [
    `Rule: ${r.id}`,
    `Applies to: ${m.applies_to || ''}`,
    `When: ${formatArr(m.when)}`,
    `Use: ${formatArr(m.use)}`,
    `Not: ${formatArr(m.not)}`,
    m.because || '',
  ].filter(Boolean).join('\n')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write('[seed-qdrant] Design Mind — Qdrant Seeder\n')
  process.stderr.write(`[seed-qdrant] Knowledge base : ${BASE_PATH}\n`)
  process.stderr.write(`[seed-qdrant] Ollama URL     : ${process.env.OLLAMA_URL || 'http://localhost:11434'}\n`)
  process.stderr.write(`[seed-qdrant] Qdrant URL     : ${process.env.QDRANT_URL || 'http://localhost:6333'}\n\n`)

  // ── Pre-flight checks ──────────────────────────────────────────────────────

  process.stderr.write('[seed-qdrant] Checking Ollama...\n')
  const ollamaOk = await isOllamaUp()
  if (!ollamaOk) {
    process.stderr.write('[seed-qdrant] ERROR: Ollama is not reachable.\n')
    process.stderr.write('[seed-qdrant]   Run: ollama serve\n')
    process.exit(1)
  }
  process.stderr.write('[seed-qdrant]   ✓ Ollama reachable\n')

  process.stderr.write('[seed-qdrant] Checking Qdrant...\n')
  const qdrantOk = await isQdrantUp()
  if (!qdrantOk) {
    process.stderr.write('[seed-qdrant] ERROR: Qdrant is not reachable.\n')
    process.stderr.write('[seed-qdrant]   Run: docker run -p 6333:6333 qdrant/qdrant\n')
    process.exit(1)
  }
  process.stderr.write('[seed-qdrant]   ✓ Qdrant reachable\n\n')

  // ── Load knowledge ─────────────────────────────────────────────────────────

  process.stderr.write('[seed-qdrant] Loading knowledge base...\n')
  const kb = loadKnowledge(BASE_PATH)
  process.stderr.write(`[seed-qdrant]   ${kb.patterns.length} patterns, ${kb.rules.length} rules loaded\n`)

  // ── Patterns (dm_patterns) ─────────────────────────────────────────────────

  process.stderr.write('\n[seed-qdrant] ── Patterns ────────────────────────────────\n')
  await recreateCollection('dm_patterns')
  process.stderr.write('[seed-qdrant]   Collection recreated\n')

  const patternTexts = kb.patterns.map(patternEmbedText)
  process.stderr.write(`[seed-qdrant]   Embedding ${patternTexts.length} documents (this takes ~${patternTexts.length * 2}s locally)...\n`)
  const patternVectors = await embed(patternTexts)

  const patternPoints = kb.patterns.map((p, i) => ({
    id: stableId('pattern:' + p.id),
    vector: patternVectors[i],
    payload: {
      id: p.id,
      summary: p.metadata?.summary || '',
      when: p.metadata?.when || '',
      not_when: p.metadata?.not_when || '',
      because: p.metadata?.because || '',
      confidence: p.metadata?.confidence || 0.9,
      ontology_refs: p.metadata?.ontology_refs || {},
      embedding_hint: p.metadata?.embedding_hint || '',
    },
  }))

  await upsert('dm_patterns', patternPoints)
  for (const p of kb.patterns) process.stderr.write(`[seed-qdrant]   ✓ ${p.id}\n`)

  // ── Rules (dm_rules) ──────────────────────────────────────────────────────

  process.stderr.write('\n[seed-qdrant] ── Rules ──────────────────────────────────\n')
  await recreateCollection('dm_rules')
  process.stderr.write('[seed-qdrant]   Collection recreated\n')

  const ruleTexts = kb.rules.map(ruleEmbedText)
  process.stderr.write(`[seed-qdrant]   Embedding ${ruleTexts.length} documents...\n`)
  const ruleVectors = await embed(ruleTexts)

  const rulePoints = kb.rules.map((r, i) => ({
    id: stableId('rule:' + r.id),
    vector: ruleVectors[i],
    payload: {
      id: r.id,
      applies_to: r.metadata?.applies_to || '',
      when: r.metadata?.when || '',
      use: r.metadata?.use || '',
      not: r.metadata?.not || '',
      because: r.metadata?.because || '',
      confidence: r.metadata?.confidence || 0.9,
    },
  }))

  await upsert('dm_rules', rulePoints)
  for (const r of kb.rules) process.stderr.write(`[seed-qdrant]   ✓ ${r.id}\n`)

  // ── Done ──────────────────────────────────────────────────────────────────

  process.stderr.write('\n[seed-qdrant] ✓ Seeding complete.\n')
  process.stderr.write(`[seed-qdrant]   Patterns : ${kb.patterns.length}\n`)
  process.stderr.write(`[seed-qdrant]   Rules    : ${kb.rules.length}\n`)
  process.stderr.write('\n[seed-qdrant] Start the MCP server:\n')
  process.stderr.write('[seed-qdrant]   node src/index.js\n')
  process.stderr.write('[seed-qdrant]   (server auto-detects Qdrant and uses it over TF-IDF)\n\n')
}

main().catch(err => {
  process.stderr.write(`[seed-qdrant] FATAL: ${err.message}\n${err.stack}\n`)
  process.exit(1)
})
