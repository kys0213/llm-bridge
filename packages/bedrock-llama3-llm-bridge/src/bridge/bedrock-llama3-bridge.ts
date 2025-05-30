import {
  LlmBridge,
  LlmBridgePrompt,
  InvokeOption,
  LlmBridgeResponse,
  LlmMetadata,
  StringContent,
  ToolCall as BridgeToolCall,
  ImageContent,
} from 'llm-bridge-spec';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
  ResponseStream,
} from '@aws-sdk/client-bedrock-runtime';

export class BedrockLlama3Bridge implements LlmBridge {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor(region: string = 'us-east-1', modelId: string = 'meta.llama3-70b-instruct-v1:0') {
    this.client = new BedrockRuntimeClient({ region });
    this.modelId = modelId;
  }

  async invoke(prompt: LlmBridgePrompt, option?: InvokeOption): Promise<LlmBridgeResponse> {
    const body = this.buildBody(prompt, option);
    const command = new InvokeModelCommand({ modelId: this.modelId, body: JSON.stringify(body) });
    const response = await this.client.send(command);
    const payload = JSON.parse(new TextDecoder().decode(response.body));
    return this.toLlmBridgeResponse(payload);
  }

  async *invokeStream(prompt: LlmBridgePrompt, option?: InvokeOption): AsyncIterable<LlmBridgeResponse> {
    const body = this.buildBody(prompt, option);
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: this.modelId,
      body: JSON.stringify(body),
    });
    const response = await this.client.send(command);
    for await (const chunk of response.body as AsyncIterable<ResponseStream>) {
      if ('chunk' in chunk && chunk.chunk?.bytes) {
        const payload = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
        yield this.toLlmBridgeResponse(payload);
      }
    }
  }

  async getMetadata(): Promise<LlmMetadata> {
    return {
      name: 'Bedrock Llama3',
      version: '1',
      description: 'Amazon Bedrock Llama3 Bridge',
      model: this.modelId,
      contextWindow: 8192,
      maxTokens: 4096,
    };
  }

  private buildBody(prompt: LlmBridgePrompt, option?: InvokeOption) {
    const messages = this.toMessages(prompt);
    return {
      messages,
      temperature: option?.temperature,
      top_p: option?.topP,
      max_tokens: option?.maxTokens,
      stop_sequences: option?.stopSequence,
    };
  }

  private toMessages(prompt: LlmBridgePrompt) {
    return prompt.messages.map(m => {
      if (m.role === 'tool') {
        const images = (m.content as ImageContent[]).filter(c => c.contentType === 'image');
        return {
          role: m.role,
          content: (m.content as any[]).filter(c => c.contentType === 'text').map(c => c.value).join('\n'),
          images: images.map(i => i.value) as Buffer[],
        };
      }
      return {
        role: m.role,
        content: m.content.contentType === 'text' ? m.content.value : '',
      };
    });
  }

  private toLlmBridgeResponse(res: any): LlmBridgeResponse {
    const content: StringContent = { contentType: 'text', value: res.generation ?? res.output ?? '' };
    const toolCalls: BridgeToolCall[] = [];
    return { content, toolCalls, usage: undefined };
  }
}
