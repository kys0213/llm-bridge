import { describe, it, expect, beforeEach } from 'vitest';
import { LlamaModel } from '../../models/llama/llama-model';

describe('LlamaModel', () => {
  let llamaModel: LlamaModel;

  beforeEach(() => {
    llamaModel = new LlamaModel('llama3.2');
  });

  describe('supportsModel', () => {
    it('should support llama models', () => {
      expect(llamaModel.supportsModel('llama3.2')).toBe(true);
      expect(llamaModel.supportsModel('llama3.1')).toBe(true);
      expect(llamaModel.supportsModel('llama3')).toBe(true);
      expect(llamaModel.supportsModel('llama2')).toBe(true);
    });

    it('should not support non-llama models', () => {
      expect(llamaModel.supportsModel('gemma3n:latest')).toBe(false);
      expect(llamaModel.supportsModel('gpt-4')).toBe(false);
      expect(llamaModel.supportsModel('claude-3')).toBe(false);
    });
  });

  describe('getSupportedModels', () => {
    it('should return list of supported llama models', () => {
      const supportedModels = llamaModel.getSupportedModels();
      expect(supportedModels).toContain('llama3.2');
      expect(supportedModels).toContain('llama3.1');
      expect(supportedModels).toContain('llama3');
      expect(supportedModels).toContain('llama2');
      expect(supportedModels).toContain('llama');
    });
  });

  describe('getModelId', () => {
    it('should return the model ID', () => {
      expect(llamaModel.getModelId()).toBe('llama3.2');
    });
  });

  describe('getMetadata', () => {
    it('should return model metadata', () => {
      const metadata = llamaModel.getMetadata();
      expect(metadata.name).toBe('Llama');
      expect(metadata.model).toBe('llama3.2');
      expect(metadata.description).toContain('Ollama Llama Bridge');
      expect(metadata.contextWindow).toBeGreaterThan(0);
      expect(metadata.maxTokens).toBeGreaterThan(0);
    });
  });

  describe('getCapabilities', () => {
    it('should return model capabilities', () => {
      const capabilities = llamaModel.getCapabilities();
      expect(capabilities).toMatchInlineSnapshot(`
        {
          "modalities": [
            "text",
            "image",
          ],
          "supportsFunctionCall": true,
          "supportsMultiTurn": false,
          "supportsStreaming": true,
          "supportsToolCall": true,
          "supportsVision": false,
        }
      `);
    });

    it('should support multiModal for llama3.2', () => {
      const llama32Model = new LlamaModel('llama3.2');
      const capabilities = llama32Model.getCapabilities();
      expect(capabilities).toMatchInlineSnapshot(`
        {
          "modalities": [
            "text",
            "image",
          ],
          "supportsFunctionCall": true,
          "supportsMultiTurn": false,
          "supportsStreaming": true,
          "supportsToolCall": true,
          "supportsVision": false,
        }
      `);
    });

    it('should not support multiModal for older models', () => {
      const llama3Model = new LlamaModel('llama3');
      const capabilities = llama3Model.getCapabilities();
      expect(capabilities).toMatchInlineSnapshot(`
        {
          "modalities": [
            "text",
            "image",
          ],
          "supportsFunctionCall": true,
          "supportsMultiTurn": false,
          "supportsStreaming": true,
          "supportsToolCall": true,
          "supportsVision": false,
        }
      `);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = llamaModel.getDefaultConfig();
      expect(config.model).toBe('llama3.2');
      expect(config.temperature).toBe(0.7);
      expect(config.num_predict).toBe(4096);
    });
  });
});
