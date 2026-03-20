/**
 * seed-vectors.js — Embed and store the Design Mind genome into the local vector store.
 *
 * No API keys, no Docker, no system installs required.
 * Model weights download automatically on first run (~90MB to ~/.cache/huggingface/)
 *
 * Usage:
 *   cd server && node src/seed-vectors.js
 *
 * Re-run whenever the knowledge base changes:
 *   - New pattern ratified
 *   - Rule updated or added
 *   - Ontology evolved
 *
 * What gets indexed:
 *   dm_patterns  — all pattern meta.yaml documents
 *   dm_rules     — all genome rule documents
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { loadKnowledge } from './knowledge.js'
import { embed } from './embedder.js'
import { recreateCollection, upsert } from './vectorstore.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const BASE_PATH = join(__dirname, '..', '..')

// ── Helpers ───────────────────────────────────────────────────────────────────

function stableId(str) {
  // djb2 hash → stable unsigned 32-bit int for use as point ID
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

function patternEmbedText(p) {
  return [
    `Pattern: ${p.id}`,
    p.summary || '',
    p.structural_family ? `Structural family: ${p.structural_family}` : '',
    p.component_type ? `Component type: ${p.component_type}` : '',
    `When to use: ${formatArr(p.when)}`,
    `Do not use when: ${formatArr(p.not_when)}`,
    p.because || '',
    p.embedding_hint || '',
  ].filter(Boolean).join('\n')
}

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
  process.stderr.write('[seed-vectors] Design Mind — Local Vector Seeder\n')
  process.stderr.write(`[seed-vectors] Knowledge base : ${BASE_PATH}\n`)
  process.stderr.write(`[seed-vectors] Model          : ${process.env.EMBED_MODEL || 'Xenova/all-MiniLM-L6-v2'}\n\n`)

  process.stderr.write('[seed-vectors] Loading knowledge base...\n')
  const kb = loadKnowledge(BASE_PATH)
  process.stderr.write(`[seed-vectors]   ${kb.patterns.length} patterns, ${kb.rules.length} rules\n\n`)

  // ── Patterns ───────────────────────────────────────────────────────────────

  process.stderr.write('[seed-vectors] ── Patterns (dm_patterns) ──────────────\n')
  recreateCollection('dm_patterns')

  const patternTexts = kb.patterns.map(patternEmbedText)
  process.stderr.write(`[seed-vectors] Embedding ${patternTexts.length} patterns...\n`)
  const patternVectors = await embed(patternTexts)

  upsert('dm_patterns', kb.patterns.map((p, i) => ({
    id: stableId('pattern:' + p.id),
    vector: patternVectors[i],
    payload: {
      id:                p.id,
      summary:           p.summary || '',
      when:              p.when || '',
      not_when:          p.not_when || '',
      because:           p.because || '',
      confidence:        p.confidence || 0.9,
      ontology_refs:     p.ontology_refs || {},
      component_type:    p.component_type || null,
      structural_family: p.structural_family || null,
      family_invariants: p.family_invariants || [],
    },
  })))

  for (const p of kb.patterns) process.stderr.write(`[seed-vectors]   ✓ ${p.id}\n`)

  // ── Rules ──────────────────────────────────────────────────────────────────

  process.stderr.write('\n[seed-vectors] ── Rules (dm_rules) ──────────────────\n')
  recreateCollection('dm_rules')

  const ruleTexts = kb.rules.map(ruleEmbedText)
  process.stderr.write(`[seed-vectors] Embedding ${ruleTexts.length} rules...\n`)
  const ruleVectors = await embed(ruleTexts)

  upsert('dm_rules', kb.rules.map((r, i) => ({
    id: stableId('rule:' + r.id),
    vector: ruleVectors[i],
    payload: {
      id:         r.id,
      applies_to: r.metadata?.applies_to || '',
      when:       r.metadata?.when || '',
      use:        r.metadata?.use || '',
      not:        r.metadata?.not || '',
      because:    r.metadata?.because || '',
      confidence: r.metadata?.confidence || 0.9,
    },
  })))

  for (const r of kb.rules) process.stderr.write(`[seed-vectors]   ✓ ${r.id}\n`)

  // ── Done ──────────────────────────────────────────────────────────────────

  process.stderr.write('\n[seed-vectors] ✓ Complete.\n')
  process.stderr.write(`[seed-vectors]   Patterns : ${kb.patterns.length}\n`)
  process.stderr.write(`[seed-vectors]   Rules    : ${kb.rules.length}\n`)
  process.stderr.write('\n[seed-vectors] Start the MCP server:\n')
  process.stderr.write('[seed-vectors]   node src/index.js\n\n')
}

main().catch(err => {
  process.stderr.write(`[seed-vectors] FATAL: ${err.message}\n${err.stack}\n`)
  process.exit(1)
})
