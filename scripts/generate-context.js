#!/usr/bin/env node
/**
 * generate-context.js
 *
 * Reads the live repo files and generates project-context-full.md —
 * a comprehensive context document for the Design Mind Claude project.
 *
 * Run manually:   node scripts/generate-context.js
 * Run in CI:      called by .github/workflows/sync-claude-context.yml
 *
 * Output: project-context-full.md in the repo root
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');

// ── Helpers ───────────────────────────────────────────────────────────────────

function read(filePath) {
  try { return readFileSync(filePath, 'utf-8').trim(); }
  catch { return null; }
}

function readJson(filePath) {
  try { return JSON.parse(readFileSync(filePath, 'utf-8')); }
  catch { return null; }
}

function section(title) {
  return `\n---\n\n## ${title}\n`;
}

// ── Load genome ───────────────────────────────────────────────────────────────

const principles  = read(join(ROOT, 'genome/principles.md'));
const taste       = read(join(ROOT, 'genome/taste.md'));
const rulesIndex  = readJson(join(ROOT, 'genome/rules/_index.json'));

const ruleFiles = rulesIndex?.rules
  ? Object.entries(rulesIndex.rules).map(([id, meta]) => ({
      id,
      confidence: meta.confidence,
      status: meta.status,
      note: meta.note || '',
      content: read(join(ROOT, meta.file)),
    })).filter(r => r.content && r.status === 'active')
  : [];

// ── Load ontology ─────────────────────────────────────────────────────────────

const entitiesYaml   = read(join(ROOT, 'ontology/entities.yaml'));
const statesYaml     = read(join(ROOT, 'ontology/states.yaml'));
const actionsYaml    = read(join(ROOT, 'ontology/actions.yaml'));
const copyVoice      = read(join(ROOT, 'ontology/copy-voice.md'));

// ── Load safety ───────────────────────────────────────────────────────────────

const hardConstraints  = read(join(ROOT, 'safety/hard-constraints.md'));
const severitySchema   = read(join(ROOT, 'safety/severity-schema.yaml'));

// ── Load blocks ───────────────────────────────────────────────────────────────

function loadPatterns() {
  const patternsDir = join(ROOT, 'blocks');
  const entries = readdirSync(patternsDir, { withFileTypes: true });
  const patterns = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const meta      = read(join(patternsDir, entry.name, 'meta.yaml'));
    const component = read(join(patternsDir, entry.name, 'component.tsx'));
    if (meta) patterns.push({ name: entry.name, meta, component });
  }

  return patterns.sort((a, b) => a.name.localeCompare(b.name));
}

function loadCandidates() {
  const candidatesDir = join(ROOT, 'blocks/_candidates');
  if (!existsSync(candidatesDir)) return [];
  return readdirSync(candidatesDir)
    .filter(f => f.endsWith('.yaml'))
    .map(f => {
      const content = read(join(candidatesDir, f));
      const nameMatch = content?.match(/pattern_name:\s*["']?(.+?)["']?\n/);
      const dateMatch = f.match(/^(\d{4}-\d{2}-\d{2})/);
      return { file: f, name: nameMatch?.[1] || f, date: dateMatch?.[1] || '' };
    });
}

// ── Load surfaces ─────────────────────────────────────────────────────────────

function loadSurfaces() {
  const surfacesDir = join(ROOT, 'surfaces');
  if (!existsSync(surfacesDir)) return [];
  return readdirSync(surfacesDir)
    .filter(f => f.endsWith('.surface.yaml'))
    .map(f => ({
      name: f.replace('.surface.yaml', ''),
      content: read(join(surfacesDir, f)),
    }));
}

// ── Load agent prompts ────────────────────────────────────────────────────────

const mindPrompt   = read(join(ROOT, 'agents/mind/system-prompt.md'));
const criticPrompt = read(join(ROOT, 'agents/critic/system-prompt.md'));

// ── Load MCP tools ────────────────────────────────────────────────────────────

function loadTools() {
  const toolsDir = join(ROOT, 'tools');
  if (!existsSync(toolsDir)) return [];
  return readdirSync(toolsDir)
    .filter(f => f.endsWith('.schema.yaml'))
    .map(f => ({ name: f.replace('.schema.yaml', ''), content: read(join(toolsDir, f)) }));
}

// ── Assemble document ─────────────────────────────────────────────────────────

const patterns   = loadPatterns();
const candidates = loadCandidates();
const surfaces   = loadSurfaces();
const tools      = loadTools();

const lines = [];

lines.push(`# Design Mind MCP — Project Context`);
lines.push(`\n> Auto-generated from repo on ${new Date().toISOString().split('T')[0]}. Do not edit manually — run \`node scripts/generate-context.js\` to refresh.\n`);
lines.push(`**Repo:** https://github.com/anantgarg-jpg/design-mind-mcp`);
lines.push(`**Hosted MCP:** https://design-mind-mcp-production.up.railway.app/sse`);

// ── What this is ──────────────────────────────────────────────────────────────
lines.push(section('What this project is'));
lines.push(`Design Mind MCP is a Claude Code tool (MCP server) that enforces consistent, safe, and ontologically correct UI generation across any frontend project that connects to it. It acts as the accumulated design intelligence of a clinical healthcare platform — with memory, taste, and the authority to push back on decisions that feel wrong.

Any team can point their \`.mcp.json\` at the hosted server and get the full Design Mind genome at build time.

Tech stack: Node.js 18+, ES modules, dual stdio/HTTP+SSE transport, Railway deployment, Anthropic API (claude-sonnet-4-5) with prompt caching for LLM-based genome reasoning. No framework — pure Node \`http\`.`);

// ── MCP tools ─────────────────────────────────────────────────────────────────
lines.push(section('MCP Tools'));
lines.push(`Three tools exposed by the server:\n`);
lines.push(`**\`consult_before_build\`** — Call BEFORE generating any UI. Required: \`intent_description\`, \`scope\`. Optional: \`domain\`, \`user_type\`, \`workflows\`. Returns: \`surface\` (matched or generated), \`layout\` (regions with block assignments), \`workflows\` (per-workflow block recommendations with import_instruction from @innovaccer/ui-assets), \`rules_applied\`, \`safety_applied\`, \`ontology_refs\`, \`confidence\`, and \`gaps\`.\n`);
lines.push(`**\`review_output\`** — Call AFTER generating UI. Takes \`generated_output\` (code) + \`original_intent\` + optional \`context_used\` (consult_before_build response). Auto-checks: block source validation (shadcn duplication, wrong tier, reimplementation), consultation alignment (surface import, layout ordering, workflow completeness), token usage (hex, rgb, non-semantic Tailwind, !important), copy voice, non-canonical terms. LLM Critic reviews holistically against the genome. Returns: \`auto_checks\`, \`honored\`, \`borderline\`, \`novel\`, \`fix\`, \`copy_violations\`, \`confidence\`.\n`);
lines.push(`**\`report_pattern\`** — Call ONLY when UI STRUCTURE changes (new layout, new interaction model, new slot arrangement). NOT when slot content changes (label, domain, icon, entity type). Submits to hosted API → Slack → human ratification. Falls back to \`blocks/_candidates/\` YAML. 3+ reports across projects = \`ready_for_ratification\`.

**Block variation rule:** "Am I changing structure or content?" Content changes → use existing block. Structure changes → call \`report_pattern\`.`);

if (tools.length > 0) {
  lines.push(`\n### Tool schemas\n`);
  for (const t of tools) {
    lines.push(`#### ${t.name}\n\`\`\`yaml\n${t.content}\n\`\`\`\n`);
  }
}

// ── Genome ────────────────────────────────────────────────────────────────────
lines.push(section('Genome hierarchy'));
lines.push(`| Level | Location | Encodes |
|-------|----------|---------|
| **Tokens** | \`genome/rules/styling-tokens.rule.md\` | Design tokens, DM Sans, 4px grid, elevation, z-index, motion |
| **Blocks** | \`blocks/*/meta.yaml\` | Reusable structures with product decisions — from status badge to form layout |
| **Surfaces** | \`surfaces/*.surface.yaml\` | Full artifacts: intent, omissions, ordering, actions, hard never rules |`);

