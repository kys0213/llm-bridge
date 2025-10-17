const fs = require('node:fs/promises');
const path = require('node:path');

async function ensureEsmPackageJson(rootDir = process.cwd()) {
  const targetDir = path.join(rootDir, 'esm');
  const manifestPath = path.join(targetDir, 'package.json');
  const content = JSON.stringify({ type: 'module' }, null, 2) + '\n';

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(manifestPath, content, 'utf8');
}

ensureEsmPackageJson().catch(err => {
  console.error('[postbuild-esm] Failed to write esm/package.json');
  console.error(err);
  process.exitCode = 1;
});
