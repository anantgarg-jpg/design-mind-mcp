/**
 * knowledge.js
 * Loads and parses the entire Design Mind knowledge base into memory.
 * Uses Python's PyYAML (available in the environment) for YAML parsing.
 * No external npm dependencies required.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// ── YAML parser via Python's PyYAML ──────────────────────────────────────────

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

// ── Markdown rule file parser ────────────────────────────────────────────────
// Extracts structured fields from the RULE: / APPLIES_TO: / WHEN: / BECAUSE: blocks

function parseRuleMd(content, filename) {
  const rule = {
    id: filename.replace('.rule.md', ''),
    raw: content,
    when: '',
    use: '',
    not: '',
    because: '',
    applies_to: '',
    confidence: 0.9,
    version: '1.0.0',
  };

  const lines = content.split('\n');
  let currentSection = null;
  const sectionBuffers = { when: [], use: [], not: [], because: [] };

  for (const line of lines) {
    // Extract metadata from top-level directives
    const ruleMatch = line.match(/^RULE:\s*(.+)/);
    const versionMatch = line.match(/^VERSION:\s*(.+)/);
    const confidenceMatch = line.match(/^CONFIDENCE:\s*(.+)/);
    const appliesMatch = line.match(/^APPLIES_TO:\s*(.+)/);

    if (ruleMatch) { rule.id = ruleMatch[1].trim(); continue; }
    if (versionMatch) { rule.version = versionMatch[1].trim(); continue; }
    if (confidenceMatch) { rule.confidence = parseFloat(confidenceMatch[1]); continue; }
    if (appliesMatch) { rule.applies_to = appliesMatch[1].trim(); continue; }

    // Section headers — look for WHEN, USE, NOT, BECAUSE at start of line
    if (/^WHEN(\s|—|:)/.test(line)) { currentSection = 'when'; continue; }
    if (/^USE:/.test(line)) { currentSection = 'use'; continue; }
    if (/^NOT:/.test(line)) { currentSection = 'not'; continue; }
    if (/^BECAUSE:/.test(line)) { currentSection = 'because'; continue; }
    if (/^EXCEPTIONS:|^BULK_THRESHOLD:/.test(line)) { currentSection = null; continue; }

    // Skip comment lines and horizontal rules
    if (line.startsWith('#') || line.startsWith('---')) {
      currentSection = null;
      continue;
    }

    if (currentSection && sectionBuffers[currentSection] !== undefined) {
      const trimmed = line.trim();
      if (trimmed) {
        sectionBuffers[currentSection].push(trimmed.replace(/^[-*]\s*/, ''));
      }
    }
  }

  rule.when = sectionBuffers.when.join(' ').trim();
  rule.use = sectionBuffers.use.join(' ').trim();
  rule.not = sectionBuffers.not.join(' ').trim();
  rule.because = sectionBuffers.because.join(' ').trim();

  // Embedding input: concatenate the most semantically rich fields
  rule.embedding_input = [
    rule.id,
    rule.applies_to,
    rule.when,
    rule.use,
    rule.because,
    // Also include the first 600 chars of raw content for coverage
    content.substring(0, 600).replace(/\s+/g, ' '),
  ].join(' ');

  return rule;
}

// ── Parse numbered constraints from hard-constraints.md ──────────────────────

function parseHardConstraints(content) {
  const constraints = [];
  // Match numbered items: "1. Text here" through to the next "N." or end of section
  const regex = /^(\d+)\.\s+([\s\S]+?)(?=\n\d+\.|\n---|\n##|$)/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    constraints.push({
      id: parseInt(match[1]),
      text: match[2].replace(/\s+/g, ' ').trim(),
    });
  }
  return constraints;
}

// ── Main knowledge loader ─────────────────────────────────────────────────────

/**
 * Loads the full Design Mind knowledge base from disk.
 * @param {string} basePath - Absolute path to the design-mind/ root folder.
 * @returns {object} Structured knowledge base ready for indexing and querying.
 */
