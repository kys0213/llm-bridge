declare module 'undici' {
  export const ProxyAgent: new (url: string) => unknown;
  export function setGlobalDispatcher(agent: unknown): void;
}

