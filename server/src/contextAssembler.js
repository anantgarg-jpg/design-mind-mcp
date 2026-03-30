/**
 * contextAssembler.js
 * Core logic for the three MCP tools.
 *
 * Tools:
 *   consultBeforeBuild  — pre-generation context retrieval
 *   reviewOutput        — post-generation critique
 *   reportPattern       — novel pattern candidate logging
 */

import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { loadGenome, getGenomeForLLM } from './genomeLoader.js';
import { callDesignMind, callCritic } from './llmClient.js';
import { loadTokenAllowlist } from './tokenResolver.js';

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return [val];
  return [];
}

// ── TOOL 1: consult_before_build ─────────────────────────────────────────────
//
// The genome is served as MCP resources read at session start.
// This handler returns unratified candidates that match the intent — frequency-
// weighted patterns that teams have built but aren't yet ratified blocks.
// Precedence: ratified surface > ratified blocks > unratified candidates.

function _candidatesDir() {
  const BASE = join(new URL(import.meta.url).pathname, '..', '..', '..');
  return join(BASE, 'blocks', '_candidates');
}

function _getMatchingCandidates(intentDescription) {
  const candidatesDir = _candidatesDir();
  if (!existsSync(candidatesDir)) return [];

  const candidates = loadExistingCandidates(candidatesDir);
  if (candidates.length === 0) return [];

  const intentLower = intentDescription.toLowerCase();
  const scored = candidates
    .map(c => {
      const score = stringSimilarity(intentLower, compositeText(c.pattern_name, c.description, c.intent_it_serves));
      return { ...c, _score: score };
    })
    .filter(c => c._score > 0.08)
    .sort((a, b) => b._score - a._score)
    .slice(0, 5);

  return scored.map(({ _score, file, ...rest }) => rest);
}

export function consultBeforeBuild(params) {
  const { intent_description } = params;
  const candidates = _getMatchingCandidates(intent_description);
  return {
    unratified_candidates: candidates,
  };
}


// ── New validation functions ──────────────────────────────────────────────────

/**
 * Validates that all blocks are imported from the correct source (@innovaccer/ui-assets).
 * Detects: shadcn duplication, wrong tier, local reimplementation, style block reimplementation,
 * className invariant conflicts.
 */
