import { useState } from 'react';

function App() {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">RedactGuard</h1>
        <span className="tagline">Zero-Trust Data Sanitization</span>
      </header>

      <main className="main">
        <div
          className={`dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
          <p className="dropzone-text">Arrastra archivos aquí o pega desde el portapapeles</p>
          <p className="dropzone-hint">PNG, JPG, PDF — Procesamiento 100% local</p>
        </div>

        <div className="status">
          <span className="badge badge-safe">● Air-Gapped</span>
          <span className="badge">Portapapeles: Monitoreado</span>
        </div>
      </main>
    </div>
  );
}

export default App;
