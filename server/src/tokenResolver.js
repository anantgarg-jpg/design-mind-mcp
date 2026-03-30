/**
 * tokenResolver.js
 * Reads design tokens from @innovaccer/ui-assets/tokens and builds an allowlist
 * of valid semantic Tailwind classes + family_invariant classes.
 *
 * Resolution order:
 *   1. node_modules/@innovaccer/ui-assets/tokens (direct package path)
 *   2. Project root CSS file that imports from @innovaccer/ui-assets/tokens
 *   3. Empty allowlist (warning logged) — no fallback to genome rule files
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const REPO_ROOT  = resolve(__dirname, '..', '..');

const PACKAGE_NAME   = '@innovaccer/ui-assets';
const TOKENS_SUBPATH = 'tokens';

// Common root CSS entry point candidates (checked in order)
const ROOT_CSS_CANDIDATES = [
  'src/index.css',
  'src/app.css',
  'src/globals.css',
  'app/globals.css',
  'styles/index.css',
  'index.css',
];

// Pattern that must be present in a CSS file for it to be a valid token source
const TOKENS_IMPORT_PATTERN = /@innovaccer\/ui-assets\/tokens/;

// ── Module-level cache ──────────────────────────────────────────────────────
let _cachedAllowlist = null;

// ── CSS custom property parser ──────────────────────────────────────────────
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
const TAILWIND_PREFIXES = [
  'bg-', 'text-', 'border-', 'ring-', 'outline-', 'shadow-',
  'fill-', 'stroke-', 'accent-', 'caret-', 'decoration-',
  'divide-', 'placeholder-',
];

function deriveTailwindClasses(variableNames) {
  const classes = new Set();
  for (const name of variableNames) {
    for (const prefix of TAILWIND_PREFIXES) {
      classes.add(`${prefix}${name}`);
    }
    classes.add(name);
  }
  return classes;
}

// ── Family invariants collector ─────────────────────────────────────────────
function collectFamilyInvariantClasses(genome) {
  const classes = new Set();
  for (const [, { meta }] of genome.blocks) {
    const invariants = meta.family_invariants || [];
    for (const invariant of invariants) {
      const tokens = invariant.split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        classes.add(token);
      }
    }
  }
  return classes;
}

// ── Find project root ────────────────────────────────────────────────────────
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

// ── Resolve the tokens CSS file from the installed package ──────────────────
function resolvePackageTokensFile(projectRoot) {
  const pkgDir = join(projectRoot, 'node_modules', ...PACKAGE_NAME.split('/'));
  if (!existsSync(pkgDir)) return null;

  // Try package.json exports for "./tokens" subpath
  const pkgJsonPath = join(pkgDir, 'package.json');
  if (existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
      const exportsEntry = pkg.exports?.[`./${TOKENS_SUBPATH}`];
      if (exportsEntry) {
        const cssPath = typeof exportsEntry === 'string'
          ? exportsEntry
          : exportsEntry.style || exportsEntry.import || exportsEntry.default;
        if (cssPath) {
          const resolved = join(pkgDir, cssPath);
          if (existsSync(resolved)) return resolved;
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  // Fallback: check common file locations under the package
  const candidates = [
    join(pkgDir, 'tokens', 'index.css'),
    join(pkgDir, 'tokens.css'),
    join(pkgDir, 'dist', 'tokens', 'index.css'),
    join(pkgDir, 'dist', 'tokens.css'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }

  return null;
}

// ── Find project root CSS file that imports from @innovaccer/ui-assets/tokens ─
function findProjectRootCss(projectRoot) {
  for (const candidate of ROOT_CSS_CANDIDATES) {
    const cssPath = join(projectRoot, candidate);
    if (!existsSync(cssPath)) continue;
    try {
      const content = readFileSync(cssPath, 'utf-8');
      if (TOKENS_IMPORT_PATTERN.test(content)) {
        return cssPath;
      }
    } catch {
      // ignore read errors
    }
  }
  return null;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Loads the token allowlist from @innovaccer/ui-assets/tokens.
 *
 * Resolution order:
 *   1. node_modules/@innovaccer/ui-assets/tokens (direct package)
 *   2. Project root CSS file that @imports from @innovaccer/ui-assets/tokens
 *   3. Empty allowlist with stderr warning
 *
 * @param {object} genome - The loaded genome object (from genomeLoader)
 * @param {string} [projectRoot] - Optional project root override
 * @returns {{ semanticTokens: Set<string>, familyInvariantClasses: Set<string>, source: string }}
 */
export function loadTokenAllowlist(genome, projectRoot) {
  if (_cachedAllowlist) return _cachedAllowlist;

  const familyInvariantClasses = collectFamilyInvariantClasses(genome);
  let semanticTokens = new Set();
  let source = 'empty';

  const root = projectRoot || findProjectRoot(process.cwd());

  if (root) {
    // 1. Try direct package path
    const pkgTokensFile = resolvePackageTokensFile(root);
    if (pkgTokensFile) {
      try {
        const css = readFileSync(pkgTokensFile, 'utf-8');
        const props = parseCssCustomProperties(css);
        semanticTokens = deriveTailwindClasses(props.keys());
        source = 'npm-package';
        process.stderr.write(`[tokenResolver] Loaded ${props.size} tokens from ${pkgTokensFile}\n`);
      } catch (err) {
        process.stderr.write(`[tokenResolver] Failed to read package tokens: ${err.message}\n`);
      }
    }

    // 2. If package not found/readable, look for a root CSS file that imports from the package
    if (source === 'empty') {
      const rootCssFile = findProjectRootCss(root);
      if (rootCssFile) {
        try {
          const css = readFileSync(rootCssFile, 'utf-8');
          const props = parseCssCustomProperties(css);
          semanticTokens = deriveTailwindClasses(props.keys());
          source = 'project-css';
          process.stderr.write(`[tokenResolver] Loaded tokens from project CSS: ${rootCssFile}\n`);
        } catch (err) {
          process.stderr.write(`[tokenResolver] Failed to read project CSS: ${err.message}\n`);
        }
      }
    }
  }

  if (source === 'empty') {
    process.stderr.write(
      `[tokenResolver] WARNING: Could not find @innovaccer/ui-assets/tokens. ` +
      `Install the package or ensure a root CSS file imports from @innovaccer/ui-assets/tokens. ` +
      `Token validation will be skipped.\n`
    );
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
