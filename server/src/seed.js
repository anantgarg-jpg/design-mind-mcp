/**
 * seed.js — Force rebuild of the Design Mind vector indexes.
 *
 * Run this whenever the knowledge base changes:
 *   - New pattern ratified
 *   - Rule updated or added
 *   - Ontology evolved
 *
 * Usage:
 *   node src/seed.js
 *
 * This deletes the existing .index/ folder and rebuilds from scratch.
 */

import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { loadKnowledge } from './knowledge.js';
import { buildKnowledgeIndexes, saveIndex } from './vectorIndex.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE_PATH = join(__dirname, '..', '..');
const INDEX_DIR = join(__dirname, '..', '.index');

process.stderr.write('[seed] Design Mind — Force Re-index\n');
process.stderr.write(`[seed] Knowledge base: ${BASE_PATH}\n`);
process.stderr.write(`[seed] Index directory: ${INDEX_DIR}\n\n`);

// Ensure index directory exists (overwrite files — delete not permitted on mounted volumes)
process.stderr.write('[seed] Clearing existing indexes (overwrite)...\n');
mkdirSync(INDEX_DIR, { recursive: true });

// Load knowledge
process.stderr.write('[seed] Loading knowledge base...\n');
const kb = loadKnowledge(BASE_PATH);

// Build indexes
process.stderr.write('\n[seed] Building TF-IDF indexes...\n');
const { patternIndex, ruleIndex } = buildKnowledgeIndexes(kb);

// Save
const patternIndexPath = join(INDEX_DIR, 'patterns.json');
const ruleIndexPath = join(INDEX_DIR, 'rules.json');

saveIndex(patternIndex, patternIndexPath);
process.stderr.write(`[seed] Saved pattern index: ${patternIndexPath}\n`);

saveIndex(ruleIndex, ruleIndexPath);
process.stderr.write(`[seed] Saved rule index: ${ruleIndexPath}\n`);

// Validation
process.stderr.write('\n[seed] ── Validation ─────────────────────────────\n');
process.stderr.write(`[seed] Patterns indexed: ${patternIndex.documents.length}\n`);
for (const doc of patternIndex.documents) {
  process.stderr.write(`[seed]   • ${doc.id} (${Object.keys(doc.vector).length} terms)\n`);
}
process.stderr.write(`\n[seed] Rules indexed: ${ruleIndex.documents.length}\n`);
for (const doc of ruleIndex.documents) {
  process.stderr.write(`[seed]   • ${doc.id} (${Object.keys(doc.vector).length} terms)\n`);
}
process.stderr.write(`\n[seed] Safety constraints loaded: ${kb.safety.constraints.length}\n`);
process.stderr.write('\n[seed] ✓ Re-index complete. Start the server with: node src/index.js\n');
