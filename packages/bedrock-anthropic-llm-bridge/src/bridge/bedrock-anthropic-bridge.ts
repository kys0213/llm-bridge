import {
  LlmBridge,
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmMetadata,
  StringContent,
  Message,
  ToolMessage,
  MultiModalContent,
} from 'llm-bridge-spec';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Agent } from 'http';

export interface BedrockAnthropicConfig {
  region?: string;
  modelId?: string;
  httpAgent?: Agent;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export class BedrockAnthropicBridge implements LlmBridge {
  private client: BedrockRuntimeClient;
  private modelId: string;
  private config: BedrockAnthropicConfig;

  constructor(config?: BedrockAnthropicConfig) {
    this.config = config ?? {};
    const region = this.config.region ?? 'us-east-1';
    const clientInit: Record<string, unknown> = { region };
    if (this.config.httpAgent) {
      clientInit['requestHandler'] = new NodeHttpHandler({
        httpAgent: this.config.httpAgent,
      });
    }
    this.client = new BedrockRuntimeClient(clientInit);
    this.modelId =
      this.config.modelId ?? 'anthropic.claude-3-haiku-20240307-v1:0';
  }

  async invoke(
    prompt: LlmBridgePrompt,
    option?: InvokeOption,
  ): Promise<LlmBridgeResponse> {
    const messages = prompt.messages.map(m => this.toAnthropicMessage(m));

    const body = {
      messages,
      temperature: option?.temperature ?? this.config.temperature,
      top_p: option?.topP ?? this.config.topP,
      top_k: option?.topK ?? this.config.topK,
      max_tokens: option?.maxTokens ?? this.config.maxTokens,
      stop_sequences: option?.stopSequence ?? this.config.stopSequences,
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const response = await this.client.send(command);
    const bodyBytes = response.body as Uint8Array;
    const text = new TextDecoder().decode(bodyBytes);
    const data = JSON.parse(text);

    const content: StringContent = {
      contentType: 'text',
      value:
        data.content ??
        data.completion ??
        data.result ??
        data.output ??
        '',
    };

    const usage = data.usage
      ? {
          promptTokens: data.usage.input_tokens ?? 0,
          completionTokens: data.usage.output_tokens ?? 0,
          totalTokens:
            (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
        }
      : undefined;

    return { content, usage };
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: 'Anthropic Claude',
      version: '3',
      description: 'Amazon Bedrock Anthropic LLM Bridge',
      model: this.modelId,
      contextWindow: 200000,
      maxTokens: 4096,
    };
  }

  private toAnthropicMessage(message: Message): { role: string; content: string } {
    if (message.role === 'tool') {
      const tool = message as ToolMessage;
      const texts = tool.content
        .filter((c): c is StringContent => this.isStringContent(c))
        .map(c => c.value);
      return { role: tool.role, content: texts.join('\n') };
    }

    if (this.isStringContent(message.content)) {
      return { role: message.role, content: message.content.value };
    }

    return { role: message.role, content: '' };
  }

  private isStringContent(content: MultiModalContent): content is StringContent {
    return (content as StringContent).contentType === 'text';
  }
}
