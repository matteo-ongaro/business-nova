import {
  CreateWebWorkerMLCEngine,
  type InitProgressReport,
  type WebWorkerMLCEngine,
} from '@mlc-ai/web-llm'
import type { Project } from './types'
import { projectContext } from './nova'
import { DEFAULT_AI_MODEL, type AIModelId } from './aiModels'

export { AI_MODELS, DEFAULT_AI_MODEL } from './aiModels'
export type { AIModelId } from './aiModels'
export type AIProgressCallback = (report: InitProgressReport) => void

let engine: WebWorkerMLCEngine | null = null
let worker: Worker | null = null
let loadedModel: string | null = null
let loadPromise: Promise<void> | null = null
const progressListeners = new Set<AIProgressCallback>()

function notifyProgress(report: InitProgressReport) {
  for (const listener of progressListeners) {
    try { listener(report) } catch { /* UI listeners must not interrupt model loading. */ }
  }
}

export function isWebGPUAvailable() {
  return 'gpu' in navigator
}

export async function ensureAIModel(model: AIModelId, onProgress?: AIProgressCallback) {
  if (!isWebGPUAvailable()) {
    throw new Error('WebGPU non è disponibile in questo browser. Aggiorna il browser o usa un dispositivo compatibile per avviare la chat AI.')
  }

  if (engine && loadedModel === model) return
  if (onProgress) progressListeners.add(onProgress)
  try {
    if (loadPromise) {
      await loadPromise.catch(() => undefined)
      if (engine && loadedModel === model) return
    }

    const operation = (async () => {
      if (engine) {
        engine.setInitProgressCallback(notifyProgress)
        await engine.reload(model)
      } else {
        worker = new Worker(new URL('./workers/webllm.worker.ts', import.meta.url), { type: 'module' })
        engine = await CreateWebWorkerMLCEngine(worker, model, {
          initProgressCallback: notifyProgress,
        })
      }
      loadedModel = model
    })()

    loadPromise = operation
    try {
      await operation
    } catch (error) {
      if (!engine) {
        worker?.terminate()
        worker = null
      }
      throw error
    } finally {
      if (loadPromise === operation) loadPromise = null
    }
  } finally {
    if (onProgress) progressListeners.delete(onProgress)
  }
}

export async function askNova(
  project: Project,
  message: string,
  model: AIModelId = DEFAULT_AI_MODEL,
  onChunk: (fullResponse: string) => void = () => undefined,
  options: { stream?: boolean; onProgress?: AIProgressCallback } = {},
): Promise<{ response: string; source: 'webllm' }> {
  await ensureAIModel(model, options.onProgress)
  if (!engine) throw new Error('Il motore AI non è pronto. Riprova tra poco.')

  const messages = [
    {
      role: 'system' as const,
      content: 'Sei Nova, co-founder strategica, concreta e incoraggiante. Rispondi in italiano in modo sintetico. Aiuta con priorità, organizzazione, risorse, recap e azioni verificabili. Contesto progetto: ' + projectContext(project),
    },
    { role: 'user' as const, content: message },
  ]
  const stream = options.stream ?? true
  let response = ''

  if (stream) {
    const result = await engine.chat.completions.create({ messages, stream: true })
    for await (const chunk of result) {
      const content = chunk.choices[0]?.delta.content
      if (typeof content === 'string') {
        response += content
        onChunk(response)
      }
    }
  } else {
    const result = await engine.chat.completions.create({ messages, stream: false })
    const content = result.choices[0]?.message.content
    response = typeof content === 'string' ? content : ''
    onChunk(response)
  }

  response = response.trim() || 'Non sono riuscita a generare una risposta.'
  onChunk(response)
  return { response, source: 'webllm' }
}
