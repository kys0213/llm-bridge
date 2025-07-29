export class LlmBridgeError extends Error {
  cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'LlmBridgeError';
    this.cause = cause;
  }
}

/**
 * 설정 검증 실패 시 발생하는 에러
 * Zod 스키마 검증 실패, 필수 설정 누락 등
 */
export class ConfigurationError extends LlmBridgeError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'ConfigurationError';
  }
}

/**
 * API 호출 실패 시 발생하는 에러
 * Rate limit, invalid request, API 서버 에러 등
 */
export class APIError extends LlmBridgeError {
  public readonly statusCode?: number;
  public readonly apiErrorCode?: string;

  constructor(message: string, statusCode?: number, apiErrorCode?: string, cause?: Error) {
    super(message, cause);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.apiErrorCode = apiErrorCode;
  }
}

/**
 * Rate limit 초과 시 발생하는 에러
 */
export class RateLimitError extends APIError {
  public readonly retryAfter?: number; // seconds
  public readonly limit?: number;
  public readonly remaining?: number;
  public readonly resetTime?: Date;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    limit?: number,
    remaining?: number,
    resetTime?: Date,
    cause?: Error
  ) {
    super(message, 429, 'rate_limit_exceeded', cause);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
    this.resetTime = resetTime;
  }
}

/**
 * Quota 또는 Credit 초과 시 발생하는 에러
 */
export class QuotaExceededError extends APIError {
  public readonly quotaType?: string; // 'monthly', 'daily', 'tokens', etc.
  public readonly usedQuota?: number;
  public readonly totalQuota?: number;
  public readonly resetTime?: Date;

  constructor(
    message: string = 'Quota exceeded',
    quotaType?: string,
    usedQuota?: number,
    totalQuota?: number,
    resetTime?: Date,
    cause?: Error
  ) {
    super(message, 429, 'quota_exceeded', cause);
    this.name = 'QuotaExceededError';
    this.quotaType = quotaType;
    this.usedQuota = usedQuota;
    this.totalQuota = totalQuota;
    this.resetTime = resetTime;
  }
}

/**
 * 잘못된 요청으로 인한 에러
 * 필수 파라미터 누락, 잘못된 형식 등
 */
export class InvalidRequestError extends APIError {
  public readonly invalidFields?: string[];

  constructor(message: string, invalidFields?: string[], cause?: Error) {
    super(message, 400, 'invalid_request', cause);
    this.name = 'InvalidRequestError';
    this.invalidFields = invalidFields;
  }
}

/**
 * 크레딧 부족 시 발생하는 에러
 */
export class InsufficientCreditsError extends APIError {
  public readonly currentCredits?: number;
  public readonly requiredCredits?: number;

  constructor(
    message: string = 'Insufficient credits',
    currentCredits?: number,
    requiredCredits?: number,
    cause?: Error
  ) {
    super(message, 402, 'insufficient_credits', cause);
    this.name = 'InsufficientCreditsError';
    this.currentCredits = currentCredits;
    this.requiredCredits = requiredCredits;
  }
}

/**
 * 서비스 이용 불가 시 발생하는 에러
 * 서버 점검, 일시적 장애 등
 */
export class ServiceUnavailableError extends APIError {
  public readonly retryAfter?: number; // seconds

  constructor(
    message: string = 'Service temporarily unavailable',
    retryAfter?: number,
    cause?: Error
  ) {
    super(message, 503, 'service_unavailable', cause);
    this.name = 'ServiceUnavailableError';
    this.retryAfter = retryAfter;
  }
}

/**
 * 네트워크 연결 문제로 발생하는 에러
 * 연결 타임아웃, DNS 실패, 네트워크 불가 등
 */
export class NetworkError extends LlmBridgeError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'NetworkError';
  }
}

/**
 * 인증 실패 시 발생하는 에러
 * API 키 누락, 유효하지 않은 자격증명 등
 */
export class AuthenticationError extends LlmBridgeError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'AuthenticationError';
  }
}

/**
 * 지원하지 않는 모델 요청 시 발생하는 에러
 */
export class ModelNotSupportedError extends LlmBridgeError {
  public readonly requestedModel: string;

  constructor(requestedModel: string, supportedModels?: string[], cause?: Error) {
    const supportedList = supportedModels?.length
      ? ` Supported models: ${supportedModels.join(', ')}`
      : '';
    super(`Model '${requestedModel}' is not supported.${supportedList}`, cause);
    this.name = 'ModelNotSupportedError';
    this.requestedModel = requestedModel;
  }
}

/**
 * 응답 파싱 실패 시 발생하는 에러
 * JSON 파싱 실패, 예상과 다른 응답 형식 등
 */
export class ResponseParsingError extends LlmBridgeError {
  public readonly rawResponse?: unknown;

  constructor(message: string, rawResponse?: unknown, cause?: Error) {
    super(message, cause);
    this.name = 'ResponseParsingError';
    this.rawResponse = rawResponse;
  }
}

/**
 * 요청 타임아웃 시 발생하는 에러
 */
export class TimeoutError extends LlmBridgeError {
  public readonly timeoutMs?: number;

  constructor(timeoutMs?: number, cause?: Error) {
    const message = timeoutMs ? `Request timed out after ${timeoutMs}ms` : 'Request timed out';
    super(message, cause);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}
