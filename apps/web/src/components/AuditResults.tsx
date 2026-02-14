'use client';

export interface Finding {
  severity: string;
  message: string;
  x?: number;
  y?: number;
}

interface AuditResultsProps {
  score: number;
  findings: Finding[];
  onToggleHeatmap: () => void;
  showHeatmap: boolean;
}

export function AuditResults({ score, findings, onToggleHeatmap, showHeatmap }: AuditResultsProps) {
  const severityColor = (s: string) => {
    if (s.includes('Critical')) return 'severity-critical';
    if (s.includes('High')) return 'severity-high';
    return 'severity-medium';
  };

  return (
    <div className="audit-results">
      <div className="audit-score">
        <span className={`score-value ${score > 80 ? 'critical' : score > 50 ? 'high' : 'ok'}`}>
          {Math.round(score)}
        </span>
        <span className="score-label">/ 100 — Reversibilidad</span>
      </div>
      <button type="button" onClick={onToggleHeatmap} className="btn-heatmap">
        {showHeatmap ? 'Ocultar' : 'Mostrar'} X-Ray Heatmap
      </button>
      <div className="findings-list">
        <h4>Hallaigos</h4>
        {findings.length === 0 ? (
          <p className="findings-empty">✓ No se detectaron vulnerabilidades críticas.</p>
        ) : (
          findings.map((f, i) => (
            <div key={i} className={`finding ${severityColor(f.severity)}`}>
              <span className="finding-severity">{f.severity}</span>
              <p>{f.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
