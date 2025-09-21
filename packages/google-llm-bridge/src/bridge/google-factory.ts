import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIBridge } from './google-bridge';
import { GoogleAIConfig, GoogleAIConfigSchema } from './google-config';

/**
 * GoogleAIBridge 생성 헬퍼
 */
export function createGoogleAIBridge(config: GoogleAIConfig): GoogleAIBridge {
  const parsed = GoogleAIConfigSchema.parse(config);
  const client = new GoogleGenerativeAI(parsed.apiKey);
  return new GoogleAIBridge(client, parsed);
}
