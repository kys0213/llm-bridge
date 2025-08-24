import { describe, it, expect } from 'vitest';
import { DependencyBridgeLoader } from '../index';

describe('loader smoke', () => {
  it('exports a constructible DependencyBridgeLoader', () => {
    expect(typeof DependencyBridgeLoader).toBe('function');
    const loader = new DependencyBridgeLoader();
    expect(loader).toBeTruthy();
    expect(typeof loader.load).toBe('function');
    expect(typeof loader.scan).toBe('function');
  });
});
