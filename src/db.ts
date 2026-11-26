import Dexie, { type Table } from 'dexie'
import type { ChatMessage, Project } from './types'

class NovaDatabase extends Dexie {
  projects!: Table<Project, string>
  messages!: Table<ChatMessage & { projectId: string }, string>
  constructor() {
    super('business-nova')
    this.version(1).stores({ projects: 'id, updatedAt, stage', messages: 'id, projectId, createdAt' })
  }
}

export const db = new NovaDatabase()
export async function saveProject(project: Project) { await db.projects.put({ ...project, updatedAt: new Date().toISOString() }) }
export async function exportProject(project: Project) {
  downloadJson({ schemaVersion: 1, exportedAt: new Date().toISOString(), project }, `${slug(project.name)}.json`)
}
export async function exportBackup() {
  const projects = await db.projects.toArray()
  downloadJson({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects }, `business-nova-backup-${new Date().toISOString().slice(0, 10)}.json`)
}
export async function importProjects(file: File): Promise<Project[]> {
  if (file.size > 10 * 1024 * 1024) throw new Error('Il file supera il limite di 10 MB.')
  const data: unknown = JSON.parse(await file.text())
  if (!data || typeof data !== 'object') throw new Error('Il file non contiene un backup valido.')
  const raw = data as { schemaVersion?: number; project?: unknown; projects?: unknown }
  if (raw.schemaVersion !== 1) throw new Error('Versione del backup non supportata.')
  const candidates = Array.isArray(raw.projects) ? raw.projects : raw.project ? [raw.project] : []
  if (!candidates.length || !candidates.every(isProject)) throw new Error('Il file non contiene progetti Nova validi.')
  const projects = candidates as Project[]
  await db.projects.bulkPut(projects)
  return projects
}
function isProject(p: unknown): p is Project {
  if (!p || typeof p !== 'object') return false
  const x = p as Partial<Project>
  const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
  const boundedString = (value: unknown, max = 5000) => typeof value === 'string' && value.length <= max
  const ids = Array.isArray(x.metrics) ? new Set(x.metrics.map(m => record(m) && typeof m.id === 'string' ? m.id : '')) : new Set<string>()
  return boundedString(x.id, 100) && boundedString(x.name, 100) && boundedString(x.createdAt, 80) && boundedString(x.updatedAt, 80) &&
    ['idea', 'validation', 'launched'].includes(x.stage ?? '') && ['physical', 'digital', 'services'].includes(x.model ?? '') &&
    ['solo', 'small'].includes(x.team ?? '') && ['order', 'customers', 'margins'].includes(x.goal ?? '') &&
    boundedString(x.description, 2000) && record(x.canvas) && Object.values(x.canvas).every(v => boundedString(v, 3000)) &&
    Array.isArray(x.metrics) && x.metrics.length <= 100 && x.metrics.every(m => record(m) && boundedString(m.id, 100) && boundedString(m.name, 100) && boundedString(m.unit, 20) && ['daily', 'weekly', 'monthly'].includes(String(m.frequency))) &&
    Array.isArray(x.entries) && x.entries.length <= 10000 && x.entries.every(e => record(e) && boundedString(e.id, 100) && ids.has(String(e.metricId)) && boundedString(e.date, 20) && typeof e.value === 'number' && Number.isFinite(e.value)) &&
    Array.isArray(x.tasks) && x.tasks.length <= 2000 && x.tasks.every(t => record(t) && boundedString(t.id, 100) && boundedString(t.title, 500) && ['todo', 'doing', 'done'].includes(String(t.status)) && ['low', 'medium', 'high'].includes(String(t.priority))) &&
    Array.isArray(x.playbooks) && x.playbooks.length <= 100 && x.playbooks.every(b => record(b) && boundedString(b.id, 100) && boundedString(b.title, 300) && boundedString(b.description, 1000) && Array.isArray(b.items) && b.items.every(i => record(i) && boundedString(i.id, 100) && boundedString(i.text, 1000) && typeof i.done === 'boolean')) &&
    Array.isArray(x.notes) && x.notes.length <= 1000 && x.notes.every(n => boundedString(n, 3000)) && boundedString(x.welcome, 2000) && Array.isArray(x.actionPlan) && x.actionPlan.length <= 50 && x.actionPlan.every(a => boundedString(a, 1000))
}
function downloadJson(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}
function slug(name: string) { return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'progetto' }
