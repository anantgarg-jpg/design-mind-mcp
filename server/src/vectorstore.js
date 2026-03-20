/**
 * vectorstore.js — Flat-file vector store with cosine similarity
 *
 * Zero external dependencies. Stores embeddings as JSON files in server/.vectors/
 * Brute-force cosine similarity — fast enough for < 1000 documents.
 *
 * Collections:
 *   dm_patterns  — pattern meta.yaml documents
 *   dm_rules     — rule documents
 *
 * File layout:
 *   server/.vectors/dm_patterns.json
 *   server/.vectors/dm_rules.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const VECTORS_DIR = join(__dirname, '..', '.vectors')

// In-memory cache — loaded once per server process
const _cache = {}

// ── Helpers ───────────────────────────────────────────────────────────────────

function collectionPath(name) {
  return join(VECTORS_DIR, `${name}.json`)
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na  += a[i] * a[i]
    nb  += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create the collection store if it doesn't exist.
 * @param {string} name
 */
export function ensureCollection(name) {
  mkdirSync(VECTORS_DIR, { recursive: true })
  const path = collectionPath(name)
  if (!existsSync(path)) {
    writeFileSync(path, JSON.stringify({ points: [] }), 'utf-8')
  }
}

/**
 * Wipe and recreate a collection (used during full re-seed).
 * @param {string} name
 */
export function recreateCollection(name) {
  mkdirSync(VECTORS_DIR, { recursive: true })
  writeFileSync(collectionPath(name), JSON.stringify({ points: [] }), 'utf-8')
  delete _cache[name]
}

/**
 * Upsert a batch of points.
 * @param {string} name
 * @param {{ id: number|string, vector: number[], payload: object }[]} points
 */
export function upsert(name, points) {
  ensureCollection(name)
  const path = collectionPath(name)
  const store = JSON.parse(readFileSync(path, 'utf-8'))

  // Overwrite existing IDs, append new ones
  const byId = Object.fromEntries(store.points.map(p => [p.id, p]))
  for (const point of points) byId[point.id] = point
  store.points = Object.values(byId)

  writeFileSync(path, JSON.stringify(store), 'utf-8')
  _cache[name] = store.points  // update in-memory cache
}

/**
 * Cosine similarity search.
 * @param {string} name
 * @param {number[]} vector
 * @param {number} topK
 * @returns {{ id: number|string, score: number, payload: object }[]}
 */
export function search(name, vector, topK = 4) {
  if (!_cache[name]) {
    const path = collectionPath(name)
    if (!existsSync(path)) return []
    _cache[name] = JSON.parse(readFileSync(path, 'utf-8')).points
  }

  const points = _cache[name]
  if (!points.length) return []

  return points
    .map(p => ({ id: p.id, score: cosine(vector, p.vector), payload: p.payload }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

/**
 * Always available — purely local file I/O.
 */
export async function checkAvailability() {
  return { available: true }
}

/**
 * Returns true if a collection has been seeded (file exists and has points).
 * @param {string} name
 */
export function isSeeded(name) {
  const path = collectionPath(name)
  if (!existsSync(path)) return false
  try {
    const store = JSON.parse(readFileSync(path, 'utf-8'))
    return store.points.length > 0
  } catch {
    return false
  }
}
