import { describe, it, expect } from 'vitest';
import { GoogleAIConfigSchema } from '../bridge/google-config';
import { GoogleModelEnum, GOOGLE_MODELS } from '../bridge/google-models';
import { GOOGLE_MANIFEST } from '../bridge/google-manifest';

describe('Google model definitions', () => {
  it('config 스키마가 enum 모델을 허용해야 함', () => {
    const parsed = GoogleAIConfigSchema.parse({
      apiKey: 'x',
      model: GoogleModelEnum.GEMINI_1_5_PRO,
    });
    expect(parsed.model).toBe(GoogleModelEnum.GEMINI_1_5_PRO);
  });

  it('config 스키마 기본값이 플래시 모델이어야 함', () => {
    const parsed = GoogleAIConfigSchema.parse({ apiKey: 'x' });
    expect(parsed.model).toBe(GoogleModelEnum.GEMINI_1_5_FLASH);
  });

  it('매니페스트 모델 목록이 GOOGLE_MODELS와 일치해야 함', () => {
    expect(GOOGLE_MANIFEST.models).toEqual(GOOGLE_MODELS);
  });
});
