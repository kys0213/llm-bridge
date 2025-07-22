import { LlmBridge } from '../bridge/types';
import { LlmManifest } from '../manifest/types';

/**
 * 브릿지 패키지 구성 옵션
 */
export interface BridgePackageOptions<TBridge extends LlmBridge, TConfig = unknown> {
  /** 브릿지 클래스 */
  bridge: new (...args: any[]) => TBridge;
  /** 팩토리 함수 */
  factory: (config: TConfig) => TBridge;
  /** 매니페스트 */
  manifest: LlmManifest;
  /** 추가 exports (선택사항) */
  exports?: Record<string, any>;
}

/**
 * 확장된 브릿지 클래스 타입 (static 메서드 포함)
 */
export interface EnhancedBridgeClass<TBridge extends LlmBridge, TConfig = unknown> {
  new (...args: any[]): TBridge;
  /** 매니페스트 함수 */
  manifest(): LlmManifest;
  /** 팩토리 함수 */
  create(config: TConfig): TBridge;
  /** 추가 속성들 */
  [key: string]: any;
}

/**
 * 간단한 브릿지 패키지 생성 함수
 *
 * @param options - 브릿지 패키지 구성 옵션
 * @returns 확장된 브릿지 클래스 (static 메서드 포함)
 *
 * @example
 * ```typescript
 * // 이제 이렇게 간단하게!
 * export default SDK.createBridgePackage({
 *   bridge: OpenAIBridge,
 *   factory: createOpenAIBridge,
 *   manifest: OPENAI_MANIFEST,
 * });
 *
 * // 개별 export도 원한다면
 * export { OpenAIBridge, createOpenAIBridge } from './bridge/...';
 *
 * // 사용법:
 * import OpenAIBridge from 'openai-llm-bridge';
 * const bridge = OpenAIBridge.create({ apiKey: 'xxx' });
 * const info = OpenAIBridge.manifest();
 * ```
 */
export function createBridgePackage<TBridge extends LlmBridge, TConfig = unknown>(
  options: BridgePackageOptions<TBridge, TConfig>
): EnhancedBridgeClass<TBridge, TConfig> {
  const { bridge: BridgeClass, factory, manifest, exports: additionalExports = {} } = options;

  // 브릿지 클래스에 static 메서드들을 추가
  const EnhancedBridge = BridgeClass as any;

  // Static 메서드 추가
  EnhancedBridge.manifest = () => manifest;
  EnhancedBridge.create = factory;

  // 추가 exports를 static 속성으로 추가
  Object.assign(EnhancedBridge, additionalExports);

  return EnhancedBridge;
}

/**
 * 브릿지 패키지 빌더 (메서드 체이닝 방식)
 */
export class BridgePackageBuilder<TBridge extends LlmBridge, TConfig = unknown> {
  private options: Partial<BridgePackageOptions<TBridge, TConfig>> = {};

  constructor(bridge: new (...args: any[]) => TBridge) {
    this.options.bridge = bridge;
  }

  /**
   * 팩토리 함수 설정
   */
  withFactory(factory: (config: TConfig) => TBridge): this {
    this.options.factory = factory;
    return this;
  }

  /**
   * 매니페스트 설정
   */
  withManifest(manifest: LlmManifest): this {
    this.options.manifest = manifest;
    return this;
  }

  /**
   * 추가 exports 설정
   */
  withExports(exports: Record<string, any>): this {
    this.options.exports = { ...this.options.exports, ...exports };
    return this;
  }

  /**
   * 브릿지 패키지 빌드
   */
  build(): EnhancedBridgeClass<TBridge, TConfig> {
    if (!this.options.bridge || !this.options.factory || !this.options.manifest) {
      throw new Error('Bridge, factory, and manifest are required');
    }

    return createBridgePackage(this.options as BridgePackageOptions<TBridge, TConfig>);
  }
}

/**
 * 브릿지 패키지 빌더 생성 헬퍼
 */
export function bridgePackage<TBridge extends LlmBridge>(
  bridge: new (...args: any[]) => TBridge
): BridgePackageBuilder<TBridge> {
  return new BridgePackageBuilder(bridge);
}
