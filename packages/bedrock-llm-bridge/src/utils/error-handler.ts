import { BedrockRuntimeServiceException } from '@aws-sdk/client-bedrock-runtime';
import {
  LlmBridgeError,
  RateLimitError,
  AuthenticationError,
  ServiceUnavailableError,
  InvalidRequestError,
  ModelNotSupportedError,
  NetworkError,
  TimeoutError,
  ResponseParsingError,
  ConfigurationError,
} from 'llm-bridge-spec';
import { isNativeError } from 'util/types';
import { z, ZodError } from 'zod';

/**
 * AWS Bedrock 에러를 적절한 브릿지 에러로 변환합니다.
 */
export function handleBedrockError(error: unknown, modelId: string, serviceName: string): never {
  // 이미 브릿지 에러인 경우 그대로 전파
  if (error instanceof LlmBridgeError) {
    throw error;
  }

  if (!isNativeError(error) || !(error instanceof BedrockRuntimeServiceException)) {
    throw new LlmBridgeError('Unknown error occurred');
  }

  const errorName = error.name || error.constructor?.name || '';
  const errorMessage = error.message || 'Unknown error occurred';

  // AWS SDK 에러 타입별 매핑
  switch (errorName) {
    case 'ThrottlingException': {
      // Rate limit 에러
      const metadata = error.$metadata || {};
      const retryAfter = metadata.totalRetryDelay || 60;
      throw new RateLimitError(
        `${serviceName} API rate limit exceeded`,
        retryAfter,
        undefined,
        undefined,
        undefined,
        error
      );
    }

    case 'UnauthorizedException':
    case 'AccessDeniedException': {
      // 인증 에러
      throw new AuthenticationError(
        `AWS credentials invalid or access denied for ${serviceName}`,
        error
      );
    }

    case 'ServiceUnavailableException':
    case 'InternalServerException': {
      // 서비스 이용 불가
      const metadata = error.$metadata || {};
      const retryAfterService = metadata.totalRetryDelay;
      throw new ServiceUnavailableError(
        `${serviceName} service temporarily unavailable`,
        retryAfterService,
        error
      );
    }

    case 'ValidationException':
    case 'InvalidRequestException': {
      // 잘못된 요청
      throw new InvalidRequestError(
        `Invalid request to ${serviceName}: ${errorMessage}`,
        undefined,
        error
      );
    }

    case 'ModelNotFoundError':
    case 'ModelTimeoutException':
    case 'ModelNotAvailableException': {
      // 모델 관련 에러
      const supportedModels = getSupportedModels(serviceName);
      throw new ModelNotSupportedError(modelId, supportedModels, error);
    }

    case 'TimeoutError':
    case 'AbortError': {
      // 타임아웃 에러

      throw new TimeoutError(undefined, error);
    }

    default: {
      // 네트워크 관련 에러 체크
      if (isNetworkError(error)) {
        throw new NetworkError(
          `Network error during ${serviceName} API call: ${errorMessage}`,
          error
        );
      }

      // 기타 에러
      throw new LlmBridgeError(`${serviceName} API error: ${errorMessage}`, error);
    }
  }
}

/**
 * 네트워크 관련 에러인지 확인합니다.
 */
export function isNetworkError(error: unknown): boolean {
  if (!isNativeError(error)) {
    return false;
  }

  const networkErrorCodes = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ENETUNREACH',
    'EHOSTUNREACH',
    'EPIPE',
    'EAI_AGAIN',
  ];

  const networkErrorNames = [
    'NetworkError',
    'FetchError',
    'RequestTimeout',
    'ConnectTimeoutError',
    'SocketError',
  ];

  return (
    (hasCode(error) && networkErrorCodes.includes(error.code)) ||
    (hasName(error) && networkErrorNames.includes(error.name)) ||
    (hasMessage(error) && error.message.toLowerCase().includes('network'))
  );
}

/**
 * JSON 파싱 에러를 ResponseParsingError로 변환합니다.
 */
export function handleParsingError(
  parseError: unknown,
  responseText: string,
  serviceName: string
): never {
  throw new ResponseParsingError(
    `Failed to parse ${serviceName} response as JSON`,
    { responseText },
    parseError as Error
  );
}

/**
 * Zod 에러를 ConfigurationError로 변환합니다.
 */
export function handleConfigurationError(error: unknown, serviceName: string): never {
  const parseErrorMessage = parseZodError(error);
  throw new ConfigurationError(`Invalid ${serviceName} configuration: ${parseErrorMessage}`);
}

/**
 * 팩토리 생성 에러를 ConfigurationError로 변환합니다.
 */
export function handleFactoryError(error: unknown, serviceName: string): never {
  if (isNativeError(error)) {
    throw new ConfigurationError(`Failed to create ${serviceName} bridge: ${error.message}`, error);
  }

  throw new ConfigurationError(`Failed to create ${serviceName} bridge: unknown error`);
}

// Private helper functions

function getSupportedModels(serviceName: string): string[] {
  switch (serviceName) {
    case 'Bedrock Anthropic':
      return ['anthropic.claude-*'];
    case 'Bedrock':
      return ['anthropic.claude-*', 'meta.llama*'];
    default:
      return [];
  }
}

function parseZodError(error: unknown): string {
  if (!(error instanceof ZodError)) {
    return 'Invalid configuration format';
  }

  const errorTree = z.treeifyError(error);
  return errorTree.errors.join('\n');
}

// Type guard functions

function hasCode(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
  );
}

function hasName(error: unknown): error is { name: string } {
  return (
    typeof error === 'object' && error !== null && 'name' in error && typeof error.name === 'string'
  );
}

function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  );
}
