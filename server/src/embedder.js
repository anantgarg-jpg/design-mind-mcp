/**
 * embedder.js — Local embedding via @xenova/transformers
 *
 * No API keys, no Docker, no system installs.
 * Model weights (~90MB) download automatically on first use to ~/.cache/huggingface/
 *
 * Model: Xenova/all-MiniLM-L6-v2
 *   - 384-dimensional embeddings
 *   - Fast, small, strong semantic similarity for English text
 *   - Runs entirely in Node.js via ONNX Runtime
 *
 * To use a larger model (better quality, ~274MB):
 *   EMBED_MODEL=Xenova/nomic-embed-text-v1 node src/index.js
 *   (also update VECTOR_SIZE in vectorstore.js to 768)
 */

import { pipeline } from '@xenova/transformers'

const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2'

let _pipe = null

async function getPipeline() {
  if (!_pipe) {
    const model = process.env.EMBED_MODEL || DEFAULT_MODEL
    process.stderr.write(`[embedder] Loading model: ${model} (downloads on first run)...\n`)
    _pipe = await pipeline('feature-extraction', model)
    process.stderr.write(`[embedder] Model ready\n`)
  }
  return _pipe
}

/**
 * Embed a single text. Returns a flat float array (384 dims by default).
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embedOne(text) {
  const pipe = await getPipeline()
  const output = await pipe(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

/**
 * Embed a batch of texts.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embed(texts) {
  const results = []
  for (const text of texts) {
    results.push(await embedOne(text))
  }
  return results
}

/**
 * Always true — no external service needed.
 */
export async function isConfigured() {
  return true
}
