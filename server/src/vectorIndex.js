/**
 * vectorIndex.js
 * TF-IDF based semantic search — zero external dependencies.
 * Works well for this corpus size (10 patterns + 5 rules).
 *
 * Architecture:
 *   buildIndex(documents)  → Index object (in-memory)
 *   query(index, text, k)  → top-K ranked results with scores
 *   saveIndex(index, path) → persist to JSON
 *   loadIndex(path)        → restore from JSON
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// ── Stopwords — common English words that add noise ──────────────────────────

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'is', 'it', 'be', 'as', 'at', 'so', 'by', 'if', 'do',
  'not', 'you', 'all', 'any', 'can', 'are', 'was', 'has', 'had', 'have',
  'from', 'that', 'this', 'they', 'them', 'their', 'there', 'then', 'when',
  'what', 'which', 'who', 'how', 'its', 'been', 'will', 'would', 'could',
  'use', 'used', 'using', 'only', 'than', 'each', 'also', 'into', 'more',
  'some', 'may', 'should', 'always', 'never', 'one', 'two', 'three', 'new',
  'get', 'set', 'via', 'per', 'vs', 'e.g', 'i.e', 'etc',
]);

// ── Tokenizer ─────────────────────────────────────────────────────────────────

function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')   // keep hyphens (care-gap, etc.)
    .replace(/-/g, ' ')           // then split hyphens too
    .split(/\s+/)
    .filter(t => t.length >= 3 && !STOPWORDS.has(t));
}

// ── TF (term frequency) ───────────────────────────────────────────────────────

function computeTf(tokens) {
  if (tokens.length === 0) return {};
  const counts = {};
  for (const token of tokens) {
    counts[token] = (counts[token] || 0) + 1;
  }
  const total = tokens.length;
  const tf = {};
  for (const [token, count] of Object.entries(counts)) {
    tf[token] = count / total;
  }
  return tf;
}

// ── IDF (inverse document frequency) ─────────────────────────────────────────

function computeIdf(allTokenSets) {
  const N = allTokenSets.length;
  const docFreq = {};

  for (const tokens of allTokenSets) {
    const unique = new Set(tokens);
    for (const token of unique) {
      docFreq[token] = (docFreq[token] || 0) + 1;
    }
  }

  const idf = {};
  for (const [token, df] of Object.entries(docFreq)) {
    // Smoothed IDF: log((N+1)/(df+1)) + 1
    idf[token] = Math.log((N + 1) / (df + 1)) + 1;
  }
  return idf;
}

// ── TF-IDF vector ─────────────────────────────────────────────────────────────

function computeTfIdfVector(tokens, idf) {
  const tf = computeTf(tokens);
  const vector = {};
  for (const [token, tfVal] of Object.entries(tf)) {
    if (idf[token]) {
      vector[token] = tfVal * idf[token];
    }
  }
  return vector;
}

// ── Cosine similarity ─────────────────────────────────────────────────────────

function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;

  for (const [t, v] of Object.entries(vecA)) {
    normA += v * v;
    if (vecB[t]) dot += v * vecB[t];
  }
  for (const v of Object.values(vecB)) {
    normB += v * v;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build a TF-IDF index from an array of documents.
 *
 * @param {Array<{id: string, text: string, metadata: object}>} documents
 * @returns {Index} In-memory index ready for querying.
 */
export function buildIndex(documents) {
  // Tokenize all documents
  const processed = documents.map(doc => ({
    id: doc.id,
    text: doc.text,
    metadata: doc.metadata,
    tokens: tokenize(doc.text),
  }));

  // Build IDF across the whole corpus
  const idf = computeIdf(processed.map(d => d.tokens));

  // Compute TF-IDF vectors
  const indexed = processed.map(doc => ({
    id: doc.id,
    text: doc.text,
    metadata: doc.metadata,
    vector: computeTfIdfVector(doc.tokens, idf),
  }));

  return { documents: indexed, idf, builtAt: new Date().toISOString() };
}

/**
 * Query an index for the most relevant documents.
 *
 * @param {Index} index
 * @param {string} queryText
 * @param {number} topK
 * @returns {Array<{id, score, metadata, text}>}
 */
export function query(index, queryText, topK = 5) {
  const qTokens = tokenize(queryText);
  const qVector = computeTfIdfVector(qTokens, index.idf);

  const scored = index.documents.map(doc => ({
    id: doc.id,
    score: cosineSimilarity(qVector, doc.vector),
    metadata: doc.metadata,
    text: doc.text,
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(d => d.score > 0);
}

/**
 * Persist an index to a JSON file.
 */
export function saveIndex(index, filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * Load a previously saved index.
 */
export function loadIndex(filePath) {
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Build two indexes (patterns + rules) from the knowledge base.
 * Returns { patternIndex, ruleIndex }.
 */
export function buildKnowledgeIndexes(kb) {
  process.stdout.write('[vectorIndex] Building pattern index...\n');
  const patternDocs = kb.patterns.map(p => ({
    id: p.id || p._patternName,
    text: p.embedding_input || '',
    metadata: {
      id: p.id || p._patternName,
      summary: p.summary || '',
      when: p.when || [],
      not_when: p.not_when || [],
      because: p.because || '',
      embedding_hint: p.embedding_hint || '',
      confidence: p.confidence || 0.9,
      ontology_refs: p.ontology_refs || {},
      critical_rules: p.critical_rules || [],
      safety_refs: p.safety_refs || [],
      component_type: p.component_type || null,
      structural_family: p.structural_family || null,
      family_invariants: p.family_invariants || [],
    },
  }));
  const patternIndex = buildIndex(patternDocs);

  process.stdout.write('[vectorIndex] Building rule index...\n');
  const ruleDocs = kb.rules.map(r => ({
    id: r.id,
    text: r.embedding_input || '',
    metadata: {
      id: r.id,
      applies_to: r.applies_to || '',
      when: r.when || '',
      use: r.use || '',
      not: r.not || '',
      because: r.because || '',
      confidence: r.confidence || 0.9,
    },
  }));
  const ruleIndex = buildIndex(ruleDocs);

  process.stdout.write(`[vectorIndex] Indexes built: ${patternDocs.length} patterns, ${ruleDocs.length} rules\n`);
  return { patternIndex, ruleIndex };
}
