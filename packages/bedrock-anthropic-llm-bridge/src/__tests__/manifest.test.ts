import { describe, it, expect } from 'vitest';
import { BEDROCK_ANTHROPIC_MANIFEST } from '../bridge/bedrock-anthropic-manifest';

describe('BedrockAnthropic manifest', () => {
  it('should have correct name', () => {
    expect(BEDROCK_ANTHROPIC_MANIFEST.name).toBe('bedrock-anthropic-llm-bridge');
  });
});
