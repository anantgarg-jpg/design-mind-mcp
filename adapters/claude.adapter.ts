// claude.adapter.ts
// Claude implementation of the DesignMindAdapter interface.
// This is the ONLY file that imports from @anthropic-ai/sdk.
// Swap this file to move to a different model.
// The rest of the system is untouched.

import Anthropic from "@anthropic-ai/sdk"
import type {
  DesignMindAdapter,
  Context,
} from "./base.adapter.interface"

const client = new Anthropic()

export class ClaudeAdapter implements DesignMindAdapter {

  async generate(prompt: string, context: Context): Promise<string> {
    const messages: Anthropic.MessageParam[] = []

    // Inject assembled knowledge as a leading user turn if present
    if (context.injectedKnowledge) {
      messages.push({
        role: "user",
        content: `[CONTEXT FROM DESIGN MIND KNOWLEDGE BASE]\n\n${context.injectedKnowledge}\n\n[END CONTEXT]`
      })
      messages.push({
        role: "assistant",
        content: "Understood. I have the relevant context. What would you like to know?"
      })
    }

    // Add conversation history if present
    if (context.conversationHistory) {
      messages.push(...context.conversationHistory.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      })))
    }

    // Add the actual prompt
    messages.push({ role: "user", content: prompt })

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: context.systemPrompt,
      messages,
    })

    const block = response.content[0]
    if (block.type !== "text") throw new Error("Unexpected response type")
    return block.text
  }

  async generateStructured<T>(
    prompt: string,
    schema: Record<string, unknown>,
    context: Context
  ): Promise<T> {
    // Uses tool_use to guarantee structured JSON output
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: context.systemPrompt,
      tools: [{
        name: "structured_output",
        description: "Return the response in the required structured format",
        input_schema: schema as Anthropic.Tool["input_schema"]
      }],
      tool_choice: { type: "tool", name: "structured_output" },
      messages: [{ role: "user", content: prompt }]
    })

    const block = response.content[0]
    if (block.type !== "tool_use") throw new Error("Expected tool_use response")
    return block.input as T
  }

  async embed(text: string): Promise<number[]> {
    // Uses local Ollama (nomic-embed-text, 768 dims).
    // Requires: ollama serve && ollama pull nomic-embed-text
    const ollamaUrl = (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/$/, "")
    const model = process.env.EMBED_MODEL || "nomic-embed-text"

    const res = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: text }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Ollama embed error ${res.status}: ${body}`)
    }

    const data = await res.json() as { embedding: number[] }
    return data.embedding
  }

  modelId(): string {
    return "claude-sonnet-4-6"
  }

  contextWindowTokens(): number {
    return 200000
  }

  supportsToolUse(): boolean {
    return true
  }
}
