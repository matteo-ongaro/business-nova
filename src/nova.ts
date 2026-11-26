import type { ChatMessage, Project } from './types'
import { db } from './db'

export type Proposal = { metricName: string; value: number; unit: string; date: string }
export async function ollamaModels(baseUrl: string) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`, { signal: AbortSignal.timeout(1800) })
  if (!response.ok) throw new Error('Ollama non ha risposto correttamente.')
  const data = await response.json() as { models?: { name: string }[] }
  return data.models?.map(m => m.name) ?? []
}
export function extractMetricProposal(text: string, project: Project): Proposal[] {
  const out: Proposal[] = [], date = new Date().toISOString().slice(0, 10)
  const patterns: [RegExp, string][] = [
    [/([\d.,]+)\s*visite\b/i, 'visite'], [/([\d.,]+)\s*(?:contatti|lead)\b/i, 'contatti'],
    [/([\d.,]+)\s*(?:vendite|clienti)\b/i, 'vendite'], [/([\d.,]+)\s*(?:€|euro)\b/i, 'ricavi'],
  ]
  for (const [pattern, hint] of patterns) {
    const match = text.match(pattern); if (!match) continue
    const value = Number(match[1].replace(',', '.')); if (!Number.isFinite(value)) continue
    const metric = project.metrics.find(m => m.name.toLowerCase().includes(hint) || (hint === 'vendite' && m.name.toLowerCase().includes('clienti')))
    if (metric) out.push({ metricName: metric.name, value, unit: metric.unit, date })
  }
  return out
}
export function projectContext(project: Project) {
  const tasks = { aperte: project.tasks.filter(t => t.status !== 'done').map(t => t.title), completate: project.tasks.filter(t => t.status === 'done').map(t => t.title) }
  const latest = project.metrics.map(metric => {
    const entries = project.entries.filter(e => e.metricId === metric.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
    return { metrica: metric.name, registrazioniRecenti: entries.map(e => ({ data: e.date, valore: e.value })) }
  })
  return JSON.stringify({ progetto: project.name, fase: project.stage, modello: project.model, obiettivo: project.goal, KPI: latest, task: tasks, note: project.notes.slice(-5) })
}
export async function askNova(project: Project, message: string, baseUrl: string, model: string, onChunk: (chunk: string) => void): Promise<{ response: string; source: 'ollama' | 'demo' }> {
  const context = projectContext(project), url = `${baseUrl.replace(/\/$/, '')}/api/chat`
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(45000), body: JSON.stringify({ model, stream: true, messages: [
      { role: 'system', content: `Sei Nova, co-founder strategica, concreta e incoraggiante. Rispondi in italiano in modo sintetico. Aiuta con priorità, organizzazione, risorse, recap e azioni verificabili. Contesto progetto: ${context}` },
      { role: 'user', content: message },
    ] }) })
    if (!response.ok) throw new Error('Ollama non disponibile')
    if (!response.body) throw new Error('Ollama non ha aperto lo stream')
    const reader = response.body.getReader(), decoder = new TextDecoder()
    let buffer = '', answer = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n'); buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.trim()) continue
        const data = JSON.parse(line) as { message?: { content?: string }; error?: string }
        if (data.error) throw new Error(data.error)
        answer += data.message?.content ?? ''
        if (answer) onChunk(answer)
      }
    }
    buffer += decoder.decode()
    if (buffer.trim()) {
      const data = JSON.parse(buffer) as { message?: { content?: string }; error?: string }
      if (data.error) throw new Error(data.error)
      answer += data.message?.content ?? ''
    }
    const clean = answer.trim() || 'Non sono riuscita a generare una risposta.'
    onChunk(clean); return { response: clean, source: 'ollama' }
  } catch {
    const answer = fallback(project, message); onChunk(answer); return { response: answer, source: 'demo' }
  }
}
export function fallback(project: Project, message: string) {
  const open = project.tasks.filter(t => t.status !== 'done').length
  if (/priorit|cosa faccio|da dove/i.test(message)) return `${project.actionPlan[0]} Hai ${open} attività aperte: tieni il focus su una sola priorità alla volta. Quale risultato vuoi vedere entro venerdì?`
  if (/ricap|stato|come va/i.test(message)) return `Per ${project.name}, la priorità è “${project.goal}”. Ci sono ${open} attività aperte e ${project.tasks.filter(t => t.status === 'done').length} completate. ${project.actionPlan[0]}`
  return `Capito. Per ${project.name} ti propongo un passo concreto: ${project.actionPlan[0]} Poi controlliamo insieme cosa ha funzionato e aggiorniamo il piano.`
}
export async function persistChat(projectId: string, message: ChatMessage) { await db.messages.put({ ...message, projectId }) }
