import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
  kind: string;
  text: string;
}

/** Detección PII simple en servidor (mismos patrones que core) */
function detectPii(text: string): boolean {
  const patterns = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    /(\+?\d{1,4}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{2,4}/,
    /[A-Z]{2}\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{0,4}/,
    /\b\d{8}[A-Z]\b/i,
    /\b\d{3}-\d{2}-\d{4}\b/,
  ];
  return patterns.some((p) => p.test(text));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const mode = (formData.get('mode') as string) || 'all';

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const worker = await createWorker('spa+eng', 1, {
      logger: () => {},
    });

    const { data } = await worker.recognize(buffer);
    await worker.terminate();

    const words = (data.words ?? []) as Array<{
      text?: string;
      bbox?: { x0: number; y0: number; x1: number; y1: number };
      box?: { x0: number; y0: number; x1: number; y1: number };
    }>;

    const zones: Zone[] = [];
    for (const word of words) {
      const wordText = (word.text ?? '').trim();
      if (!wordText) continue;
      if (mode === 'pii' && !detectPii(wordText)) continue;

      const bbox = word.bbox ?? word.box;
      if (!bbox || bbox.x0 == null) continue;

      const x = Math.max(0, Math.round(bbox.x0));
      const y = Math.max(0, Math.round(bbox.y0));
      const w = Math.max(1, Math.round((bbox.x1 ?? bbox.x0) - bbox.x0));
      const h = Math.max(1, Math.round((bbox.y1 ?? bbox.y0) - bbox.y0));
      if (w <= 0 || h <= 0) continue;

      zones.push({
        x,
        y,
        width: w,
        height: h,
        kind: mode === 'pii' ? 'pii' : 'text',
        text: wordText,
      });
    }

    return NextResponse.json({ zones });
  } catch (e) {
    console.error('[OCR API]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error en OCR' },
      { status: 500 }
    );
  }
}
