import {
  InvokeOption,
  LlmBridge,
  LlmBridgePrompt,
  LlmBridgeResponse,
  LlmMetadata,
  ModelNotSupportedError,
} from 'llm-bridge-spec';
import { ChatResponse, Ollama } from 'ollama';
import { AbstractOllamaModel, ALL_SUPPORTED_MODELS, createModelFromId } from '../models';
import { OllamaBaseConfig } from '../types/config';
import { handleOllamaError } from '../utils/error-handler';

export class OllamaBridge implements LlmBridge {
  private model: AbstractOllamaModel;

  constructor(
    private client: Ollama,
    private config: OllamaBaseConfig
  ) {
    const model: string = config.model;
    // 모델 자동 감지 및 초기화
    this.model = this.resolveModel(model);
  }

  /**
   * 모델 ID를 기반으로 적절한 모델 구현체를 찾아 반환
   */
  private resolveModel(modelId: string): AbstractOllamaModel {
    try {
      const model = createModelFromId(modelId);
      model.setConfig(this.config);
      return model;
    } catch (error) {
      throw new ModelNotSupportedError(modelId, [...ALL_SUPPORTED_MODELS], error as Error);
    }
  }

  /**
   * LLM 모델 호출 (일반)
   */
  async invoke(prompt: LlmBridgePrompt, options?: InvokeOption): Promise<LlmBridgeResponse> {
    try {
      // 모델별 요청 빌드
      const chatRequest = this.model.buildChatRequest(prompt, options);

      // Ollama API 호출
      const response: ChatResponse = await this.client.chat({
        ...chatRequest,
        stream: false,
      });

      // 모델별 응답 파싱
      return this.model.parseResponse(response);
    } catch (error) {
      handleOllamaError(error);
    }
  }

  /**
   * LLM 모델 호출 (스트리밍)
   */
  async *invokeStream(
    prompt: LlmBridgePrompt,
    options?: InvokeOption
  ): AsyncGenerator<LlmBridgeResponse, void, unknown> {
    try {
      // 스트리밍 요청 빌드
      const chatRequest = this.model.buildChatRequest(prompt, options);
      chatRequest.stream = true;

      // Ollama 스트리밍 API 호출
      const stream = await this.client.chat({
        ...chatRequest,
        stream: true,
      });

      for await (const chunk of stream) {
        // 각 청크를 모델별 파싱

        const response = this.model.parseResponse(chunk);
        yield response;
      }
    } catch (error) {
      handleOllamaError(error);
    }
  }

  /**
   * 메타데이터 반환
   */
  async getMetadata(): Promise<LlmMetadata> {
    return this.model.getMetadata();
  }

  /**
   * 지원 모델 목록 반환
   */
  getSupportedModels(): string[] {
    return [...ALL_SUPPORTED_MODELS];
  }

  /**
   * 현재 모델 변경
   */
  setModel(modelId: string): void {
    this.model = this.resolveModel(modelId);
    this.config.model = modelId;
  }

  /**
   * 현재 모델 ID 반환
   */
  getCurrentModel(): string {
    return this.model.getModelId();
  }

  /**
   * 모델 기본 설정 반환
   */
  getDefaultConfig(): Partial<OllamaBaseConfig> {
    return this.model.getDefaultConfig();
  }
}
