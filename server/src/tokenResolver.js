/**
 * tokenResolver.js
 * Reads design tokens from the installed @innovaccer/ui-assets package and
 * builds an allowlist of valid semantic Tailwind classes + family_invariant classes.
 *
 * Fallback: if the package isn't installed, parses styling-tokens.rule.md from the genome.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const REPO_ROOT  = resolve(__dirname, '..', '..');

const PACKAGE_NAME     = '@innovaccer/ui-assets';
const TOKENS_SUBPATH   = 'src/tokens/index.css';

// ── Module-level cache ──────────────────────────────────────────────────────
let _cachedAllowlist = null;

// ── CSS custom property parser ──────────────────────────────────────────────
// Extracts all --variable-name declarations from a CSS file.

function parseCssCustomProperties(css) {
  const props = new Map();
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    props.set(m[1], m[2].trim());
  }
  return props;
}

// ── Derive Tailwind class names from CSS variable names ─────────────────────
// E.g. --muted → bg-muted, text-muted, border-muted
// E.g. --destructive → bg-destructive, text-destructive, border-destructive

const TAILWIND_PREFIXES = [
  'bg-', 'text-', 'border-', 'ring-', 'outline-', 'shadow-',
  'fill-', 'stroke-', 'accent-', 'caret-', 'decoration-',
  'divide-', 'placeholder-',
];

function deriveTailwindClasses(variableNames) {
  const classes = new Set();
  for (const name of variableNames) {
    // Add the raw variable name as a class (e.g., text-foreground from --foreground)
    for (const prefix of TAILWIND_PREFIXES) {
      classes.add(`${prefix}${name}`);
    }
    // Also add the variable name itself for cases like font-sans, font-mono
    classes.add(name);
  }
  return classes;
}

// ── Family invariants collector ─────────────────────────────────────────────
// Flattens all family_invariants from all genome blocks into a Set of classes.

function collectFamilyInvariantClasses(genome) {
  const classes = new Set();
  for (const [, { meta }] of genome.blocks) {
    const invariants = meta.family_invariants || [];
    for (const invariant of invariants) {
      // Each invariant is a string of space-separated Tailwind classes
      const tokens = invariant.split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        classes.add(token);
      }
    }
  }
  return classes;
}

// ── Fallback: parse styling-tokens.rule.md ──────────────────────────────────
// Extract known semantic token names from the rule file when CSS file unavailable.

function parseTokensFromRuleFile() {
  const rulePath = join(REPO_ROOT, 'genome', 'rules', 'styling-tokens.rule.md');
  if (!existsSync(rulePath)) return new Set();

  const content = readFileSync(rulePath, 'utf-8');
  const classes = new Set();

  // Match patterns like `--variable-name` in the rule file
  const varRe = /--([\w-]+)/g;
  let m;
  while ((m = varRe.exec(content)) !== null) {
    const name = m[1];
    for (const prefix of TAILWIND_PREFIXES) {
      classes.add(`${prefix}${name}`);
    }
  }

  // Also match explicit Tailwind class mentions like `bg-muted`, `text-foreground`
  const twRe = /\b((?:bg|text|border|ring|shadow|fill|stroke|accent|caret|decoration|divide|placeholder)-[\w-]+)/g;
  while ((m = twRe.exec(content)) !== null) {
    classes.add(m[1]);
  }

  return classes;
}

// ── Find project root (reuse logic from packageChecker) ─────────────────────
function findProjectRoot(startDir) {
  let dir = resolve(startDir || process.cwd());
  for (let i = 0; i < 20; i++) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate) && dir !== REPO_ROOT) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Loads the token allowlist. Tries the npm package first, falls back to genome rules.
 *
 * @param {object} genome - The loaded genome object (from genomeLoader)
 * @param {string} [projectRoot] - Optional project root override
 * @returns {{ semanticTokens: Set<string>, familyInvariantClasses: Set<string>, source: string }}
 */
export function loadTokenAllowlist(genome, projectRoot) {
  if (_cachedAllowlist) return _cachedAllowlist;

  const familyInvariantClasses = collectFamilyInvariantClasses(genome);
  let semanticTokens;
  let source;

  // Try reading from installed npm package
  const root = projectRoot || findProjectRoot(process.cwd());
  const tokensPath = root
    ? join(root, 'node_modules', PACKAGE_NAME, TOKENS_SUBPATH)
    : null;

  if (tokensPath && existsSync(tokensPath)) {
    try {
      const css = readFileSync(tokensPath, 'utf-8');
      const props = parseCssCustomProperties(css);
      semanticTokens = deriveTailwindClasses(props.keys());
      source = 'npm-package';
      process.stderr.write(`[tokenResolver] Loaded ${props.size} tokens from ${tokensPath}\n`);
    } catch (err) {
      process.stderr.write(`[tokenResolver] Failed to read tokens CSS: ${err.message}\n`);
      semanticTokens = parseTokensFromRuleFile();
      source = 'rule-file-fallback';
    }
  } else {
    // Fallback to styling-tokens.rule.md
    semanticTokens = parseTokensFromRuleFile();
    source = tokensPath ? 'rule-file-fallback' : 'rule-file-no-project';
    process.stderr.write(`[tokenResolver] Using styling-tokens.rule.md fallback (source: ${source})\n`);
  }

  _cachedAllowlist = { semanticTokens, familyInvariantClasses, source };
  return _cachedAllowlist;
}

/**
 * Clears the cached allowlist. Called when genome is refreshed.
 */
export function clearTokenCache() {
  _cachedAllowlist = null;
}
