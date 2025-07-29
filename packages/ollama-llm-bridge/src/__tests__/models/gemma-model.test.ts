import { describe, it, expect, beforeEach } from 'vitest';
import { GemmaModel } from '../../models/gemma/gemma-model';

describe('GemmaModel', () => {
  let gemmaModel: GemmaModel;

  beforeEach(() => {
    gemmaModel = new GemmaModel('gemma3n:latest');
  });

  describe('supportsModel', () => {
    it('should support gemma models', () => {
      expect(gemmaModel.supportsModel('gemma3n:latest')).toBe(true);
      expect(gemmaModel.supportsModel('gemma3n:7b')).toBe(true);
      expect(gemmaModel.supportsModel('gemma3n:2b')).toBe(true);
      expect(gemmaModel.supportsModel('gemma2:latest')).toBe(true);
      expect(gemmaModel.supportsModel('gemma:7b')).toBe(true);
    });

    it('should not support non-gemma models', () => {
      expect(gemmaModel.supportsModel('llama3.2')).toBe(false);
      expect(gemmaModel.supportsModel('gpt-4')).toBe(false);
      expect(gemmaModel.supportsModel('claude-3')).toBe(false);
    });
  });

  describe('getSupportedModels', () => {
    it('should return list of supported gemma models', () => {
      const supportedModels = gemmaModel.getSupportedModels();
      expect(supportedModels).toContain('gemma3n:latest');
      expect(supportedModels).toContain('gemma3n:7b');
      expect(supportedModels).toContain('gemma3n:2b');
      expect(supportedModels).toContain('gemma2:latest');
      expect(supportedModels).toContain('gemma:latest');
    });
  });

  describe('getModelId', () => {
    it('should return the model ID', () => {
      expect(gemmaModel.getModelId()).toBe('gemma3n:latest');
    });
  });

  describe('getMetadata', () => {
    it('should return model metadata', () => {
      const metadata = gemmaModel.getMetadata();
      expect(metadata.name).toBe('Gemma');
      expect(metadata.model).toBe('gemma3n:latest');
      expect(metadata.description).toContain('Ollama Gemma Bridge');
      expect(metadata.contextWindow).toBeGreaterThan(0);
      expect(metadata.maxTokens).toBeGreaterThan(0);
    });

    it('should include model size in description', () => {
      const gemma7bModel = new GemmaModel('gemma3n:7b');
      const metadata = gemma7bModel.getMetadata();
      expect(metadata.description).toContain('7b');
    });
  });

  describe('getCapabilities', () => {
    it('should return model capabilities', () => {
      const capabilities = gemmaModel.getCapabilities();
      expect(capabilities).toMatchInlineSnapshot(`
        {
          "modalities": [
            "text",
            "image",
            "audio",
            "video",
            "file",
          ],
          "supportsFunctionCall": true,
          "supportsMultiTurn": true,
          "supportsStreaming": true,
          "supportsToolCall": true,
          "supportsVision": true,
        }
      `);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = gemmaModel.getDefaultConfig();
      expect(config.model).toBe('gemma3n:latest');
      expect(config.temperature).toBe(0.7);
      expect(config.num_predict).toBe(2048);
    });
  });

  describe('model size detection', () => {
    it('should detect 2b model size', () => {
      const gemma2bModel = new GemmaModel('gemma3n:2b');
      const capabilities = gemma2bModel.getMetadata();
      expect(capabilities.maxTokens).toBe(1024);
    });

    it('should detect 7b model size', () => {
      const gemma7bModel = new GemmaModel('gemma3n:7b');
      const capabilities = gemma7bModel.getMetadata();
      expect(capabilities.maxTokens).toBe(2048);
    });
  });
});
