import {
  ConfigurationError,
  APIError,
  RateLimitError,
  InvalidRequestError,
  ServiceUnavailableError,
  NetworkError,
  AuthenticationError,
  ModelNotSupportedError,
  ResponseParsingError,
  TimeoutError,
} from 'llm-bridge-spec';
import { ZodError } from 'zod';
import { ALL_SUPPORTED_MODELS } from '../models/index';

// Type guards for error handling
function hasCause(error: unknown): error is { cause: unknown } {
  return typeof error === 'object' && error !== null && 'cause' in error;
}

function hasErrorCode(obj: unknown): obj is { code: string } {
  return typeof obj === 'object' && obj !== null && 'code' in obj && typeof obj.code === 'string';
}

function isFetchError(error: unknown): error is TypeError & { message: string; name: string } {
  return error instanceof TypeError && error.name === 'TypeError' && 'message' in error;
}

function isAbortError(error: Error): error is Error & { name: 'AbortError' } {
  return error.name === 'AbortError';
}

function isSyntaxError(error: Error): error is SyntaxError {
  return error instanceof SyntaxError;
}

/**
 * Ollama API 에러를 llm-bridge-spec 에러로 변환
 */
export function handleOllamaError(error: unknown): never {
  // TypeError: fetch failed (네트워크 에러)
  if (isFetchError(error)) {
    const errorMessage = error.message || 'Unknown error occurred';

    if (hasCause(error) && hasErrorCode(error.cause)) {
      if (error.cause.code === 'ECONNREFUSED') {
        throw new ServiceUnavailableError(
          'Ollama server is not running or not accessible. Please check if Ollama is running on the specified host.',
          60,
          error
        );
      }
      if (error.cause.code === 'ETIMEDOUT' || error.cause.code === 'ECONNRESET') {
        throw new NetworkError(`Network timeout during Ollama API call: ${errorMessage}`, error);
      }
    }
    throw new NetworkError(`Network error during Ollama API call: ${errorMessage}`, error);
  }

  // AbortError (타임아웃)
  if (error instanceof Error && isAbortError(error)) {
    throw new TimeoutError(30000, error);
  }

  // JSON 파싱 에러
  if (error instanceof Error && isSyntaxError(error)) {
    throw new ResponseParsingError('Failed to parse Ollama API response', undefined, error);
  }

  // 일반 Error 객체
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // HTTP 상태 코드 기반 에러 처리
    if (errorMessage.includes('404') || errorMessage.includes('model not found')) {
      throw new ModelNotSupportedError('unknown', [...ALL_SUPPORTED_MODELS], error);
    }

    if (errorMessage.includes('400') || errorMessage.includes('bad request')) {
      throw new InvalidRequestError('Invalid request to Ollama API', undefined, error);
    }

    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      throw new AuthenticationError('Authentication failed for Ollama API', error);
    }

    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      throw new RateLimitError(
        'Rate limit exceeded for Ollama API',
        undefined,
        undefined,
        undefined,
        undefined,
        error
      );
    }

    if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
      throw new ServiceUnavailableError('Ollama server internal error', 30, error);
    }

    if (errorMessage.includes('503') || errorMessage.includes('service unavailable')) {
      throw new ServiceUnavailableError('Ollama service temporarily unavailable', 60, error);
    }

    // 기본 API 에러
    throw new APIError(`Ollama API error: ${error.message}`, undefined, undefined, error);
  }

  // 알 수 없는 에러
  throw new APIError(
    `Unknown Ollama error: ${String(error)}`,
    undefined,
    undefined,
    new Error(String(error))
  );
}

/**
 * 팩토리 함수에서 발생하는 에러 처리
 */
export function handleFactoryError(error: unknown): never {
  if (error instanceof ZodError) {
    const fieldErrors = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
    throw new ConfigurationError(
      `Configuration validation failed: ${fieldErrors.join(', ')}`,
      error
    );
  }

  // ModelNotSupportedError는 직접 re-throw (래핑하지 않음)
  if (error instanceof ModelNotSupportedError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new ConfigurationError(`Factory error: ${error.message}`, error);
  }

  throw new ConfigurationError(`Unknown factory error: ${String(error)}`, new Error(String(error)));
}

/**
 * 모델 검증
 */
export function validateModel(modelId: string): void {
  const supportedModels = [...ALL_SUPPORTED_MODELS];

  if (!supportedModels.some(model => modelId.startsWith(model.split(':')[0]))) {
    throw new ModelNotSupportedError(modelId, supportedModels);
  }
}
