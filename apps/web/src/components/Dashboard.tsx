'use client';

import { useState, useCallback, useMemo } from 'react';
import { DropZone, type FileDrop } from './DropZone';
import { ZoneEditor, type Zone } from './ZoneEditor';
import { AuditResults } from './AuditResults';
import { PiiScanner } from './PiiScanner';
import { auditImage, sanitizeImage } from '@/lib/wasm';
import {
  suggestZonesFromImage,
  suggestZonesFromAllText,
  suggestZonesViaApi,
} from '@/lib/ocr-pii';

type View = 'drop' | 'editor' | 'audit' | 'xray';

export function Dashboard() {
  const [view, setView] = useState<View>('drop');
  const [fileData, setFileData] = useState<FileDrop | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [auditResult, setAuditResult] = useState<{
    score: number;
    findings: { severity: string; message: string }[];
    heatmap: number[][];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const handleFile = useCallback((drop: FileDrop) => {
    setFileData(drop);
    setZones([]);
    setAuditResult(null);
    setView('editor');
  }, []);

  const handleAudit = useCallback(async () => {
    if (!fileData) return;
    setLoading(true);
    setError(null);
    try {
      const result = await auditImage(new Uint8Array(fileData.data));
      const parsed = JSON.parse(result);
      setAuditResult({
        score: parsed.score,
        findings: parsed.findings ?? [],
        heatmap: parsed.heatmap ?? [],
      });
      setView('audit');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error en auditoría');
    } finally {
      setLoading(false);
    }
  }, [fileData]);

  const [showScanAnim, setShowScanAnim] = useState(false);
  const [lastCert, setLastCert] = useState<string | null>(null);
  const [suggestingOcr, setSuggestingOcr] = useState(false);

  const runOcrSuggest = useCallback(
    async (
      mode: 'all' | 'pii',
      fn: typeof suggestZonesFromImage | typeof suggestZonesFromAllText
    ) => {
      if (!fileData) return;
      setSuggestingOcr(true);
      setError(null);
      try {
        const img = new Image();
        const blob = new Blob([fileData.data], { type: fileData.file.type });
        const url = URL.createObjectURL(blob);
        await new Promise<void>((res, rej) => {
          img.onload = () => {
            URL.revokeObjectURL(url);
            res();
          };
          img.onerror = rej;
          img.src = url;
        });

        let suggested: { x: number; y: number; width: number; height: number }[];
        try {
          suggested = await fn(
            fileData.data,
            img.naturalWidth,
            img.naturalHeight,
            fileData.file.type || 'image/png'
          );
        } catch (clientErr) {
          console.warn('[RedactGuard OCR] Navegador falló, usando servidor:', clientErr);
          suggested = await suggestZonesViaApi(fileData.file, mode);
        }

        const newZones: Zone[] = suggested.map((s) => ({
          id: crypto.randomUUID(),
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
        }));
        setZones((prev) => [...prev, ...newZones]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al analizar imagen';
        console.error('[RedactGuard OCR]', e);
        setError(msg);
      } finally {
        setSuggestingOcr(false);
      }
    },
    [fileData]
  );

  const handleSuggestPii = useCallback(
    () => runOcrSuggest('pii', suggestZonesFromImage),
    [runOcrSuggest]
  );
  const handleSuggestAllText = useCallback(
    () => runOcrSuggest('all', suggestZonesFromAllText),
    [runOcrSuggest]
  );

  const handleSanitize = useCallback(async () => {
    if (!fileData) return;
    setLoading(true);
    setError(null);
    setShowScanAnim(true);
    setTimeout(() => setShowScanAnim(false), 2000);
    try {
      const zonePayload = zones.map((z) => ({ x: z.x, y: z.y, width: z.width, height: z.height }));
      const result = await sanitizeImage(new Uint8Array(fileData.data), zonePayload);
      const resultArr = new Uint8Array(result);
      const blob = new Blob([resultArr], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const hashBuf = await crypto.subtle.digest('SHA-256', resultArr);
      const hashHex = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const cert = `RedactGuard Sanitization Certificate
File: ${fileData.file.name}
Date: ${new Date().toISOString()}
SHA-256: ${hashHex}
Policy: Manual zones`;
      setLastCert(cert);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redactguard_${fileData.file.name.replace(/\.[^.]+$/, '')}.png`;
      a.click();
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(cert).catch(() => {});
      }
      URL.revokeObjectURL(url);
      setView('editor');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error en sanitización');
    } finally {
      setLoading(false);
    }
  }, [fileData, zones]);

  const handleBack = () => {
    if (view === 'editor') {
      setFileData(null);
      setZones([]);
      setView('drop');
    } else {
      setView('editor');
    }
  };

  const handleLoadTestImage = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 400, 100);
    ctx.fillStyle = '#000';
    ctx.font = '24px sans-serif';
    ctx.fillText('FURIA Training Club', 20, 40);
    ctx.fillText('FUERZA EMOM EXTRA', 20, 75);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const data = await blob.arrayBuffer();
      const file = new File([blob], 'test-ocr.png', { type: 'image/png' });
      handleFile({ file, data });
    }, 'image/png');
  }, [handleFile]);

  const imageUrl = useMemo(
    () => (fileData ? URL.createObjectURL(fileData.file) : ''),
    [fileData]
  );

  return (
    <div className="dashboard">
      {showScanAnim && <div className="scan-line" aria-hidden />}
      <header className="header">
        <h1 className="logo">RedactGuard</h1>
        <span className="tagline">Zero-Trust Data Sanitization</span>
        <nav className="nav">
          <span className="badge-safe">● 100% Local · Air-Gapped</span>
        </nav>
      </header>

      <main className="main">
        {view === 'drop' && (
          <>
            <DropZone onFile={handleFile} />
            <p className="hint" style={{ marginTop: '0.5rem' }}>
              <button type="button" className="link-btn" onClick={handleLoadTestImage}>
                Probar con imagen de ejemplo
              </button>{' '}
              (si el OCR falla en tu móvil)
            </p>
            <PiiScanner />
            <div className="status">
              <span className="badge-safe">● Procesamiento en navegador (WASM)</span>
            </div>
          </>
        )}

        {view === 'editor' && fileData && (
          <div className="editor-view">
            <div className="editor-toolbar">
              <button type="button" onClick={handleBack} className="btn-back">
                ← Volver
              </button>
              <h2>{fileData.file.name}</h2>
              <div className="toolbar-actions">
                <button
                  type="button"
                  onClick={handleSuggestPii}
                  disabled={loading || suggestingOcr}
                  className="btn-suggest-pii"
                  title="OCR + detección de PII (email, teléfono, DNI, IBAN, etc.)"
                >
                  {suggestingOcr ? 'Analizando…' : 'Solo PII'}
                </button>
                <button
                  type="button"
                  onClick={handleSuggestAllText}
                  disabled={loading || suggestingOcr}
                  className="btn-suggest-all"
                  title="OCR de todo el texto: crea zonas sobre cada palabra detectada"
                >
                  {suggestingOcr ? 'Analizando…' : 'Todo el texto'}
                </button>
                <button
                  type="button"
                  onClick={handleAudit}
                  disabled={loading}
                  className="btn-audit"
                >
                  {loading ? 'Analizando…' : 'Auditar (X-Ray)'}
                </button>
                <button
                  type="button"
                  onClick={handleSanitize}
                  disabled={loading || zones.length === 0}
                  className="btn-sanitize"
                >
                  {loading ? 'Procesando…' : 'Sanitizar y Descargar'}
                </button>
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <ZoneEditor
              imageUrl={imageUrl}
              imageSize={{ width: 0, height: 0 }}
              zones={zones}
              onZonesChange={setZones}
              heatmap={auditResult?.heatmap ?? []}
              showHeatmap={showHeatmap}
            />
            <p className="hint">
              Haz clic en la imagen para añadir zonas manualmente. «Todo el texto» cubre todo lo que el OCR detecte; «Solo PII» solo emails, teléfonos, DNI, IBAN, etc. Si el OCR falla en el navegador (p. ej. móvil), se usa el servidor automáticamente.
            </p>
            {error && (
              <p className="hint">
                Si el OCR falla, prueba{' '}
                <button type="button" className="link-btn" onClick={handleLoadTestImage}>
                  cargar imagen de prueba
                </button>{' '}
                y luego «Todo el texto». Si eso funciona, el problema puede ser el tamaño o formato de tu imagen.
              </p>
            )}
            {lastCert && (
              <div className="proof-panel">
                <h4>Certificado de sanitización</h4>
                <pre>{lastCert}</pre>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(lastCert ?? ''); setLastCert(null); }}>
                  Copiar y cerrar
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'audit' && fileData && auditResult && (
          <div className="audit-view">
            <div className="editor-toolbar">
              <button type="button" onClick={handleBack} className="btn-back">
                ← Volver
              </button>
              <h2>X-Ray Auditor — {fileData.file.name}</h2>
            </div>
            <div className="audit-layout">
              <div className="audit-canvas">
                <ZoneEditor
                  imageUrl={imageUrl}
                  imageSize={{ width: 0, height: 0 }}
                  zones={zones}
                  onZonesChange={setZones}
                  heatmap={auditResult.heatmap}
                  showHeatmap={showHeatmap}
                />
              </div>
              <AuditResults
                score={auditResult.score}
                findings={auditResult.findings}
                onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
                showHeatmap={showHeatmap}
              />
            </div>
            <div className="audit-actions">
              <button type="button" onClick={handleSanitize} disabled={loading || zones.length === 0} className="btn-sanitize">
                Export Safe
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
