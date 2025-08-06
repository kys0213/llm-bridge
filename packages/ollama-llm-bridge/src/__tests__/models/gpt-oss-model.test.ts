import { describe, it, expect, beforeEach } from 'vitest';
import { GptOssModel } from '../../models/gpt-oss/gpt-oss-model';

describe('GptOssModel', () => {
  let model: GptOssModel;

  beforeEach(() => {
    model = new GptOssModel('gpt-oss-20:b');
    model.setConfig({
      host: 'http://localhost:11434',
      model: 'gpt-oss-20:b',
      temperature: 0.7,
      num_predict: 512,
    });
  });

  describe('supportsModel', () => {
    it('should support gpt-oss models', () => {
      expect(model.supportsModel('gpt-oss-20:b')).toBe(true);
      expect(model.supportsModel('gpt-oss-20b')).toBe(true);
    });

    it('should not support other models', () => {
      expect(model.supportsModel('llama3.2')).toBe(false);
    });
  });

  describe('getSupportedModels', () => {
    it('should return list of supported gpt-oss models', () => {
      expect(model.getSupportedModels()).toContain('gpt-oss-20:b');
    });
  });

  describe('getMetadata', () => {
    it('should return model metadata', () => {
      const metadata = model.getMetadata();
      expect(metadata.name).toBe('GPT-OSS');
      expect(metadata.model).toBe('gpt-oss-20:b');
      expect(metadata.maxTokens).toBe(512);
      expect(metadata.contextWindow).toBe(4096);
    });
  });

  describe('getCapabilities', () => {
    it('should return model capabilities', () => {
      const capabilities = model.getCapabilities();
      expect(capabilities).toMatchInlineSnapshot(`
        {
          "modalities": [
            "text",
          ],
          "supportsFunctionCall": false,
          "supportsMultiTurn": true,
          "supportsStreaming": true,
          "supportsToolCall": true,
          "supportsVision": false,
        }
      `);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = model.getDefaultConfig();
      expect(config.model).toBe('gpt-oss-20:b');
      expect(config.temperature).toBe(0.7);
      expect(config.num_predict).toBe(4096);
    });
  });
});