function validateBlockSources(code, genome) {
  const violations = [];
  const genomeBlockIds = new Set(genome.blocks.keys());

  // 1. Parse all imports
  const imports = [];

  // NPM canonical: import { X } from '@innovaccer/ui-assets/block-primitives/X'
  const npmRe = /import\s+\{([^}]+)\}\s+from\s+['"]@innovaccer\/ui-assets\/(block-primitives|block-composites|surfaces)\/(\w+)['"]/g;
  let m;
  while ((m = npmRe.exec(code)) !== null) {
    const names = m[1].split(',').map(s => s.trim()).filter(Boolean);
    imports.push({ names, source: 'npm', tier: m[2], blockPath: m[3] });
  }

  // shadcn: import { X } from '@/components/ui/x'
  const shadcnRe = /import\s+\{([^}]+)\}\s+from\s+['"]@\/components\/ui\/[\w-]+['"]/g;
  while ((m = shadcnRe.exec(code)) !== null) {
    const names = m[1].split(',').map(s => s.trim()).filter(s => /^[A-Z]/.test(s));
    for (const name of names) {
      if (genomeBlockIds.has(name)) {
        const entry = genome.blocks.get(name);
        const level = entry?.meta?.level || 'composite';
        const tier = level === 'primitive' ? 'block-primitives' : 'block-composites';
        violations.push({
          violation_type: 'shadcn-duplication',
          found_text: m[0],
          correction: `import { ${name} } from '@innovaccer/ui-assets/${tier}/${name}'`,
          severity: 'blocker',
          rule_ref: 'safety/hard-constraints.md rule 25',
        });
      }
    }
    imports.push({ names, source: 'shadcn' });
  }

  // Local/relative: import { X } from '@/components/X' or './X' or '../ui/X'
  const localRe = /import\s+\{([^}]+)\}\s+from\s+['"]((?:@\/|\.\.?\/)[^'"]+)['"]/g;
  while ((m = localRe.exec(code)) !== null) {
    if (m[2].startsWith('@innovaccer/')) continue; // already handled
    if (m[2].startsWith('@/components/ui/')) continue; // already handled as shadcn
    const names = m[1].split(',').map(s => s.trim()).filter(s => /^[A-Z]/.test(s));
    for (const name of names) {
      if (genomeBlockIds.has(name)) {
        const entry = genome.blocks.get(name);
        const level = entry?.meta?.level || 'composite';
        const tier = level === 'primitive' ? 'block-primitives' : 'block-composites';
        violations.push({
          violation_type: 'local-import-duplication',
          found_text: m[0],
          correction: `import { ${name} } from '@innovaccer/ui-assets/${tier}/${name}'`,
          severity: 'blocker',
          rule_ref: 'safety/hard-constraints.md rule 25',
        });
      }
    }
    imports.push({ names, source: 'local', path: m[2] });
  }

  // 2. Check wrong-tier imports
  for (const imp of imports) {
    if (imp.source !== 'npm') continue;
    for (const name of imp.names) {
      const cleanName = name.replace(/\s+as\s+\w+/, '').trim();
      if (!genomeBlockIds.has(cleanName)) continue;
      const entry = genome.blocks.get(cleanName);
      const level = entry?.meta?.level || 'composite';
      const expectedTier = level === 'primitive' ? 'block-primitives' : 'block-composites';
      if (imp.tier !== expectedTier) {
        violations.push({
          violation_type: 'wrong-tier-import',
          found_text: `${cleanName} imported from ${imp.tier}`,
          correction: `import { ${cleanName} } from '@innovaccer/ui-assets/${expectedTier}/${cleanName}'`,
          severity: 'blocker',
          rule_ref: 'safety/hard-constraints.md rule 25',
        });
      }
    }
  }

  // 3. Check local reimplementation (const/function definitions)
  const importedFromPackage = new Set();
  for (const imp of imports) {
    if (imp.source === 'npm') {
      for (const n of imp.names) importedFromPackage.add(n.replace(/\s+as\s+\w+/, '').trim());
    }
  }

  const defRe = /(?:const|let|var|function)\s+([A-Z]\w+)\s*(?:=\s*(?:styled|forwardRef|React\.forwardRef|memo|React\.memo)\s*\(|[=(])/g;
  while ((m = defRe.exec(code)) !== null) {
    const name = m[1];
    if (genomeBlockIds.has(name) && !importedFromPackage.has(name)) {
      if (isInComment(code, m[0])) continue;
      const entry = genome.blocks.get(name);
      const level = entry?.meta?.level || 'composite';
      const tier = level === 'primitive' ? 'block-primitives' : 'block-composites';
      violations.push({
        violation_type: 'local-reimplementation',
        found_text: m[0].trim(),
        correction: `import { ${name} } from '@innovaccer/ui-assets/${tier}/${name}'`,
        severity: 'blocker',
        rule_ref: 'safety/hard-constraints.md rule 25',
      });
    }
  }

  // 4. Check <style> block reimplementation
  const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    const styleContent = styleMatch[1];
    for (const blockId of genomeBlockIds) {
      const lower = blockId.toLowerCase();
      const abbrev = lower.slice(0, 3);
      const cssRe = new RegExp(`\\.(?:${lower}|${abbrev})[^{]*\\{`, 'i');
      if (cssRe.test(styleContent)) {
        violations.push({
          violation_type: 'style-reimplementation',
          found_text: `<style> contains CSS for ${blockId}`,
          correction: `Import ${blockId} from @innovaccer/ui-assets instead of reimplementing in CSS`,
          severity: 'blocker',
          rule_ref: 'safety/hard-constraints.md rule 25',
        });
      }
    }
  }

  // 5. Check className override conflicts with family_invariants
  for (const blockId of importedFromPackage) {
    const entry = genome.blocks.get(blockId);
    if (!entry || entry.meta.level !== 'primitive') continue;
    // Match <BlockId className="..." or <BlockId className={cn("..."
    const clsRe = new RegExp(`<${blockId}[^>]*className=(?:{[^}]*(?:cn|clsx|cva)\\s*\\(\\s*)?["']([^"']+)["']`, 'g');
    let cm;
    while ((cm = clsRe.exec(code)) !== null) {
      if (classHasInvariantConflict(cm[1])) {
        violations.push({
          violation_type: 'invariant-override',
          found_text: `<${blockId} className="${cm[1]}">`,
          correction: `Only additive classes (positioning, sizing, spacing, layout) are allowed. Remove classes that conflict with ${blockId}'s family_invariants.`,
          severity: 'blocker',
          rule_ref: 'safety/hard-constraints.md rule 22',
        });
      }
    }
  }

  return violations;
}

