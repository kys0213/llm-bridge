import { describe, it, expect } from 'vitest';
import { GoogleAIConfigSchema } from '../bridge/google-config';
import { GoogleModelEnum, GOOGLE_MODELS, getModelMetadata } from '../bridge/google-models';
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

  it('모델 메타데이터가 컨텍스트, 토큰 한도, 가격 정보를 포함해야 함', () => {
    const flash = getModelMetadata(GoogleModelEnum.GEMINI_1_5_FLASH);
    expect(flash.contextWindowTokens).toBe(1_000_000);
    expect(flash.maxOutputTokens).toBe(8_192);
    expect(flash.pricing).toEqual({
      unit: 1_000_000,
      currency: 'USD',
      prompt: 0.35,
      completion: 1.05,
    });

    const pro = getModelMetadata(GoogleModelEnum.GEMINI_1_5_PRO);
    expect(pro.pricing.prompt).toBeGreaterThan(flash.pricing.prompt);
  });
});
