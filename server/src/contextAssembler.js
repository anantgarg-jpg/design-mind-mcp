/**
 * contextAssembler.js
 * Core logic for the three MCP tools.
 *
 * Tools:
 *   consultBeforeBuild  — pre-generation context retrieval
 *   reviewOutput        — post-generation critique
 *   reportPattern       — novel pattern candidate logging
 */

import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { query } from './vectorIndex.js';
import { embedOne } from './embedder.js';
import { search, isSeeded } from './vectorstore.js';

// Maps query component_type to the pattern component_types it should structurally match.
// "list" queries match "row" and "card" patterns since lists are composed of rows/cards.
const TYPE_FAMILIES = {
  list:   ['row', 'card'],
  row:    ['row'],
  card:   ['card'],
  table:  ['row', 'table'],
  banner: ['banner'],
  header: ['header'],
  form:   ['form'],
  badge:  ['badge'],
  button: ['button'],
  modal:  ['modal'],
  drawer: ['drawer'],
  page:   ['page', 'panel'],
  panel:  ['panel', 'page'],
  other:  ['other'],
};

function structuralBoost(patternComponentType, queryComponentType) {
  if (!queryComponentType || !patternComponentType) return 0;
  const related = TYPE_FAMILIES[queryComponentType] || [queryComponentType];
  return related.includes(patternComponentType) ? 0.35 : 0;
}

// Set to true by index.js after confirming the vector store has been seeded
let _useVectorStore = false;
export function setUseVectorStore(val) { _useVectorStore = val; }

/**
 * Unified search: flat-file vector store (semantic) when seeded, TF-IDF otherwise.
 * Always returns [{id, score, metadata}] regardless of backend.
 */
async function queryPatterns(text, k, patternIndex) {
  if (_useVectorStore) {
    const vec = await embedOne(text);
    const hits = search('dm_patterns', vec, k);
    return hits.map(h => ({ id: h.payload.id, score: h.score, metadata: h.payload }));
  }
  return query(patternIndex, text, k);
}

async function queryRules(text, k, ruleIndex) {
  if (_useVectorStore) {
    const vec = await embedOne(text);
    const hits = search('dm_rules', vec, k);
    return hits.map(h => ({ id: h.payload.id, score: h.score, metadata: h.payload }));
  }
  return query(ruleIndex, text, k);
}

// Surface matching — TF-IDF Jaccard on embedding_input (surfaces are few enough
// that a full vector store is not needed; linear scan is fast)
function querySurfaces(text, surfaces) {
  if (!surfaces || surfaces.length === 0) return null;
  const textWords = new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  let best = null, bestScore = 0;
  for (const s of surfaces) {
    const surfaceWords = new Set((s.embedding_input || '').split(/\s+/).filter(w => w.length > 2));
    const intersection = [...textWords].filter(w => surfaceWords.has(w)).length;
    const union = new Set([...textWords, ...surfaceWords]).size;
    const score = union > 0 ? intersection / union : 0;
    if (score > bestScore) { bestScore = score; best = { surface: s, score }; }
  }
  // Only return a surface match if it's reasonably confident
  return bestScore > 0.08 ? best : null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return [val];
  return [];
}

function formatWhen(whenVal) {
  if (!whenVal) return 'Not specified';
  if (Array.isArray(whenVal)) return whenVal.map(w => `• ${w}`).join('\n');
  return String(whenVal);
}

function formatNotWhen(notWhenVal) {
  if (!notWhenVal) return 'Not specified';
  if (Array.isArray(notWhenVal)) return notWhenVal.map(w => `• ${w}`).join('\n');
  return String(notWhenVal);
}

// Identify which safety constraints are in scope for an intent
function getSafetyConstraintsInScope(intent, componentType, domain, kb) {
  const allConstraints = kb.safety.constraints || [];
  const intentLower = (intent + ' ' + domain).toLowerCase();

  // Always return all safety constraints — per the spec: "always included, never filtered"
  return allConstraints.map(c => ({
    constraint_id: c.id,
    rule: c.text,
    applies_because: inferAppliesBecause(c, intentLower, componentType),
  }));
}

