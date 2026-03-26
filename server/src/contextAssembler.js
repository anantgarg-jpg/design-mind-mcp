/**
 * contextAssembler.js
 * Core logic for the three MCP tools.
 *
 * Tools:
 *   consultBeforeBuild  — pre-generation context retrieval
 *   reviewOutput        — post-generation critique
 *   reportPattern       — novel pattern candidate logging
 */

import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadGenome, getGenomeForLLM, resolveTsx } from './genomeLoader.js';
import { callDesignMind, callCritic } from './llmClient.js';

// ── Episodic memory writer ────────────────────────────────────────────────────
function logEpisodic(entry) {
  try {
    const BASE_PATH = join(new URL(import.meta.url).pathname, '..', '..', '..');
    const memDir  = join(BASE_PATH, 'memory');
    const logPath = join(memDir, 'episodic-log.jsonl');
    if (!existsSync(memDir)) mkdirSync(memDir, { recursive: true });
    appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8');
  } catch {
    // Non-fatal: episodic logging must never interrupt the tool response
  }
}
// ── Tokenizer ─────────────────────────────────────────────────────────────────
// Used for not_when penalty, composition hint checks, and keyword scoring.
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2);
}

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

// ── Stable sort ───────────────────────────────────────────────────────────────
// When two results have scores within SCORE_EPSILON of each other, sort
// alphabetically by id. This guarantees the same pattern order is returned
// across different threads / runs for the same input — critical for consistency.
const SCORE_EPSILON = 0.001;
function stableSort(results) {
  return results.slice().sort((a, b) => {
    const diff = b.score - a.score;
    if (Math.abs(diff) < SCORE_EPSILON) return a.id.localeCompare(b.id);
    return diff;
  });
}

// FAMILY_MAP and familyRankScore removed — structural_family is deprecated for scoring.
// component_type structural boost (stage1 via structuralBoost) remains active.

// ── Change 1: not_when penalty ────────────────────────────────────────────────
// Demotes blocks whose not_when text overlaps strongly with the intent.
function applyNotWhenPenalty(scoredBlocks, intentTokens) {
  return scoredBlocks.map(block => {
    const notWhenVal = block.metadata?.not_when;
    const notWhenText = Array.isArray(notWhenVal)
      ? notWhenVal.join(' ')
      : (notWhenVal || '');
    const notWhenTokens = tokenize(notWhenText);
    const overlap = notWhenTokens.filter(t => intentTokens.includes(t)).length;
    if (overlap >= 2) {
      const demotedScore = block.score * 0.3;
      return {
        ...block,
        score: demotedScore,
        adjusted_score: demotedScore,
        not_when_penalised: true,
      };
    }
    return block;
  });
}

// ── Change 2: composition hints ───────────────────────────────────────────────
// When two blocks each score in the ambiguous zone and are structurally distinct,
// suggest composing them rather than inventing a third block.
// Accepts boostedResults (raw scored blocks) so _embedding_hint is read from
// r.metadata — it is not exposed in the patterns output.
function buildCompositionHints(boostedResults) {
  const qualifiers = boostedResults.filter(r => r.score >= 0.45 && r.score <= 0.72);
  const hints = [];
  for (let i = 0; i < qualifiers.length && hints.length < 2; i++) {
    for (let j = i + 1; j < qualifiers.length && hints.length < 2; j++) {
      const a = qualifiers[i];
      const b = qualifiers[j];
      const aFam = a.metadata?.structural_family;
      const bFam = b.metadata?.structural_family;
      if (aFam && aFam === bFam) continue;
      const aTokens = tokenize(a.metadata?.embedding_hint || a.metadata?.summary || '');
      const bTokens = tokenize(b.metadata?.embedding_hint || b.metadata?.summary || '');
      const overlap = aTokens.filter(t => bTokens.includes(t)).length;
      if (overlap > 3) continue;
      const aSummary = (a.metadata?.summary || '').trim().replace(/\s+/g, ' ').substring(0, 120);
      const bSummary = (b.metadata?.summary || '').trim().replace(/\s+/g, ' ').substring(0, 120);
      hints.push({
        blocks: [a.id, b.id],
        rationale: `${aSummary} ${bSummary}`.trim().substring(0, 220),
        usage: `Render ${b.id} inside ${a.id}'s secondary metadata slot.`,
      });
    }
  }
  return hints;
}

// ── Change 3: structure-vs-content gap probe ──────────────────────────────────
// Fires only in the 0.55–0.74 ambiguous zone to pre-empt false report_pattern calls.
function buildGapProbe(topPattern) {
  if (!topPattern) return null;
  const score = topPattern.relevance_score;
  if (score < 0.55 || score > 0.74) return null;
  return {
    matched_block: topPattern.id,
    confidence: score,
    question: `Does your intent change the slot structure of ${topPattern.id}, or just its content — labels, domain, entity type, icon?`,
    if_content: `Use ${topPattern.id} as-is. Content changes do not require a new block or report_pattern.`,
    if_structure: `Describe the structural difference specifically, then consider calling report_pattern. Do not invent a new block without first confirming the structure genuinely differs.`,
  };
}

/**
 * Keyword-based scoring: score each item in the array against a query text.
 * Returns [{id, score, metadata}] sorted by score descending, capped at k results.
 * Items are expected to have id, summary, when, description, embedding_hint, or raw fields.
 */
