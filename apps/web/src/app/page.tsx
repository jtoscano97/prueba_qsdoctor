export default function Home() {
  return (
    <main style={{ minHeight: '100vh', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'monospace', color: '#00FF88', fontSize: '2rem' }}>
          RedactGuard
        </h1>
        <p style={{ color: '#71717A', fontSize: '0.875rem' }}>
          Zero-Trust Data Sanitization & Compliance Suite
        </p>
      </header>

      <div style={{
        padding: '4rem 2rem',
        border: '2px dashed rgba(0, 255, 136, 0.2)',
        borderRadius: '8px',
        maxWidth: '600px',
        textAlign: 'center',
      }}>
        <p style={{ marginBottom: '0.5rem' }}>Arrastra archivos aquí o pega desde el portapapeles</p>
        <p style={{ fontSize: '0.875rem', color: '#71717A', fontFamily: 'monospace' }}>
          PNG, JPG, PDF — WASM client-side (próximamente)
        </p>
      </div>

      <p style={{ fontSize: '0.875rem', color: '#00FF88' }}>● Procesamiento 100% local · Air-Gapped</p>
    </main>
  );
}
