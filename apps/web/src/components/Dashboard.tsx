'use client';

import { useState, useCallback, useMemo } from 'react';
import { DropZone, type FileDrop } from './DropZone';
import { ZoneEditor, type Zone } from './ZoneEditor';
import { AuditResults } from './AuditResults';
import { auditImage, sanitizeImage } from '@/lib/wasm';

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

  const handleSanitize = useCallback(async () => {
    if (!fileData) return;
    setLoading(true);
    setError(null);
    try {
      const zonePayload = zones.map((z) => ({ x: z.x, y: z.y, width: z.width, height: z.height }));
      const result = await sanitizeImage(new Uint8Array(fileData.data), zonePayload);
      const blob = new Blob([new Uint8Array(result)], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redactguard_${fileData.file.name.replace(/\.[^.]+$/, '')}.png`;
      a.click();
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

  const imageUrl = useMemo(
    () => (fileData ? URL.createObjectURL(fileData.file) : ''),
    [fileData]
  );

  return (
    <div className="dashboard">
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
            <p className="hint">Haz clic en la imagen para añadir zonas de redacción.</p>
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
