import { LlmManifest } from 'llm-bridge-spec';
import { OpenAIGpt4Bridge } from './bridge/openai-gpt4-bridge';
import { OPENAI_GPT4_MANIFEST } from './bridge/openai-gpt4-manifest';

export default OpenAIGpt4Bridge;

export function manifest(): LlmManifest {
  return OPENAI_GPT4_MANIFEST;
}
