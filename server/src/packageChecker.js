/**
 * packageChecker.js
 * Checks whether @innovaccer/ui-assets is installed and configured correctly
 * in the consuming project. Returns an array of soft-warning strings.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname, extname } from 'node:path';
import { get as httpsGet } from 'node:https';
import { fileURLToPath } from 'node:url';

const PACKAGE_NAME = '@innovaccer/ui-assets';
const REGISTRY_HOST = 'npm.pkg.github.com';
const REGISTRY_PATH = `/${encodeURIComponent(PACKAGE_NAME)}`;

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
// server/src/ → up two → repo root (the MCP itself)
const MCP_ROOT   = resolve(__dirname, '..', '..');

// ── Find project root ─────────────────────────────────────────────────────────
// Walk up from startDir until we find a package.json that is NOT the MCP repo.
function findProjectRoot(startDir) {
  let dir = resolve(startDir);
  for (let i = 0; i < 20; i++) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate) && dir !== MCP_ROOT) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break; // filesystem root
    dir = parent;
  }
  return null;
}

// ── Installed version ─────────────────────────────────────────────────────────
function getInstalledVersion(projectRoot) {
  const pkgPath = join(projectRoot, 'package.json');
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    return deps[PACKAGE_NAME] || null; // e.g. "^1.2.3" or null
  } catch {
    return null;
  }
}

// ── Latest version from GitHub Packages ──────────────────────────────────────
function fetchLatestVersion() {
  return new Promise((resolve) => {
    const token = process.env.NODE_AUTH_TOKEN || process.env.GITHUB_TOKEN;
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const req = httpsGet(
      { host: REGISTRY_HOST, path: REGISTRY_PATH, headers, timeout: 4000 },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json['dist-tags']?.latest ?? null);
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// ── Tokens import check ───────────────────────────────────────────────────────
const TOKEN_IMPORT_RE = /@innovaccer\/ui-assets\/tokens/;
const SEARCHABLE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);

function isTokensImported(projectRoot) {
  function walk(dir, depth) {
    if (depth > 6) return false;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return false; }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (walk(full, depth + 1)) return true;
      } else if (entry.isFile() && SEARCHABLE_EXTS.has(extname(entry.name))) {
        try {
          if (TOKEN_IMPORT_RE.test(readFileSync(full, 'utf-8'))) return true;
        } catch { /* skip unreadable */ }
      }
    }
    return false;
  }
  return walk(projectRoot, 0);
}

// ── Semver helpers ────────────────────────────────────────────────────────────
function stripRange(v) {
  return v ? v.replace(/^[^0-9]*/, '') : null;
}
function isOlderThan(a, b) {
  if (!a || !b) return false;
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const va = pa[i] || 0, vb = pb[i] || 0;
    if (va < vb) return true;
    if (va > vb) return false;
  }
  return false;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run all package checks and return an array of warning strings.
 * @param {string|undefined} projectRoot  Explicit project root (from tool param), or
 *                                        undefined to auto-detect via cwd walk-up.
 * @returns {Promise<string[]>}
 */
export async function check(projectRoot) {
  const warnings = [];

  const root = projectRoot
    ? resolve(projectRoot)
    : findProjectRoot(process.cwd());

  if (!root) return warnings; // can't locate a project — skip silently

  // 1. Installation check
  const installedRaw = getInstalledVersion(root);
  if (!installedRaw) {
    warnings.push(
      `⚠️  **${PACKAGE_NAME} is not installed** in this project.\n` +
      `   Run: \`npm install ${PACKAGE_NAME}\`\n` +
      `   Then add \`import '${PACKAGE_NAME}/tokens'\` to your app entry point.`
    );
    return warnings; // no point checking version or tokens if not installed
  }

  // 2. Version check (best-effort — silently skip on failure)
  const latest = await fetchLatestVersion();
  const installedBare = stripRange(installedRaw);
  if (latest && isOlderThan(installedBare, latest)) {
    warnings.push(
      `⚠️  **${PACKAGE_NAME} is out of date** (installed: ${installedBare}, latest: ${latest}).\n` +
      `   Run: \`npm install ${PACKAGE_NAME}@latest\` to update.`
    );
  }

  // 3. Tokens import check
  if (!isTokensImported(root)) {
    warnings.push(
      `⚠️  **Design tokens not imported.** Add this to your app entry point:\n` +
      `   \`import '${PACKAGE_NAME}/tokens'\``
    );
  }

  return warnings;
}
