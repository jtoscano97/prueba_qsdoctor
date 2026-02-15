'use client';

import { useState, useCallback } from 'react';
import { detectPiiInText } from '@/lib/wasm';

export function PiiScanner() {
  const [text, setText] = useState('');
  const [matches, setMatches] = useState<{ kind: string; start: number; end: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleScan = useCallback(async () => {
    setLoading(true);
    try {
      const result = await detectPiiInText(text);
      setMatches(result);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [text]);

  const highlighted = text.split('').map((char, i) => {
    const m = matches.find((x) => i >= x.start && i < x.end);
    return m ? { char, kind: m.kind } : { char, kind: null };
  });

  return (
    <div className="pii-scanner">
      <h4>Escanear texto (PII)</h4>
      <p className="pii-hint">Pega texto para detectar emails, teléfonos, IBAN, DNI, SSN.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Pega aquí el texto a analizar..."
        rows={4}
      />
      <button type="button" onClick={handleScan} disabled={loading} className="btn-scan">
        {loading ? 'Escaneando…' : 'Escanear'}
      </button>
      {matches.length > 0 && (
        <div className="pii-results">
          <p className="pii-count">
            {matches.length} hallazgo(s):{' '}
            {[...new Set(matches.map((m) => m.kind))].join(', ')}
          </p>
          <div className="pii-list">
            {matches.map((m, i) => (
              <span key={i} className={`pii-tag pii-${m.kind}`}>
                {text.slice(m.start, m.end)} ({m.kind})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
