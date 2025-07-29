import {
  ImageContent,
  FileContent,
  MultiModalContent,
  VideoContent,
  AudioContent,
  StringContent,
} from './types';

export class MultiModalContentHelper {
  static isStringContent(content: MultiModalContent): content is StringContent {
    return content.contentType === 'text';
  }

  static isImageContent(content: MultiModalContent): content is ImageContent {
    return content.contentType === 'image';
  }

  static isAudioContent(content: MultiModalContent): content is AudioContent {
    return content.contentType === 'audio';
  }

  static isVideoContent(content: MultiModalContent): content is VideoContent {
    return content.contentType === 'video';
  }

  static isFileContent(content: MultiModalContent): content is FileContent {
    return content.contentType === 'file';
  }
}
