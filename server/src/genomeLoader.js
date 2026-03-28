/**
 * genomeLoader.js
 * Loads the entire Design Mind genome into a structured, cached object.
 * Provides serialization helpers for LLM context.
 *
 * Uses the same Python PyYAML spawnSync approach as knowledge.js.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// ── Paths ─────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
// server/src/ → up two levels → repo root
const BASE_PATH  = join(__dirname, '..', '..');

// ── YAML parser (same pattern as knowledge.js) ────────────────────────────────

function parseYaml(content) {
  const result = spawnSync('python3', ['-c', `
import yaml, json, sys
content = sys.stdin.read()
data = yaml.safe_load(content)
print(json.dumps(data, default=str))
`], { input: content, encoding: 'utf-8', timeout: 8000 });

  if (result.status !== 0) {
    throw new Error(`YAML parse error: ${result.stderr?.trim()}`);
  }
  if (!result.stdout?.trim()) {
    return {};
  }
  return JSON.parse(result.stdout);
}

// ── Module-level cache ────────────────────────────────────────────────────────

let _genome = null;

// ── loadGenome ────────────────────────────────────────────────────────────────

/**
 * Reads the entire genome from disk into a structured object, cached in
 * module-level `_genome`. Subsequent calls return the cached value.
 *
 * @returns {{
 *   blocks: Map<string, { meta: object }>,
 *   surfaces: Map<string, object>,
 *   rules: Map<string, { fullContent: string }>,
 *   safety: string,
 *   ontology: Map<string, object>,
 *   taste: string,
 *   principles: string,
 *   severitySchema: object,
 * }}
 */
export function loadGenome() {
  if (_genome) return _genome;

  const genome = {
    blocks:         new Map(),
    surfaces:       new Map(),
    rules:          new Map(),
    safety:         '',
    ontology:       new Map(),
    taste:          '',
    principles:     '',
    severitySchema: null,
  };

  // ── Blocks ──────────────────────────────────────────────────────────────────
  const blocksDir = join(BASE_PATH, 'blocks');
  if (existsSync(blocksDir)) {
    for (const blockName of readdirSync(blocksDir)) {
      if (blockName.startsWith('_')) continue; // skip _candidates etc.

      const metaPath = join(blocksDir, blockName, 'meta.yaml');
      if (!existsSync(metaPath)) continue;

      try {
        const metaContent = readFileSync(metaPath, 'utf-8');
        const meta        = parseYaml(metaContent);

        // Skip deprecated blocks
        if (meta.status === 'deprecated') continue;

        // Store the raw YAML string alongside parsed meta for serialization
        meta._metaRaw     = metaContent;
        meta._patternName = blockName;

        const blockId = meta.id || blockName;
        genome.blocks.set(blockId, { meta });
      } catch (e) {
        process.stderr.write(`[genome] WARN: could not parse ${blockName}/meta.yaml: ${e.message}\n`);
      }
    }
  }

  // ── Surfaces ─────────────────────────────────────────────────────────────────
  const surfacesDir = join(BASE_PATH, 'surfaces');
  if (existsSync(surfacesDir)) {
    for (const file of readdirSync(surfacesDir)) {
      if (!file.endsWith('.surface.yaml')) continue;
      try {
        const content = readFileSync(join(surfacesDir, file), 'utf-8');
        const parsed  = parseYaml(content);
        // Stash raw for serialization
        parsed._raw = content;
        const surfaceId = parsed.id || file.replace('.surface.yaml', '');
        genome.surfaces.set(surfaceId, parsed);
      } catch (e) {
        process.stderr.write(`[genome] WARN: could not parse surfaces/${file}: ${e.message}\n`);
      }
    }
  }

  // ── Rules ────────────────────────────────────────────────────────────────────
  const rulesDir = join(BASE_PATH, 'genome', 'rules');
  if (existsSync(rulesDir)) {
    for (const file of readdirSync(rulesDir)) {
      if (!file.endsWith('.rule.md')) continue;
      try {
        const fullContent = readFileSync(join(rulesDir, file), 'utf-8');
        const ruleId      = file.replace('.rule.md', '');
        genome.rules.set(ruleId, { fullContent });
      } catch (e) {
        process.stderr.write(`[genome] WARN: could not read rules/${file}: ${e.message}\n`);
      }
    }
  }

  // ── Safety ───────────────────────────────────────────────────────────────────
  const hardConstraintsPath = join(BASE_PATH, 'safety', 'hard-constraints.md');
  if (existsSync(hardConstraintsPath)) {
    try {
      genome.safety = readFileSync(hardConstraintsPath, 'utf-8');
    } catch (e) {
      process.stderr.write(`[genome] WARN: could not read hard-constraints.md: ${e.message}\n`);
    }
  }

  // ── Severity schema ──────────────────────────────────────────────────────────
  const severitySchemaPath = join(BASE_PATH, 'safety', 'severity-schema.yaml');
  if (existsSync(severitySchemaPath)) {
    try {
      genome.severitySchema = parseYaml(readFileSync(severitySchemaPath, 'utf-8'));
    } catch (e) {
      process.stderr.write(`[genome] WARN: could not parse severity-schema.yaml: ${e.message}\n`);
    }
  }

  // ── Ontology ─────────────────────────────────────────────────────────────────
  const ontologyDir = join(BASE_PATH, 'ontology');
  if (existsSync(ontologyDir)) {
    for (const file of readdirSync(ontologyDir)) {
      const concept  = file.replace(/\.(yaml|md)$/, '');
      const filePath = join(ontologyDir, file);
      try {
        if (file.endsWith('.yaml')) {
          const raw    = readFileSync(filePath, 'utf-8');
          const parsed = parseYaml(raw);
          parsed._raw  = raw;
          genome.ontology.set(concept, parsed);
        } else if (file.endsWith('.md')) {
          // Store markdown as an object with fullContent for uniform handling
          genome.ontology.set(concept, { fullContent: readFileSync(filePath, 'utf-8') });
        }
      } catch (e) {
        process.stderr.write(`[genome] WARN: could not parse ontology/${file}: ${e.message}\n`);
      }
    }
  }

  // ── Taste ────────────────────────────────────────────────────────────────────
  const tastePath = join(BASE_PATH, 'genome', 'taste.md');
  if (existsSync(tastePath)) {
    try {
      genome.taste = readFileSync(tastePath, 'utf-8');
    } catch (e) {
      process.stderr.write(`[genome] WARN: could not read taste.md: ${e.message}\n`);
    }
  }

  // ── Principles ───────────────────────────────────────────────────────────────
  const principlesPath = join(BASE_PATH, 'genome', 'principles.md');
  if (existsSync(principlesPath)) {
    try {
      genome.principles = readFileSync(principlesPath, 'utf-8');
    } catch (e) {
      process.stderr.write(`[genome] WARN: could not read principles.md: ${e.message}\n`);
    }
  }

  console.log(
    `[genome] Loaded: ${genome.blocks.size} blocks, ${genome.surfaces.size} surfaces, ${genome.rules.size} rules`
  );

  _genome = genome;
  return _genome;
}

