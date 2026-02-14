'use client';

import { useCallback, useState, useEffect } from 'react';

const MAX_SIZE_MB = 50;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export interface FileDrop {
  file: File;
  data: ArrayBuffer;
}

interface DropZoneProps {
  onFile: (drop: FileDrop) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Formato no soportado. Use PNG, JPG o WebP.`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Máximo ${MAX_SIZE_MB}MB.`;
    }
    return null;
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      const data = await file.arrayBuffer();
      onFile({ file, data });
    },
    [validate, onFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [disabled, processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (disabled) return;
      const item = e.clipboardData?.items?.[0];
      if (item?.kind === 'file') {
        const file = item.getAsFile();
        if (file) processFile(file);
      }
    },
    [disabled, processFile]
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = '';
    },
    [processFile]
  );

  return (
    <div
      className={`dropzone ${dragOver ? 'drag-over' : ''} ${error ? 'error' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        onChange={handleInputChange}
        disabled={disabled}
        style={{ display: 'none' }}
        id="file-input"
      />
      <label htmlFor="file-input" className="dropzone-label">
        <p className="dropzone-text">
          Arrastra archivos aquí o pega desde el portapapeles
        </p>
        <p className="dropzone-hint">PNG, JPG, WebP — Máx {MAX_SIZE_MB}MB · 100% local</p>
      </label>
      {error && <p className="dropzone-error">{error}</p>}
    </div>
  );
}
