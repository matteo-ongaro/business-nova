import type { Goal, Model, Project, Stage, Team } from './types'

export const labels = {
  stage: { idea: 'Idea', validation: 'Validazione', launched: 'Attività avviata' } as Record<Stage, string>,
  model: { physical: 'Prodotto fisico', digital: 'Prodotto digitale', services: 'Servizi / Consulenza' } as Record<Model, string>,
  goal: { order: 'Mettere ordine', customers: 'Trovare clienti', margins: 'Migliorare i margini' } as Record<Goal, string>,
}
export function createProject(name: string, stage: Stage, model: Model, team: Team, goal: Goal): Project {
  const id = crypto.randomUUID(), now = new Date().toISOString()
  const metrics = goal === 'margins' ? [metric('Ricavi', '€'), metric('Costi', '€'), metric('Margine', '%')] :
    goal === 'customers' ? [metric('Visite', ''), metric('Contatti', ''), metric('Clienti', '')] :
      [metric('Attività completate', ''), metric('Ore investite', 'h'), metric('Nuove opportunità', '')]
  const title = stage === 'launched' ? 'Rivedi un processo che rallenta il team' : 'Parla con 3 potenziali clienti questa settimana'
  return {
    id, name, createdAt: now, updatedAt: now, stage, model, team, goal,
    description: '', canvas: { problem: '', value: '', segments: '', channels: '', hypotheses: '' }, metrics, entries: [],
    tasks: [{ id: crypto.randomUUID(), title, status: 'todo', priority: 'high' }],
    playbooks: makePlaybooks(stage, model), notes: [],
    welcome: `Ciao! Sono Nova, la tua co-founder. Partiamo da ${goal === 'customers' ? 'chi vuoi aiutare e come raggiungerlo' : goal === 'margins' ? 'ricavi, costi e margini' : 'una priorità chiara'} per ${name}.`,
    actionPlan: ['Definisci il risultato che vuoi ottenere nei prossimi 7 giorni.', 'Scegli una piccola azione verificabile.', 'Registra il risultato e decidiamo insieme il passo successivo.'],
  }
}
function metric(name: string, unit: string) { return { id: crypto.randomUUID(), name, unit, frequency: 'weekly' as const } }
export function makePlaybooks(stage: Stage, model: Model) {
  const offer = model === 'physical' ? 'Calcola il costo completo del prodotto e della spedizione.' : model === 'digital' ? 'Scrivi una promessa concreta per la pagina di vendita.' : 'Descrivi il risultato che il cliente ottiene lavorando con te.'
  const books = [
    { id: 'validate', title: 'Valida prima di costruire', description: 'Riduci il rischio con conversazioni e prove semplici.', items: ['Scrivi il problema in una frase.', 'Parla con 3 persone del segmento scelto.', 'Annota le obiezioni con le parole esatte.'], stages: ['idea', 'validation'] as Stage[], models: ['physical', 'digital', 'services'] as Model[] },
    { id: 'offer', title: 'Rendi l’offerta chiara', description: 'Una proposta comprensibile è più facile da scegliere.', items: [offer, 'Definisci cosa è incluso e cosa no.', 'Chiedi feedback a una persona in target.'], stages: ['idea', 'validation', 'launched'] as Stage[], models: ['physical', 'digital', 'services'] as Model[] },
    { id: 'margin', title: 'Proteggi margini e cassa', description: 'Prendi decisioni con numeri semplici e aggiornati.', items: ['Elenca costi fissi e variabili.', 'Calcola il margine per vendita.', 'Scegli una soglia minima di cassa.'], stages: ['validation', 'launched'] as Stage[], models: ['physical', 'digital', 'services'] as Model[] },
  ]
  return books.filter(b => b.stages.includes(stage)).map(b => ({ ...b, items: b.items.map(text => ({ id: crypto.randomUUID(), text, done: false })) }))
}
export function createDemoProject(): Project {
  const p = createProject('Studio Lume', 'launched', 'services', 'solo', 'customers')
  p.description = 'Consulenza di brand strategy per piccole attività indipendenti.'
  p.canvas = { problem: 'Comunicazione dispersiva e pochi contatti qualificati', value: 'Strategia di marca chiara, concreta e applicabile', segments: 'Attività indipendenti e studi creativi', channels: 'Passaparola, LinkedIn, newsletter', hypotheses: 'Un audit iniziale breve facilita la decisione d’acquisto' }
  p.metrics = [metric('Visite', ''), metric('Contatti', ''), metric('Vendite', ''), metric('Ricavi', '€')]
  const dates = [-35, -28, -21, -14, -7, 0].map(offset => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10) })
  const values = [[140, 4, 1, 220], [165, 5, 1, 220], [152, 7, 2, 440], [190, 8, 2, 440], [212, 11, 3, 690], [238, 13, 3, 690]]
  p.entries = dates.flatMap((date, i) => p.metrics.map((m, j) => ({ id: crypto.randomUUID(), metricId: m.id, date, value: values[i][j] })))
  p.tasks = [
    { id: crypto.randomUUID(), title: 'Preparare il caso studio di Marta', status: 'doing', priority: 'high' },
    { id: crypto.randomUUID(), title: 'Inviare la newsletter mensile', status: 'todo', priority: 'medium' },
    { id: crypto.randomUUID(), title: 'Aggiornare il listino consulenze', status: 'todo', priority: 'high' },
    { id: crypto.randomUUID(), title: 'Raccogliere il feedback di Giulia', status: 'done', priority: 'low' },
  ]
  p.playbooks = makePlaybooks('launched', 'services')
  p.playbooks[0].items[0].done = true
  p.welcome = 'Ciao, benvenuta nel tuo spazio di lavoro. Le visite e i contatti stanno crescendo: oggi ti suggerisco di proteggere un’ora per il caso studio, così rendi più tangibile il valore della tua offerta.'
  p.actionPlan = ['Concludi il caso studio: è la prova più forte della tua offerta.', 'Ricontatta i 2 lead interessati entro venerdì.', 'A fine settimana confronta contatti e vendite con la settimana scorsa.']
  return p
}