// ── refreshGenome ─────────────────────────────────────────────────────────────

/**
 * Clears the module-level cache and reloads the genome from disk.
 * @returns {object} The freshly loaded genome.
 */
export function refreshGenome() {
  _genome = null;
  return loadGenome();
}

// ── getGenomeForLLM ───────────────────────────────────────────────────────────

/**
 * Serializes the entire genome into a single string suitable for LLM context.
 * Targets ~25-30K tokens. All sections included.
 *
 * @returns {string}
 */
export function getGenomeForLLM() {
  const g = loadGenome();
  const parts = [];

  // ── BLOCKS ──────────────────────────────────────────────────────────────────
  parts.push('===== BLOCKS =====');
  for (const [blockId, { meta }] of g.blocks) {
    parts.push(`\n--- ${blockId} ---`);
    parts.push(meta._metaRaw || JSON.stringify(meta, null, 2));
  }

  // ── SURFACES ─────────────────────────────────────────────────────────────────
  parts.push('\n\n===== SURFACES =====');
  for (const [surfaceId, surface] of g.surfaces) {
    parts.push(`\n--- ${surfaceId} ---`);
    parts.push(surface._raw || JSON.stringify(surface, null, 2));
  }

  // ── RULES ────────────────────────────────────────────────────────────────────
  parts.push('\n\n===== RULES =====');
  for (const [ruleId, { fullContent }] of g.rules) {
    parts.push(`\n--- ${ruleId} ---`);
    parts.push(fullContent);
  }

  // ── SAFETY CONSTRAINTS ────────────────────────────────────────────────────────
  parts.push('\n\n===== SAFETY CONSTRAINTS =====');
  parts.push(g.safety);

  // ── ONTOLOGY ─────────────────────────────────────────────────────────────────
  parts.push('\n\n===== ONTOLOGY =====');
  for (const [concept, value] of g.ontology) {
    parts.push(`\n--- ${concept} ---`);
    if (typeof value.fullContent === 'string') {
      parts.push(value.fullContent);
    } else {
      parts.push(value._raw || JSON.stringify(value, null, 2));
    }
  }

  // ── TASTE ────────────────────────────────────────────────────────────────────
  parts.push('\n\n===== TASTE =====');
  parts.push(g.taste);

  // ── PRINCIPLES ───────────────────────────────────────────────────────────────
  parts.push('\n\n===== PRINCIPLES =====');
  parts.push(g.principles);

  return parts.join('\n');
}