function inferAppliesBecause(constraint, intentLower, componentType) {
  const id = constraint.id;
  // Severity color rules (1-4)
  if (id <= 4) return 'Severity colors are always in scope when building clinical UI';
  // Alert dismissal rules (5-7)
  if (id <= 7) {
    if (intentLower.includes('alert') || intentLower.includes('dismiss') || componentType === 'banner') {
      return 'Alert dismissal rules apply to this component type';
    }
    return 'Alert rules included — verify no dismiss control exists on critical alerts';
  }
  // Patient identity rules (8-10)
  if (id <= 10) {
    if (intentLower.includes('patient') || componentType === 'header') {
      return 'Patient identity display rules apply';
    }
    return 'Patient identity rules included — verify any patient fields use canonical display';
  }
  // Confirmation rules (11-12)
  if (id <= 12) {
    if (intentLower.includes('delete') || intentLower.includes('bulk') || intentLower.includes('modify')) {
      return 'This action modifies or deletes data — confirmation required';
    }
    return 'Confirm any destructive or bulk actions with explicit consequence statement';
  }
  // Terminology rules (13-14)
  return 'Clinical terminology rules always apply';
}

// Get relevant ontology concepts for a set of ontology_refs
function getOntologyRefs(ontologyRefs, kb) {
  const result = [];
  if (!ontologyRefs || typeof ontologyRefs !== 'object') return result;

  const entities = ontologyRefs.entities || [];
  const states = ontologyRefs.states || [];
  const actions = ontologyRefs.actions || [];

  const allEntities = kb.ontology.entities || {};
  const allStates = kb.ontology.states || {};
  const allActions = kb.ontology.actions || {};

  for (const entityName of toArray(entities)) {
    const entity = allEntities[entityName];
    if (entity) {
      result.push({
        concept: 'entity',
        canonical_name: entity.canonical_name || entityName,
        ui_label: entity.canonical_name || entityName,
        notes: entity.definition
          ? entity.definition.replace(/\s+/g, ' ').trim().substring(0, 200)
          : '',
      });
    }
  }

  for (const stateName of toArray(states)) {
    // States are nested under TaskStatus, CareGapStatus, etc.
    let found = false;
    for (const [groupKey, group] of Object.entries(allStates)) {
      if (groupKey === stateName && group.values) {
        result.push({
          concept: 'status',
          canonical_name: groupKey,
          ui_label: groupKey,
          notes: `Values: ${Object.keys(group.values).join(', ')}`,
        });
        found = true;
        break;
      }
    }
    if (!found) {
      result.push({ concept: 'status', canonical_name: stateName, ui_label: stateName, notes: '' });
    }
  }

  for (const actionName of toArray(actions)) {
    const action = allActions[actionName];
    if (action) {
      result.push({
        concept: 'action',
        canonical_name: action.canonical_name || actionName,
        ui_label: action.ui_label || actionName,
        notes: [
          action.meaning ? action.meaning.replace(/\s+/g, ' ').trim().substring(0, 150) : '',
          action.confirmation_required ? `Confirmation required: "${action.confirmation_copy}"` : '',
          action.constraint || '',
        ].filter(Boolean).join(' | '),
      });
    }
  }

  return result;
}

// ── TOOL 1: consult_before_build ─────────────────────────────────────────────

/**
 * Returns the most relevant patterns, rules, ontology refs, and safety
 * constraints for the agent's stated intent.
 */
