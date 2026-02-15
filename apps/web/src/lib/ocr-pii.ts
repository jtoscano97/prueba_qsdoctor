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

/** Fallback: OCR vía API del servidor cuando el navegador falla (p.ej. móvil) */
export async function suggestZonesViaApi(
  imageFile: File,
  mode: 'all' | 'pii'
): Promise<SuggestedZone[]> {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('mode', mode);
  const res = await fetch('/api/ocr', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API OCR: ${res.status}`);
  }
  const { zones } = await res.json();
  return zones ?? [];
}

interface TessWord {
  text?: string;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
  box?: { x0: number; y0: number; x1: number; y1: number };
}

const MAX_OCR_DIMENSION = 1200;

type OcrInput = { input: string | Blob; width: number; height: number; revoke?: () => void };

/** Prepara la imagen para OCR: Blob directo si es pequeña, o URL si se redimensiona */
async function prepareImageForOcr(
  imageData: ArrayBuffer,
  mimeType: string,
  origWidth: number,
  origHeight: number
): Promise<OcrInput> {
  const needsResize = origWidth > MAX_OCR_DIMENSION || origHeight > MAX_OCR_DIMENSION;
  if (!needsResize) {
    const blob = new Blob([imageData], { type: mimeType });
    return { input: blob, width: origWidth, height: origHeight };
  }
  const scale = MAX_OCR_DIMENSION / Math.max(origWidth, origHeight);
  const w = Math.round(origWidth * scale);
  const h = Math.round(origHeight * scale);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([imageData], { type: mimeType });
    const src = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(src);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas no disponible'));
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (b) => {
          if (!b) return reject(new Error('Error al redimensionar'));
          const url = URL.createObjectURL(b);
          resolve({
            input: url,
            width: w,
            height: h,
            revoke: () => URL.revokeObjectURL(url),
          });
        },
        'image/png',
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error('No se pudo cargar la imagen'));
    };
    img.src = src;
  });
}

async function runOcr(
  imageInput: string | Blob,
  lang: string = 'eng'
): Promise<{ words: TessWord[] }> {
  const Tesseract = (await import('tesseract.js')).default;
  const opts = { logger: () => {} };
  try {
    const { data } = await Tesseract.recognize(imageInput, lang, opts);
    return { words: (data.words ?? []) as TessWord[] };
  } catch (err) {
    if (lang !== 'eng') {
      try {
        const { data } = await Tesseract.recognize(imageInput, 'eng', opts);
        return { words: (data.words ?? []) as TessWord[] };
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

/**
 * OCR + PII: Extrae texto de la imagen, detecta PII, devuelve zonas sugeridas.
 */
export async function suggestZonesFromImage(
  imageData: ArrayBuffer,
  imageWidth: number,
  imageHeight: number,
  mimeType: string = 'image/png'
): Promise<SuggestedZone[]> {
  const prepared = await prepareImageForOcr(
    imageData,
    mimeType,
    imageWidth,
    imageHeight
  );
  try {
    const { words } = await runOcr(prepared.input, 'spa+eng');
    const suggestedZones: SuggestedZone[] = [];
    const scaleX = imageWidth / prepared.width;
    const scaleY = imageHeight / prepared.height;

    for (const word of words) {
      const wordText = (word.text ?? '').trim();
      if (!wordText) continue;
      const pii = await detectPiiInText(wordText);
      if (pii.length === 0) continue;

      const bbox = word.bbox ?? word.box;
      if (!bbox || bbox.x0 == null) continue;

      const x = Math.max(0, Math.round(bbox.x0 * scaleX));
      const y = Math.max(0, Math.round(bbox.y0 * scaleY));
      const w = Math.min(imageWidth - x, Math.max(1, Math.round(((bbox.x1 ?? bbox.x0) - bbox.x0) * scaleX)));
      const h = Math.min(imageHeight - y, Math.max(1, Math.round(((bbox.y1 ?? bbox.y0) - bbox.y0) * scaleY)));
      if (w <= 0 || h <= 0) continue;

      suggestedZones.push({
        x, y, width: w, height: h,
        kind: pii[0]!.kind,
        text: wordText,
      });
    }
    return mergeOverlappingZones(suggestedZones);
  } finally {
    prepared.revoke?.();
  }
}

/**
 * OCR: Extrae TODO el texto de la imagen y devuelve zonas que cubren cada palabra.
 * Sirve para redactar la imagen por completo (todo el texto detectado).
 */
export async function suggestZonesFromAllText(
  imageData: ArrayBuffer,
  imageWidth: number,
  imageHeight: number,
  mimeType: string = 'image/png'
): Promise<SuggestedZone[]> {
  const prepared = await prepareImageForOcr(
    imageData,
    mimeType,
    imageWidth,
    imageHeight
  );
  try {
    const { words } = await runOcr(prepared.input, 'spa+eng');
    const suggestedZones: SuggestedZone[] = [];
    const scaleX = imageWidth / prepared.width;
    const scaleY = imageHeight / prepared.height;

    for (const word of words) {
      const wordText = (word.text ?? '').trim();
      if (!wordText) continue;

      const bbox = word.bbox ?? word.box;
      if (!bbox || bbox.x0 == null) continue;

      const x = Math.max(0, Math.round(bbox.x0 * scaleX));
      const y = Math.max(0, Math.round(bbox.y0 * scaleY));
      const w = Math.min(imageWidth - x, Math.max(1, Math.round(((bbox.x1 ?? bbox.x0) - bbox.x0) * scaleX)));
      const h = Math.min(imageHeight - y, Math.max(1, Math.round(((bbox.y1 ?? bbox.y0) - bbox.y0) * scaleY)));
      if (w <= 0 || h <= 0) continue;

      suggestedZones.push({
        x, y, width: w, height: h,
        kind: 'text',
        text: wordText,
      });
    }
    return mergeOverlappingZones(suggestedZones);
  } finally {
    prepared.revoke?.();
  }
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
