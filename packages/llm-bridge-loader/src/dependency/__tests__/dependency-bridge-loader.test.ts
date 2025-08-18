import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { DependencyBridgeLoader } from '../dependency-bridge.loader';

const MOCK_PACKAGE = 'mock-llm-bridge';
const MOCK_MODULE_DIR = path.join(__dirname, '../../../node_modules', MOCK_PACKAGE);
const BAD_PACKAGE = 'bad-llm-bridge';
const BAD_MODULE_DIR = path.join(__dirname, '../../../node_modules', BAD_PACKAGE);

beforeAll(async () => {
  await fs.mkdir(MOCK_MODULE_DIR, { recursive: true });
  await fs.writeFile(
    path.join(MOCK_MODULE_DIR, 'package.json'),
    JSON.stringify({ name: MOCK_PACKAGE, main: 'index.js' }, null, 2),
  );
  await fs.writeFile(
    path.join(MOCK_MODULE_DIR, 'index.js'),
    `class MockBridge {
  static manifest() {
    return { name: 'mock-bridge', configSchema: { parse: (v) => v }, models: [] };
  }
}
module.exports = MockBridge;
`,
  );

  await fs.mkdir(BAD_MODULE_DIR, { recursive: true });
  await fs.writeFile(
    path.join(BAD_MODULE_DIR, 'package.json'),
    JSON.stringify({ name: BAD_PACKAGE, main: 'index.js' }, null, 2),
  );
  await fs.writeFile(path.join(BAD_MODULE_DIR, 'index.js'), 'module.exports = {};');
});

describe('DependencyLoader', () => {
  it('should load bridge manifest from dependency', async () => {
    const loader = new DependencyBridgeLoader();
    const result = await loader.load(MOCK_PACKAGE);

    expect(result.manifest.name).toBe('mock-bridge');
    expect(result.ctor).toBeDefined();
    expect(result.configSchema).toBeDefined();
  });

  it('should scan installed bridges from dependencies', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bridge-test-'));
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ dependencies: { [MOCK_PACKAGE]: '1.0.0' } }, null, 2),
    );
    const loader = new DependencyBridgeLoader();
    const results = await loader.scan({ cwd: tempDir, includeDev: false });
    const names = results.map((r) => r.manifest.name);
    expect(names).toContain('mock-bridge');
  });

  it('should throw when dependency loading fails', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bridge-test-'));
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ dependencies: { [BAD_PACKAGE]: '1.0.0' } }, null, 2),
    );
    const loader = new DependencyBridgeLoader();
    await expect(loader.scan({ cwd: tempDir, includeDev: false })).rejects.toThrow(BAD_PACKAGE);
  });
});
