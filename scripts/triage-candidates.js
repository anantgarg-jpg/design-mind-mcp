#!/usr/bin/env node
/**
 * triage-candidates.js
 *
 * Design Mind improvement: Change 3 — candidate decay on orphaned context
 *
 * Reads all files in blocks/_candidates/, applies decay rules, and reports
 * what's ready for ratification vs. what should be archived.
 *
 * Rules:
 *   - frequency === 1 + single reporter inactive > 60 days → move to _archived/
 *   - frequency >= 2 from different projects → print ratification prompt
 *
 * Usage: node scripts/triage-candidates.js
 * npm script: npm run triage:candidates
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CANDIDATES_DIR = join(ROOT, 'blocks', '_candidates');
const ARCHIVED_DIR   = join(CANDIDATES_DIR, '_archived');
const DECAY_DAYS     = 60;

function parseField(content, field) {
  const match = content.match(new RegExp(`^${field}:\\s*["']?(.+?)["']?\\s*$`, 'm'));
  return match ? match[1].trim() : null;
}

function parseIntField(content, field) {
  const val = parseField(content, field);
  return val ? parseInt(val, 10) : null;
}

function parseReportingProjects(content) {
  const projects = [];
  const regex = /- project_id:\s*["']?([^"'\n]+)["']?\s*\n\s*last_active:\s*["']?([^"'\n]+)["']?/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    projects.push({ project_id: match[1].trim(), last_active: match[2].trim() });
  }
  return projects;
}

function daysSince(dateStr) {
  const then = new Date(dateStr);
  const now  = new Date();
  if (isNaN(then.getTime())) return Infinity;
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function readCandidates() {
  if (!existsSync(CANDIDATES_DIR)) {
    console.log('No candidates directory found:', CANDIDATES_DIR);
    process.exit(0);
  }

  return readdirSync(CANDIDATES_DIR)
    .filter(f => f.endsWith('.yaml') && !f.startsWith('_'))
    .map(f => {
      try {
        const content = readFileSync(join(CANDIDATES_DIR, f), 'utf-8');
        const patternName = parseField(content, 'pattern_name');
        const frequency   = parseIntField(content, 'frequency') ?? parseIntField(content, 'frequency_count') ?? 1;
        const projects    = parseReportingProjects(content);

        // Fallback: if no reporting_projects block, use submitted_by + generated date from filename
        if (projects.length === 0) {
          const submittedBy = parseField(content, 'submitted_by') || 'unknown';
          // Filename format: 2026-03-20T11-39-52-slug.yaml → extract date
          const dateMatch = f.match(/^(\d{4}-\d{2}-\d{2})/);
          const lastActive = dateMatch ? dateMatch[1] : '2000-01-01';
          projects.push({ project_id: submittedBy, last_active: lastActive });
        }

        return { file: f, patternName, frequency, projects, content };
      } catch (err) {
        return { file: f, patternName: f, frequency: 1, projects: [], content: '', error: err.message };
      }
    });
}

function main() {
  const candidates = readCandidates();

  let archived = 0;
  let ready    = 0;
  let active   = 0;
  let errors   = 0;

  console.log(`\nDesign Mind — Candidate Triage\n${'─'.repeat(50)}`);
  console.log(`Scanning ${candidates.length} candidates...\n`);

  if (!existsSync(ARCHIVED_DIR)) mkdirSync(ARCHIVED_DIR, { recursive: true });

  for (const c of candidates) {
    if (c.error) {
      console.log(`ERROR  ${c.file}: ${c.error}`);
      errors++;
      continue;
    }

    // Rule: frequency >= 2 from different projects → ready for ratification
    const uniqueProjects = new Set(c.projects.map(p => p.project_id)).size;
    if (c.frequency >= 2 && uniqueProjects >= 2) {
      const oldest = c.projects
        .map(p => p.last_active)
        .sort()[0];
      console.log(`READY  ${c.patternName} — reported by ${uniqueProjects} projects (${c.frequency}x), oldest: ${oldest}`);
      ready++;
      continue;
    }

    // Rule: frequency === 1, single reporter inactive > 60 days → archive
    if (c.frequency === 1 && c.projects.length > 0) {
      const lastActive = c.projects[0].last_active;
      const age = daysSince(lastActive);
      if (age > DECAY_DAYS) {
        const reason = `Archived: single reporter (${c.projects[0].project_id}), project inactive > ${DECAY_DAYS} days (last active: ${lastActive}, ${age} days ago)`;
        try {
          renameSync(join(CANDIDATES_DIR, c.file), join(ARCHIVED_DIR, c.file));
          console.log(`ARCHIVE  ${c.patternName} — ${reason}`);
          archived++;
        } catch (err) {
          console.log(`ERROR archiving ${c.file}: ${err.message}`);
          errors++;
        }
        continue;
      }
    }

    // Active — not yet ready for ratification, not yet stale
    const ages = c.projects.map(p => `${p.project_id}:${p.last_active}`).join(', ');
    console.log(`ACTIVE  ${c.patternName} — ${c.frequency}x from ${uniqueProjects} project(s) [${ages}]`);
    active++;
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Summary: ${ready} ready · ${active} active · ${archived} archived · ${errors} errors`);
  console.log(`Total scanned: ${candidates.length}\n`);
}

main();
