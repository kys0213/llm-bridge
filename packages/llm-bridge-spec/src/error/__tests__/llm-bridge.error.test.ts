import { describe, it, expect } from 'vitest';
import {
  LlmBridgeError,
  ConfigurationError,
  APIError,
  RateLimitError,
  QuotaExceededError,
  InvalidRequestError,
  InsufficientCreditsError,
  ServiceUnavailableError,
  NetworkError,
  AuthenticationError,
  ModelNotSupportedError,
  ResponseParsingError,
  TimeoutError,
} from '../llm-bridge.error';

describe('LlmBridgeError', () => {
  it('기본 에러 클래스가 올바르게 생성되어야 함', () => {
    const error = new LlmBridgeError('Test error');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('LlmBridgeError');
    expect(error.message).toBe('Test error');
    expect(error.cause).toBeUndefined();
  });

  it('원인 에러를 포함하여 생성할 수 있어야 함', () => {
    const cause = new Error('Original error');
    const error = new LlmBridgeError('Test error', cause);

    expect(error.cause).toBe(cause);
  });
});

describe('ConfigurationError', () => {
  it('설정 에러가 올바르게 생성되어야 함', () => {
    const error = new ConfigurationError('Invalid configuration');

    expect(error).toBeInstanceOf(LlmBridgeError);
    expect(error.name).toBe('ConfigurationError');
    expect(error.message).toBe('Invalid configuration');
  });
});

describe('APIError', () => {
  it('API 에러가 올바르게 생성되어야 함', () => {
    const error = new APIError('API call failed', 429, 'rate_limit_exceeded');

    expect(error).toBeInstanceOf(LlmBridgeError);
    expect(error.name).toBe('APIError');
    expect(error.message).toBe('API call failed');
    expect(error.statusCode).toBe(429);
    expect(error.apiErrorCode).toBe('rate_limit_exceeded');
  });

  it('상태 코드와 API 에러 코드 없이도 생성할 수 있어야 함', () => {
    const error = new APIError('API call failed');

    expect(error.statusCode).toBeUndefined();
    expect(error.apiErrorCode).toBeUndefined();
  });
});

describe('RateLimitError', () => {
  it('Rate limit 에러가 올바르게 생성되어야 함', () => {
    const resetTime = new Date('2024-01-01T12:00:00Z');
    const error = new RateLimitError('Too many requests', 60, 100, 0, resetTime);

    expect(error).toBeInstanceOf(APIError);
    expect(error.name).toBe('RateLimitError');
    expect(error.message).toBe('Too many requests');
    expect(error.statusCode).toBe(429);
    expect(error.apiErrorCode).toBe('rate_limit_exceeded');
    expect(error.retryAfter).toBe(60);
    expect(error.limit).toBe(100);
    expect(error.remaining).toBe(0);
    expect(error.resetTime).toBe(resetTime);
  });

  it('기본 메시지로 생성할 수 있어야 함', () => {
    const error = new RateLimitError();

    expect(error.message).toBe('Rate limit exceeded');
  });
});

describe('QuotaExceededError', () => {
  it('Quota 초과 에러가 올바르게 생성되어야 함', () => {
    const resetTime = new Date('2024-02-01T00:00:00Z');
    const error = new QuotaExceededError(
      'Monthly quota exceeded',
      'monthly',
      1000,
      1000,
      resetTime
    );

    expect(error).toBeInstanceOf(APIError);
    expect(error.name).toBe('QuotaExceededError');
    expect(error.message).toBe('Monthly quota exceeded');
    expect(error.statusCode).toBe(429);
    expect(error.apiErrorCode).toBe('quota_exceeded');
    expect(error.quotaType).toBe('monthly');
    expect(error.usedQuota).toBe(1000);
    expect(error.totalQuota).toBe(1000);
    expect(error.resetTime).toBe(resetTime);
  });

  it('기본 메시지로 생성할 수 있어야 함', () => {
    const error = new QuotaExceededError();

    expect(error.message).toBe('Quota exceeded');
  });
});

describe('InvalidRequestError', () => {
  it('유효하지 않은 요청 에러가 올바르게 생성되어야 함', () => {
    const error = new InvalidRequestError('Missing required fields', ['name', 'email']);

    expect(error).toBeInstanceOf(APIError);
    expect(error.name).toBe('InvalidRequestError');
    expect(error.message).toBe('Missing required fields');
    expect(error.statusCode).toBe(400);
    expect(error.apiErrorCode).toBe('invalid_request');
    expect(error.invalidFields).toEqual(['name', 'email']);
  });

  it('유효하지 않은 필드 목록 없이도 생성할 수 있어야 함', () => {
    const error = new InvalidRequestError('Invalid request format');

    expect(error.invalidFields).toBeUndefined();
  });
});

