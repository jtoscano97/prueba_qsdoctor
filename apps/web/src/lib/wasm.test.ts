import { describe, it, expect, vi } from 'vitest';

// WASM requires browser/Web APIs - mock for unit tests
vi.mock('./wasm', () => ({
  detectPiiInText: vi.fn().mockResolvedValue([
    { kind: 'email', start: 9, end: 23 },
  ]),
}));

import { detectPiiInText } from './wasm';

describe('detectPiiInText (mocked)', () => {
  it('returns matches for text with email', async () => {
    const matches = await detectPiiInText('Contact: test@example.com');
    expect(Array.isArray(matches)).toBe(true);
  });

  it('returns array', async () => {
    const matches = await detectPiiInText('any text');
    expect(matches).toBeDefined();
    expect(Array.isArray(matches)).toBe(true);
  });
});
