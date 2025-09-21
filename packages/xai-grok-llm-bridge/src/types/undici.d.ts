declare module 'undici' {
  export class ProxyAgent {
    constructor(url: string);
  }
  export function setGlobalDispatcher(dispatcher: unknown): void;
}