/**
 * Validates that the generated code aligns with the consult_before_build response.
 * Checks: surface import, layout region ordering, never constraints, workflow completeness, block coverage.
 */
function validateConsultationAlignment(code, contextUsed) {
  if (!contextUsed) return [];
  const violations = [];

  // Resolve which block IDs appear in the code (imported or used as JSX)
  const usedBlockIds = new Set();
  // Check imports
  const importRe = /import\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g;
  let m;
  while ((m = importRe.exec(code)) !== null) {
    const names = m[1].split(',').map(s => s.trim().replace(/\s+as\s+\w+/, '')).filter(s => /^[A-Z]/.test(s));
    for (const n of names) usedBlockIds.add(n);
  }
  // Check JSX usage
  const jsxRe = /<([A-Z]\w+)[\s/>]/g;
  while ((m = jsxRe.exec(code)) !== null) {
    usedBlockIds.add(m[1]);
  }

  // 1. Surface validation
  const surface = contextUsed.surface;
  if (surface && surface.matched && surface.surface_id) {
    if (!usedBlockIds.has(surface.surface_id)) {
      const importInstr = surface.import_instruction || `import from @innovaccer/ui-assets/surfaces/${surface.surface_id}`;
      // Also check if there's an explicit import statement for the surface
      const surfaceImported = code.includes(`@innovaccer/ui-assets/surfaces/`);
      if (!surfaceImported) {
        violations.push({
          violation_type: 'surface-not-imported',
          found_text: `Surface ${surface.surface_id} was matched but not imported`,
          correction: importInstr,
          severity: 'blocker',
          rule_ref: 'consult_before_build surface recommendation',
        });
      }
    }
  }

  // 2. Layout region ordering + never constraints
  const regions = contextUsed.layout?.regions || [];
  if (regions.length > 1) {
    // Check ordering: first occurrence of any block from region N should be before region N+1
    const regionPositions = regions.map(region => {
      const blocks = region.blocks || [];
      let earliest = Infinity;
      for (const blockId of blocks) {
        const idx = code.indexOf(`<${blockId}`);
        if (idx !== -1 && idx < earliest) earliest = idx;
      }
      return { id: region.id, order: region.order, earliest };
    }).filter(r => r.earliest < Infinity);

    for (let i = 0; i < regionPositions.length - 1; i++) {
      for (let j = i + 1; j < regionPositions.length; j++) {
        if (regionPositions[i].order < regionPositions[j].order &&
            regionPositions[i].earliest > regionPositions[j].earliest) {
          violations.push({
            violation_type: 'layout-ordering-mismatch',
            found_text: `Region "${regionPositions[j].id}" appears before "${regionPositions[i].id}" in code`,
            correction: `Region "${regionPositions[i].id}" (order ${regionPositions[i].order}) should appear before "${regionPositions[j].id}" (order ${regionPositions[j].order})`,
            severity: 'warning',
            rule_ref: 'consult_before_build layout.regions ordering',
          });
        }
      }
    }

    // Check never constraints
    for (const region of regions) {
      const neverBlocks = region.never || [];
      for (const forbidden of neverBlocks) {
        if (usedBlockIds.has(forbidden)) {
          // Check if the forbidden block appears near the region's blocks
          violations.push({
            violation_type: 'never-constraint-violation',
            found_text: `${forbidden} is used but forbidden in region "${region.id}"`,
            correction: `Remove ${forbidden} from the "${region.id}" region — it is in the 'never' list`,
            severity: 'blocker',
            rule_ref: 'consult_before_build layout.regions.never',
          });
        }
      }
    }
  }

  // 3. Workflow completeness
  const workflows = contextUsed.workflows || [];
  for (const wf of workflows) {
    const wfBlocks = (wf.blocks || []).map(b => b.id);
    const hasRepresentation = wfBlocks.some(id => usedBlockIds.has(id));
    if (wfBlocks.length > 0 && !hasRepresentation) {
      violations.push({
        violation_type: 'workflow-not-represented',
        found_text: `Workflow "${wf.id}" (${wf.intent}) has no blocks in the generated code`,
        correction: `Import and use at least one of: ${wfBlocks.join(', ')}`,
        severity: 'warning',
        rule_ref: 'consult_before_build workflow recommendation',
      });
    }
  }

  // 4. Block coverage
  const allRecommended = contextUsed.blocks || [];
  for (const block of allRecommended) {
    if (!usedBlockIds.has(block.id)) {
      violations.push({
        violation_type: 'recommended-block-unused',
        found_text: `Recommended block ${block.id} not found in generated code`,
        correction: block.import_instruction || `Import ${block.id} from @innovaccer/ui-assets`,
        severity: 'warning',
        rule_ref: 'consult_before_build block recommendation',
      });
    }
  }

  return violations;
}

