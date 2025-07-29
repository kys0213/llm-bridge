import { AssistantMessage, Message, SystemMessage, ToolMessage, UserMessage } from './types';

export class MessageHelper {
  static isToolMessage(message: Message): message is ToolMessage {
    return message.role === 'tool';
  }

  static isUserMessage(message: Message): message is UserMessage {
    return message.role === 'user';
  }

  static isAssistantMessage(message: Message): message is AssistantMessage {
    return message.role === 'assistant';
  }

  static isSystemMessage(message: Message): message is SystemMessage {
    return message.role === 'system';
  }
}
