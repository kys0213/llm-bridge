const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');

async function ensureEsmPackageJson(targetDir) {
  const manifestPath = path.join(targetDir, 'package.json');
  const content = JSON.stringify({ type: 'module' }, null, 2) + '\n';

  await fs.writeFile(manifestPath, content, 'utf8');
}

function tryAppendExtension(filePath, specifier) {
  if (!specifier.startsWith('.')) {
    return specifier;
  }

  const [base, suffix] = (() => {
    const queryIndex = specifier.indexOf('?');
    const hashIndex = specifier.indexOf('#');
    let cutIndex = specifier.length;

    if (queryIndex !== -1) cutIndex = Math.min(cutIndex, queryIndex);
    if (hashIndex !== -1) cutIndex = Math.min(cutIndex, hashIndex);

    return [specifier.slice(0, cutIndex), specifier.slice(cutIndex)];
  })();

  if (base.endsWith('/')) {
    return specifier;
  }

  const knownSuffixes = new Set(['.js', '.cjs', '.mjs', '.json', '.node']);
  if (knownSuffixes.has(path.extname(base))) {
    return specifier;
  }

  const candidate = `${base}.js`;
  const resolvedCandidate = path.resolve(path.dirname(filePath), candidate);

  if (fsSync.existsSync(resolvedCandidate)) {
    return `${candidate}${suffix}`;
  }

  return specifier;
}

function rewriteRelativeSpecifiers(filePath, source) {
  const fromPattern = /(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g;
  const importPattern = /(import\(\s*['"])(\.{1,2}\/[^'"]+)(['"]\s*\))/g;

  const replaceWithExtension = (_, prefix, specifier, suffix) => {
    const nextSpecifier = tryAppendExtension(filePath, specifier);
    return `${prefix}${nextSpecifier}${suffix}`;
  };

  let transformed = source.replace(fromPattern, replaceWithExtension);
  transformed = transformed.replace(importPattern, replaceWithExtension);

  return transformed;
}

async function fixEsmImports(targetDir) {
  const stack = [targetDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith('.js')) {
        continue;
      }

      const original = await fs.readFile(fullPath, 'utf8');
      const updated = rewriteRelativeSpecifiers(fullPath, original);

      if (updated !== original) {
        await fs.writeFile(fullPath, updated, 'utf8');
      }
    }
  }
}

async function postbuild(rootDir = process.cwd()) {
  const esmDir = path.join(rootDir, 'esm');
  await fs.mkdir(esmDir, { recursive: true });
  await ensureEsmPackageJson(esmDir);
  await fixEsmImports(esmDir);
}

postbuild().catch(err => {
  console.error('[postbuild-esm] Failed to finalize ESM output');
  console.error(err);
  process.exitCode = 1;
});