/**
 * Validates that all color/spacing/typography values use semantic tokens.
 * Uses the installed @innovaccer/ui-assets tokens as the primary allowlist,
 * falls back to styling-tokens.rule.md.
 */
function validateTokenUsage(code, genome) {
  const violations = [];
  const { semanticTokens, familyInvariantClasses } = loadTokenAllowlist(genome);
  const allowedClasses = new Set([...semanticTokens, ...familyInvariantClasses]);

  // Strip comments to avoid false positives
  const stripped = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(['"`])(?:(?!\1).)*\1/g, '""'); // strip string contents but keep structure

  // 1. Hardcoded hex colors
  const hexRe = /#[0-9A-Fa-f]{3,8}\b/g;
  let m;
  while ((m = hexRe.exec(stripped)) !== null) {
    if (isInComment(code, m[0])) continue;
    violations.push({
      violation_type: 'hardcoded-hex',
      found_text: m[0],
      correction: 'Use a semantic color token from @innovaccer/ui-assets/tokens',
      severity: 'blocker',
      rule_ref: 'styling-tokens.rule.md',
    });
  }

  // 2. CSS color functions in inline styles
  const cssFnRe = /(?:rgba?|hsla?|oklch)\s*\([^)]+\)/g;
  while ((m = cssFnRe.exec(stripped)) !== null) {
    if (isInComment(code, m[0])) continue;
    violations.push({
      violation_type: 'hardcoded-color-function',
      found_text: m[0],
      correction: 'Use a semantic color token instead of CSS color functions',
      severity: 'blocker',
      rule_ref: 'styling-tokens.rule.md',
    });
  }

  // 3. Non-semantic Tailwind color classes
  // Match: bg-{color}-{shade}, text-{color}-{shade}, border-{color}-{shade}, etc.
  const twColorRe = /\b((?:bg|text|border|ring|shadow|fill|stroke|accent|divide|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)-\d{2,4})\b/g;
  while ((m = twColorRe.exec(stripped)) !== null) {
    if (allowedClasses.has(m[1])) continue; // in allowlist
    if (isInComment(code, m[1])) continue;
    violations.push({
      violation_type: 'non-semantic-tailwind-color',
      found_text: m[1],
      correction: 'Use a semantic token class (e.g., bg-muted, text-foreground, border-subtle)',
      severity: 'blocker',
      rule_ref: 'styling-tokens.rule.md',
    });
  }

  // 4. !important on token-controlled properties
  const importantRe = /!(bg|text|border|ring|shadow|font|rounded|gap|p|m)-[\w-]+/g;
  while ((m = importantRe.exec(stripped)) !== null) {
    violations.push({
      violation_type: 'important-override',
      found_text: m[0],
      correction: 'Remove !important — use the correct semantic token instead of forcing overrides',
      severity: 'warning',
      rule_ref: 'styling-tokens.rule.md',
    });
  }

  // 5. Arbitrary Tailwind values for spacing
  const arbitraryRe = /\b((?:gap|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h)-\[\d+px\])/g;
  while ((m = arbitraryRe.exec(stripped)) !== null) {
    if (isInComment(code, m[1])) continue;
    violations.push({
      violation_type: 'arbitrary-spacing',
      found_text: m[1],
      correction: 'Use spacing tokens (multiples of 4px: gap-1, gap-2, gap-3, gap-4, etc.)',
      severity: 'warning',
      rule_ref: 'styling-tokens.rule.md',
    });
  }

  return violations;
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


// Check for non-canonical terminology
function checkNonCanonicalTerms(code, genome) {
  const violations = [];
  const entitiesEntry = genome.ontology?.get('entities');
  const entities = entitiesEntry?.entities || entitiesEntry || {};

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
function checkHonored(code, contextUsed) {
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

export async function reviewOutput(params) {
  const {
    generated_output: code,
    original_intent,
    context_used: contextUsed,
  } = params;

  const genome = loadGenome();

  // ── Step 1: Deterministic auto-checks ──────────────────────────────────────
  const blockViolations     = validateBlockSources(code, genome);
  const alignmentViolations = validateConsultationAlignment(code, contextUsed);
  const tokenViolations     = validateTokenUsage(code, genome);
  const copyViolations      = checkCopyVoice(code);
  const termViolations      = checkNonCanonicalTerms(code, genome);
  const honored             = checkHonored(code, contextUsed);

  const allAutoChecks = [
    ...blockViolations,
    ...alignmentViolations,
    ...tokenViolations,
    ...copyViolations.map(cv => ({
      violation_type: 'copy-voice',
      found_text: cv.found,
      correction: cv.correction,
      severity: 'warning',
      rule_ref: cv.rule,
    })),
    ...termViolations.map(tv => ({
      violation_type: 'non-canonical-term',
      found_text: tv.problem,
      correction: tv.correction,
      severity: 'warning',
      rule_ref: tv.rule_violated,
    })),
  ];

  // ── Step 2: LLM Critic ────────────────────────────────────────────────────
  let criticResult = {};
  try {
    criticResult = await callCritic({
      generatedCode: code,
      originalIntent: original_intent || '',
      genomeContext: getGenomeForLLM(),
      autoCheckResults: allAutoChecks,
      contextUsed: contextUsed || null,
    });
  } catch (err) {
    process.stderr.write(`[reviewOutput] Critic call failed: ${err.message}\n`);
  }

  // ── Step 3: Merge and deduplicate ─────────────────────────────────────────
  const llmFixes = criticResult.fix || [];
  const autoFixTexts = new Set(allAutoChecks.map(v => v.found_text));

  // Remove LLM fixes that duplicate auto-check findings
  const dedupedLlmFixes = llmFixes.filter(f => {
    const problem = f.problem || '';
    return !autoFixTexts.has(problem);
  });

  const response = {
    auto_checks: allAutoChecks,
    honored: [...honored, ...(criticResult.honored || [])],
    borderline: criticResult.borderline || [],
    novel: criticResult.novel || [],
    fix: [...allAutoChecks.filter(v => v.severity === 'blocker'), ...dedupedLlmFixes],
    candidate_patterns: criticResult.candidate_patterns || [],
    next_step: (criticResult.candidate_patterns || []).length > 0
      ? `REQUIRED: call report_pattern for each entry in candidate_patterns before proceeding. ` +
        `Do not skip this step. review_output and report_pattern are separate obligations — ` +
        `completing review does not discharge the reporting requirement.`
      : undefined,
    copy_violations: copyViolations,
    layout_compliance: criticResult.layout_compliance || [],
    confidence: criticResult.confidence || 0,
  };

  return response;
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
      const freqMatch    = content.match(/frequency_count:\s*(\d+)/);
      return {
        file: f,
        pattern_name:      nameMatch   ? nameMatch[1].trim()                         : f,
        description:       descMatch   ? descMatch[1].replace(/\s+/g, ' ').trim()   : '',
        intent_it_serves:  intentMatch ? intentMatch[1].replace(/\s+/g, ' ').trim() : '',
        structural_family: familyMatch ? familyMatch[1].trim()                       : null,
        candidate_id:      idMatch     ? idMatch[1].trim()                           : f.replace('.yaml', ''),
        frequency_count:   freqMatch   ? parseInt(freqMatch[1], 10)                  : 1,
      };
    } catch {
      return { file: f, pattern_name: f, description: '', intent_it_serves: '', structural_family: null, candidate_id: f.replace('.yaml', ''), frequency_count: 1 };
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

  // No frozen field → check for structural signal in why; if present, pass through.
  // If absent, probe once (advisory) but do not loop — probe has no resubmit path here.
  if (!contract || contract.frozen.length === 0) {
    if (hasStructuralSignal(why)) {
      return { pass: true, structural_delta: why };
    }
    return {
      pass: false,
      probe: true,
      probe_questions: [
        `Does your intent require a different container or layout structure than ${blockId} provides?`,
        `Does your intent require a different interaction model (e.g. drag-and-drop, multi-select, inline edit, different action placement)?`,
        `Does your intent require slots or data zones that ${blockId} has no equivalent for?`,
      ],
      probe_instruction:
        `If all answers are NO, your delta is content — use ${blockId} as-is and do NOT resubmit. ` +
        `If any answer is YES, resubmit once with why_existing_patterns_didnt_fit updated to name the specific structural difference.`,
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
    `# 3. If valid: create blocks/${pattern_name}/ with meta.yaml (npm_path required); source lives in @innovaccer/ui-assets`,
    `# 4. Run: node server/src/seed.js to re-index`,
  ].filter(line => line !== null).join('\n');

  writeFileSync(join(candidatesDir, `${candidateId}.yaml`), yamlContent, 'utf-8');

  if (params.preview_code) {
    writeFileSync(join(candidatesDir, `${candidateId}.preview.tsx`), params.preview_code, 'utf-8');
    process.stderr.write(`[reportPattern] Preview written: ${candidateId}.preview.tsx\n`);
  }

  return { candidate_id: candidateId, similar_candidates: similar.map(s => ({ file: s.file, pattern_name: s.pattern_name })), frequency_count: frequencyCount, status, source: 'local_fallback' };
}

// ── Session candidate cache ───────────────────────────────────────────────────
// Tracks patterns reported in this server process lifetime.
// Key: normalized pattern name (lowercase, alphanumeric only)
// Value: { candidate_id, frequency_count }
// Purpose: within one working session, revisions of the same pattern replace
// the earlier candidate rather than creating duplicates or inflating frequency.

const _sessionCandidates = new Map();

function normalizePatternName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function replaceSessionCandidate(params, basePath, sessionEntry) {
  const candidatesDir = join(basePath, 'blocks', '_candidates');
  const { candidate_id: oldId, frequency_count: frozenFreq } = sessionEntry;

  // Remove old files
  try { if (existsSync(join(candidatesDir, `${oldId}.yaml`)))        unlinkSync(join(candidatesDir, `${oldId}.yaml`));        } catch {}
  try { if (existsSync(join(candidatesDir, `${oldId}.preview.tsx`))) unlinkSync(join(candidatesDir, `${oldId}.preview.tsx`)); } catch {}

  const newId = generateCandidateId(params.pattern_name);
  const {
    pattern_name, description, intent_it_serves,
    why_existing_patterns_didnt_fit, ontology_refs = [],
    implementation_ref = '', structural_delta,
  } = params;

  const status = frozenFreq >= 3 ? 'ready_for_ratification'
               : frozenFreq === 2 ? 'needs_more_signal'
               : 'logged';

  const incomingFamily      = inferStructuralFamily(params, basePath);
  const structuralFamilyLine = incomingFamily ? `structural_family: "${incomingFamily}"` : null;
  const projectId           = process.env.DESIGN_MIND_PROJECT || basePath.split('/').pop() || 'unknown';
  const today               = new Date().toISOString().substring(0, 10);

  if (!existsSync(candidatesDir)) mkdirSync(candidatesDir, { recursive: true });

  const yamlContent = [
    `# Design Mind Pattern Candidate`,
    `# Generated: ${new Date().toISOString()} (session revision — frequency frozen at ${frozenFreq})`,
    `# Status: ${status}`,
    ``,
    `candidate_id: "${newId}"`,
    `pattern_name: "${pattern_name}"`,
    `status: ${status}`,
    `frequency: ${frozenFreq}`,
    `frequency_count: ${frozenFreq}`,
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
    structural_delta ? `structural_delta: >\n  ${structural_delta.replace(/\n/g, '\n  ')}` : null,
    structural_delta ? `` : null,
    implementation_ref ? `implementation_ref: "${implementation_ref}"` : `implementation_ref: null`,
    ``,
    `ontology_refs:`,
    ...(Array.isArray(ontology_refs) && ontology_refs.length > 0
      ? ontology_refs.map(r => `  - ${r}`)
      : ['  []']),
    ``,
    `# Instructions for human ratification:`,
    `# 1. Review the description and intent`,
    `# 2. If valid: create blocks/${pattern_name}/ with meta.yaml`,
    `# 3. Run: node server/src/seed.js to re-index`,
  ].filter(l => l !== null).join('\n');

  writeFileSync(join(candidatesDir, `${newId}.yaml`), yamlContent, 'utf-8');

  if (params.preview_code) {
    writeFileSync(join(candidatesDir, `${newId}.preview.tsx`), params.preview_code, 'utf-8');
  }

  _sessionCandidates.set(normalizePatternName(pattern_name), { candidate_id: newId, frequency_count: frozenFreq });

  process.stderr.write(`[reportPattern] Session revision: ${oldId} → ${newId} (frequency frozen at ${frozenFreq})\n`);

  return {
    candidate_id:     newId,
    frequency_count:  frozenFreq,
    status,
    session_revision: true,
    replaced:         oldId,
    source:           'local_session_replace',
  };
}

/**
 * Submits a novel pattern candidate to the hosted API.
 * Falls back to local file write if the API is unreachable.
 * Session revisions replace the earlier candidate and freeze frequency_count.
 */
export async function reportPattern(params, basePath) {
  const nameKey = normalizePatternName(params.pattern_name);
  const sessionEntry = _sessionCandidates.get(nameKey);

  // Session revision — replace earlier candidate, freeze frequency_count
  if (sessionEntry) {
    // Still run the structural gate so probe/block logic applies to revisions too
    const gateResult = runStructuralGate(params, basePath);
    if (!gateResult.pass) return gateResult;
    const paramsWithDelta = {
      ...params,
      structural_delta: gateResult.structural_delta || params.why_existing_patterns_didnt_fit,
    };
    return replaceSessionCandidate(paramsWithDelta, basePath, sessionEntry);
  }

  // ── First report in this session ─────────────────────────────────────────────
  const gateResult = runStructuralGate(params, basePath);
  if (!gateResult.pass) return gateResult;

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

  let result;
  try {
    const apiResult = await submitToApi(payload);
    if (apiResult.status === 201) {
      process.stderr.write(`[reportPattern] Submitted to API: ${apiResult.body.candidate_id} (${apiResult.body.status})\n`);
      result = apiResult.body;
    } else {
      result = localFallback(paramsWithDelta, basePath, `API returned ${apiResult.status}`);
    }
  } catch (err) {
    result = localFallback(paramsWithDelta, basePath, err.message);
  }

  // Register in session cache so subsequent calls for same pattern are treated as revisions
  if (result?.candidate_id) {
    _sessionCandidates.set(nameKey, {
      candidate_id:    result.candidate_id,
      frequency_count: result.frequency_count ?? 1,
    });
  }

  return result;
}


