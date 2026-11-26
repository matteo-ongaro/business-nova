# Business Nova

Dashboard local-first per pianificare e far crescere un’attività. Tutti i progetti e i messaggi Nova restano in IndexedDB; Ollama è interrogato solo su localhost. Nessun account o backend cloud.

## Avvio

```bash
npm install
npm run dev
```

Per abilitare Ollama: avvia il servizio locale, usa un modello chat disponibile e imposta l’URL (predefinito `http://localhost:11434`). Se il servizio non risponde, Nova passa automaticamente alla modalità demo. La condivisione tra origini può richiedere la configurazione CORS di Ollama.

## Struttura

- `src/db.ts`: schema Dexie, import ed export JSON con controlli di formato.
- `src/templates.ts`: template deterministici, KPI, playbook e progetto demo.
- `src/nova.ts`: contesto progetto, client Ollama, fallback e proposta di estrazione metriche.
- `src/App.tsx`: Project Hub, wizard, workspace e drawer di Nova.
- `src/styles.css`: tema e layout responsive.

L’export JSON include `schemaVersion: 1`; il backup globale conserva i progetti, mentre i messaggi chat non fanno parte dell’export.
