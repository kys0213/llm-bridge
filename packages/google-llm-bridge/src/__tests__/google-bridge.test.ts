import { describe, it, expect } from 'vitest';
import { LlmBridgePrompt } from 'llm-bridge-spec';
import { GoogleAIBridge } from '../bridge/google-bridge';
import { GoogleAIConfig } from '../bridge/google-config';
import { GoogleModelEnum } from '../bridge/google-models';

class MockModel {
  constructor(private responseText: string) {}
  async generateContent() {
    return { response: { text: () => this.responseText } };
  }
}

class MockClient {
  constructor(private model: MockModel) {}
  getGenerativeModel() {
    return this.model;
  }
}

describe('GoogleAIBridge', () => {
  it('기본 텍스트 프롬프트를 처리해야 함', async () => {
    const config: GoogleAIConfig = {
      apiKey: 'test',
      model: GoogleModelEnum.GEMINI_1_5_FLASH,
    };
    const mockModel = new MockModel('hi');
    const client = new MockClient(mockModel);
    const bridge = new GoogleAIBridge(client, config);

    const prompt: LlmBridgePrompt = {
      messages: [{ role: 'user', content: [{ contentType: 'text', value: 'hello' }] }],
    };

    const res = await bridge.invoke(prompt);
    expect(res.content).toEqual({ contentType: 'text', value: 'hi' });
  });
});
