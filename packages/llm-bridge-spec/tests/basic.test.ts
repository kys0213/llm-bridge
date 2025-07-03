import { describe, it, expect } from 'vitest';
import * as spec from '../src';

// Basic sanity test to ensure package exports are defined

describe('llm-bridge-spec package', () => {
  it('should export definitions', () => {
    expect(spec).toBeTypeOf('object');
    expect(Object.keys(spec).length).toBeGreaterThan(0);
  });
});
