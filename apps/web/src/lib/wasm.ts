'use client';

let wasmModule: typeof import('@redactguard/wasm') | null = null;

export async function initWasm() {
  if (wasmModule) return wasmModule;
  wasmModule = await import('@redactguard/wasm');
  await wasmModule.default();
  return wasmModule;
}

export async function auditImage(input: Uint8Array): Promise<string> {
  const mod = await initWasm();
  return mod.audit_image(input);
}

export async function sanitizeImage(
  input: Uint8Array,
  zones: { x: number; y: number; width: number; height: number }[]
): Promise<Uint8Array> {
  const mod = await initWasm();
  return mod.sanitize_image(input, JSON.stringify(zones));
}

export async function detectPiiInText(text: string): Promise<{ kind: string; start: number; end: number }[]> {
  const mod = await initWasm();
  const json = mod.detect_pii_text(text);
  return JSON.parse(json);
}
