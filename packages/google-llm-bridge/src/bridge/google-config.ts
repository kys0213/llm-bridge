import { z } from 'zod';
import { GoogleModelEnum } from './google-models';

/**
 * Google Gemini 브릿지 설정 Zod 스키마
 */
export const GoogleAIConfigSchema = z.object({
  apiKey: z.string().describe('Google Generative AI API key'),
  model: z
    .nativeEnum(GoogleModelEnum)
    .default(GoogleModelEnum.GEMINI_1_5_FLASH)
    .describe('Gemini model name'),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().min(0).optional(),
  maxOutputTokens: z.number().min(1).optional(),
  stopSequences: z.array(z.string()).optional(),
  candidateCount: z.number().int().min(1).max(8).optional(),
  responseMimeType: z.string().optional(),
  responseSchema: z.record(z.string(), z.unknown()).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  safetySettings: z
    .array(
      z.object({
        category: z.string(),
        threshold: z.string(),
      })
    )
    .optional(),
});

export type GoogleAIConfig = z.infer<typeof GoogleAIConfigSchema>;
