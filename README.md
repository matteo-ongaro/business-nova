# Business Nova

Dashboard local-first per pianificare e far crescere un’attività. Progetti e conversazioni restano nel database del browser; Nova usa WebLLM per eseguire il modello AI sul dispositivo, senza un server applicativo.

## Avvio

Esegui npm install e poi npm run dev.

Nova richiede un browser con WebGPU e una connessione Internet per scaricare il modello al primo avvio. Il modello scelto viene poi conservato nella cache del browser. L’app può essere pubblicata su hosting statico, incluso GitHub Pages, tramite HTTPS; il supporto WebGPU dipende dal browser e dal dispositivo.

Il modello predefinito è Llama-3.2-1B-Instruct-q4f16_1-MLC. Dalle impostazioni di Nova è possibile scegliere anche Qwen2.5-1.5B-Instruct-q4f16_1-MLC.

## Struttura

- src/db.ts: schema Dexie, import ed export JSON con controlli di formato.
- src/templates.ts: template deterministici, KPI, playbook e progetto demo.
- src/aiModels.ts: elenco dei modelli AI e modello predefinito.
- src/aiService.ts: inizializzazione WebLLM nel Web Worker e generazione streaming o completa.
- src/workers/webllm.worker.ts: worker dedicato al motore AI.
- src/nova.ts: contesto progetto, estrazione proposte metriche e persistenza chat.
- src/App.tsx: Project Hub, wizard, workspace e drawer di Nova.
- src/styles.css: tema e layout responsive.

L’export JSON include schemaVersion: 1; il backup globale conserva i progetti, mentre i messaggi chat non fanno parte dell’export.
