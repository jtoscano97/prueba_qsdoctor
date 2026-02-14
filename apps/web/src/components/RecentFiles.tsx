'use client';

interface RecentFilesProps {
  files: { name: string; status: 'sanitized' | 'audited'; time: string }[];
}

export function RecentFiles({ files }: RecentFilesProps) {
  if (files.length === 0) return null;
  return (
    <div className="recent-files">
      <h4>Recientes</h4>
      {files.map((f, i) => (
        <div key={i} className="recent-item">
          <span>{f.name}</span>
          <span className={`status-${f.status}`}>
            {f.status === 'sanitized' ? '✓ Sanitizado' : '⚠ Auditoría'}
          </span>
          <span className="time">{f.time}</span>
        </div>
      ))}
    </div>
  );
}