export function loadKnowledge(basePath) {
  const kb = {
    basePath,
    patterns: [],
    surfaces: [],
    rules: [],
    ontology: {},
    safety: {
      constraints: [],
      hardConstraintsRaw: '',
      severitySchema: null,
    },
    taste: '',
    principles: '',
  };

  // console.log routes to severity="info" in Railway; raw process.stdout.write does not.
  const kbLog    = msg => console.log(msg);
  const kbLogErr = msg => process.stderr.write(`[knowledge] WARN: ${msg}\n`);

  kbLog('[knowledge] Loading genome...');

  // Taste and principles (full text — used for review_output context)
  const tastePath = join(basePath, 'genome', 'taste.md');
  if (existsSync(tastePath)) kb.taste = readFileSync(tastePath, 'utf-8');

  const principlesPath = join(basePath, 'genome', 'principles.md');
  if (existsSync(principlesPath)) kb.principles = readFileSync(principlesPath, 'utf-8');

  // ── Rules ──────────────────────────────────────────────────────────────────
  kbLog('[knowledge] Loading rules...');
  const rulesDir = join(basePath, 'genome', 'rules');
  if (existsSync(rulesDir)) {
    for (const file of readdirSync(rulesDir)) {
      if (!file.endsWith('.rule.md')) continue;
      try {
        const content = readFileSync(join(rulesDir, file), 'utf-8');
        const parsed = parseRuleMd(content, file);
        kb.rules.push(parsed);
        kbLog(`[knowledge]   rule: ${parsed.id} (v${parsed.version}, confidence ${parsed.confidence})`);
      } catch (e) {
        kbLogErr(`could not parse ${file}: ${e.message}`);
      }
    }
  }

  // ── Blocks ─────────────────────────────────────────────────────────────────
  kbLog('[knowledge] Loading blocks...');
  const patternsDir = join(basePath, 'blocks');
  if (existsSync(patternsDir)) {
    for (const patternName of readdirSync(patternsDir)) {
      if (patternName.startsWith('_')) continue; // skip _candidates

      const metaPath = join(patternsDir, patternName, 'meta.yaml');
      if (!existsSync(metaPath)) continue;

      try {
        const metaContent = readFileSync(metaPath, 'utf-8');
        const meta = parseYaml(metaContent);

        // Skip deprecated patterns — they are replaced by their deprecated_by successor
        if (meta.status === 'deprecated') {
          kbLog(`[knowledge]   skip (deprecated): ${meta.id || patternName}`);
          continue;
        }

        meta._patternName = patternName;
        meta._metaRaw = metaContent;

        // Component source lives in @innovaccer/ui-assets (not local tsx files)
        meta._componentSrc = '';

        // Build embedding input string
        const whenStr = Array.isArray(meta.when)
          ? meta.when.join(' ')
          : (typeof meta.when === 'string' ? meta.when : '');
        const notWhenStr = Array.isArray(meta.not_when)
          ? meta.not_when.join(' ')
          : (typeof meta.not_when === 'string' ? meta.not_when : '');

        meta.embedding_input = [
          meta.id || patternName,
          meta.summary || '',
          whenStr,
          notWhenStr,
          meta.because || '',
          meta.embedding_hint || '',
          meta.structural_family || '',
          meta.component_type || '',
        ].join(' ');

        kb.patterns.push(meta);
        kbLog(`[knowledge]   pattern: ${meta.id || patternName}`);
      } catch (e) {
        kbLogErr(`could not parse ${patternName}/meta.yaml: ${e.message}`);
      }
    }
  }

  // ── Ontology ───────────────────────────────────────────────────────────────
  kbLog('[knowledge] Loading ontology...');
  const ontologyDir = join(basePath, 'ontology');
  if (existsSync(ontologyDir)) {
    for (const file of readdirSync(ontologyDir)) {
      const key = file.replace(/\.(yaml|md)$/, '');
      const filePath = join(ontologyDir, file);
      try {
        if (file.endsWith('.yaml')) {
          kb.ontology[key] = parseYaml(readFileSync(filePath, 'utf-8'));
        } else if (file.endsWith('.md')) {
          kb.ontology[key] = readFileSync(filePath, 'utf-8');
        }
      } catch (e) {
        kbLogErr(`could not parse ontology/${file}: ${e.message}`);
      }
    }
  }

  // ── Safety ─────────────────────────────────────────────────────────────────
  kbLog('[knowledge] Loading safety...');
  const hardConstraintsPath = join(basePath, 'safety', 'hard-constraints.md');
  if (existsSync(hardConstraintsPath)) {
    kb.safety.hardConstraintsRaw = readFileSync(hardConstraintsPath, 'utf-8');
    kb.safety.constraints = parseHardConstraints(kb.safety.hardConstraintsRaw);
  }

  const severitySchemaPath = join(basePath, 'safety', 'severity-schema.yaml');
  if (existsSync(severitySchemaPath)) {
    try {
      kb.safety.severitySchema = parseYaml(readFileSync(severitySchemaPath, 'utf-8'));
    } catch (e) {
      kbLogErr(`could not parse severity-schema.yaml: ${e.message}`);
    }
  }

  // ── Surfaces ────────────────────────────────────────────────────────────────
  kbLog('[knowledge] Loading surfaces...');
  const surfacesDir = join(basePath, 'surfaces');
  if (existsSync(surfacesDir)) {
    for (const file of readdirSync(surfacesDir)) {
      if (!file.endsWith('.surface.yaml')) continue;
      try {
        const content = readFileSync(join(surfacesDir, file), 'utf-8');
        const parsed = parseYaml(content);
        // Build embedding input from intent + what_it_omits + never fields
        // what_it_omits entries may be plain strings (legacy) or {item, reason} objects (v2)
        const omitsText = Array.isArray(parsed.what_it_omits)
          ? parsed.what_it_omits.map(e => (typeof e === 'string' ? e : `${e.item || ''} ${e.reason || ''}`)).join(' ')
          : '';
        parsed.embedding_input = [
          parsed.id || '',
          parsed.intent || '',
          omitsText,
          Array.isArray(parsed.never) ? parsed.never.join(' ') : '',
          Array.isArray(parsed.user_type) ? parsed.user_type.join(' ') : '',
        ].join(' ');
        kb.surfaces.push(parsed);
        kbLog(`[knowledge]   surface: ${parsed.id}`);
      } catch (e) {
        kbLogErr(`could not parse ${file}: ${e.message}`);
      }
    }
  }

  kb._loadedAt = new Date().toISOString();

  kbLog(
    `[knowledge] Loaded: ${kb.patterns.length} patterns, ${kb.surfaces.length} surfaces, ` +
    `${kb.rules.length} rules, ${kb.safety.constraints.length} safety constraints`
  );

  return kb;
}
