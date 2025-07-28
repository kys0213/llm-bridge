# Bridge Loader Specification

This document outlines the `BridgeLoader` interface used to load LLM bridges in various ways.

## BridgeLoader Interface

```typescript
import { LlmBridge, LlmManifest } from 'llm-bridge-spec';
import { z } from 'zod';

export interface BridgeLoadResult<M extends LlmManifest> {
  manifest: M;
  ctor: new (config: z.infer<M['configSchema']>) => LlmBridge;
  configSchema: M['configSchema'];
}

export interface BridgeLoader {
  /** Load and return an `LlmBridge` instance with typed config */
  load<M extends LlmManifest>(pkg: string): Promise<BridgeLoadResult<M>>;
}
```

Implementations may add additional behaviours such as directory watching or child process loading.

### File Watching Loader

Directory-based triggers should be handled inside the loader implementation.

```typescript
export interface FileWatchingLoader extends BridgeLoader {
  /** Start internal directory watch */
  start(): void;
  /** Stop watching */
  stop(): void;
}
```

### Child Process Loader

```typescript
export interface ChildProcessLoader extends BridgeLoader {
  /** Load bridge in a separate process */
  loadInChild(): Promise<LlmBridge>;
}
```

### Dependency Based Loading

A loader can also perform initialization when loaded as a dependency. This behaviour should be implemented inside the loader class without additional API surface.
