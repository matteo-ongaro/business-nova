export const AI_MODELS = [
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 · 1B (più leggero)' },
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 · 1.5B' },
] as const

export type AIModelId = typeof AI_MODELS[number]['id']
export const DEFAULT_AI_MODEL: AIModelId = AI_MODELS[0].id
