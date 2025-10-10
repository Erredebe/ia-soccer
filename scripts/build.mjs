import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const srcDir = path.join(rootDir, 'src');
const readmePath = path.join(rootDir, 'readme.md');

rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });

cpSync(srcDir, path.join(publicDir, 'src'), { recursive: true });

const packageJson = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const publicPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  type: packageJson.type,
  main: 'src/cli/index.js',
  scripts: {
    start: 'node src/cli/index.js'
  }
};

writeFileSync(
  path.join(publicDir, 'package.json'),
  JSON.stringify(publicPackageJson, null, 2) + '\n'
);

if (existsSync(readmePath)) {
  copyFileSync(readmePath, path.join(publicDir, 'README.md'));
}

console.log(`Build completed. Output available in ${publicDir}`);