if (rulesIndex) {
  lines.push(`\n**Rules registry (v${rulesIndex.version}):**\n`);
  for (const [id, meta] of Object.entries(rulesIndex.rules || {})) {
    if (meta.status === 'active') {
      lines.push(`- \`${id}\` — confidence ${meta.confidence}${meta.note ? ` — ${meta.note}` : ''}`);
    }
  }
}

// ── Principles ────────────────────────────────────────────────────────────────
if (principles) {
  lines.push(section('Product principles'));
  lines.push(principles);
}

// ── Taste ─────────────────────────────────────────────────────────────────────
if (taste) {
  lines.push(section('Aesthetic identity'));
  lines.push(taste);
}

// ── Rules (full content) ──────────────────────────────────────────────────────
if (ruleFiles.length > 0) {
  lines.push(section('Genome rules (full)'));
  for (const rule of ruleFiles) {
    lines.push(`\n### ${rule.id} (confidence: ${rule.confidence})\n`);
    lines.push(rule.content);
  }
}

// ── Safety ────────────────────────────────────────────────────────────────────
if (hardConstraints) {
  lines.push(section('Safety — hard constraints (immutable)'));
  lines.push(hardConstraints);
}
if (severitySchema) {
  lines.push(section('Safety — severity schema'));
  lines.push(`\`\`\`yaml\n${severitySchema}\n\`\`\``);
}

