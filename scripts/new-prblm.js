import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const rawName = args.find((a) => !a.startsWith('--'));
const useJs = args.includes('--js');

if (!rawName) {
  console.error('Usage: npm run new -- problem-name [--js]');
  process.exit(1);
}

function sanitize(name) {
  return name
    .replace(/ +/g, '_')
    .replace(/[^A-Za-z0-9._-]/g, '');
}

const name = sanitize(rawName);

if (!name) {
  console.error(`"${rawName}" contains no valid characters after sanitizing.`);
  process.exit(1);
}

if (name !== rawName) {
  console.log(`Note: name sanitized from "${rawName}" to "${name}"`);
}

const template = useJs ? 'prblm-templ-js' : 'prblm-templ-ts';
const dest = join('prblms', name);

if (existsSync(dest)) {
  console.error(`Folder already exists: ${dest}`);
  process.exit(1);
}

cpSync(join('templ', template), dest, { recursive: true });
console.log(`Created ${dest} (${useJs ? 'JS' : 'TS'})`);
