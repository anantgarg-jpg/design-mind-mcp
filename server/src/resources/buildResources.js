/**
 * buildResources.js
 * Builds all MCP resource payloads from the live genome cache.
 * All resources served from in-memory — no file reads at request time.
 *
 * Directory conventions (mirrors blocks exactly):
 *   surfaces/SurfaceName/meta.yaml  → ratified surface
 *   surfaces/_candidates/           → unratified, not served here
 *
 * Scaling plan: when blocks manifest exceeds ~15K tokens (~120 blocks),
 * replace manifest resources with search endpoints.
 */

/**
 * Full block palette — id, level, import_instruction, when, not_when, family_invariants.
 * genome.blocks is Map<blockId, { meta: object }>.
 */
export function buildBlocksManifest(genome) {
  const result = [];
  for (const [blockId, { meta }] of genome.blocks) {
    const id = meta.id || blockId;
    result.push({
      id,
      level: meta.level ?? 'composite',
      component_type: meta.component_type ?? '',
      import_instruction: meta.npm_path
        ? `import { ${id} } from '${meta.npm_path}'`
        : '',
      when: meta.when ?? null,
      not_when: meta.not_when ?? null,
      family_invariants: meta.family_invariants ?? [],
    });
  }
  return result;
}

/**
 * Ratified surface patterns.
 * genome.surfaces is Map<surfaceId, meta object>.
 * Starts empty — correct on first run. Populates as patterns ratify.
 */
export function buildSurfacesManifest(genome) {
  const result = [];
  for (const [surfaceId, meta] of genome.surfaces) {
    result.push({
      id: meta.id || surfaceId,
      intent: meta.intent ?? null,
      canonical_structure: meta.canonical_structure ?? null,
      never: meta.never ?? [],
      blocks_used: meta.blocks_used ?? [],
      times_built: meta.times_built ?? 0,
    });
  }
  return result;
}

/**
 * Full hard-constraints.md — genome.safety is raw string.
 */
export function buildSafetyResource(genome) {
  return genome.safety || '';
}

/**
 * Combined ontology — entities, states, actions, copy-voice.
 * genome.ontology is Map<concept, { fullContent: string } | { _raw: string, ... }>.
 */
export function buildOntologyResource(genome) {
  const parts = [];
  for (const [key, value] of genome.ontology) {
    const content = typeof value.fullContent === 'string'
      ? value.fullContent
      : (value._raw || JSON.stringify(value, null, 2));
    parts.push(`# ${key}\n${content}`);
  }
  return parts.join('\n\n---\n\n');
}

/**
 * Full styling-tokens.rule.md.
 * genome.rules is Map<ruleId, { fullContent: string }>.
 */
export function buildTokensResource(genome) {
  const entry = genome.rules.get('styling-tokens');
  return entry?.fullContent || '';
}

/**
 * copy-voice.md — stored as genome.ontology.get('copy-voice').fullContent
 */
export function buildCopyVoiceResource(genome) {
  const entry = genome.ontology.get('copy-voice');
  return entry?.fullContent || '';
}

/**
 * genome/principles.md — genome.principles is raw string.
 */
export function buildPrinciplesResource(genome) {
  return genome.principles || '';
}

/**
 * genome/taste.md — genome.taste is raw string.
 */
export function buildTasteResource(genome) {
  return genome.taste || '';
}
