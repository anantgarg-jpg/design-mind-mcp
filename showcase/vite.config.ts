import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync, readdirSync, existsSync } from 'node:fs'

// ── YAML candidate parser ─────────────────────────────────────────────────────

function parseCandidateYaml(raw: string): Record<string, unknown> | null {
  const lines = raw.split('\n')
  const result: Record<string, unknown> = {}
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.match(/^\s*#/) || line.trim() === '') { i++; continue }

    // key: "quoted value"
    const q = line.match(/^([\w]+):\s*"(.*)"$/)
    if (q) { result[q[1]] = q[2]; i++; continue }

    // key: >  (folded block scalar)
    const b = line.match(/^([\w]+):\s*>\s*$/)
    if (b) {
      i++
      const parts: string[] = []
      while (i < lines.length) {
        const bl = lines[i]
        if (!bl.startsWith('  ') && bl.trim() !== '') break
        if (bl.startsWith('  ')) parts.push(bl.slice(2).trimEnd())
        i++
      }
      result[b[1]] = parts.join(' ').replace(/\s+/g, ' ').trim()
      continue
    }

    // key:  (block sequence/mapping on next lines)
    const k = line.match(/^([\w]+):\s*$/)
    if (k) {
      i++
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
        const item = lines[i].match(/^\s+-\s+(\S.*)$/)
        if (item && item[1] !== '[]') items.push(item[1].trim())
        i++
      }
      result[k[1]] = items
      continue
    }

    // key: scalar
    const s = line.match(/^([\w]+):\s*(\S.*)$/)
    if (s) {
      const val = s[2].trim()
      if (val === '[]') result[s[1]] = []
      else if (val === 'null') result[s[1]] = null
      else if (!isNaN(Number(val))) result[s[1]] = Number(val)
      else result[s[1]] = val
      i++; continue
    }

    i++
  }

  if (!result.candidate_id) return null
  return result
}

// ── Surfaces virtual module plugin ────────────────────────────────────────────

const SURFACES_VIRTUAL_ID = 'virtual:surfaces'
const SURFACES_RESOLVED_ID = '\0' + SURFACES_VIRTUAL_ID
const SURFACES_DIR = path.resolve(__dirname, '../surfaces')

function parseSurfaceYaml(raw: string): Record<string, unknown> | null {
  const lines = raw.split('\n')
  const result: Record<string, unknown> = {}
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.match(/^\s*#/) || line.trim() === '') { i++; continue }

    // key: >  (folded block scalar)
    const b = line.match(/^([\w]+):\s*>\s*$/)
    if (b) {
      i++
      const parts: string[] = []
      while (i < lines.length) {
        const bl = lines[i]
        if (!bl.startsWith('  ') && bl.trim() !== '') break
        if (bl.startsWith('  ')) parts.push(bl.slice(2).trimEnd())
        i++
      }
      result[b[1]] = parts.join(' ').replace(/\s+/g, ' ').trim()
      continue
    }

    // key:  (block sequence on next lines)
    const k = line.match(/^([\w]+):\s*$/)
    if (k) {
      i++
      const items: (string | Record<string, string>)[] = []
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
        const itemLine = lines[i]
        // list item: "  - key: value" or "  - item"
        const listMatch = itemLine.match(/^\s+-\s+(\S.*)$/)
        if (listMatch) {
          const kv = listMatch[1].match(/^([\w]+):\s+"?(.*?)"?\s*$/)
          if (kv) {
            // start of a mapping item
            const obj: Record<string, string> = { [kv[1]]: kv[2] }
            i++
            while (i < lines.length && lines[i].match(/^\s{4}/)) {
              const nested = lines[i].match(/^\s+([\w]+):\s+"?(.*?)"?\s*$/)
              if (nested) obj[nested[1]] = nested[2]
              i++
            }
            items.push(obj)
            continue
          }
          if (listMatch[1] !== '[]') items.push(listMatch[1].trim())
        }
        i++
      }
      result[k[1]] = items
      continue
    }

    // key: [inline array]
    const ia = line.match(/^([\w]+):\s+\[(.*)]\s*$/)
    if (ia) {
      result[ia[1]] = ia[2].split(',').map((s) => s.trim()).filter(Boolean)
      i++; continue
    }

    // key: scalar
    const s = line.match(/^([\w]+):\s*(\S.*)$/)
    if (s) {
      const val = s[2].trim()
      if (val === '[]') result[s[1]] = []
      else if (val === 'null') result[s[1]] = null
      else result[s[1]] = val
      i++; continue
    }

    i++
  }

  if (!result.id) return null
  return result
}

