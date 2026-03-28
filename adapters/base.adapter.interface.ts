// base.adapter.interface.ts
// The contract every model adapter must implement.
// Nothing in the system calls Claude/OpenAI/Gemini directly.
// Everything calls this interface.
// Swap the model by writing a new adapter that implements this.

export interface Context {
  systemPrompt: string
  injectedKnowledge?: string   // assembled by context-builder
  conversationHistory?: Message[]
}

export interface Message {
  role: "user" | "assistant"
  content: string
}

export interface DesignMindAdapter {
  // Core generation
  generate(prompt: string, context: Context): Promise<string>

  // Structured output — used for reviews, mutations, tool responses
  generateStructured<T>(
    prompt: string,
    schema: Record<string, unknown>,
    context: Context
  ): Promise<T>

  // Embedding — for vector DB writes and semantic search
  embed(text: string): Promise<number[]>

  // Metadata
  modelId(): string
  contextWindowTokens(): number
  supportsToolUse(): boolean
}
