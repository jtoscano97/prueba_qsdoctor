'use client';

import { detectPiiInText } from './wasm';

export interface SuggestedZone {
  x: number;
  y: number;
  width: number;
  height: number;
  kind: string;
  text: string;
}

interface TessWord {
  text?: string;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
  box?: { x0: number; y0: number; x1: number; y1: number };
}

/**
 * OCR + PII: Extrae texto de la imagen, detecta PII, devuelve zonas sugeridas.
 * Funciona a nivel de palabra (email, teléfono, IBAN, DNI, SSN) y también con
 * texto completo para PII que abarca varias palabras.
 */
export async function suggestZonesFromImage(
  imageData: ArrayBuffer,
  imageWidth: number,
  imageHeight: number
): Promise<SuggestedZone[]> {
  const Tesseract = (await import('tesseract.js')).default;
  const { data } = await Tesseract.recognize(
    new Blob([imageData]),
    'spa+eng',
    { logger: () => {} }
  );

  const words = (data.words ?? []) as TessWord[];
  const suggestedZones: SuggestedZone[] = [];

  // 1. Palabra a palabra: detecta PII en cada palabra (email, tel, IBAN, etc.)
  for (const word of words) {
    const wordText = (word.text ?? '').trim();
    if (!wordText) continue;
    const pii = await detectPiiInText(wordText);
    if (pii.length === 0) continue;

    const bbox = word.bbox ?? word.box;
    if (!bbox || bbox.x0 == null) continue;

    const x = Math.max(0, Math.round(bbox.x0));
    const y = Math.max(0, Math.round(bbox.y0));
    const w = Math.min(imageWidth - x, Math.max(1, Math.round((bbox.x1 ?? bbox.x0) - bbox.x0)));
    const h = Math.min(imageHeight - y, Math.max(1, Math.round((bbox.y1 ?? bbox.y0) - bbox.y0)));
    if (w <= 0 || h <= 0) continue;

    suggestedZones.push({
      x, y, width: w, height: h,
      kind: pii[0]!.kind,
      text: wordText,
    });
  }

  return mergeOverlappingZones(suggestedZones);
}

/**
 * OCR: Extrae TODO el texto de la imagen y devuelve zonas que cubren cada palabra.
 * Sirve para redactar la imagen por completo (todo el texto detectado).
 */
export async function suggestZonesFromAllText(
  imageData: ArrayBuffer,
  imageWidth: number,
  imageHeight: number
): Promise<SuggestedZone[]> {
  const Tesseract = (await import('tesseract.js')).default;
  const { data } = await Tesseract.recognize(
    new Blob([imageData]),
    'spa+eng',
    { logger: () => {} }
  );

  const words = (data.words ?? []) as TessWord[];
  const suggestedZones: SuggestedZone[] = [];

  for (const word of words) {
    const wordText = (word.text ?? '').trim();
    if (!wordText) continue;

    const bbox = word.bbox ?? word.box;
    if (!bbox || bbox.x0 == null) continue;

    const x = Math.max(0, Math.round(bbox.x0));
    const y = Math.max(0, Math.round(bbox.y0));
    const w = Math.min(imageWidth - x, Math.max(1, Math.round((bbox.x1 ?? bbox.x0) - bbox.x0)));
    const h = Math.min(imageHeight - y, Math.max(1, Math.round((bbox.y1 ?? bbox.y0) - bbox.y0)));
    if (w <= 0 || h <= 0) continue;

    suggestedZones.push({
      x, y, width: w, height: h,
      kind: 'text',
      text: wordText,
    });
  }

  return mergeOverlappingZones(suggestedZones);
}

function mergeOverlappingZones(zones: SuggestedZone[]): SuggestedZone[] {
  if (zones.length <= 1) return zones;
  const merged: SuggestedZone[] = [];
  let current = { ...zones[0]! };

  for (let i = 1; i < zones.length; i++) {
    const z = zones[i]!;
    const gap = 30;
    const overlapX = z.x <= current.x + current.width + gap && z.x + z.width >= current.x - gap;
    const overlapY = z.y <= current.y + current.height + gap && z.y + z.height >= current.y - gap;
    if (overlapX && overlapY) {
      const xMin = Math.min(current.x, z.x);
      const yMin = Math.min(current.y, z.y);
      current = {
        ...current,
        x: xMin,
        y: yMin,
        width: Math.max(current.x + current.width, z.x + z.width) - xMin,
        height: Math.max(current.y + current.height, z.y + z.height) - yMin,
      };
    } else {
      merged.push(current);
      current = { ...z };
    }
  }
  merged.push(current);
  return merged;
}
