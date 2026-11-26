export type Stage = 'idea' | 'validation' | 'launched'
export type Model = 'physical' | 'digital' | 'services'
export type Team = 'solo' | 'small'
export type Goal = 'order' | 'customers' | 'margins'
export type Metric = { id: string; name: string; unit: string; frequency: 'daily' | 'weekly' | 'monthly'; target?: number }
export type MetricEntry = { id: string; metricId: string; date: string; value: number; note?: string }
export type Task = { id: string; title: string; status: 'todo' | 'doing' | 'done'; priority: 'low' | 'medium' | 'high'; area?: string }
export type Playbook = { id: string; title: string; description: string; items: { id: string; text: string; done: boolean }[]; stages: Stage[]; models: Model[] }
export type Project = {
  id: string; name: string; createdAt: string; updatedAt: string; stage: Stage; model: Model; team: Team; goal: Goal;
  description: string; canvas: Record<string, string>; metrics: Metric[]; entries: MetricEntry[]; tasks: Task[]; playbooks: Playbook[]; notes: string[]
  welcome: string; actionPlan: string[]
}
export type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string; proposedEntries?: { metricName: string; value: number; unit: string; date: string }[] }