function keywordScore(text, items, k) {
  const queryTokens = tokenize(text);
  if (queryTokens.length === 0) return [];
  const querySet = new Set(queryTokens);

  const scored = items.map(item => {
    const fields = [
      item.id || '',
      item.summary || '',
      item.description || '',
      item.embedding_hint || '',
      item.when || '',
      item.use || '',
      item.raw || '',
      item.component_type || '',
      item.domain || '',
      (item.tags || []).join(' '),
    ].join(' ');
    const itemTokens = tokenize(fields);
    const itemSet = new Set(itemTokens);
    const intersection = [...querySet].filter(t => itemSet.has(t)).length;
    const union = new Set([...querySet, ...itemSet]).size;
    const score = union > 0 ? intersection / union : 0;
    return { id: item.id, score, metadata: item };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

async function queryPatterns(text, k, patternIndex) {
  return keywordScore(text, patternIndex || [], k);
}

async function queryRules(text, k, ruleIndex) {
  return keywordScore(text, ruleIndex || [], k);
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

// Change 2: Determine whether a constraint is "direct" (governs the component
// being built right now) or "carry_forward" (applies to sub-components —
// confirmation dialogs, modal copy, form error states, button behavior).
// Based on reading each constraint's text:
//   9  — destructive confirmation → sub-component (confirmation dialog)
//   12 — unsaved-changes warning → sub-component behavior
//   13 — form error token → sub-component error state
//   16 — confirmation dialog copy → sub-component dialog
//   17 — modal secondary "Close" label → sub-component button behavior
// All others govern the component's own layout, display, or visual treatment.
const CARRY_FORWARD_IDS = new Set([9, 12, 13, 16, 17]);
// C22: no className override of family_invariants
// C23: downstream review when composed block changes
// C24: meta.yaml sync when .tsx changes
// These are commit/review-time constraints, not design-time.
const GOVERNANCE_IDS = new Set([22, 23, 24]);

function determineConstraintScope(id) {
  if (GOVERNANCE_IDS.has(id)) return 'governance';
  if (CARRY_FORWARD_IDS.has(id)) return 'carry_forward';
  return 'direct';
}

// Identify which safety constraints are in scope for an intent
function getSafetyConstraintsInScope(intent, componentType, domain, kb) {
  const allConstraints = kb.safety.constraints || [];
  const intentLower = (intent + ' ' + domain).toLowerCase();

  // Always return all safety constraints — per the spec: "always included, never filtered"
  return allConstraints.map(c => ({
    constraint_id:   c.id,
    rule:            c.text,
    applies_because: inferAppliesBecause(c, intentLower, componentType),
    scope:           determineConstraintScope(c.id),
  }));
}

// Design Mind improvement: Change 1 — safety blocking vs confidence gating
// CONSTRAINT_RELEVANCE maps component_type / domain to the constraint IDs that are
// structurally in scope. Only constraints for types/domains in this map are flagged.
// Unlisted types fall through to the terminology constraints (13, 14) which always apply.
const CONSTRAINT_RELEVANCE = {
  'banner':          [1, 2, 3, 4, 5, 6, 7],   // severity color + alert dismissal
  'clinical-alerts': [1, 2, 3, 4, 5, 6, 7],
  'header':          [8, 9, 10],               // patient identity
  'patient-data':    [8, 9, 10],
  'form':            [11, 12],                 // confirmation
  'modal':           [11, 12],
  'table':           [12],                     // bulk action only
  'list':            [12],
};

function detectSafetyViolations(intent, componentType, domain, kb) {
  const idsFromType   = CONSTRAINT_RELEVANCE[componentType] || [];
  const idsFromDomain = CONSTRAINT_RELEVANCE[domain]        || [];
  const inScope       = new Set([...idsFromType, ...idsFromDomain]);

  // Unlisted component types always check terminology + copy/language + CTA + accessibility (13–21)
  if (idsFromType.length === 0 && idsFromDomain.length === 0) {
    [13, 14, 15, 16, 17, 18, 19, 20, 21].forEach(id => inScope.add(id));
  }

  // Copy, language, CTA display, and accessibility constraints always apply regardless of component type
  [15, 16, 17, 18, 19, 20, 21].forEach(id => inScope.add(id));

  return [...inScope].sort((a, b) => a - b);
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
  // Terminology + copy/language + CTA display + accessibility rules (13–21) — always apply
  return 'Clinical terminology, copy/language, CTA display, and accessibility rules always apply';
}

// ── Fix 3: Ontology resolver — text-based, with domain defaults ───────────────
// Resolves ontology refs by matching against intent_description text (canonical names +
// synonyms). Merges with domain-based defaults. Returns shaped objects with build-relevant
// notes. Replaces the old pattern-ref lookup (getOntologyRefs) which only matched
// whatever the top pattern declared and returned [] for unrecognised concepts.
const DOMAIN_ONTOLOGY_DEFAULTS = {
  'clinical-alerts': ['Alert', 'AlertSeverity'],
  'patient-data':    ['Patient'],
  'care-gaps':       ['CareGap', 'Patient'],
  'tasks':           ['Task'],
};

function resolveOntologyFromIntent(intentDescription, domain, kb) {
  const intentLower = (intentDescription || '').toLowerCase();
  const result = [];
  const seen = new Set();

  const allEntities = kb.ontology.entities || {};
  const allStates   = kb.ontology.states   || {};
  const allActions  = kb.ontology.actions  || {};

  function addEntityEntry(key, entity) {
    const canonical = entity.canonical_name || key;
    if (seen.has(canonical)) return;
    seen.add(canonical);
    result.push({
      concept:        canonical,
      canonical_name: canonical,
      ui_label:       canonical,
      source:         'ontology/entities.yaml',
      notes: entity.definition
        ? entity.definition.replace(/\s+/g, ' ').trim().substring(0, 200)
        : '',
    });
  }

  function addStateGroupEntry(groupKey, group) {
    if (seen.has(groupKey)) return;
    seen.add(groupKey);
    const valueLabels = group.values
      ? Object.values(group.values).map(v => v.canonical_name).filter(Boolean).join(', ')
      : '';
    result.push({
      concept:        groupKey,
      canonical_name: groupKey,
      ui_label:       groupKey,
      source:         'ontology/states.yaml',
      notes:          valueLabels ? `Values: ${valueLabels}` : '',
    });
  }

  function addActionEntry(key, action) {
    const canonical = action.canonical_name || key;
    if (seen.has(canonical)) return;
    seen.add(canonical);
    const noteParts = [];
    if (action.meaning) {
      noteParts.push(action.meaning.replace(/\s+/g, ' ').trim().substring(0, 100));
    }
    if (action.confirmation_required !== undefined) {
      noteParts.push(`confirmation_required: ${action.confirmation_required}`);
    }
    if (action.audit_logged !== undefined) {
      noteParts.push(`audit_logged: ${action.audit_logged}`);
    }
    if (action.applies_to && action.applies_to.length > 0) {
      noteParts.push(`applies_to: [${action.applies_to.join(', ')}]`);
    }
    if (action.constraint) {
      noteParts.push(action.constraint);
    }
    result.push({
      concept:        canonical,
      canonical_name: canonical,
      ui_label:       action.ui_label || canonical,
      source:         'ontology/actions.yaml',
      notes:          noteParts.join('. '),
    });
  }

  // ── Text matching: entities ───────────────────────────────────────────────
  for (const [key, entity] of Object.entries(allEntities)) {
    const names = [entity.canonical_name, ...(entity.synonyms || [])].filter(Boolean);
    if (names.some(n => intentLower.includes(n.toLowerCase()))) {
      addEntityEntry(key, entity);
    }
  }

  // ── Text matching: state groups ───────────────────────────────────────────
  for (const [groupKey, group] of Object.entries(allStates)) {
    if (!group.values) continue;
    const groupLower = groupKey.toLowerCase();
    let matched = intentLower.includes(groupLower);
    if (!matched) {
      for (const [, valObj] of Object.entries(group.values)) {
        const terms = [valObj.canonical_name, ...(valObj.synonyms || [])].filter(Boolean);
        if (terms.some(t => intentLower.includes(t.toLowerCase()))) {
          matched = true;
          break;
        }
      }
    }
    if (matched) addStateGroupEntry(groupKey, group);
  }

  // ── Text matching: actions ────────────────────────────────────────────────
  for (const [key, action] of Object.entries(allActions)) {
    const names = [action.canonical_name, ...(action.synonyms || [])].filter(Boolean);
    if (names.some(n => intentLower.includes(n.toLowerCase()))) {
      addActionEntry(key, action);
    }
  }

  // ── Domain defaults (merged, deduplicated) ────────────────────────────────
  const defaults = DOMAIN_ONTOLOGY_DEFAULTS[domain] || [];
  for (const conceptName of defaults) {
    if (seen.has(conceptName)) continue;
    // Check entities
    const entity = allEntities[conceptName];
    if (entity) { addEntityEntry(conceptName, entity); continue; }
    // Check state groups
    const stateGroup = allStates[conceptName];
    if (stateGroup) { addStateGroupEntry(conceptName, stateGroup); continue; }
    // Check actions
    const action = allActions[conceptName];
    if (action) { addActionEntry(conceptName, action); }
  }

  return result;
}

// ── Fix 4: Ontology gap detector ───────────────────────────────────────────────
// After the resolver runs, extract candidate action/entity names from
// intent_description and check each against the ontology. Returns gap strings
// for any candidate that has no canonical definition.
// Order: unmatched (no synonym) before near-matched (synonym exists) — the
// unmatched case is more urgent because there's no canonical to redirect to.
function detectOntologyGaps(intentDescription, kb) {
  const gaps = [];
  const intent = intentDescription || '';
  const allActions = kb.ontology.actions || {};

  // Build canonical lookup and synonym lookup for actions
  const canonicalActions = new Map(); // lowercase canonical → action entry
  const synonymActions   = new Map(); // lowercase synonym → { canonical, entry }

  for (const [, action] of Object.entries(allActions)) {
    const c = (action.canonical_name || '').toLowerCase();
    if (c) canonicalActions.set(c, action);
    for (const syn of (action.synonyms || [])) {
      const s = syn.toLowerCase();
      if (!synonymActions.has(s)) {
        synonymActions.set(s, { canonical: action.canonical_name, entry: action });
      }
    }
  }

  // Extract candidate action words from intent using two strategies:
  //   1. Words after "= " in "Severity = Action1, Action2, Action3" patterns
  //   2. Words in "actions per item:", "actions:", "user can" phrases
  const candidates = new Set();

  // Strategy 1: "= Word1, Word2, …" — stops at . ; ( or end
  const eqPattern = /=\s*([A-Za-z][A-Za-z,\s/]*?)(?:[.;(]|$)/g;
  let m;
  while ((m = eqPattern.exec(intent)) !== null) {
    for (const w of m[1].split(/[,\s/]+/)) {
      const clean = w.replace(/[^a-zA-Z]/g, '');
      if (clean.length >= 3 && /^[A-Z]/.test(clean)) candidates.add(clean);
    }
  }

  // Strategy 2: after "actions per item:", "actions:", "user can" up to the period
  const phrasePat = /(?:actions?(?:\s+per\s+\w+)?|user\s+can)\s*[:\s]\s*([^.]+)/gi;
  while ((m = phrasePat.exec(intent)) !== null) {
    for (const w of m[1].split(/[,;\s/]+/)) {
      const clean = w.replace(/[^a-zA-Z]/g, '');
      if (clean.length >= 3 && /^[A-Z]/.test(clean)) candidates.add(clean);
    }
  }

  // Skip words that are clearly severity levels, entities, or common modifiers
  const skipWords = new Set([
    'Critical', 'High', 'Medium', 'Low', 'The', 'And', 'For', 'With',
    'This', 'That', 'Each', 'All', 'Item', 'Items', 'View', 'Page',
    'Full', 'Today', 'Care', 'When', 'Only', 'After', 'From', 'Into',
    'Once', 'Last', 'First', 'Includes', 'Shows', 'Agent', 'Source',
    'Badge', 'Name', 'Reason', 'State', 'Empty', 'Patient', 'Manager',
    'Work', 'Queue', 'Priority', 'MRN', 'Timestamp',
  ]);

  const noMatch   = [];  // not canonical, not a synonym of anything
  const nearMatch = [];  // not canonical, but is a synonym → near-match

  for (const candidate of candidates) {
    if (skipWords.has(candidate)) continue;
    const lower = candidate.toLowerCase();
    if (canonicalActions.has(lower)) continue; // exact canonical → no gap
    const syn = synonymActions.get(lower);
    if (syn) {
      nearMatch.push({ candidate, canonical: syn.canonical, synonyms: syn.entry.synonyms || [] });
    } else {
      noMatch.push({ candidate });
    }
  }

  // Unmatched (most urgent) first, then near-matched
  for (const { candidate } of noMatch) {
    gaps.push(
      `Action '${candidate}' is referenced in the intent but has no canonical definition in ontology/actions.yaml. ` +
      `No close synonym match found. If this is a new action, it should be added to ontology/actions.yaml before this component is built.`
    );
  }
  for (const { candidate, canonical, synonyms } of nearMatch) {
    gaps.push(
      `Action '${candidate}' is referenced in the intent but has no canonical definition in ontology/actions.yaml. ` +
      `Verify with the ontology owner before building — using non-canonical labels creates product-wide inconsistency. ` +
      `Closest canonical action may be '${canonical}' (synonyms include: ${synonyms.join(', ')}).`
    );
  }

  return gaps;
}

// ── (legacy — kept for direct pattern-ref resolution if needed internally) ────
function _getOntologyRefsByPattern(ontologyRefs, kb) {
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

// ── Fix 5: Signal-based because generator ─────────────────────────────────────
// Replaces the old template-string approach. Extracts specific signals from the
// intent and pattern metadata, then builds a targeted explanation from them.
// Returns null (never "") if no meaningful because can be generated.
//
// Signal priority:
//   1. Action names from intent found in pattern fields (when/summary/embedding_hint)
//   2. Ontology refs resolved for this intent that are relevant to the pattern
//   3. critical_rules or safety_refs that directly relate to intent constraints
//   4. Structural fallback if no specific signals fire
// Low-confidence matches get an honest "low confidence" note with a reconsider hint.
function generateBecause(patternResult, intentDesc, matchedOntologyRefs, domain, componentType) {
  const patternId    = patternResult.id || '';
  const meta         = patternResult.metadata || {};
  const summary      = (meta.summary || '').trim();
  const whenArr      = Array.isArray(meta.when)     ? meta.when     : (meta.when     ? [String(meta.when)]     : []);
  const notWhenArr   = Array.isArray(meta.not_when)  ? meta.not_when : (meta.not_when  ? [String(meta.not_when)]  : []);
  const critRules    = Array.isArray(meta.critical_rules) ? meta.critical_rules : [];
  const safetyRefs   = Array.isArray(meta.safety_refs)    ? meta.safety_refs    : [];
  const embHint      = (meta.embedding_hint || '').toLowerCase();
  const intentLower  = (intentDesc || '').toLowerCase();
  const score        = typeof patternResult.score === 'number'
    ? patternResult.score
    : (patternResult.relevance_score || 0);

  if (!intentDesc && !summary) return null;

  // Full searchable text of the pattern
  const patternText = [summary, ...whenArr, embHint, ...critRules, ...safetyRefs]
    .join(' ').toLowerCase();

  // ── Signal 1: action words from intent that appear in pattern fields ─────
  const ACTION_WORDS = [
    'acknowledge', 'dismiss', 'escalate', 'archive', 'delete',
    'assign', 'accept', 'snooze', 'close gap', 'close',
  ];
  const matchedActions = ACTION_WORDS.filter(a =>
    intentLower.includes(a) && patternText.includes(a)
  );

  // ── Signal 2: ontology refs relevant to this pattern ────────────────────
  const relevantOntologyRefs = (matchedOntologyRefs || []).filter(ref =>
    patternText.includes((ref.canonical_name || '').toLowerCase())
  ).map(ref => ref.canonical_name);

  // ── Signal 3: critical_rules / safety_refs that map to intent ───────────
  const hasSeverityInIntent    = /critical|severity|high|medium|low/.test(intentLower);
  const hasConfirmationInIntent = /confirmation|confirm/.test(intentLower);

  const severitySafetyMatch = (hasSeverityInIntent || hasConfirmationInIntent) &&
    safetyRefs.length > 0 &&
    safetyRefs.some(sr => /critical|dismiss|severity|acknowledge/.test(sr.toLowerCase()));

  const severityCritRulesMatch = hasSeverityInIntent && critRules.length > 0 &&
    critRules.some(r => /critical|dismiss|acknowledge|severity/.test(r.toLowerCase()));

  const confirmationCritRulesMatch = hasConfirmationInIntent && critRules.length > 0 &&
    critRules.some(r => /confirm|destructive/.test(r.toLowerCase()));

  // ── Extract severity action rules from intent (e.g. "Critical = Acknowledge only") ──
  const criticalRuleMatch = intentDesc.match(/Critical\s*=\s*([^;.]+)/i);
  const otherSeverityMatch = intentDesc.match(/(?:High|Medium|Low)[/\w,\s]*=\s*([^;.(]+)/i);

  // ── Low confidence path ──────────────────────────────────────────────────
  if (score < 0.55) {
    // Find the most structurally relevant not_when hint
    const relevantNotWhen = notWhenArr.find(nw => {
      const nwl = nw.toLowerCase();
      return nwl.includes('paged') || nwl.includes('single') || nwl.includes('scroll') ||
             nwl.includes('queue') || nwl.includes('priority') || nwl.includes('list');
    });
    const summaryHint = summary ? ` — ${summary.substring(0, 100)}` : '';
    const notWhenHint = relevantNotWhen
      ? ` Review: not_when says "${relevantNotWhen}".`
      : '';
    return (
      `Matched at low confidence${summaryHint}.${notWhenHint} ` +
      `Only use if the intent genuinely requires this pattern's structure.`
    );
  }

  // ── Assemble the because string from fired signals ───────────────────────
  const parts = [];

  // Opening clause: what specific thing in the intent drove the match
  if (hasSeverityInIntent && (severityCritRulesMatch || patternText.includes('severity'))) {
    // Severity-aware pattern + severity-based intent
    const critClause  = criticalRuleMatch  ? `Critical=${criticalRuleMatch[1].trim()}`  : '';
    const otherClause = otherSeverityMatch ? otherSeverityMatch[1].trim().substring(0, 60) : '';
    const actionDetail = [critClause, otherClause].filter(Boolean).join(', ');
    parts.push(
      `the intent describes severity-grouped alerts with per-severity action rules` +
      (actionDetail ? ` (${actionDetail})` : '')
    );
  } else if (hasConfirmationInIntent && confirmationCritRulesMatch) {
    parts.push(`the intent specifies a confirmation dialog for destructive actions`);
  } else if (matchedActions.length > 0) {
    parts.push(
      `the intent's actions (${matchedActions.join(', ')}) appear in ${patternId}'s ` +
      `when/summary/embedding_hint fields`
    );
  } else if (relevantOntologyRefs.length > 0) {
    parts.push(
      `ontology concepts from the intent (${relevantOntologyRefs.join(', ')}) ` +
      `align with ${patternId}'s declared use case`
    );
  } else {
    // Structural fallback
    parts.push(
      summary
        ? `the ${domain} ${componentType} intent structurally aligns with: ${summary.substring(0, 100)}`
        : `${patternId} is the closest genome pattern for this ${componentType} intent`
    );
  }

  // Second clause: what makes this pattern specifically authoritative
  if (severitySafetyMatch) {
    parts.push(
      `${patternId}'s safety_refs (${safetyRefs.slice(0, 2).join(', ')}) ` +
      `enforce exactly the constraints the intent describes`
    );
  } else if (confirmationCritRulesMatch) {
    parts.push(`${patternId} is the designated block for destructive confirmation`);
  } else if (matchedActions.length > 0 && critRules.length > 0) {
    const relevantRule = critRules.find(r =>
      matchedActions.some(a => r.toLowerCase().includes(a))
    );
    if (relevantRule) {
      parts.push(`critical_rule: "${relevantRule.substring(0, 100)}"`);
    }
  }

  return parts.length > 0
    ? `Matched because ${parts.join('. ')}.`
    : (summary
        ? `Matched because the ${domain} ${componentType} intent aligns with: ${summary}.`
        : null);
}

// ── Fix 1: Secondary structural retrieval pass ─────────────────────────────────
// For page and panel component types only, a second pass finds blocks from four
// structural families that are invisible to the primary vector search because their
// embedding vocabulary doesn't overlap with display-heavy intent language.
//
// The pass scans kb.patterns directly (bypassing the index) so it always finds the
// canonical structural block even if it scored near-zero in retrieval. Blocks with
// a structural_role field are preferred over those without one.
//
// Structural inclusions are APPENDED after the primary top-N — they are additive,
// not substitutions. structural_inclusion: true marks them so the agent can treat
// them differently from retrieval-ranked results.

const STRUCTURAL_PASS_FAMILIES = [
  'actionable-list-row',
  'section-divider',
  'page-navigation',
  'section-organiser',
];

// Intent-specific because string for each structural family.
// References signals from the intent where possible.
function generateStructuralBecause(blockId, meta, intentDesc) {
  const family = meta?.structural_family || '';
  const intentLower = (intentDesc || '').toLowerCase();

  const hasList   = /queue|list|items|work item|worklist/i.test(intentDesc);
  const hasAction = /action|acknowledge|dismiss|accept|snooze|escalate/i.test(intentDesc);
  const hasSeverityGrouping = /grouped by severity|severity.*group|critical\s*[→>]/i.test(intentDesc) ||
    (/critical/i.test(intentDesc) && /high/i.test(intentDesc) && /medium/i.test(intentDesc) && /low/i.test(intentDesc));

  // Extract severity sequence from intent for SectionHeader because
  const severitySeqMatch = intentDesc.match(/Critical\s*[→>]\s*High\s*[→>]\s*Medium\s*[→>]\s*Low/i);
  const severitySeq = severitySeqMatch ? severitySeqMatch[0] : 'Critical → High → Medium → Low';

  switch (family) {
    case 'actionable-list-row': {
      if (hasList && hasAction) {
        const severityNote = hasSeverityGrouping
          ? ` The intent's severity-grouped structure (${severitySeq}) maps directly to ${blockId}'s scan-and-act model — one row per item, primary action right-aligned, accent stripe driven by severity.`
          : '';
        return (
          `Included as a structural block — page-level intents that describe a list, queue, or collection of items ` +
          `require a row container pattern. ${blockId} is the canonical list row for any scan-and-act workflow.` +
          severityNote +
          ` Consider this the default row block unless the intent specifically calls for a read-only or non-actionable list.`
        );
      }
      return (
        `Included as a structural block — ${blockId} defines how individual items are rendered ` +
        `in the collection this page describes.`
      );
    }

    case 'section-divider':
      if (hasSeverityGrouping) {
        return (
          `Included as a structural block — the intent describes severity-grouped sections (${severitySeq}). ` +
          `${blockId} is the canonical block for naming and counting groups within a list. ` +
          `Use one ${blockId} per severity group with countVariant matching the group's urgency level.`
        );
      }
      return (
        `Included as a structural block — ${blockId} provides section labels to organize the grouped ` +
        `content this page describes.`
      );

    case 'page-navigation':
      return (
        `Included as a structural block — ${blockId} is available if the item count can grow beyond a single ` +
        `viewport. Review the data-density rule before enabling pagination — if all critical items must be ` +
        `visible at once, prefer scroll over pagination.`
      );

    case 'section-organiser':
      return (
        `Included as a structural block — ${blockId} provides filter, search, and sort controls above ` +
        `the list. Use if the user needs to filter items by severity, date, or patient attributes.`
      );

    default:
      return (
        `Included as a structural block — ${blockId} supports the ${family} structure this page requires.`
      );
  }
}

// Build the structural inclusions list for a page/panel intent.
// allRetrieved = _rawBoosted (all 8 pre-slice results, used only to look up
//                retrieval scores for display — not for candidate selection)
// primaryTopN  = boostedResults (the top-5 already in the patterns output)
//
// Candidate selection uses kb.patterns (the full library) rather than the
// retrieval pool, because the whole point of this pass is to surface blocks
// that the primary retrieval missed. Confidence is the tie-breaker within
// each family pool — the most-ratified block wins, not the highest TF-IDF scorer.
function buildStructuralInclusions(primaryTopN, allRetrieved, kb, componentType, intentDesc, domain) {
  if (!['page', 'panel'].includes(componentType)) return [];

  const primaryIds      = new Set(primaryTopN.map(r => r.id));
  // Build a score lookup from the retrieval pool for display purposes only
  const retrievedScores = new Map(allRetrieved.map(r => [r.id, parseFloat(r.score.toFixed(4))]));

  const EMPTY_USAGE_SIGNAL = { renders_total: 0, products: [], override_rate: 0.0 };
  const inclusions = [];

  for (const targetFamily of STRUCTURAL_PASS_FAMILIES) {
    // ── Step 1: find best candidate from the full block library ──────────────
    // Scan kb.patterns (not retrieval results) so we always find the canonical
    // block regardless of whether it scored in the primary retrieval pass.
    const allCandidates = (kb.patterns || []).filter(p =>
      p.structural_family === targetFamily &&
      p.status === 'active'    // skip placeholder / deprecated
    );
    if (allCandidates.length === 0) continue;

    // Prefer blocks with structural_role (Fix 4) over those without.
    // Within the preferred pool, sort by confidence — most-ratified wins.
    const withRole = allCandidates.filter(p => p.structural_role);
    const pool     = withRole.length > 0 ? withRole : allCandidates;
    const best     = pool.slice().sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    if (!best) continue;

    // ── Step 2: skip if already surfaced in the primary top-5 ────────────────
    if (primaryIds.has(best.id)) continue;

    // ── Step 3: build the inclusion entry ─────────────────────────────────────
    // Use retrieval score if the block happened to appear in the retrieval pool,
    // otherwise 0 (explicitly excluded by score cutoff, not a retrieval failure).
    const candScore = retrievedScores.get(best.id) || 0;

    inclusions.push({
      id:               best.id,
      level:            best.level || null,
      family_invariants: best.family_invariants || [],
      relevance_score:  candScore,
      structural_family: best.structural_family || null,
      component_type:   best.component_type || null,
      summary:          (best.summary || '').trim(),
      when:             formatWhen(best.when),
      not_when:         formatNotWhen(best.not_when),
      because:          generateStructuralBecause(best.id, best, intentDesc),
      confidence:       best.confidence || 0.0,
      structural_inclusion: true,
      usage_signal:     EMPTY_USAGE_SIGNAL,
    });
  }

  return inclusions;
}

// ── Change 1: Intent quality gate ────────────────────────────────────────────
// Scores the input against four signals before retrieval runs.
// If score < 0.5, returns a needs_clarification response — no patterns, no rules.
function scoreIntentQuality(intentDescription, userType, componentType) {
  const signals = {
    hasUserContext:      Array.isArray(userType) && userType.length > 0,
    hasDataDescription:  /patient|record|list|gap|task|alert|protocol|score|count|metric|data|form|table|row|card/i.test(intentDescription),
    hasActionContext:    /action|button|click|close|assign|submit|view|edit|create|confirm|acknowledge|filter|select|search|add|remove/i.test(intentDescription),
    hasSpecificity:      intentDescription.trim().split(/\s+/).length > 8,
  };
  const score   = Object.values(signals).filter(Boolean).length / Object.keys(signals).length;
  const missing = Object.entries(signals)
    .filter(([, v]) => !v)
    .map(([k]) => k.replace('has', '').replace(/([A-Z])/g, '_$1').toLowerCase().slice(1));
  return { score, signals, missing };
}

// ── TOOL 1: consult_before_build ─────────────────────────────────────────────

/**
 * Returns the design genome construction packet for the agent's stated intent.
 * Uses the LLM-based Design Mind agent via llmClient and the genome loader.
 */
export async function consultBeforeBuild(params, _kb, _patternIndex, _ruleIndex, _surfaces) {
  const {
    intent_description,
    scope = 'block',
    domain,
    user_type,
  } = params;

  // 1. Load genome (cached after first call)
  const genome = loadGenome();
  const genomeContext = getGenomeForLLM();

  // 2. Call LLM
  const llmResult = await callDesignMind({
    genomeContext,
    intent: intent_description,
    scope,
    domain,
    userType: user_type,
  });

  // 3. Resolve .tsx files for selected blocks
  const selectedIds = llmResult.selected_blocks || [];
  const tsxMap = resolveTsx(selectedIds);

  // 4. Build blocks array
  const blocks = selectedIds.map(id => {
    const entry = genome.blocks.get(id);
    if (!entry) return null;
    return {
      id,
      level: entry.meta.level || 'composite',
      meta_yaml: entry.meta._metaRaw || JSON.stringify(entry.meta),
      component_tsx: tsxMap.get(id) || '',
      family_invariants: entry.meta.family_invariants || [],
      import_path: `@/blocks/${id}/${id}`,
      when: Array.isArray(entry.meta.when) ? entry.meta.when.join('; ') : (entry.meta.when || ''),
      not_when: Array.isArray(entry.meta.not_when) ? entry.meta.not_when.join('; ') : (entry.meta.not_when || ''),
    };
  }).filter(Boolean);

  // 5. Build primitive_guard — ALL primitive-level blocks always
  const allPrimitives = [];
  for (const [id, entry] of genome.blocks) {
    if (entry.meta.level === 'primitive') {
      allPrimitives.push({
        id,
        import_path: `@/blocks/${id}/${id}`,
        family_invariants: entry.meta.family_invariants || [],
      });
    }
  }

  // 6. Build rules array
  const rules = (llmResult.rules_applied || []).map(r => {
    const ruleEntry = genome.rules.get(r.rule_id);
    return {
      rule_id: r.rule_id,
      summary: r.applies_because || '',
      applies_because: r.applies_because || '',
      full_content: ruleEntry ? ruleEntry.fullContent : '',
    };
  });

  // 7. Build safety constraints
  const safety_constraints = (llmResult.safety_applied || []).map(s => ({
    constraint_id: s.constraint_id,
    rule: '',
    applies_because: s.applies_because || '',
  }));

  // 8. Surface data if surface-first
  const surfaceId = llmResult.build_mode?.anchor?.surface_id;
  const surfaceData = surfaceId ? genome.surfaces.get(surfaceId) || null : null;

  // 9. Log to episodic memory
  logEpisodic({
    timestamp: new Date().toISOString(),
    intent: intent_description,
    scope,
    domain,
    build_mode: llmResult.build_mode?.mode,
    selected_blocks: selectedIds,
    confidence: llmResult.confidence,
  });

  return {
    build_mode: llmResult.build_mode || { mode: 'block-composition', anchor: null },
    surface: surfaceData,
    blocks,
    primitive_guard: {
      instruction: 'Import these from their declared paths. Do not override family_invariants.',
      primitives: allPrimitives,
    },
    rules,
    safety_constraints,
    ontology_refs: llmResult.ontology_refs || [],
    confidence: llmResult.confidence || 0,
    gaps: llmResult.gaps || [],
  };
}

// ── TOOL 1 (legacy path — keyword-only fallback, kept for reviewOutput internals) ──

/**
 * @internal
 * Legacy keyword-based retrieval. Called by reviewOutput which still needs kb/patternIndex.
 */
async function consultBeforeBuildLegacy(params, kb, patternIndex, ruleIndex, surfaces) {
  const {
    intent_description,
    component_type = 'other',
    domain = 'other',
    user_type = [],
    product_area = '',
  } = params;

  // ── Intent quality gate (pre-retrieval) ─────────────────────────────────────
  const intentQuality = scoreIntentQuality(intent_description, user_type, component_type);
  if (intentQuality.score < 0.5) {
    return {
      status:         'needs_clarification',
      intent_quality: {
        score:   intentQuality.score,
        missing: intentQuality.missing,
      },
      questions: [
        'What data is displayed or acted on in this component? (e.g. a list of care protocols, a patient summary card, a form for logging outreach)',
        'What actions can the user take? (e.g. close a gap, assign a task, filter the list, submit a form)',
      ],
      patterns:           null,
      rules:              null,
      safety_constraints: null,
      ontology_refs:      null,
      similar_builds:     null,
      confidence:         null,
      gaps:               null,
    };
  }

  // Compose search text from all input fields
  const searchText = [
    intent_description,
    component_type,
    domain,
    toArray(user_type).join(' '),
    product_area,
  ].join(' ');

  // ── Keyword retrieval (TF-IDF Jaccard, pre-LLM candidate selection) ──────────
  const patternResults = await queryPatterns(searchText, 8, patternIndex);

  // Ranking: component_type structural boost (stage1 via TYPE_FAMILIES).
  // structural_family FAMILY_MAP boost removed — deprecated.
  // not_when penalty applied before top-5 slice (Change 1).
  const _rawBoosted = stableSort(patternResults
    .map(r => {
      const raw_score      = r.score;
      const stage1         = structuralBoost(r.metadata?.component_type, component_type);
      const adjusted_score = raw_score + stage1;
      return {
        ...r,
        raw_score,
        adjusted_score,
        score: adjusted_score,
        structurally_matched: stage1 > 0,
        family_match: false,
      };
    }));

  const intentTokens = tokenize(intent_description);
  // stableSort guarantees the same order for the same scores across threads.
  const boostedResults = stableSort(applyNotWhenPenalty(_rawBoosted, intentTokens))
    .slice(0, 5);

  let ruleResults = await queryRules(searchText, 3, ruleIndex);

  // styling-tokens and copy-voice apply to every component — always include both
  // regardless of query relevance so the model always has the token reference
  // and the copy/language rules before generating any output.
  // Change 6 — structural inclusions based on component_type:
  //   accessibility:        always (page, form, modal additionally required)
  //   destructive-actions:  modal, drawer, form
  //   interface-guidelines: page, panel
  // Deduplication ensures retrieval results are not double-listed.
  const enriched = new Map(kb.rules.map(r => [r.id, r]));

  const structuralIncludes = new Set(['styling-tokens', 'copy-voice', 'accessibility']);
  if (['modal', 'drawer', 'form'].includes(component_type)) {
    structuralIncludes.add('destructive-actions');
  }
  if (['page', 'panel'].includes(component_type)) {
    structuralIncludes.add('interface-guidelines');
  }

  for (const alwaysId of structuralIncludes) {
    if (!ruleResults.some(r => r.id === alwaysId)) {
      const rule = enriched.get(alwaysId);
      if (rule) ruleResults = [...ruleResults, { id: rule.id, score: 1.0, metadata: rule }];
    }
  }
  // Merge raw (and any other fields stripped by the index) back into each result
  ruleResults = ruleResults.map(r => ({
    ...r,
    metadata: { ...enriched.get(r.id), ...r.metadata },
  }));

  // ── Ontology refs — text-based resolver (Fixes 3 & 4) ──────────────────────
  // Computed here (before pattern assembly) so generateBecause can use it.
  const ontologyRefs = resolveOntologyFromIntent(intent_description, domain, kb);
  const ontologyGaps = detectOntologyGaps(intent_description, kb);

  // ── Pattern results ─────────────────────────────────────────────────────────
  // Change 7 — usage_signal is always present (empty shape when no telemetry data)
  // Fix 5 — because is signal-based (null if not meaningful, never "")
  const EMPTY_USAGE_SIGNAL = { renders_total: 0, products: [], override_rate: 0.0 };

  const kbPatternById = new Map((kb.patterns || []).map(p => [p.id, p]));

  const patterns = boostedResults.map(r => {
    const usageSignal = r.metadata?.usage_signal;
    const hasUsageData = usageSignal && usageSignal.renders_total > 0;
    return {
      id:                r.id,
      level:             r.metadata?.level || null,
      family_invariants: r.metadata?.family_invariants || [],
      relevance_score:   parseFloat(r.score.toFixed(4)),
      structural_family: r.metadata?.structural_family || null,
      component_type:    r.metadata?.component_type || null,
      summary:           r.metadata?.summary || '',
      when:              formatWhen(r.metadata?.when),
      not_when:          formatNotWhen(r.metadata?.not_when),
      because:           generateBecause(r, intent_description, ontologyRefs, domain, component_type),
      confidence:        r.metadata?.confidence || 0.9,
      usage_signal:      hasUsageData ? usageSignal : EMPTY_USAGE_SIGNAL,
      component_src:     kbPatternById.get(r.id)?._componentSrc || null,
    };
  });

  // ── Fix 1: Structural inclusions (page/panel only) ───────────────────────────
  // Secondary pass: finds actionable-list-row, section-divider, page-navigation,
  // section-organiser blocks that scored too low to appear in primary top-5.
  // Appended after primary results. structural_inclusion: true marks them.
  const structuralInclusions = buildStructuralInclusions(
    boostedResults, _rawBoosted, kb, component_type, intent_description, domain
  );
  // Combined pattern list used in the response
  const allPatterns = [...patterns, ...structuralInclusions];

  // ── canonical_block_set — stable, sorted block list for cross-thread consistency ──
  // Blocks above the relevance threshold + structural inclusions, sorted
  // alphabetically by id so the same intent always yields the same ordered set
  // regardless of floating-point tie-breaking differences across runs/threads.
  const CANONICAL_THRESHOLD = 0.28;
  const canonical_block_set = allPatterns
    .filter(p => p.relevance_score >= CANONICAL_THRESHOLD || p.structural_inclusion)
    .map(p => p.id)
    .sort();

  // ── primitive_guard — explicit protection for ALL primitive blocks ─────────────
  // Lists every active primitive in the knowledge base (not just the top-5 for this
  // query) so the LLM always knows which blocks have immutable invariants regardless
  // of what the primary retrieval returned.
  const activePrimitives = (kb.patterns || [])
    .filter(p => p.level === 'primitive' && p.status === 'active')
    .sort((a, b) => a.id.localeCompare(b.id));

  const primitive_guard = activePrimitives.length > 0 ? {
    rule_refs: ['safety/hard-constraints.md#22', 'safety/hard-constraints.md#25'],
    instruction: [
      'All primitive blocks must be imported from @/blocks/<BlockId>/<BlockId> and used as-is (hard-constraint #25).',
      'Never redefine or reimplement a primitive inline.',
      'Only additive className classes are permitted on primitives: positioning, sizing, spacing, and layout (hard-constraint #22).',
      'Never pass className values that conflict with a primitive\'s family_invariants.',
      'To change an invariant, update the source block\'s meta.yaml and .tsx with design-leadership justification — never inline.',
    ].join(' '),
    primitives: activePrimitives.map(p => ({
      id:                p.id,
      import_path:       `@/blocks/${p.id}/${p.id}`,
      family_invariants: p.family_invariants || [],
    })),
  } : null;

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

  // Change 5 — intent-specific applies_because for rules
  function ruleAppliesBecause(ruleId, intentDesc, compType, dom) {
    const ct  = compType || 'component';
    const d   = dom      || 'this domain';
    const i   = intentDesc ? intentDesc.trim().substring(0, 120) : '';
    switch (ruleId) {
      case 'styling-tokens':
        return `Applies because all color, spacing, and typography values on this ${ct} must resolve to design tokens — not hardcoded hex or px values.`;
      case 'copy-voice':
        return `Applies because all labels, empty states, error messages, and CTAs on this ${ct} must follow clinical copy standards — imperative labels, no first-person, specific empty states.`;
      case 'accessibility':
        if (['page', 'form', 'modal'].includes(ct)) {
          return `Applies because ${ct}-level components must establish correct focus management, tab order, and ARIA landmark structure for all sub-components built within them.`;
        }
        return `Applies because every interactive element on this ${ct} must meet WCAG 2.1 AA requirements — color is never the sole differentiator, focus rings are never suppressed, and touch targets meet the 44×44px minimum.`;
      case 'data-density':
        return `Applies because a ${d} ${ct} likely displays lists or tables of records where table layout, progressive disclosure, and zero-results handling decisions are required.`;
      case 'destructive-actions':
        return `Applies because any destructive or bulk action within this ${ct} requires an explicit confirmation step with a consequence statement — not "Are you sure?".`;
      case 'interface-guidelines':
        return `Applies because ${ct}-level components must follow surface composition rules — header hierarchy, section spacing, and navigation placement.`;
      default: {
        // Generic: mention at least one aspect of the current intent
        const intentHint = i.length > 10 ? ` for "${i.substring(0, 60)}..."` : '';
        return `Applies to this ${ct} in ${d}${intentHint} — verify compliance before generating.`;
      }
    }
  }

  // ── Rule results ────────────────────────────────────────────────────────────
  const rules = ruleResults.map(r => {
    let content;
    if (r.id === 'copy-voice') {
      // Summary + pointer — no full content needed
      content = {
        summary:
          "Clinical and direct. No 'we'/'our'/'I'. No 'Something went wrong'. " +
          "Error messages state what happened + what to do. Labels are imperative " +
          "present tense. Empty states are honest and specific. " +
          "Confirmation dialogs state the consequence, never 'Are you sure?'.",
        ref: 'genome/rules/copy-voice.rule.md',
      };
    } else {
      const hasStructured = !!(r.metadata.when && r.metadata.use);
      content = hasStructured
        ? { summary: [r.metadata.when, r.metadata.use].join(' | ').substring(0, 300) }
        : { full_content: r.metadata.raw || '' };
    }
    return {
      rule_id: r.id,
      ...content,
      applies_because: ruleAppliesBecause(r.id, intent_description, component_type, domain),
      confidence: r.metadata.confidence || 0.9,
    };
  });

  // ── Safety constraints (always all of them) ─────────────────────────────────
  const safetyConstraints = getSafetyConstraintsInScope(
    intent_description, component_type, domain, kb
  );

  // safety_violations (now pre_build_constraints): constraints structurally in scope → causes build_gate: true
  // coverage_gap: confidence < 0.6 → warning only, never blocks
  const safetyViolations = detectSafetyViolations(
    intent_description, component_type, domain, kb
  );

  // ── Confidence score ────────────────────────────────────────────────────────
  // TF-IDF Jaccard naturally tops out ~0.5–0.6; boosted scores may reach ~0.9
  const topPatternScore = boostedResults[0]?.score || 0;
  // Keyword scores naturally top out ~0.5–0.6; scale by /0.55 so ~0.5 maps to ~0.9
  const confidence = parseFloat(Math.min(topPatternScore / 0.55, 1.0).toFixed(4));

  const coverageGap = confidence < 0.6;

  // Change 9 — confidence_basis: decompose what the confidence score means in context
  let confidenceBasis;
  if (confidence >= 0.7 && intentQuality.score >= 0.5) {
    confidenceBasis = 'reliable';
  } else if (confidence >= 0.7 && intentQuality.score < 0.5) {
    // Gated cases never reach here (early return above), so this is borderline 0.4–0.5
    confidenceBasis = 'unreliable_match';
  } else if (intentQuality.score >= 0.4 && intentQuality.score < 0.5) {
    // Borderline intent quality that was not gated (score 0.4–0.5)
    confidenceBasis = 'low_intent_quality';
  } else {
    // Intent was acceptable but genome returned low-relevance matches
    confidenceBasis = 'low_coverage';
  }

  // ── Gap detection — pattern coverage + ontology gaps ───────────────────────
  // ontologyGaps (Fix 4) are prepended: unmatched actions before near-matches.
  const lowThreshold = 0.25;
  const gaps = [...ontologyGaps];
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
    what_it_omits:     (surfaceMatch.surface.what_it_omits || []).map(entry =>
      typeof entry === 'string'
        ? { item: entry, reason: null }
        : { item: entry.item, reason: entry.reason || null }
    ),
    empty_state_meaning: surfaceMatch.surface.empty_state_meaning || '',
    ordering:          surfaceMatch.surface.ordering || '',
    actions:           surfaceMatch.surface.actions || [],
    never:             surfaceMatch.surface.never || [],
    match_score:       parseFloat(surfaceMatch.score.toFixed(3)),
  } : null;

  // ── Episodic memory — similar past builds ───────────────────────────────────
  const similarBuilds = loadSimilarBuilds(kb.basePath, searchText);

  // Design Mind improvement: Change 6 — _debug field (only when DEBUG_CONTEXT=true)
  // Captures ranking internals, rule inclusion/exclusion, surface match, episodic query.
  // Never emitted in production (empty object when env var is not set).
  const allRuleIds = (kb.rules || []).map(r => r.id);
  const includedRuleIds = ruleResults.map(r => r.id);
  const excludedRuleIds = allRuleIds.filter(id => !includedRuleIds.includes(id));

  const debugField = process.env.DEBUG_CONTEXT === 'true' ? {
    patterns_retrieved: boostedResults.map(r => ({
      id: r.id,
      raw_score: parseFloat((r.raw_score || 0).toFixed(4)),
      adjusted_score: parseFloat((r.adjusted_score || r.score).toFixed(4)),
      family_match: r.family_match || false,
    })),
    rules_included: includedRuleIds,
    rules_excluded: excludedRuleIds,
    rules_excluded_reason: excludedRuleIds.map(id => `${id}: not in top-3 for this query and not force-included`),
    surface_matched: surfaceMatch ? surfaceMatch.surface.id : null,
    episodic_query: searchText.substring(0, 80),
    episodic_hits: similarBuilds.length,
  } : {};

  // ── Change 2: composition hints ──────────────────────────────────────────────
  const compositions = buildCompositionHints(boostedResults);

  // ── Change 3: structure-vs-content gap probe ─────────────────────────────────
  const gap_probe = buildGapProbe(patterns[0] || null);

  // ── Change 3 (surface hierarchy): build_mode ─────────────────────────────────
  // Surface match ≥ 0.7 → surface-first. Agent anchors to surface spec.
  // No match ≥ 0.7 → block-composition. Agent composes from blocks directly.
  const SURFACE_FIRST_THRESHOLD = 0.7;
  let build_mode;
  if (surfaceMatch && surfaceMatch.score >= SURFACE_FIRST_THRESHOLD) {
    const baseInstruction =
      `Build to the ${surfaceMatch.surface.id} surface spec. The surface defines ` +
      `what goes in, what's forbidden, and what ordering is required. Select blocks ` +
      `to fulfil its sections. Surface never-rules override block defaults.`;
    const mismatchNote = component_type !== 'page'
      ? ` Note: your component_type was '${component_type}' but this intent matches ` +
        `the ${surfaceMatch.surface.id} surface. If you are building a section within ` +
        `${surfaceMatch.surface.id}, anchor to the surface spec. If you are building a ` +
        `standalone component, ignore the surface match.`
      : '';
    build_mode = {
      mode: 'surface-first',
      anchor: {
        surface_id:       surfaceMatch.surface.id,
        relevance_score:  parseFloat(surfaceMatch.score.toFixed(3)),
        instruction:      baseInstruction + mismatchNote,
      },
    };
  } else {
    build_mode = {
      mode: 'block-composition',
      anchor: null,
      instruction: 'No surface match — compose directly from blocks. Do NOT start building yet. Return to the Block Consultation Protocol: identify every block needed across all levels, then call consult_before_build once per block in strict level order (primitives first, composites second, surfaces last). This response covers only the component you just described — it is not a clearance to build the full UI.',
    };
  }

  // ── Assemble response ────────────────────────────────────────────────────────
  const blockCompositionNextStep = build_mode.mode === 'block-composition'
    ? {
        action: 'consult_each_block',
        instruction: 'List every block this UI needs. Call consult_before_build once per block in level order: all primitives first, then composites, then surfaces. Do not write any code until all required blocks have been individually consulted.',
        level_order: ['primitive', 'composite / domain', 'surface'],
      }
    : null;

  const response = {
    build_mode,
    ...(blockCompositionNextStep       ? { next_step: blockCompositionNextStep }   : {}),
    ...(surface                        ? { surface }                               : {}),
    ...(structuralGuidance             ? { structural_guidance: structuralGuidance } : {}),
    intent_quality: { score: intentQuality.score, missing: intentQuality.missing },
    patterns: allPatterns,
    canonical_block_set,
    ...(primitive_guard                ? { primitive_guard }                       : {}),
    ...(compositions.length > 0        ? { compositions }                          : {}),
    ...(gap_probe                      ? { gap_probe }                             : {}),
    rules,
    ontology_refs:      ontologyRefs,
    safety_constraints: safetyConstraints,
    similar_builds:     similarBuilds,
    confidence,
    confidence_basis:   confidenceBasis,
    coverage_gap: coverageGap,
    ...(gaps.length > 0                ? { gaps }                                  : {}),
    ...(Object.keys(debugField).length ? { _debug: debugField }                    : {}),
  };

  // build_gate fires on direct + carry_forward constraints in scope.
  // Governance constraints (C22–C24) are always present in safety_constraints
  // with scope='governance' but never contribute to the gate count —
  // they apply at commit time, not design time.
  if (safetyViolations.length > 0) {
    const directCount       = safetyConstraints.filter(c =>
      safetyViolations.includes(c.constraint_id) && c.scope === 'direct'
    ).length;
    const carryForwardCount = safetyConstraints.filter(c =>
      safetyViolations.includes(c.constraint_id) && c.scope === 'carry_forward'
    ).length;
    const governanceCount   = safetyConstraints.filter(c => c.scope === 'governance').length;

    response.build_gate = true;
    response.build_gate_reason =
      `${directCount} direct and ${carryForwardCount} carry-forward constraints require pre-build verification ` +
      `for component_type='${component_type}' in domain='${domain}'.` +
      (governanceCount > 0
        ? ` Additionally ${governanceCount} governance constraints apply at commit time — ` +
          `see safety_constraints where scope='governance'.`
        : '') +
      ` Review direct and carry-forward constraints before writing code.`;
    response.build_gate_resolution =
      "Review each constraint in safety_constraints (scope='direct' and scope='carry_forward') before writing any code. " +
      "For scope='direct' constraints, verify your planned component architecture satisfies them. " +
      "For scope='carry_forward' constraints, note them and apply when building sub-components. " +
      "scope='governance' constraints apply at commit time — review before committing. " +
      "Self-certification is sufficient — no separate tool call required. " +
      "Proceed once all direct and carry-forward constraints have been reviewed.";
  }

  if (coverageGap) {
    response.coverage_warning =
      'Genome has low coverage for this component type. Proceed carefully and call report_pattern if you invent new structure.';
  }

  // Change 10 — auto-log gap observations when intent was well-described but genome had no good matches
  if (confidence < 0.4 && intentQuality.score >= 0.5) {
    const gapLogPath = join(kb.basePath, 'memory', 'gap-observations.jsonl');
    try {
      if (!existsSync(join(kb.basePath, 'memory'))) {
        mkdirSync(join(kb.basePath, 'memory'), { recursive: true });
      }
      const observation = {
        timestamp:        new Date().toISOString(),
        intent_description,
        component_type,
        domain,
        confidence,
        top_pattern_score: parseFloat((topPatternScore).toFixed(4)),
        observation_type:  'auto_gap_log',
      };
      writeFileSync(gapLogPath, JSON.stringify(observation) + '\n', { flag: 'a', encoding: 'utf-8' });
    } catch {
      // Non-fatal: gap logging failure must never interrupt the tool response
    }
  }

  return response;
}

// ── Primitive block protection checks (rules 22 & 25) ────────────────────────
//
// Rule 22: consuming blocks must not pass className overrides that conflict with
//          a primitive's family_invariants. Only additive classes are permitted.
// Rule 25: existing blocks must be used as-is — no reimplementation inline.
//
// INVARIANT_CLASS_PREFIXES: Tailwind prefixes that govern the visual identity of
// a primitive and are frozen by its family_invariants. Passing these as className
// overrides violates rule 22.
const INVARIANT_CLASS_PREFIXES = [
  'rounded', 'font-', 'whitespace-', 'text-xs', 'text-sm', 'text-base', 'text-lg',
  'text-xl', 'text-2xl', 'text-3xl', 'bg-', 'border-', 'ring-', 'focus-',
  'transition-', 'shadow-', 'outline-', 'inline-flex', 'items-', 'justify-',
  'opacity-', 'scale-', 'leading-', 'tracking-', 'decoration-',
];

// ADDITIVE_CLASS_PREFIXES: purely layout, sizing, spacing, and positioning classes
// that are always safe to pass as className overrides per rule 22.
const ADDITIVE_CLASS_PREFIXES = [
  'gap-', 'space-x-', 'space-y-', 'p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-',
  'm-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-',
  'w-', 'h-', 'min-w-', 'max-w-', 'min-h-', 'max-h-', 'size-',
  'absolute', 'relative', 'fixed', 'sticky', 'static',
  'top-', 'right-', 'bottom-', 'left-', 'inset-',
  'z-', 'col-span-', 'row-span-', 'flex-1', 'flex-none', 'flex-shrink', 'flex-grow',
  'self-', 'place-', 'overflow-', 'truncate', 'cursor-', 'pointer-events-',
  'hidden', 'block', 'shrink-', 'grow-',
];

function classHasInvariantConflict(className) {
  if (!className) return false;
  return className.trim().split(/\s+/).some(cls => {
    if (!cls) return false;
    // If it matches an additive prefix it is always safe — check first
    const isAdditive = ADDITIVE_CLASS_PREFIXES.some(prefix =>
      cls === prefix.replace(/-$/, '') || cls.startsWith(prefix)
    );
    if (isAdditive) return false;
    // Otherwise check if it conflicts with an invariant property group
    return INVARIANT_CLASS_PREFIXES.some(prefix =>
      cls === prefix.replace(/-$/, '') || cls.startsWith(prefix)
    );
  });
}

/**
 * Scans the generated code for three categories of primitive violations:
 *   1. className overrides that conflict with family_invariants (rule 22)
 *   2. Primitive blocks defined locally instead of imported (rule 25, TSX)
 *   3. Primitive re-implemented as a CSS class in a <style> block (rule 25, HTML)
 *
 * Check 3 runs unconditionally — it does not require JSX presence, so it fires
 * for HTML prototypes where <Button> never appears but .btn-primary does.
 *
 * @param {string}   code            - The generated code (TSX, JSX, or HTML)
 * @param {object[]} primitiveBlocks - Active primitive blocks from kb.patterns
 * @returns {object[]} Array of fix-shaped violation objects with safety_block: true
 */
function checkPrimitiveViolations(code, primitiveBlocks) {
  const violations = [];

  // Pre-extract all <style>...</style> content once — used in Check 3 for every block.
  const styleBlockContent = [...code.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(m => m[1]).join('\n');
  // Collect all CSS class selectors defined in style blocks: `.foo {`, `.foo,`
  const styleClassNames = styleBlockContent
    ? [...styleBlockContent.matchAll(/\.([a-zA-Z][\w-]*)\s*[{,]/g)].map(m => m[1])
    : [];

  for (const block of primitiveBlocks) {
    const id = block.id;
    if (!block.family_invariants || block.family_invariants.length === 0) continue;

    // ── Check 3: primitive re-implemented via <style> block CSS class (rule 25) ──
    // Runs before the JSX-presence guard so it fires for HTML prototypes.
    // Matches: full lowercase id ("button", "badge") and 3-char abbreviation ("btn", "bdg").
    if (styleClassNames.length > 0) {
      const idLower  = id.toLowerCase();
      const idAbbrev = idLower.slice(0, 3);
      const prefixes = [...new Set([idLower, idAbbrev])];
      const shadowClass = styleClassNames.find(cls =>
        prefixes.some(pfx => cls === pfx || cls.startsWith(pfx + '-'))
      );
      if (shadowClass) {
        violations.push({
          problem: `Primitive '${id}' re-implemented as CSS class '.${shadowClass}' in a <style> block instead of applying family_invariants inline`,
          rule_violated: 'safety/hard-constraints.md rule 25',
          correction:
            `Remove '.${shadowClass}' from the <style> block. ` +
            `Apply ${id}'s family_invariants as inline Tailwind classes directly on the element: ` +
            `${(block.family_invariants || []).join(' | ')}. ` +
            `A custom CSS class is a re-implementation — it bypasses the block contract and breaks the invariant audit trail.`,
          safety_block: true,
        });
        continue; // style re-implementation supersedes JSX checks for this block
      }
    }

    // ── JSX-only checks — skip if primitive not referenced as a JSX element ──
    if (!new RegExp(`<${id}[\\s/>]`).test(code)) continue;

    // ── Check 1: conflicting className override (rule 22) ───────────────────
    // Match both literal className="..." and expression className={cn("...")}
    const literalRe = new RegExp(`<${id}[^>]{0,400}className\\s*=\\s*["'\`]([^"'\`]*)["'\`]`, 's');
    const exprRe    = new RegExp(`<${id}[^>]{0,400}className\\s*=\\s*\\{[^}]*["'\`]([^"'\`]*)["'\`]`, 's');

    for (const re of [literalRe, exprRe]) {
      const m = code.match(re);
      if (m && classHasInvariantConflict(m[1])) {
        const invariantSample = (block.family_invariants || []).slice(0, 3).join('; ');
        violations.push({
          problem: `className override on primitive '${id}' conflicts with its family_invariants`,
          rule_violated: 'safety/hard-constraints.md rule 22',
          correction:
            `Only additive classes (positioning, sizing, spacing, layout) may be passed to '${id}'. ` +
            `Invariants in force: ${invariantSample}. ` +
            `To change an invariant, update blocks/${id}/meta.yaml and blocks/${id}/${id}.tsx with ` +
            `design-leadership justification — never override inline.`,
          safety_block: true,
        });
        break; // one violation per block is enough
      }
    }

    // ── Check 2: primitive reimplemented inline (rule 25, TSX) ─────────────
    // Detect: `const Button = ...` or `function Button(` without a corresponding
    // import from the blocks directory, which signals the block was rebuilt locally.
    const redefineRe = new RegExp(`(?:^|\\n)(?:const|function|let|var)\\s+${id}\\s*[=(]`, 'i');
    const importRe   = new RegExp(`import[^;]*\\b${id}\\b[^;]*from[^;]*['"][^'"]*blocks`, 'i');
    if (redefineRe.test(code) && !importRe.test(code)) {
      violations.push({
        problem: `Primitive block '${id}' appears to be redefined locally rather than imported`,
        rule_violated: 'safety/hard-constraints.md rule 25',
        correction:
          `Import ${id} directly from '@/blocks/${id}/${id}' and use it as-is. ` +
          `Never reimplement a primitive block inline. ` +
          `If structural changes are required, register a candidate via report_pattern.`,
        safety_block: true,
      });
    }
  }

  return violations;
}

/**
 * Resolves block IDs actually present in the generated code by scanning
 * multiple import path conventions used across real TSX codebases and the
 * design-mind canonical format.
 *
 * Recognised patterns:
 *   1. Design-mind canonical  — @/blocks/<Id>/<Id>
 *   2. shadcn/ui              — @/components/ui/<name>  (named exports, PascalCase)
 *   3. Generic component dir  — @/components/<Name>     (named exports, PascalCase)
 *
 * @param {string} code - The generated code
 * @returns {Set<string>} Set of PascalCase block IDs found via imports
 */
function resolveImportedBlockIds(code) {
  const ids = new Set();

  // 1. Design-mind: @/blocks/Button/Button → id = "Button"
  for (const m of code.matchAll(
    /import\s+(?:\{[^}]*\}|\w+)\s+from\s+['"]@\/blocks\/(\w+)\/\w+['"]/g
  )) ids.add(m[1]);

  // 2. shadcn: import { Button, ButtonProps } from '@/components/ui/button'
  //    Extract each named export; keep only PascalCase identifiers (component names).
  for (const m of code.matchAll(
    /import\s+\{([^}]+)\}\s+from\s+['"]@\/components\/ui\/[\w-]+['"]/g
  )) {
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0].trim();
      if (/^[A-Z]/.test(name)) ids.add(name);
    }
  }

  // 3. Generic: import { Button } from '@/components/Button'
  for (const m of code.matchAll(
    /import\s+\{([^}]+)\}\s+from\s+['"]@\/components\/[\w/-]+['"]/g
  )) {
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0].trim();
      if (/^[A-Z]/.test(name)) ids.add(name);
    }
  }

  return ids;
}

/**
 * Compares the blocks actually imported in the generated code against the
 * blocks recommended by consult_before_build (from context_used.patterns).
 * Flags high-confidence recommended blocks that are absent, and validates
 * that variant props used on imported blocks match documented variants.
 *
 * @param {string}   code            - The generated code (TSX, JSX, or HTML)
 * @param {object}   contextUsed     - The full context returned by consult_before_build
 * @param {object[]} primitiveBlocks - Active primitive blocks (for variant validation)
 * @returns {object[]} Array of borderline-shaped observations
 */
function checkBlockIdentity(code, contextUsed, primitiveBlocks = []) {
  const issues = [];
  if (!contextUsed?.patterns) return issues;

  const usedBlockIds = resolveImportedBlockIds(code);

  // ── High-confidence block usage check ──────────────────────────────────────
  const highConfRecommended = (contextUsed.patterns || []).filter(
    p => p.relevance_score >= 0.65 && !p.structural_inclusion
  );

  for (const rec of highConfRecommended) {
    if (!usedBlockIds.has(rec.id)) {
      issues.push({
        observation: `High-confidence recommended block '${rec.id}' (score: ${rec.relevance_score}) was not imported in the generated output`,
        tension: `consult_before_build identified this as a primary pattern match — unused blocks risk design-system drift and inconsistency`,
        recommendation:
          `Verify this omission was intentional. If a different block was chosen instead, confirm it satisfies the same design intent and genome rules. ` +
          `If this block should have been used, import it from '@/blocks/${rec.id}/${rec.id}'.`,
      });
    }
  }

  // ── Variant prop validation (TSX only) ─────────────────────────────────────
  // Check that variant="..." values on imported primitive JSX elements match
  // the block's documented variants. Catches invented variants like "ghost"
  // that have no canonical definition.
  for (const blockId of usedBlockIds) {
    const block = primitiveBlocks.find(b => b.id === blockId);
    if (!block?.variants) continue;
    const validVariants = Object.keys(block.variants);
    const variantRe = new RegExp(
      `<${blockId}[^>]{0,400}variant\\s*=\\s*["'\`]([^"'\`]+)["'\`]`, 'g'
    );
    for (const m of code.matchAll(variantRe)) {
      const used = m[1].trim();
      if (used && !validVariants.includes(used)) {
        issues.push({
          observation: `'${blockId}' used with variant="${used}" which is not a documented variant`,
          tension: `Undocumented variants are not covered by the block contract and may produce unexpected styles or break across design-system updates. Valid variants: ${validVariants.join(', ')}.`,
          recommendation: `Replace variant="${used}" with one of: ${validVariants.join(', ')}.`,
        });
      }
    }
  }

  return issues;
}

/**
 * Produces a structured invariant audit for every primitive that is in scope
 * for the generated output. "In scope" means the primitive was:
 *   - imported or used as JSX,
 *   - re-implemented via a <style> block CSS class,
 *   - used as a raw HTML element with inline classes, OR
 *   - recommended with relevance_score ≥ 0.45 by consult_before_build.
 *
 * Each entry reports how the primitive was detected, which family_invariants
 * are satisfied, which are missing, and a machine-readable verdict:
 *   correct            — imported/used correctly, all invariants present
 *   partial            — imported but some invariants missing or className conflict
 *   variant_violation  — imported but an undocumented variant prop was used
 *   reimplemented      — found as a CSS class in a <style> block (rule 25)
 *   partial_inline     — found as a raw HTML element with some invariants inline
 *   absent             — in scope (recommended) but not found in the output
 *
 * @param {string}   code            - The generated code
 * @param {object[]} primitiveBlocks - Active primitive blocks from kb.patterns
 * @param {object}   contextUsed     - Context returned by consult_before_build (optional)
 * @returns {object[]} invariant_check array
 */
function buildInvariantCheck(code, primitiveBlocks, contextUsed) {
  const results = [];

  // Primitives recommended with moderate confidence are "in scope" even if absent.
  const highConfIds = new Set(
    (contextUsed?.patterns || [])
      .filter(p => p.level === 'primitive' && p.relevance_score >= 0.45)
      .map(p => p.id)
  );

  // Pre-compute import set and style block classes once.
  const importedIds = resolveImportedBlockIds(code);

  const styleBlockContent = [...code.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(m => m[1]).join('\n');
  const styleClassNames = styleBlockContent
    ? [...styleBlockContent.matchAll(/\.([a-zA-Z][\w-]*)\s*[{,]/g)].map(m => m[1])
    : [];

  /**
   * Given a family_invariant string (e.g. "focus-visible:ring-2 focus-visible:ring-offset-1 (rule 20)")
   * extract the Tailwind-like tokens within it so we can check their presence in code.
   */
  function tokensFromInvariant(inv) {
    // Match tokens that contain at least one dash or colon — Tailwind class shape.
    return (inv.match(/[\w:![\].-]+(?:[-:][\w:![\].-]+)+/g) || []).filter(t => t.length > 3);
  }

  function classifyInvariants(invariants, searchTarget) {
    const present = [];
    const missing = [];
    for (const inv of invariants) {
      const tokens = tokensFromInvariant(inv);
      // An invariant is "present" if at least one of its key tokens appears in the target.
      const satisfied = tokens.length === 0 || tokens.some(t => searchTarget.includes(t));
      (satisfied ? present : missing).push(inv);
    }
    return { present, missing };
  }

  for (const block of primitiveBlocks) {
    const id = block.id;
    const invariants = block.family_invariants || [];
    if (invariants.length === 0) continue;

    const inImport  = importedIds.has(id);
    const inJsx     = new RegExp(`<${id}[\\s/>]`).test(code);
    const inHighConf = highConfIds.has(id);

    // Style block shadow?
    const idLower  = id.toLowerCase();
    const idAbbrev = idLower.slice(0, 3);
    const prefixes = [...new Set([idLower, idAbbrev])];
    const shadowClass = styleClassNames.find(cls =>
      prefixes.some(pfx => cls === pfx || cls.startsWith(pfx + '-'))
    );

    // Raw HTML element usage (for HTML prototypes — <button>, <input>, etc.)
    const htmlTag = idLower; // Button→button, Badge→badge, Input→input
    const htmlClassRe = new RegExp(
      `<${htmlTag}[^>]{0,600}class(?:Name)?\\s*=\\s*["']([^"']*)["']`, 'gi'
    );
    const htmlClasses = [...code.matchAll(htmlClassRe)].flatMap(m => m[1].split(/\s+/));

    // Skip entirely if not in scope.
    if (!inImport && !inJsx && !inHighConf && !shadowClass && htmlClasses.length === 0) continue;

    let detection_method, verdict;
    let invariants_present = [];
    let invariants_missing = [];

    if (inImport || inJsx) {
      // ── TSX / imported component path ──────────────────────────────────
      detection_method = inImport ? 'import' : 'jsx_usage';

      // Check for variant prop violations.
      let hasVariantViolation = false;
      if (block.variants) {
        const validVariants = Object.keys(block.variants);
        const variantRe = new RegExp(
          `<${id}[^>]{0,400}variant\\s*=\\s*["'\`]([^"'\`]+)["'\`]`, 'g'
        );
        for (const m of code.matchAll(variantRe)) {
          if (!validVariants.includes(m[1].trim())) { hasVariantViolation = true; break; }
        }
      }

      // Check className for invariant-prefix conflicts.
      const literalRe = new RegExp(`<${id}[^>]{0,400}className\\s*=\\s*["'\`]([^"'\`]*)["'\`]`, 's');
      const exprRe    = new RegExp(`<${id}[^>]{0,400}className\\s*=\\s*\\{[^}]*["'\`]([^"'\`]*)["'\`]`, 's');
      const classMatch = code.match(literalRe) || code.match(exprRe);
      const hasConflict = classMatch ? classHasInvariantConflict(classMatch[1]) : false;

      const { present, missing } = classifyInvariants(invariants, code);
      invariants_present = present;
      invariants_missing = missing;

      if (hasVariantViolation)      verdict = 'variant_violation';
      else if (hasConflict)         verdict = 'partial';
      else if (missing.length === 0) verdict = 'correct';
      else                           verdict = 'partial';

    } else if (shadowClass) {
      // ── CSS class re-implementation in <style> block ────────────────────
      detection_method = 'style_reimplementation';
      invariants_missing = [...invariants]; // all invariants hidden behind CSS class
      verdict = 'reimplemented';

    } else if (htmlClasses.length > 0) {
      // ── Raw HTML element with inline classes (HTML prototype) ───────────
      detection_method = 'inline_tailwind';
      const { present, missing } = classifyInvariants(invariants, htmlClasses.join(' '));
      invariants_present = present;
      invariants_missing = missing;
      verdict = missing.length === 0 ? 'correct'
              : present.length > 0   ? 'partial_inline'
              :                        'absent';

    } else {
      // ── Recommended but not found ───────────────────────────────────────
      detection_method = 'not_found';
      invariants_missing = [...invariants];
      verdict = 'absent';
    }

    results.push({ block: id, detection_method, invariants_present, invariants_missing, verdict });
  }

  return results;
}

// ── TOOL 2: review_output ─────────────────────────────────────────────────────

// Design Mind improvement: Change 4 — copy-voice.md checks
// copy-voice.md is loaded into kb.ontology['copy-voice'] as raw text by knowledge.js.
// It is NOT passed as a separate arg — it is always available via kb.
// The checks below run in reviewOutput and populate copy_violations in the response.
// agents/critic/system-prompt.md has a parallel COPY_VIOLATIONS section — VERIFIED PRESENT.
// COPY_VOICE_CHECKS below — VERIFIED PRESENT. No changes needed.
// COPY_VOICE_CHECKS — mirrors the 11-rule checklist in agents/critic/system-prompt.md
const COPY_VOICE_CHECKS = [
  // Rule 1: first-person forms
  {
    rule: 'first-person-copy',
    pattern: /\b(we |we'|our |i am |i've |i'll )/i,
    correction: 'First-person constructions ("we", "our", "I") are prohibited in all user-facing strings. Rewrite in second person or state the fact directly.',
  },
  // Rule 2: "something went wrong"
  {
    rule: 'vague-error-something-went-wrong',
    pattern: /something went wrong|something happened(?! to the patient)/i,
    correction: 'Error messages must state what happened + what to do. E.g. "Patient record could not be saved. Check your connection and try again."',
  },
  // Rule 3: "due to a system/technical issue"
  {
    rule: 'system-issue-euphemism',
    pattern: /due to a (system|technical) issue/i,
    correction: 'State the actual cause or use a direct recovery instruction. Avoid vague blame phrases.',
  },
  // Rule 4: "denied" in permission errors
  {
    rule: 'permission-denied-wording',
    pattern: /\baccess denied\b|\bpermission denied\b/i,
    correction: 'Avoid "denied" in permission errors. Use "You don\'t have access to [resource]. Contact your administrator." instead.',
  },
  // Rule 5: "to continue" appended after a CTA
  {
    rule: 'cta-to-continue-suffix',
    pattern: /\b(save|submit|confirm|continue|proceed|next)\b[^"'<]*to continue/i,
    correction: 'Remove "to continue" after CTA labels. The action label should be self-explanatory.',
  },
  // Rule 6: "Unable to …" in body copy
  {
    rule: 'unable-to-in-body-copy',
    pattern: /unable to (load|fetch|retrieve|save|submit|update|delete)/i,
    correction: '"Unable to …" is permitted only in error headings, not body copy. Body copy must state what happened and what to do.',
  },
  // Rule 8: infrastructure terms for non-technical audience
  {
    rule: 'infrastructure-terms-exposed',
    pattern: /\b(the server|our server|the API|the backend|the database)\b/i,
    correction: 'Do not expose infrastructure terms (server, API, backend, database) to non-technical users. Describe the outcome instead.',
  },
  // Rule 9: "after some time" → should be "later"
  {
    rule: 'after-some-time-vague',
    pattern: /after some time/i,
    correction: 'Replace "after some time" with "later".',
  },
  // Rule 10: "Try again" missing from recoverable system-loading errors
  {
    rule: 'recoverable-error-missing-try-again',
    pattern: /could not (load|fetch|retrieve)[^.]*\./i,
    check: (stripped) => {
      // Only flag if the error string does NOT already contain "try again"
      const match = stripped.match(/could not (load|fetch|retrieve)[^.]*\./i);
      if (!match) return null;
      const afterMatch = stripped.substring(stripped.indexOf(match[0]));
      if (/try again/i.test(afterMatch.substring(0, 200))) return null;
      return match[0];
    },
    correction: 'Recoverable loading errors must include "Try again" so the user knows there is an action to take.',
  },
  // Rule 16 (hard constraint): "Are you sure?" in confirmation dialogs
  {
    rule: 'confirmation-are-you-sure',
    pattern: /are you sure/i,
    correction: 'Confirmation dialogs must state the consequence, not ask "Are you sure?". Primary CTA label must match the consequence.',
  },
  // Rule 17 (hard constraint): "Cancel" on secondary modal/popover buttons
  {
    rule: 'modal-cancel-not-close',
    pattern: /"Cancel"|'Cancel'|>Cancel</,
    correction: 'Secondary buttons on modals, interstitials, and popovers must use "Close", not "Cancel".',
  },
  // Legacy checks preserved
  {
    rule: 'tone-cute-or-casual',
    pattern: /all caught up|looks like you('re| are)|nothing to see here|hooray|yay[^a-z]|great job/i,
    correction: 'Use honest, specific copy. E.g. "No open care gaps for this patient" not "All caught up!"',
  },
  {
    rule: 'label-gerund-tense',
    pattern: /"(Acknowledging|Escalating|Dismissing|Completing|Assigning|Deleting|Submitting|Saving|Updating|Closing)"/,
    correction: 'Labels use imperative present tense: "Acknowledge" not "Acknowledging". See copy-voice.md.',
  },
  {
    rule: 'empty-state-vague',
    pattern: /no (items|results|data|records) (found|available|here)|nothing to (show|display|find)/i,
    correction: 'Empty states must be specific: "No open care gaps for this patient" not "No results found".',
  },
  {
    rule: 'written-out-clinical-number',
    pattern: /\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+(patient|alert|task|gap|record)/i,
    correction: 'Use numerals for all clinical quantities: "3 patients" not "three patients". See copy-voice.md.',
  },
];

function checkCopyVoice(code) {
  const violations = [];
  // Strip comments and import paths to avoid false positives on developer copy
  const stripped = code
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/import\s+.*from\s+["'][^"']*["']/g, '');

  for (const check of COPY_VOICE_CHECKS) {
    // Some checks provide a custom check() fn instead of a bare pattern test
    if (check.check) {
      const found = check.check(stripped);
      if (found) {
        violations.push({ rule: check.rule, found, correction: check.correction });
      }
      continue;
    }
    const match = stripped.match(check.pattern);
    if (match) {
      violations.push({
        rule: check.rule,
        found: match[0],
        correction: check.correction,
      });
    }
  }
  return violations;
}

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
    correction: 'Replace all hex colors with design token classes (text-destructive, bg-[var(--alert-light)], etc.)',
  },
  {
    id: 'c-tailwind-colors',
    check: (code) => {
      // Look for Tailwind default color classes like red-600, amber-100, blue-500, etc.
      return /\b(red|blue|green|yellow|amber|orange|purple|pink|gray|slate|zinc|neutral|stone|lime|emerald|teal|cyan|indigo|violet|fuchsia|rose)-\d{2,3}\b/.test(code);
    },
    problem: 'Tailwind default color classes found (e.g. red-600, amber-100)',
    rule_violated: 'genome/rules/styling-tokens.rule.md',
    correction: 'Use semantic token classes only. See styling-tokens.rule.md for the full token map.',
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
  {
    id: 'c15-first-person',
    check: (code) => /\b(we |we'|our |i am |i've |i'll )/i.test(
      code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
    ),
    problem: 'First-person construction ("we", "our", "I") found in user-facing copy',
    rule_violated: 'safety/hard-constraints.md rule 15',
    correction: 'All first-person constructions are prohibited. Rewrite in second person or state the fact directly.',
  },
  {
    id: 'c17-cancel-not-close',
    check: (code) => /"Cancel"|'Cancel'|>Cancel</.test(code),
    problem: '"Cancel" found on a button — secondary actions on modals must use "Close"',
    rule_violated: 'safety/hard-constraints.md rule 17',
    correction: 'Replace "Cancel" with "Close" on modal, interstitial, and popover secondary buttons.',
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
      observation: 'Uses semantic color tokens correctly',
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
      rule_or_pattern_ref: `blocks/${patternResults[0].id}/meta.yaml`,
    });
  }

  return honored;
}

// ── isInComment helper for auto-checks ───────────────────────────────────────
function isInComment(code, needle) {
  // Returns true if the needle only appears inside // or /* */ comments
  const lines = code.split('\n');
  for (const line of lines) {
    const singleCommentIdx = line.indexOf('//');
    const lineWithoutComment = singleCommentIdx >= 0
      ? line.substring(0, singleCommentIdx)
      : line;
    if (lineWithoutComment.includes(needle)) return false;
  }
  // Also check block comments — if ALL occurrences are inside /* */ then treat as comment
  const withoutBlockComments = code.replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutAllComments   = withoutBlockComments.replace(/\/\/[^\n]*/g, '');
  return !withoutAllComments.includes(needle);
}

/**
 * Reviews generated UI code/description against the Design Mind genome.
 * Hybrid approach: step 1 runs fast regex auto-checks, step 2 sends everything
 * to the LLM Critic, step 3 merges and deduplicates the results.
 */
export async function reviewOutput(params, kb, patternIndex) {
  const { generated_output, original_intent, context_used } = params;
  const code = generated_output || '';

  // ── STEP 1 — CODE AUTO-CHECKS ────────────────────────────────────────────────
  const violations = [];

  // 1. Hardcoded hex colors
  const hexMatches = code.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
  hexMatches.filter(h => !isInComment(code, h)).forEach(found => {
    violations.push({ violation_type: 'hardcoded-hex', found_text: found, rule_ref: 'styling-tokens', severity: 'blocker' });
  });

  // 2. Tailwind default color classes
  const twColorMatches = code.match(/\b(red|blue|green|yellow|purple|pink|indigo|orange|teal|cyan|rose|violet|fuchsia|lime|emerald|sky|amber|gray|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900|950)\b/g) || [];
  twColorMatches.forEach(found => {
    violations.push({ violation_type: 'tailwind-default-color', found_text: found, rule_ref: 'styling-tokens', severity: 'blocker' });
  });

  // 3. Critical alert dismiss
  if (/dismiss|close/i.test(code) && /critical|severity-critical/i.test(code)) {
    violations.push({ violation_type: 'critical-alert-dismiss', found_text: 'dismiss/close near critical', rule_ref: 'hard-constraints rule 1', severity: 'blocker' });
  }

  // 4. Patient first-name-only
  if (/patient\.firstName|patient\.first_name|\bfirstName\b/.test(code) && !/patient\.lastName|patient\.last_name|\blastName\b/.test(code)) {
    violations.push({ violation_type: 'patient-first-name-only', found_text: 'firstName without lastName', rule_ref: 'hard-constraints rule 3', severity: 'blocker' });
  }

  // 5. Copy voice violations
  const copyVoiceChecks = [
    { pattern: /something went wrong/i, label: 'Something went wrong' },
    { pattern: /are you sure\?/i, label: 'Are you sure?' },
    { pattern: /\b(we|our|I)\b/i, label: 'first-person pronoun' },
    { pattern: /<Button[^>]*>Cancel</i, label: 'Cancel button (use Close)' },
    { pattern: /\bdenied\b|\bfailed\b|\bfailure\b/i, label: 'denied/failed/failure' },
  ];
  copyVoiceChecks.forEach(({ pattern, label }) => {
    if (pattern.test(code)) {
      violations.push({ violation_type: 'copy-voice', found_text: label, rule_ref: 'copy-voice', severity: 'warning' });
    }
  });

  // 6. Primitive reimplementation via <style> blocks
  if (/<style[^>]*>/.test(code)) {
    violations.push({ violation_type: 'primitive-reimplementation', found_text: '<style> block', rule_ref: 'hard-constraints', severity: 'warning' });
  }

  // 7. Import path check (rounded-full without @/blocks/ import)
  if (/className=["'][^"']*rounded-full[^"']*["']/.test(code) && !/@\/blocks\//.test(code)) {
    violations.push({ violation_type: 'import-path', found_text: 'rounded-full without @/blocks/ import', rule_ref: 'hard-constraints', severity: 'warning' });
  }

  // ── STEP 2 — LLM CRITIC ──────────────────────────────────────────────────────
  let criticResult = {};
  try {
    criticResult = await callCritic({
      generatedCode: code,
      originalIntent: original_intent || '',
      genomeContext: getGenomeForLLM(),
      autoCheckResults: violations,
    });
  } catch (err) {
    process.stderr.write(`[reviewOutput] callCritic error: ${err.message}\n`);
    criticResult = {};
  }

  // ── STEP 3 — MERGE AND DEDUPLICATE ──────────────────────────────────────────
  // Remove auto-check violations that are already covered by LLM fix items
  // (same violation_type or similar found_text).
  const llmFix = criticResult.fix || [];
  const llmFixTexts = llmFix.map(f => (f.problem || '').toLowerCase());

  const deduplicatedViolations = violations.filter(v => {
    const vText = (v.found_text || '').toLowerCase();
    const vType = (v.violation_type || '').toLowerCase();
    return !llmFixTexts.some(
      ft => ft.includes(vType) || ft.includes(vText) || vText.length > 3 && ft.includes(vText)
    );
  });

  return {
    auto_checks: violations,                                    // full step 1 results (unfiltered)
    honored: criticResult.honored || [],
    borderline: criticResult.borderline || [],
    novel: criticResult.novel || [],
    fix: [
      ...deduplicatedViolations.map(v => ({
        problem: `Auto-check: ${v.violation_type} — ${v.found_text}`,
        rule_violated: v.rule_ref,
        correction: `Remove or replace the offending ${v.violation_type} (found: "${v.found_text}")`,
        safety_block: v.severity === 'blocker',
      })),
      ...llmFix,
    ],
    candidate_patterns: criticResult.candidate_patterns || [],
    copy_violations: criticResult.copy_violations || [],
    invariant_check: criticResult.invariant_check || [],
    confidence: criticResult.confidence || 0,
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
      const familyMatch  = content.match(/structural_family:\s*["']?(.+?)["']?\n/);
      const idMatch      = content.match(/candidate_id:\s*["']?(.+?)["']?\n/);
      return {
        file: f,
        pattern_name:      nameMatch   ? nameMatch[1].trim()                         : f,
        description:       descMatch   ? descMatch[1].replace(/\s+/g, ' ').trim()   : '',
        intent_it_serves:  intentMatch ? intentMatch[1].replace(/\s+/g, ' ').trim() : '',
        structural_family: familyMatch ? familyMatch[1].trim()                       : null,
        candidate_id:      idMatch     ? idMatch[1].trim()                           : f.replace('.yaml', ''),
      };
    } catch {
      return { file: f, pattern_name: f, description: '', intent_it_serves: '', structural_family: null, candidate_id: f.replace('.yaml', '') };
    }
  });
}

// Composite text for similarity: name carries 3x weight by repetition,
// description and intent carry 1x each. This means two patterns with
// very different names (AssessmentTab vs ClinicalAssessmentForm) but
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

// ── Change 2 (new): report_pattern structural gate ────────────────────────────

// Load frozen and free arrays from a block's meta.yaml using line-by-line parsing.
function loadBlockContract(blockId, basePath) {
  if (!blockId || blockId === 'none') return null;
  const metaPath = join(basePath, 'blocks', blockId, 'meta.yaml');
  if (!existsSync(metaPath)) return null;
  const lines = readFileSync(metaPath, 'utf-8').split('\n');

  const extractList = (startKey) => {
    const items = [];
    let inside = false;
    for (const line of lines) {
      if (line.match(new RegExp(`^${startKey}:`))) { inside = true; continue; }
      if (inside) {
        if (line.match(/^  - /)) {
          // Strip leading `  - ` and surrounding quotes
          items.push(line.replace(/^  - /, '').replace(/^"/, '').replace(/"$/, '').trim());
        } else if (line.match(/^\S/) && line.trim()) {
          break; // new top-level key
        }
      }
    }
    return items;
  };

  const frozen = extractList('frozen');
  const freeRaw = extractList('free');
  // free entries are "key: description" strings
  const free = freeRaw.map(entry => {
    const colonIdx = entry.indexOf(':');
    return colonIdx > 0
      ? { slot: entry.substring(0, colonIdx).trim(), description: entry.substring(colonIdx + 1).trim() }
      : { slot: entry, description: '' };
  });

  return frozen.length > 0 || free.length > 0 ? { frozen, free } : null;
}

// Structural signals — if any appear in why_existing_patterns_didnt_fit, the delta is structural.
const STRUCTURAL_SIGNALS = [
  'drag', 'multi-select', 'multiselect', 'inline edit', 'inline editing', 'inline-edit',
  'different container', 'different layout', 'does not support', "doesn't support",
  'cannot express', "can't express", 'different interaction', 'interaction model',
  'transforms into', 'transform into', 'different slot', 'new slot', 'slot arrangement',
  'cannot be expressed', 'not supported by', 'layout that cannot', 'reorder', 'resizable',
];

// Check whether a why text contains structural signals.
function hasStructuralSignal(why) {
  const lower = why.toLowerCase();
  return STRUCTURAL_SIGNALS.some(sig => lower.includes(sig));
}

// Check whether a why text conflicts with a safety frozen entry (prefix match on key terms).
function hasSafetyConflict(why, frozenEntry) {
  // Extract description text after " — " in the entry
  const descPart = frozenEntry.includes(' — ') ? frozenEntry.split(' — ').slice(1).join(' — ') : frozenEntry;
  const entryTokens = tokenize(descPart).filter(t => t.length >= 4);
  const whyTokens   = tokenize(why).filter(t => t.length >= 4);
  // Match on 5-char prefix to catch inflected forms (dismiss/dismissed/dismissable)
  const conflicts = entryTokens.filter(et =>
    whyTokens.some(wt => wt.substring(0, 5) === et.substring(0, 5))
  );
  return conflicts.length >= 2;
}

// Run the structural gate for a report_pattern submission.
// Returns { pass: true, structural_delta } or a blocked/probe response object.
function runStructuralGate(params, basePath) {
  const { closest_match_block_id: blockId, why_existing_patterns_didnt_fit: why = '' } = params;

  // "none" → no probe, proceed
  if (!blockId || blockId === 'none') return { pass: true, structural_delta: why };

  const contract = loadBlockContract(blockId, basePath);

  // No frozen field → advisory generic probe only, no hard block
  if (!contract || contract.frozen.length === 0) {
    return {
      pass: false,
      probe: true,
      probe_questions: [
        `Does your intent require a different container or layout structure than ${blockId} provides?`,
        `Does your intent require a different interaction model (e.g. drag-and-drop, multi-select, inline edit, different action placement)?`,
        `Does your intent require slots or data zones that ${blockId} has no equivalent for?`,
      ],
      probe_instruction:
        `If all answers are NO, your delta is content — use ${blockId} as-is. ` +
        `Fill its free slots with your domain content. ` +
        `If any answer is YES, state which one specifically, then resubmit.`,
    };
  }

  const safetyEntries    = contract.frozen.filter(e => e.startsWith('safety:'));
  const nonSafetyEntries = contract.frozen.filter(e => !e.startsWith('safety:'));

  // Check safety conflicts first — these hard-block regardless of structural argument
  const conflictingEntry = safetyEntries.find(e => hasSafetyConflict(why, e));
  if (conflictingEntry) {
    return {
      pass: false,
      blocked: true,
      reason: `Safety constraint — not a structural debate. The constraint referenced below is immovable.`,
      use_instead: blockId,
      safety_reminder: safetyEntries.map(e => e.replace(/^safety:\s*/, '').trim()),
    };
  }

  // If why describes a structural change → pass through
  if (hasStructuralSignal(why)) {
    return { pass: true, structural_delta: why, safety_reminder: safetyEntries.length > 0 ? safetyEntries.map(e => e.replace(/^safety:\s*/, '').trim()) : undefined };
  }

  // No structural signal → content variation, block
  const freeSlots = contract.free.length > 0
    ? contract.free.map(f => f.slot)
    : ['title', 'label', 'status', 'meta', 'primaryAction', 'contextLabel'];

  return {
    pass: false,
    blocked: true,
    reason: `Content variation, not structural. Use ${blockId} as-is.`,
    use_instead: blockId,
    free_slots: freeSlots,
    probe_questions: nonSafetyEntries.map(e => `Does your intent require changing: ${e}?`),
    probe_instruction:
      `Answer each question. If all answers are NO, your delta is content — ` +
      `use ${blockId} as-is. If any answer is YES, state which one and why, then resubmit.`,
    ...(safetyEntries.length > 0 ? { safety_reminder: safetyEntries.map(e => e.replace(/^safety:\s*/, '').trim()) } : {}),
  };
}

// ── Change 4: structural family deduplication helpers ─────────────────────────

// Build a map of block_name (lowercase) → structural_family from the blocks directory.
function loadBlockFamilyMap(basePath) {
  const blocksDir = join(basePath, 'blocks');
  const map = {};
  try {
    const entries = readdirSync(blocksDir);
    for (const entry of entries) {
      if (entry.startsWith('_')) continue;
      const metaPath = join(blocksDir, entry, 'meta.yaml');
      if (!existsSync(metaPath)) continue;
      try {
        const content = readFileSync(metaPath, 'utf-8');
        const familyMatch = content.match(/structural_family:\s*["']?(.+?)["']?\n/);
        if (familyMatch) map[entry.toLowerCase()] = familyMatch[1].trim();
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return map;
}

// Keyword-to-family fallback table.
const FAMILY_KEYWORD_MAP = {
  'form-input':        ['input', 'field', 'textfield', 'textarea'],
  'data-row':          ['data row', 'table row'],
  'entity-header':     ['entity header', 'context header', 'patient header'],
  'feedback-banner':   ['banner', 'notification', 'feedback message'],
  'actionable-list-row': ['worklist', 'action row', 'entity row', 'list row'],
  'assessment-form':   ['assessment', 'questionnaire', 'screening', 'sdoh'],
  'stat-metric-card':  ['metric', 'stat', 'count', 'kpi', 'summary count'],
  'status-indicator':  ['status badge', 'status indicator', 'state indicator'],
  'modal-dialog':      ['modal', 'dialog', 'confirmation dialog'],
  'overlay-panel':     ['drawer', 'sheet', 'overlay panel'],
  'form-layout':       ['form layout', 'form container'],
  'severity-alert-banner': ['alert banner', 'severity alert', 'clinical alert'],
};

// Infer structural_family from pattern name, description, and why text.
function inferStructuralFamily(params, basePath) {
  const text = [
    params.description || '',
    params.why_existing_patterns_didnt_fit || '',
    params.pattern_name || '',
  ].join(' ').toLowerCase();

  // Step 1: check for known block names referenced in the why/description text
  const blockFamilyMap = loadBlockFamilyMap(basePath);
  for (const [blockName, family] of Object.entries(blockFamilyMap)) {
    if (text.includes(blockName)) return family;
  }

  // Step 2: keyword match against known family names
  for (const [family, keywords] of Object.entries(FAMILY_KEYWORD_MAP)) {
    const hits = keywords.filter(kw => text.includes(kw));
    if (hits.length >= 2) return family;
  }

  return null;
}

// Update an existing candidate YAML: increment frequency, append impl ref, update timestamp.
function mergeIntoCandidate(candidatePath, implementationRef) {
  let content = readFileSync(candidatePath, 'utf-8');

  // Increment frequency_count (and legacy frequency field if present)
  const freqMatch = content.match(/frequency_count:\s*(\d+)/);
  const existingFreq = freqMatch ? parseInt(freqMatch[1], 10) : 1;
  const newFreq = existingFreq + 1;
  content = content.replace(/frequency_count:\s*\d+/, `frequency_count: ${newFreq}`);
  content = content.replace(/^frequency:\s*\d+/m, `frequency: ${newFreq}`);

  // Append implementation_ref if provided
  if (implementationRef) {
    if (/^implementation_refs:/m.test(content)) {
      // Already an array — append
      content = content.replace(
        /(implementation_refs:(?:\n  - .+)*)/,
        `$1\n  - "${implementationRef}"`
      );
    } else if (/^implementation_ref:/m.test(content)) {
      // Singular → convert to plural array
      content = content.replace(
        /^implementation_ref:\s*["']?(.+?)["']?\n/m,
        (_, existing) =>
          `implementation_refs:\n  - "${existing.trim()}"\n  - "${implementationRef}"\n`
      );
    } else {
      content += `\nimplementation_refs:\n  - "${implementationRef}"\n`;
    }
  }

  // Update or insert updated_at timestamp
  const now = new Date().toISOString();
  if (/^updated_at:/m.test(content)) {
    content = content.replace(/^updated_at:\s*.+/m, `updated_at: "${now}"`);
  } else {
    content = content.replace(
      /(frequency_count:\s*\d+\n)/,
      `$1updated_at: "${now}"\n`
    );
  }

  writeFileSync(candidatePath, content, 'utf-8');
  return newFreq;
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

  const candidatesDir = join(basePath, 'blocks', '_candidates');
  if (!existsSync(candidatesDir)) mkdirSync(candidatesDir, { recursive: true });

  const existing = loadExistingCandidates(candidatesDir);

  // ── Change 4: structural family deduplication ─────────────────────────────
  const incomingFamily = inferStructuralFamily(params, basePath);
  if (incomingFamily) {
    const familyMatch = existing.find(e => e.structural_family === incomingFamily);
    if (familyMatch) {
      const candidatePath = join(candidatesDir, familyMatch.file);
      const newFreq = mergeIntoCandidate(candidatePath, implementation_ref || null);
      const newStatus = newFreq >= 3 ? 'ready_for_ratification'
                      : newFreq === 2 ? 'needs_more_signal'
                      : 'logged';
      process.stderr.write(
        `[report_pattern] Merged into existing candidate ${familyMatch.candidate_id} ` +
        `(structural_family: ${incomingFamily}). frequency_count: ${newFreq}\n`
      );
      return {
        candidate_id:        familyMatch.candidate_id,
        frequency_count:     newFreq,
        status:              newStatus,
        merged_into_existing: true,
        source:              'local_fallback',
      };
    }
  }
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

  // Design Mind improvement: Change 3 — candidate decay tracking
  const projectId = process.env.DESIGN_MIND_PROJECT || basePath.split('/').pop() || 'unknown';
  const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD

  // Include inferred structural_family in the YAML so future deduplication works (Change 4)
  const structuralFamilyLine = incomingFamily ? `structural_family: "${incomingFamily}"` : null;

  const yamlContent = [
    `# Design Mind Pattern Candidate`,
    `# Generated: ${new Date().toISOString()}`,
    `# Status: ${status}`,
    `# NOTE: written locally — API was unreachable. Submit to design-mind-mcp when online.`,
    ``,
    `candidate_id: "${candidateId}"`,
    `pattern_name: "${pattern_name}"`,
    `status: ${status}`,
    `frequency: ${frequencyCount}`,
    `frequency_count: ${frequencyCount}`,
    ...(structuralFamilyLine ? [structuralFamilyLine] : []),
    ``,
    `reporting_projects:`,
    `  - project_id: "${projectId}"`,
    `    last_active: "${today}"`,
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
    params.structural_delta
      ? `structural_delta: >\n  ${params.structural_delta.replace(/\n/g, '\n  ')}`
      : null,
    params.structural_delta ? `` : null,
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
    `# 3. If valid: create blocks/${pattern_name}/ with meta.yaml and component.tsx`,
    `# 4. Run: node server/src/seed.js to re-index`,
  ].filter(line => line !== null).join('\n');

  writeFileSync(join(candidatesDir, `${candidateId}.yaml`), yamlContent, 'utf-8');

  if (params.preview_code) {
    writeFileSync(join(candidatesDir, `${candidateId}.preview.tsx`), params.preview_code, 'utf-8');
    process.stderr.write(`[reportPattern] Preview written: ${candidateId}.preview.tsx\n`);
  }

  return { candidate_id: candidateId, similar_candidates: similar.map(s => ({ file: s.file, pattern_name: s.pattern_name })), frequency_count: frequencyCount, status, source: 'local_fallback' };
}

/**
 * Submits a novel pattern candidate to the hosted API.
 * Falls back to local file write if the API is unreachable.
 */
export async function reportPattern(params, basePath) {
  // ── Change 2: structural gate — runs before API submission ───────────────────
  const gateResult = runStructuralGate(params, basePath);
  if (!gateResult.pass) {
    // Probe (advisory, no frozen) — return questions but do not block hard
    if (gateResult.probe) return gateResult;
    // Blocked — content variation or safety conflict
    return gateResult;
  }

  // Gate passed — attach structural_delta for the candidate record
  const paramsWithDelta = {
    ...params,
    structural_delta: gateResult.structural_delta || params.why_existing_patterns_didnt_fit,
    safety_reminder:  gateResult.safety_reminder,
  };

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
    return localFallback(paramsWithDelta, basePath, `API returned ${result.status}`);
  } catch (err) {
    return localFallback(paramsWithDelta, basePath, err.message);
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