function surfacesPlugin() {
  return {
    name: 'vite-plugin-surfaces',
    resolveId(id: string) {
      if (id === SURFACES_VIRTUAL_ID) return SURFACES_RESOLVED_ID
    },
    load(id: string) {
      if (id !== SURFACES_RESOLVED_ID) return
      if (!existsSync(SURFACES_DIR)) return 'export default []'

      const surfaces = readdirSync(SURFACES_DIR)
        .filter((f) => f.endsWith('.surface.yaml'))
        .sort()
        .map((f) => {
          try {
            const raw = readFileSync(path.join(SURFACES_DIR, f), 'utf-8')
            const parsed = parseSurfaceYaml(raw)
            if (!parsed) return null
            return {
              id:                  parsed.id ?? '',
              user_type:           Array.isArray(parsed.user_type) ? parsed.user_type : [],
              intent:              parsed.intent ?? '',
              what_it_omits:       Array.isArray(parsed.what_it_omits) ? parsed.what_it_omits : [],
              empty_state_meaning: parsed.empty_state_meaning ?? '',
              ordering:            parsed.ordering ?? '',
              actions:             Array.isArray(parsed.actions) ? parsed.actions : [],
              never:               Array.isArray(parsed.never) ? parsed.never : [],
            }
          } catch {
            return null
          }
        })
        .filter(Boolean)

      return `export default ${JSON.stringify(surfaces)}`
    },
    configureServer(server: { watcher: { add: (p: string) => void; on: (e: string, cb: (f: string) => void) => void }; moduleGraph: { getModuleById: (id: string) => unknown; invalidateModule: (m: unknown) => void }; hot: { send: (p: unknown) => void } }) {
      if (existsSync(SURFACES_DIR)) server.watcher.add(SURFACES_DIR)
      const invalidate = (file: string) => {
        if (!file.startsWith(SURFACES_DIR) || !file.endsWith('.surface.yaml')) return
        const mod = server.moduleGraph.getModuleById(SURFACES_RESOLVED_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.hot.send({ type: 'full-reload' })
        }
      }
      server.watcher.on('add', invalidate)
      server.watcher.on('change', invalidate)
    },
  }
}

// ── Virtual module plugin ─────────────────────────────────────────────────────

const VIRTUAL_ID = 'virtual:candidates'
const RESOLVED_ID = '\0' + VIRTUAL_ID
const CANDIDATES_DIR = path.resolve(__dirname, '../blocks/_candidates')

function candidatesPlugin() {
  return {
    name: 'vite-plugin-candidates',
    resolveId(id: string) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id: string) {
      if (id !== RESOLVED_ID) return
      if (!existsSync(CANDIDATES_DIR)) return 'export default []'

      const candidates = readdirSync(CANDIDATES_DIR)
        .filter((f) => f.endsWith('.yaml'))
        .sort()
        .map((f) => {
          try {
            const raw = readFileSync(path.join(CANDIDATES_DIR, f), 'utf-8')
            const parsed = parseCandidateYaml(raw)
            if (!parsed) return null
            return {
              candidate_id:                    parsed.candidate_id ?? '',
              pattern_name:                    parsed.pattern_name ?? '',
              status:                          parsed.status ?? 'logged',
              frequency_count:                 parsed.frequency_count ?? 1,
              description:                     parsed.description ?? '',
              intent_it_serves:                parsed.intent_it_serves ?? '',
              why_existing_patterns_didnt_fit: parsed.why_existing_patterns_didnt_fit ?? '',
              implementation_ref:              parsed.implementation_ref ?? '',
              ontology_refs:                   Array.isArray(parsed.ontology_refs) ? parsed.ontology_refs : [],
              similar_candidates:              [],
            }
          } catch {
            return null
          }
        })
        .filter(Boolean)

      return `export default ${JSON.stringify(candidates)}`
    },
    configureServer(server: { watcher: { add: (p: string) => void; on: (e: string, cb: (f: string) => void) => void }; moduleGraph: { getModuleById: (id: string) => unknown; invalidateModule: (m: unknown) => void }; hot: { send: (p: unknown) => void } }) {
      server.watcher.add(CANDIDATES_DIR)
      const invalidate = (file: string) => {
        if (!file.startsWith(CANDIDATES_DIR) || !file.endsWith('.yaml')) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.hot.send({ type: 'full-reload' })
        }
      }
      server.watcher.on('add', invalidate)
      server.watcher.on('change', invalidate)
    },
  }
}

export default defineConfig({
  plugins: [react(), candidatesPlugin(), surfacesPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@blocks': path.resolve(__dirname, '../blocks'),
      // Redirect external imports from block files to our local installs
      'lucide-react': path.resolve(__dirname, './node_modules/lucide-react'),
      'date-fns': path.resolve(__dirname, './node_modules/date-fns'),
      'recharts': path.resolve(__dirname, './node_modules/recharts'),
      'sonner': path.resolve(__dirname, './node_modules/sonner'),
      'react-hook-form': path.resolve(__dirname, './node_modules/react-hook-form'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/seed': 'http://localhost:8080',
    },
  },
})