describe('InsufficientCreditsError', () => {
  it('크레딧 부족 에러가 올바르게 생성되어야 함', () => {
    const error = new InsufficientCreditsError('Not enough credits', 10, 50);

    expect(error).toBeInstanceOf(APIError);
    expect(error.name).toBe('InsufficientCreditsError');
    expect(error.message).toBe('Not enough credits');
    expect(error.statusCode).toBe(402);
    expect(error.apiErrorCode).toBe('insufficient_credits');
    expect(error.currentCredits).toBe(10);
    expect(error.requiredCredits).toBe(50);
  });

  it('기본 메시지로 생성할 수 있어야 함', () => {
    const error = new InsufficientCreditsError();

    expect(error.message).toBe('Insufficient credits');
  });
});

describe('ServiceUnavailableError', () => {
  it('서비스 이용 불가 에러가 올바르게 생성되어야 함', () => {
    const error = new ServiceUnavailableError('Server maintenance', 3600);

    expect(error).toBeInstanceOf(APIError);
    expect(error.name).toBe('ServiceUnavailableError');
    expect(error.message).toBe('Server maintenance');
    expect(error.statusCode).toBe(503);
    expect(error.apiErrorCode).toBe('service_unavailable');
    expect(error.retryAfter).toBe(3600);
  });

  it('기본 메시지로 생성할 수 있어야 함', () => {
    const error = new ServiceUnavailableError();

    expect(error.message).toBe('Service temporarily unavailable');
  });
});

describe('NetworkError', () => {
  it('네트워크 에러가 올바르게 생성되어야 함', () => {
    const error = new NetworkError('Connection failed');

    expect(error).toBeInstanceOf(LlmBridgeError);
    expect(error.name).toBe('NetworkError');
    expect(error.message).toBe('Connection failed');
  });
});

describe('AuthenticationError', () => {
  it('인증 에러가 올바르게 생성되어야 함', () => {
    const error = new AuthenticationError('Invalid API key');

    expect(error).toBeInstanceOf(LlmBridgeError);
    expect(error.name).toBe('AuthenticationError');
    expect(error.message).toBe('Invalid API key');
  });
});

describe('ModelNotSupportedError', () => {
  it('지원하지 않는 모델 에러가 올바르게 생성되어야 함', () => {
    const error = new ModelNotSupportedError('gpt-5', ['gpt-4', 'gpt-3.5-turbo']);

    expect(error).toBeInstanceOf(LlmBridgeError);
    expect(error.name).toBe('ModelNotSupportedError');
    expect(error.message).toBe(
      "Model 'gpt-5' is not supported. Supported models: gpt-4, gpt-3.5-turbo"
    );
    expect(error.requestedModel).toBe('gpt-5');
  });

  it('지원 모델 목록 없이도 생성할 수 있어야 함', () => {
    const error = new ModelNotSupportedError('invalid-model');

    expect(error.message).toBe("Model 'invalid-model' is not supported.");
    expect(error.requestedModel).toBe('invalid-model');
  });
});

describe('ResponseParsingError', () => {
  it('응답 파싱 에러가 올바르게 생성되어야 함', () => {
    const rawResponse = { invalid: 'response' };
    const error = new ResponseParsingError('Failed to parse response', rawResponse);

    expect(error).toBeInstanceOf(LlmBridgeError);
    expect(error.name).toBe('ResponseParsingError');
    expect(error.message).toBe('Failed to parse response');
    expect(error.rawResponse).toBe(rawResponse);
  });

  it('원본 응답 없이도 생성할 수 있어야 함', () => {
    const error = new ResponseParsingError('Failed to parse response');

    expect(error.rawResponse).toBeUndefined();
  });
});

describe('TimeoutError', () => {
  it('타임아웃 에러가 올바르게 생성되어야 함', () => {
    const error = new TimeoutError(5000);

    expect(error).toBeInstanceOf(LlmBridgeError);
    expect(error.name).toBe('TimeoutError');
    expect(error.message).toBe('Request timed out after 5000ms');
    expect(error.timeoutMs).toBe(5000);
  });
});
