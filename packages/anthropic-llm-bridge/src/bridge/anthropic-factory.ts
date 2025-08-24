import Anthropic from '@anthropic-ai/sdk';
import { AnthropicBridge } from './anthropic-bridge';
import { AnthropicConfig, AnthropicConfigSchema } from './anthropic-config';
import { AnthropicModelEnum } from './anthropic-models';

/**
 * Anthropic 브릿지 생성 함수
 */
export function createAnthropicBridge(config: AnthropicConfig): AnthropicBridge {
  const validatedConfig = AnthropicConfigSchema.parse(config);
  
  const clientConfig: ConstructorParameters<typeof Anthropic>[0] = {
    apiKey: validatedConfig.apiKey,
    baseURL: validatedConfig.baseURL,
    timeout: validatedConfig.timeout,
    maxRetries: validatedConfig.maxRetries,
  };

  const client = new Anthropic(clientConfig);
  return new AnthropicBridge(client, validatedConfig);
}

/**
 * Claude Opus 4.1 브릿지 생성 (최고 성능)
 */
export function createClaudeOpusBridge(
  config: Omit<AnthropicConfig, 'model'> & { model?: string }
): AnthropicBridge {
  return createAnthropicBridge({
    ...config,
    model: AnthropicModelEnum.CLAUDE_OPUS_4_1,
  });
}

/**
 * Claude Sonnet 4 브릿지 생성 (균형잡힌 성능)
 */
export function createClaudeSonnetBridge(
  config: Omit<AnthropicConfig, 'model'> & { model?: string }
): AnthropicBridge {
  return createAnthropicBridge({
    ...config,
    model: AnthropicModelEnum.CLAUDE_SONNET_4,
  });
}

/**
 * Claude Haiku 3.5 브릿지 생성 (빠르고 경량)
 */
export function createClaudeHaikuBridge(
  config: Omit<AnthropicConfig, 'model'> & { model?: string }
): AnthropicBridge {
  return createAnthropicBridge({
    ...config,
    model: AnthropicModelEnum.CLAUDE_HAIKU_3_5,
  });
}

/**
 * 기본 Anthropic 브릿지 생성 (Sonnet 4 기본값)
 */
export function createDefaultAnthropicBridge(
  config: Omit<AnthropicConfig, 'model'> & { model?: string }
): AnthropicBridge {
  return createAnthropicBridge({
    temperature: 0.7,
    maxTokens: 8192,
    ...config,
    model: config.model ?? AnthropicModelEnum.CLAUDE_SONNET_4,
  });
}