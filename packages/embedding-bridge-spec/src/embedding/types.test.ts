import { describe, it, expect } from 'vitest';

import type { EmbeddingBridge, EmbeddingRequest } from './types';

describe('EmbeddingBridge', () => {
  it('정의가 존재해야 한다', () => {
    const fn = (bridge: EmbeddingBridge) => bridge;
    expect(fn).toBeTruthy();
  });

  it('멀티모달 입력을 허용해야 한다', () => {
    const request: EmbeddingRequest = {
      input: ['hello', { contentType: 'image', value: Buffer.from([]) }],
    };
    expect(Array.isArray(request.input)).toBe(true);
  });
});
