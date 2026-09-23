import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// OpenNext embeds .env files into its Worker. Build without runtime secrets;
// production credentials are supplied exclusively by Cloudflare bindings.
export function buildEnvironment(env) {
  const result = { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' };
  for (const name of ['PATH', 'HOME', 'TMPDIR', 'SystemRoot']) {
    if (env[name]) result[name] = env[name];
  }
  return result;
}

export function prepareBuild(source, stage) {
  const entries = ['src', 'public', 'scripts', 'package.json', 'package-lock.json',
    'next.config.mjs', 'open-next.config.ts', 'tsconfig.json', 'tailwind.config.ts',
    'postcss.config.mjs', '.eslintrc.json', 'wrangler.json', 'next-env.d.ts'];
  for (const entry of entries.filter(entry => fs.existsSync(path.join(source, entry)))) {
    fs.cpSync(path.join(source, entry), path.join(stage, entry), {
      recursive: true,
      filter: file => {
        const name = path.basename(file);
        return !fs.lstatSync(file).isSymbolicLink() &&
          !/^(?:\.env(?:\.|$)|\.dev\.vars(?:\.|$)|\.wrangler$|\.npmrc$|\.secrets$)/.test(name) &&
          !/\.(?:pem|key|p12|pfx|log)$/.test(name);
      },
    });
  }
  fs.symlinkSync(path.join(source, 'node_modules'), path.join(stage, 'node_modules'), 'dir');
}

export function verifyBuild(output) {
  const env = fs.readFileSync(path.join(output, 'env/next-env.mjs'), 'utf8');
  const expected = ['production', 'development', 'test'].map(mode => `export const ${mode} = {};`).join('\n');
  if (env.trim() !== expected) throw new Error('Build rejected: embedded environment is not empty.');
}

export function buildWorker(source = process.cwd()) {
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-secure-build-'));
  fs.chmodSync(stage, 0o700);
  try {
    prepareBuild(source, stage);
    const result = spawnSync(path.join(stage, 'node_modules/.bin/opennextjs-cloudflare'), [], {
      cwd: stage, env: buildEnvironment(process.env), stdio: 'inherit',
    });
    if (result.error || result.status !== 0) throw new Error('Worker build failed; deployment blocked.');
    const output = path.join(stage, '.open-next');
    verifyBuild(output);
    // Replace only generated output, after successful validation.
    fs.rmSync(path.join(source, '.open-next'), { recursive: true, force: true });
    fs.cpSync(output, path.join(source, '.open-next'), { recursive: true });
    fs.chmodSync(path.join(source, '.open-next'), 0o700);
    // OpenNext records absolute build paths in manifests; point them at the
    // copied output so the temporary staging directory can be removed safely.
    const copied = path.join(source, '.open-next');
    for (const file of fs.readdirSync(copied, { recursive: true })) {
      const target = path.join(copied, file);
      if (!fs.statSync(target).isFile() || !/\.(?:mjs|cjs|json)$/.test(target)) continue;
      const content = fs.readFileSync(target, 'utf8').replaceAll(stage, source);
      fs.writeFileSync(target, content);
    }
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildWorker();
}
