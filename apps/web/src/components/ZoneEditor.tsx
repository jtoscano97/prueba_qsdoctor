'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

export interface Zone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ZoneEditorProps {
  imageUrl: string;
  imageSize: { width: number; height: number };
  zones: Zone[];
  onZonesChange: (zones: Zone[]) => void;
  heatmap?: number[][];
  showHeatmap?: boolean;
}

export function ZoneEditor({
  imageUrl,
  imageSize,
  zones,
  onZonesChange,
  heatmap = [],
  showHeatmap = false,
}: ZoneEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ id: string; start: { x: number; y: number } } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; corner: string } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (showHeatmap && heatmap.length > 0) {
        const block = 8;
        ctx.globalAlpha = 0.6;
        for (let by = 0; by < heatmap.length; by++) {
          for (let bx = 0; bx < (heatmap[by]?.length ?? 0); bx++) {
            const risk = heatmap[by][bx] ?? 0;
            if (risk > 10) {
              ctx.fillStyle =
                risk > 80 ? '#FF3366' : risk > 50 ? '#FF9933' : risk > 20 ? '#FFCC00' : '#00FF88';
              ctx.fillRect(bx * block, by * block, block, block);
            }
          }
        }
        ctx.globalAlpha = 1;
      }

      zones.forEach((z) => {
        ctx.strokeStyle = '#00FF88';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(z.x, z.y, z.width, z.height);
        ctx.fillStyle = 'rgba(0,255,136,0.2)';
        ctx.fillRect(z.x, z.y, z.width, z.height);
        ctx.setLineDash([]);
      });
    };
    img.src = imageUrl;
  }, [imageUrl, zones, heatmap, showHeatmap]);

  useEffect(() => draw(), [draw]);

  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(((e.clientX - rect.left) / rect.width) * canvas.width),
      y: Math.round(((e.clientY - rect.top) / rect.height) * canvas.height),
    };
  };

  const hitTestZone = useCallback((px: number, py: number) => {
    return zones.find(
      (z) => px >= z.x && px <= z.x + z.width && py >= z.y && py <= z.y + z.height
    );
  }, [zones]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName !== 'CANVAS') return;
    const { x, y } = getCanvasCoords(e);
    const zone = hitTestZone(x, y);
    if (zone) {
      setDragging({ id: zone.id, start: { x: zone.x - x, y: zone.y - y } });
    } else {
      const newZone = {
        id: crypto.randomUUID(),
        x: Math.max(0, x - 50),
        y: Math.max(0, y - 20),
        width: 100,
        height: 40,
      };
      onZonesChange([...zones, newZone]);
    }
  };

  const zonesRef = useRef(zones);
  zonesRef.current = zones;

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * canvas.width);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * canvas.height);
      const currentZones = zonesRef.current;
      onZonesChange(
        currentZones.map((z) =>
          z.id === dragging.id
            ? { ...z, x: Math.max(0, x + dragging.start.x), y: Math.max(0, y + dragging.start.y) }
            : z
        )
      );
    };
    const handleMouseUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, onZonesChange]);

  const handleZoneResize = (id: string, dx: number, dy: number, dw: number, dh: number) => {
    onZonesChange(
      zones.map((z) =>
        z.id === id
          ? {
              ...z,
              x: Math.max(0, z.x + dx),
              y: Math.max(0, z.y + dy),
              width: Math.max(20, z.width + dw),
              height: Math.max(20, z.height + dh),
            }
          : z
      )
    );
  };

  const handleDeleteZone = (id: string) => {
    onZonesChange(zones.filter((z) => z.id !== id));
  };

  return (
    <div className="zone-editor" ref={containerRef}>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          style={{ cursor: dragging ? 'grabbing' : 'crosshair' }}
        />
      </div>
      <div className="zones-list">
        <h4>Zonas a redactar ({zones.length})</h4>
        {zones.map((z) => (
          <div key={z.id} className="zone-item">
            <code>{z.x},{z.y} {z.width}×{z.height}</code>
            <div className="zone-actions">
              <button type="button" onClick={() => handleZoneResize(z.id, 0, 0, -10, 0)} title="− Ancho">−</button>
              <button type="button" onClick={() => handleZoneResize(z.id, 0, 0, 10, 0)} title="+ Ancho">+</button>
              <button type="button" onClick={() => handleZoneResize(z.id, 0, 0, 0, -5)} title="− Alto">↕−</button>
              <button type="button" onClick={() => handleZoneResize(z.id, 0, 0, 0, 5)} title="+ Alto">↕+</button>
              <button type="button" onClick={() => handleDeleteZone(z.id)} className="btn-delete">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