// ── Ontology ──────────────────────────────────────────────────────────────────
if (entitiesYaml) {
  lines.push(section('Ontology — entities'));
  lines.push(`\`\`\`yaml\n${entitiesYaml}\n\`\`\``);
}
if (statesYaml) {
  lines.push(section('Ontology — states'));
  lines.push(`\`\`\`yaml\n${statesYaml}\n\`\`\``);
}
if (actionsYaml) {
  lines.push(section('Ontology — actions'));
  lines.push(`\`\`\`yaml\n${actionsYaml}\n\`\`\``);
}
if (copyVoice) {
  lines.push(section('Ontology — copy voice'));
  lines.push(copyVoice);
}

// ── Blocks ────────────────────────────────────────────────────────────────────
lines.push(section('Blocks — ratified'));
lines.push(`${patterns.length} ratified blocks:\n`);
lines.push(patterns.map(p => `- **${p.name}**`).join('\n'));

for (const pattern of patterns) {
  lines.push(`\n---\n\n### ${pattern.name}\n`);
  lines.push(`#### meta.yaml\n\`\`\`yaml\n${pattern.meta}\n\`\`\``);
  if (pattern.component) {
    lines.push(`\n#### component.tsx\n\`\`\`tsx\n${pattern.component}\n\`\`\``);
  }
}

// ── Candidates ────────────────────────────────────────────────────────────────
if (candidates.length > 0) {
  lines.push(section('Blocks — candidates (awaiting ratification)'));
  for (const c of candidates) {
    lines.push(`- **${c.name}**${c.date ? ` — ${c.date}` : ''} (\`${c.file}\`)`);
  }
}

// ── Surfaces ──────────────────────────────────────────────────────────────────
if (surfaces.length > 0) {
  lines.push(section('Surfaces'));
  lines.push(`${surfaces.length} surfaces:\n`);
  for (const s of surfaces) {
    lines.push(`\n### ${s.name}\n\`\`\`yaml\n${s.content}\n\`\`\``);
  }
}

// ── Agent prompts ─────────────────────────────────────────────────────────────
if (mindPrompt) {
  lines.push(section('Agent — Design Mind (system prompt)'));
  lines.push(mindPrompt);
}
if (criticPrompt) {
  lines.push(section('Agent — Critic (system prompt)'));
  lines.push(criticPrompt);
}

// ── Write output ──────────────────────────────────────────────────────────────

const output = lines.join('\n');

// Write versioned snapshot (v1, v2, v3 …)
const existing = readdirSync(ROOT)
  .map(f => f.match(/^project-context-full-v(\d+)\.md$/))
  .filter(Boolean)
  .map(m => parseInt(m[1], 10));
const nextVersion  = existing.length > 0 ? Math.max(...existing) + 1 : 1;
const versionedName = `project-context-full-v${nextVersion}.md`;
const versionedPath = join(ROOT, versionedName);

writeFileSync(versionedPath, output, 'utf-8');

const lineCount = output.split('\n').length;
const sizeKb    = (Buffer.byteLength(output) / 1024).toFixed(1);
console.log(`✓ ${versionedName} written — ${lineCount} lines, ${sizeKb} KB`);
console.log(`  Blocks: ${patterns.length} ratified, ${candidates.length} candidates`);
console.log(`  Surfaces: ${surfaces.length}`);
console.log(`  Rules: ${ruleFiles.length} active`);