export async function consultBeforeBuild(params, kb, patternIndex, ruleIndex, surfaces) {
  const {
    intent_description,
    component_type = 'other',
    domain = 'other',
    user_type = [],
    product_area = '',
  } = params;

  // Compose search text from all input fields
  const searchText = [
    intent_description,
    component_type,
    domain,
    toArray(user_type).join(' '),
    product_area,
  ].join(' ');

  // ── Vector search (Qdrant semantic or TF-IDF fallback) ──────────────────────
  const patternResults = await queryPatterns(searchText, 8, patternIndex);

  // Apply structural boost and re-rank
  const boostedResults = patternResults
    .map(r => ({
      ...r,
      score: r.score + structuralBoost(r.metadata?.component_type, component_type),
      structurally_matched: structuralBoost(r.metadata?.component_type, component_type) > 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const ruleResults = await queryRules(searchText, 2, ruleIndex);

  // ── Pattern results ─────────────────────────────────────────────────────────
  const patterns = boostedResults.map(r => ({
    id: r.id,
    relevance_score: parseFloat(r.score.toFixed(4)),
    structural_family: r.metadata?.structural_family || null,
    component_type: r.metadata?.component_type || null,
    structurally_matched: r.structurally_matched || false,
    summary: r.metadata?.summary || '',
    when: formatWhen(r.metadata?.when),
    not_when: formatNotWhen(r.metadata?.not_when),
    because: r.metadata?.because || '',
    confidence: r.metadata?.confidence || 0.9,
    usage_signal: { renders_total: 0, override_rate: 0.0 },
  }));

  // ── Structural guidance — dominant family + invariants ──────────────────────
  // When multiple top patterns share a structural family, surface the invariants
  // so the LLM knows exactly which tokens are non-negotiable.
  const familyCounts = {};
  for (const r of boostedResults) {
    const fam = r.metadata?.structural_family;
    if (fam && r.structurally_matched) {
      familyCounts[fam] = (familyCounts[fam] || []);
      familyCounts[fam].push(r);
    }
  }
  const dominantFamilyEntry = Object.entries(familyCounts)
    .sort((a, b) => b[1].length - a[1].length)[0];

  let structuralGuidance = null;
  if (dominantFamilyEntry) {
    const [familyName, familyPatterns] = dominantFamilyEntry;
    // Collect unique invariants from all patterns in this family
    const allInvariants = familyPatterns
      .flatMap(r => r.metadata?.family_invariants || [])
      .filter((v, i, a) => a.indexOf(v) === i);
    structuralGuidance = {
      family: familyName,
      invariants: allInvariants,
      examples: familyPatterns.map(r => r.id),
    };
  }

  // ── Rule results ────────────────────────────────────────────────────────────
  const rules = ruleResults.map(r => ({
    rule_id: r.id,
    summary: [r.metadata.when, r.metadata.use].filter(Boolean).join(' | ').substring(0, 300),
    applies_because: `Applies to: ${r.metadata.applies_to || 'this component type'}`,
    confidence: r.metadata.confidence || 0.9,
  }));

  // ── Ontology refs (from top matched pattern) ────────────────────────────────
  const topPatternRefs = boostedResults[0]?.metadata?.ontology_refs || {};
  const ontologyRefs = getOntologyRefs(topPatternRefs, kb);

  // ── Safety constraints (always all of them) ─────────────────────────────────
  const safetyConstraints = getSafetyConstraintsInScope(
    intent_description, component_type, domain, kb
  );

  // ── Confidence score ────────────────────────────────────────────────────────
  // Vector store: cosine similarity 0.0–1.0, good match ~0.70+
  // TF-IDF: naturally tops out ~0.5–0.6, scaled by /0.55 so ~0.5 maps to ~0.9
  const topPatternScore = boostedResults[0]?.score || 0;
  const confidence = _useVectorStore
    ? parseFloat(Math.min(topPatternScore, 1.0).toFixed(4))
    : parseFloat(Math.min(topPatternScore / 0.55, 1.0).toFixed(4));

  // ── Gap detection ───────────────────────────────────────────────────────────
  // Vector store: low match < 0.45 cosine. TF-IDF: low match < 0.25 raw.
  const lowThreshold = _useVectorStore ? 0.45 : 0.25;
  const gaps = [];
  if (boostedResults.length === 0) {
    gaps.push('No pattern matches found. This is likely a novel UI element — flag with DESIGN MIND comment.');
  } else if (topPatternScore < lowThreshold) {
    gaps.push(
      `Low pattern coverage for this intent (best match score: ${topPatternScore.toFixed(2)}). ` +
      `The genome may not have a pattern for "${component_type}" in domain "${domain}". ` +
      `Consider calling report_pattern after building.`
    );
  }

  // ── Surface match — which governed surface is this being built inside? ───────
  const surfaceMatch = querySurfaces(searchText, surfaces || kb.surfaces || []);
  const surface = surfaceMatch ? {
    id:                surfaceMatch.surface.id,
    intent:            surfaceMatch.surface.intent || '',
    what_it_omits:     surfaceMatch.surface.what_it_omits || [],
    empty_state_meaning: surfaceMatch.surface.empty_state_meaning || '',
    ordering:          surfaceMatch.surface.ordering || '',
    actions:           surfaceMatch.surface.actions || [],
    never:             surfaceMatch.surface.never || [],
    match_score:       parseFloat(surfaceMatch.score.toFixed(3)),
  } : null;

  // ── Episodic memory — similar past builds ───────────────────────────────────
  const similarBuilds = loadSimilarBuilds(kb.basePath, searchText);

  return {
    surface,
    structural_guidance: structuralGuidance,
    patterns,
    rules,
    ontology_refs: ontologyRefs,
    safety_constraints: safetyConstraints,
    similar_builds: similarBuilds,
    confidence,
    gaps,
  };
}

// ── TOOL 2: review_output ─────────────────────────────────────────────────────

// Hard constraint violation detectors
const HARD_CONSTRAINT_CHECKS = [
  {
    id: 'c5-critical-dismiss',
    check: (code) => {
      const lower = code.toLowerCase();
      // Look for "dismiss" or "close" button near "critical"
      const hasCritical = lower.includes('critical');
      const hasDismiss = lower.includes('dismiss') || /\bclose\b/.test(lower);
      if (hasCritical && hasDismiss) {
        // More precise: check if they're close together (within 200 chars)
        const critIdx = lower.indexOf('critical');
        const dismissIdx = Math.max(lower.indexOf('dismiss'), lower.search(/\bclose\b/));
        if (Math.abs(critIdx - dismissIdx) < 300) return true;
      }
      return false;
    },
    problem: 'Dismiss or Close control may be rendered for a Critical alert',
    rule_violated: 'safety/hard-constraints.md rule 5',
    correction: 'Remove Dismiss/Close from Critical alerts. Only Acknowledge and Escalate are permitted actions.',
  },
  {
    id: 'c1-hardcoded-color',
    check: (code) => /#[0-9A-Fa-f]{3,8}(?!\s*\/\/)/.test(code),
    problem: 'Hardcoded hex color found in component code',
    rule_violated: 'genome/rules/styling-tokens.rule.md',
    correction: 'Replace all hex colors with MDS token classes (text-destructive, bg-[var(--alert-light)], etc.)',
  },
  {
    id: 'c-tailwind-colors',
    check: (code) => {
      // Look for Tailwind default color classes like red-600, amber-100, blue-500, etc.
      return /\b(red|blue|green|yellow|amber|orange|purple|pink|gray|slate|zinc|neutral|stone|lime|emerald|teal|cyan|indigo|violet|fuchsia|rose)-\d{2,3}\b/.test(code);
    },
    problem: 'Tailwind default color classes found (e.g. red-600, amber-100)',
    rule_violated: 'genome/rules/styling-tokens.rule.md',
    correction: 'Use MDS semantic token classes only. See styling-tokens.rule.md for the full token map.',
  },
  {
    id: 'c8-patient-name',
    check: (code) => {
      // Only flag rendering contexts — JSX text interpolation {firstName} or template literals `${firstName}`
      // NOT prop passing (lastName={...} firstName={...}) which is correct pattern usage
      // Look for firstName rendered directly without a lastName nearby in JSX output
      const hasFirstNameRender = /\{[^}]*firstName[^}]*\}/.test(code) || /`[^`]*firstName[^`]*`/.test(code);
      const hasLastNameNearby = /lastName/.test(code);
      // Only flag if firstName is rendered but no lastName is present anywhere in the file
      return hasFirstNameRender && !hasLastNameNearby;
    },
    problem: 'Patient first name rendered without last name anywhere in component',
    rule_violated: 'safety/hard-constraints.md rule 8',
    correction: 'Always display patient name as Last, First (formal) or First Last (conversational). Never first name only.',
  },
  {
    id: 'c13-forbidden-terms',
    check: (code) => {
      const lower = code.toLowerCase();
      return lower.includes('"normal"') || lower.includes("'normal'") ||
             lower.includes('"fine"') || lower.includes("'fine'") ||
             lower.includes("don't worry") || lower.includes('unfortunately');
    },
    problem: 'Forbidden clinical terminology found in copy',
    rule_violated: 'safety/hard-constraints.md rule 13',
    correction: 'Remove "Normal", "Fine", "don\'t worry", "unfortunately". Use clinical terminology per ontology/copy-voice.md.',
  },
];

// Check for non-canonical terminology
function checkNonCanonicalTerms(code, kb) {
  const violations = [];
  const entities = kb.ontology?.entities || {};

  // Strip code of content that produces false positives before synonym scanning:
  // 1. Developer comments (// ... and /* ... */)
  // 2. className="..." and className={cn(...)} strings — these contain CSS token names
  // 3. Prop value assignments like variant="warning" — CSS token variant strings
  // 4. Import paths
  const strippedCode = code
    .replace(/\/\/[^\n]*/g, '')                  // single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')             // block comments
    .replace(/className\s*=\s*["'`][^"'`]*["'`]/g, '') // className="..." strings
    .replace(/className\s*=\s*\{[^}]*\}/g, '')    // className={...} expressions
    .replace(/variant\s*=\s*["'`][^"'`]*["'`]/g, '') // variant="..." props (CSS tokens)
    .replace(/import\s+.*from\s+["'][^"']*["']/g, ''); // import statements

  for (const [entityKey, entity] of Object.entries(entities)) {
    const synonyms = toArray(entity.synonyms);
    for (const synonym of synonyms) {
      // Skip short synonyms (< 6 chars) — too many false positives
      if (synonym.length < 6) continue;
      // Skip synonyms with regex special chars
      if (/[^a-z\s-]/i.test(synonym)) continue;
      const escapedSynonym = synonym.replace(/[-]/g, '[-]');
      const regex = new RegExp(`\\b${escapedSynonym}\\b`, 'i');
      if (regex.test(strippedCode)) {
        violations.push({
          problem: `Non-canonical term "${synonym}" found in UI copy. Use "${entity.canonical_name}" instead.`,
          rule_violated: 'ontology/entities.yaml — terminology rule',
          correction: `Replace all instances of "${synonym}" in user-visible copy with the canonical name "${entity.canonical_name}"`,
        });
      }
    }
  }
  return violations;
}

// Check for honored patterns/rules (positive signals)
function checkHonored(code, patternResults, kb) {
  const honored = [];

  // Token-based checks
  if (/text-destructive|text-alert|text-warning|bg-destructive|bg-\[var\(--/.test(code)) {
    honored.push({
      observation: 'Uses MDS semantic color tokens correctly',
      rule_or_pattern_ref: 'genome/rules/styling-tokens.rule.md',
    });
  }
  if (/Last,\s*First|`\${.*last.*}\s*,\s*\${.*first.*}`/i.test(code)) {
    honored.push({
      observation: 'Patient name rendered in Last, First format',
      rule_or_pattern_ref: 'safety/hard-constraints.md rule 8',
    });
  }
  if (/AlertDialog|confirmationRequired|consequence/i.test(code)) {
    honored.push({
      observation: 'Destructive action uses AlertDialog with confirmation',
      rule_or_pattern_ref: 'genome/rules/destructive-actions.rule.md',
    });
  }
  if (/Acknowledge|acknowledge/i.test(code) && !/Dismiss|dismiss/i.test(code)) {
    honored.push({
      observation: 'Alert uses Acknowledge rather than Dismiss — correct for critical/high severity',
      rule_or_pattern_ref: 'safety/hard-constraints.md rule 5',
    });
  }
  if (patternResults.length > 0 && patternResults[0].score > 0.4) {
    honored.push({
      observation: `Matches established pattern: ${patternResults[0].id} (similarity: ${patternResults[0].score.toFixed(2)})`,
      rule_or_pattern_ref: `patterns/${patternResults[0].id}/meta.yaml`,
    });
  }

  return honored;
}

/**
 * Reviews generated UI code/description against the Design Mind genome.
 */
export async function reviewOutput(params, kb, patternIndex) {
  const { generated_output, original_intent, context_used } = params;
  const code = generated_output || '';

  // Find matching patterns
  const patternResults = await queryPatterns(
    (original_intent || '') + ' ' + code.substring(0, 500), 3, patternIndex
  );

  const fix = [];
  const borderline = [];
  const candidatePatterns = [];

  // ── Hard constraint violation checks ────────────────────────────────────────
  for (const check of HARD_CONSTRAINT_CHECKS) {
    if (check.check(code)) {
      fix.push({
        problem: check.problem,
        rule_violated: check.rule_violated,
        correction: check.correction,
      });
    }
  }

  // ── Non-canonical terminology ────────────────────────────────────────────────
  const termViolations = checkNonCanonicalTerms(code, kb);
  fix.push(...termViolations);

  // ── Borderline checks ────────────────────────────────────────────────────────
  // Check for missing audit trail on alert acknowledgment
  if (/acknowledge/i.test(code) && !/audit|log|track/i.test(code)) {
    borderline.push({
      observation: 'Acknowledge action present but no audit trail call visible',
      tension: 'Hard constraint rule 7: acknowledgment must always create an audit log entry',
      recommendation: 'Ensure onAcknowledge fires an audit event. This may be handled by the API layer — confirm.',
    });
  }
  // Check for navigation chrome inside artifact
  if (/breadcrumb|back.button|backButton|<nav/i.test(code)) {
    borderline.push({
      observation: 'Navigation element (breadcrumb/back button) detected inside artifact content',
      tension: 'shell-layout rule: artifacts in Panel 3 should not have their own navigation chrome',
      recommendation: 'Remove navigation elements from the artifact — Panel 1/tab close (×) handles navigation.',
    });
  }
  // Check for font-family override
  if (/font-family|fontFamily/i.test(code)) {
    borderline.push({
      observation: 'font-family is being set explicitly in a component',
      tension: 'styling-tokens rule: never set font-family in components — all text inherits DM Sans from root',
      recommendation: 'Remove the font-family declaration. Components inherit from globals.css.',
    });
  }

  // ── Positive signals ─────────────────────────────────────────────────────────
  const honored = checkHonored(code, patternResults, kb);

  // ── Novel pattern detection ───────────────────────────────────────────────────
  // Vector store: novel if cosine < 0.40. TF-IDF: novel if raw score < 0.3.
  const topPatternScore = patternResults[0]?.score || 0;
  const novelThreshold = _useVectorStore ? 0.40 : 0.3;
  if (topPatternScore < novelThreshold) {
    candidatePatterns.push({
      name: 'Unknown — inferred from low pattern match',
      description: 'This component does not closely match any existing pattern in the library.',
      promoted_to_candidates: false,
    });
  }

  // ── Overall compliance score ─────────────────────────────────────────────────
  let compliance = 1.0;
  compliance -= fix.length * 0.15;       // each fix deducts 15%
  compliance -= borderline.length * 0.05; // each borderline deducts 5%
  compliance = Math.max(0, Math.min(1, compliance));

  return {
    honored,
    borderline,
    novel: candidatePatterns.length > 0 ? [{
      description: candidatePatterns[0].description,
      coherent_with_taste: topPatternScore > 0.1,
      coherence_reasoning: topPatternScore > 0.1
        ? 'Component appears consistent with genome style but fills a gap'
        : 'Low resemblance to existing patterns — review against genome before promoting',
    }] : [],
    fix,
    candidate_patterns: candidatePatterns,
    confidence: parseFloat(compliance.toFixed(4)),
  };
}

// ── TOOL 3: report_pattern ────────────────────────────────────────────────────

function generateCandidateId(patternName) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const slug = patternName.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
  return `${ts}-${slug}`;
}

function loadExistingCandidates(candidatesDir) {
  if (!existsSync(candidatesDir)) return [];
  const files = readdirSync(candidatesDir).filter(f => f.endsWith('.yaml'));
  return files.map(f => {
    try {
      const content = readFileSync(join(candidatesDir, f), 'utf-8');
      const nameMatch    = content.match(/pattern_name:\s*["']?(.+?)["']?\n/);
      const descMatch    = content.match(/description:\s*[>|]?\s*\n?((?:  .+\n?)+)/);
      const intentMatch  = content.match(/intent_it_serves:\s*[>|]?\s*\n?((?:  .+\n?)+)/);
      return {
        file: f,
        pattern_name:     nameMatch   ? nameMatch[1].trim()              : f,
        description:      descMatch   ? descMatch[1].replace(/\s+/g, ' ').trim()   : '',
        intent_it_serves: intentMatch ? intentMatch[1].replace(/\s+/g, ' ').trim() : '',
      };
    } catch {
      return { file: f, pattern_name: f, description: '', intent_it_serves: '' };
    }
  });
}

// Composite text for similarity: name carries 3x weight by repetition,
// description and intent carry 1x each. This means two patterns with
// very different names (SdohAssessmentTab vs ClinicalAssessmentForm) but
// similar descriptions and intents will still score as similar.
function compositeText(pattern_name, description = '', intent_it_serves = '') {
  return [pattern_name, pattern_name, pattern_name, description, intent_it_serves]
    .join(' ')
    .toLowerCase()
}

function stringSimilarity(a, b) {
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 2));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

// ── API submission config ─────────────────────────────────────────────────────
// Candidates are submitted to the hosted API so they're visible to maintainers
// regardless of which project the consumer is working in.
// Falls back to a local file write if the API is unreachable.

const CANDIDATE_API_URL = process.env.DESIGN_MIND_API_URL || 'http://localhost:3456';
const CANDIDATE_API_KEY = process.env.DESIGN_MIND_API_KEY || 'dm-local-dev-key';

async function submitToApi(payload) {
  const url = `${CANDIDATE_API_URL}/candidates`;
  const body = JSON.stringify(payload);
  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === 'https:';
  const { request } = isHttps ? await import('node:https') : await import('node:http');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Api-Key': CANDIDATE_API_KEY,
      },
    };
    const req = request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.setTimeout(4000, () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function localFallback(params, basePath, reason) {
  process.stderr.write(`[reportPattern] API unavailable (${reason}) — writing locally\n`);

  const {
    pattern_name,
    description,
    intent_it_serves,
    implementation_ref = '',
    why_existing_patterns_didnt_fit,
    ontology_refs = [],
  } = params;

  const candidatesDir = join(basePath, 'patterns', '_candidates');
  if (!existsSync(candidatesDir)) mkdirSync(candidatesDir, { recursive: true });

  const existing = loadExistingCandidates(candidatesDir);
  const incomingText = compositeText(pattern_name, params.description, params.intent_it_serves);
  const similar = existing
    .map(e => ({
      ...e,
      similarity: stringSimilarity(
        incomingText,
        compositeText(e.pattern_name, e.description, e.intent_it_serves)
      ),
    }))
    .filter(e => e.similarity > 0.2)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);

  const frequencyCount = similar.length + 1;
  const status = frequencyCount >= 3 ? 'ready_for_ratification'
               : frequencyCount === 2 ? 'needs_more_signal'
               : 'logged';
  const candidateId = generateCandidateId(pattern_name);

  const yamlContent = [
    `# Design Mind Pattern Candidate`,
    `# Generated: ${new Date().toISOString()}`,
    `# Status: ${status}`,
    `# NOTE: written locally — API was unreachable. Submit to design-mind-mcp when online.`,
    ``,
    `candidate_id: "${candidateId}"`,
    `pattern_name: "${pattern_name}"`,
    `status: ${status}`,
    `frequency_count: ${frequencyCount}`,
    ``,
    `description: >`,
    `  ${description.replace(/\n/g, '\n  ')}`,
    ``,
    `intent_it_serves: >`,
    `  ${intent_it_serves.replace(/\n/g, '\n  ')}`,
    ``,
    `why_existing_patterns_didnt_fit: >`,
    `  ${why_existing_patterns_didnt_fit.replace(/\n/g, '\n  ')}`,
    ``,
    implementation_ref ? `implementation_ref: "${implementation_ref}"` : `implementation_ref: null`,
    ``,
    `ontology_refs:`,
    ...(Array.isArray(ontology_refs) && ontology_refs.length > 0
      ? ontology_refs.map(r => `  - ${r}`)
      : ['  []']),
    ``,
    `similar_candidates:`,
    ...(similar.length > 0
      ? similar.map(s => `  - file: ${s.file}\n    pattern_name: "${s.pattern_name}"\n    similarity: ${s.similarity.toFixed(2)}`)
      : ['  []']),
    ``,
    `# Instructions for human ratification:`,
    `# 1. Review the description and intent`,
    `# 2. Check similar_candidates — merge if duplicate`,
    `# 3. If valid: create patterns/${pattern_name}/ with meta.yaml and component.tsx`,
    `# 4. Run: node server/src/seed.js to re-index`,
  ].join('\n');

  writeFileSync(join(candidatesDir, `${candidateId}.yaml`), yamlContent, 'utf-8');
  return { candidate_id: candidateId, similar_candidates: similar.map(s => ({ file: s.file, pattern_name: s.pattern_name })), frequency_count: frequencyCount, status, source: 'local_fallback' };
}

/**
 * Submits a novel pattern candidate to the hosted API.
 * Falls back to local file write if the API is unreachable.
 */
export async function reportPattern(params, basePath) {
  const payload = {
    pattern_name:                    params.pattern_name,
    type:                            params.type || 'decision',
    description:                     params.description,
    intent_it_serves:                params.intent_it_serves,
    why_existing_patterns_didnt_fit: params.why_existing_patterns_didnt_fit,
    ontology_refs:                   params.ontology_refs || [],
    implementation_ref:              params.implementation_ref || null,
    submitted_by: process.env.DESIGN_MIND_PROJECT || basePath.split('/').pop() || 'unknown',
  };

  try {
    const result = await submitToApi(payload);
    if (result.status === 201) {
      process.stderr.write(`[reportPattern] Submitted to API: ${result.body.candidate_id} (${result.body.status})\n`);
      return result.body;
    }
    return localFallback(params, basePath, `API returned ${result.status}`);
  } catch (err) {
    return localFallback(params, basePath, err.message);
  }
}

// ── Episodic memory reader ────────────────────────────────────────────────────

function loadSimilarBuilds(basePath, searchText) {
  const logPath = join(basePath, 'memory', 'episodic-log.jsonl');
  if (!existsSync(logPath)) return [];

  try {
    const lines = readFileSync(logPath, 'utf-8').split('\n').filter(Boolean);
    const entries = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

    // Simple keyword match against intent field
    const keywords = searchText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const scored = entries
      .filter(e => e.intent)
      .map(e => {
        const intentLower = e.intent.toLowerCase();
        const matchCount = keywords.filter(k => intentLower.includes(k)).length;
        return { ...e, matchCount };
      })
      .filter(e => e.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 3);

    return scored.map(e => ({
      build_id: e.id || 'unknown',
      intent: e.intent || '',
      what_worked: e.what_worked || '',
      what_to_watch: e.what_to_watch || '',
    }));
  } catch {
    return [];
  }
}
