// Validates every extensions/<id>/extension.json and writes index.json (with SHA-256 per file).
// The apps refuse a file whose checksum differs from index.json, so index.json is only ever built by CI.
//   node scripts/build-index.js          validate + write index.json
//   node scripts/build-index.js --check  validate only (pull requests)
// Rules must match CodePad-Windows/src/main/extensions.js (validate) and the iPad app's ExtensionManifest.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const LICENSES = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'MPL-2.0', 'GPL-2.0-only', 'GPL-3.0-only', 'GPL-3.0-or-later', 'LGPL-3.0-only', 'AGPL-3.0-only', 'Unlicense', 'CC0-1.0', '0BSD', 'Zlib']);
const TOKEN_KINDS = ['keyword', 'type', 'function', 'string', 'number', 'comment'];
const ALLOWED_TOP = new Set(['id', 'name', 'version', 'description', 'author', 'license', 'repository', 'kind', 'platforms', 'theme', 'language', 'snippets', 'tasks', 'plugin']);
const PERMISSIONS = ['workspace', 'terminal'];

// Task input values go onto the command line unquoted: harmless characters only, no leading "-".
const SAFE_VALUE = /^(?!-)[A-Za-z0-9_.:/@=,+-]*$/;

function snippetGroup(sn = {}, need, s) {
  need(s(sn.language, 40), 'snippets.language fehlt (z. B. "javascript")');
  need(Array.isArray(sn.items) && sn.items.length > 0 && sn.items.length <= 200, 'snippets.items: 1–200 Einträge');
  for (const it of sn.items || []) need(s(it.prefix, 40) && s(it.body, 4000) && (it.description === undefined || (typeof it.description === 'string' && it.description.length <= 200)), `Snippet „${it.prefix}“ ungültig`);
}

function check(e, folder) {
  const errors = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };
  const s = (v, max) => typeof v === 'string' && v.trim() && v.length <= max;
  const hex = v => typeof v === 'string' && /^#?[0-9a-fA-F]{6}$/.test(v);
  need(e && typeof e === 'object' && !Array.isArray(e), 'Datei ist kein JSON-Objekt');
  if (errors.length) return errors;
  for (const k of Object.keys(e)) need(ALLOWED_TOP.has(k), `unbekanntes Feld „${k}“`);
  need(s(e.id, 80) && /^[a-z0-9][a-z0-9-]{0,38}\.[a-z0-9][a-z0-9-]{0,38}$/.test(e.id), 'id muss „autor.name“ sein (a–z, 0–9, -)');
  need(e.id === folder, `id („${e.id}“) muss dem Ordnernamen („${folder}“) entsprechen`);
  need(s(e.name, 60), 'name fehlt (max. 60 Zeichen)');
  need(typeof e.version === 'string' && /^\d+\.\d+\.\d+$/.test(e.version), 'version muss x.y.z sein');
  need(e.description === undefined || (typeof e.description === 'string' && e.description.length <= 300), 'description max. 300 Zeichen');
  need(s(e.author, 60), 'author fehlt');
  need(LICENSES.has(e.license), `license muss eine Open-Source-Lizenz sein: ${[...LICENSES].join(', ')}`);
  need(e.repository === undefined || (typeof e.repository === 'string' && /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(e.repository)), 'repository muss https://github.com/<owner>/<repo> sein');
  need(e.platforms === undefined || (Array.isArray(e.platforms) && e.platforms.every(p => p === 'windows' || p === 'ipad')), 'platforms: "windows" und/oder "ipad"');
  if (e.kind === 'theme') {
    const t = e.theme || {};
    need(typeof t.dark === 'boolean', 'theme.dark (true/false) fehlt');
    need(hex(t.background) && hex(t.foreground), 'theme.background/foreground: Hex-Farben wie "1E1F22"');
    need(t.colors && typeof t.colors === 'object' && Object.keys(t.colors).every(k => TOKEN_KINDS.includes(k) && hex(t.colors[k])), `theme.colors: nur ${TOKEN_KINDS.join(', ')} mit Hex-Farben`);
    need(t.id === e.id && t.name === e.name, 'theme.id und theme.name müssen id und name entsprechen (für die iPad-App)');
  } else if (e.kind === 'language') {
    const l = e.language || {};
    need(s(l.id, 40) && /^[a-z0-9-]+$/.test(l.id), 'language.id fehlt (a–z, 0–9, -)');
    need(s(l.name, 40), 'language.name fehlt');
    need(Array.isArray(l.fileExtensions) && l.fileExtensions.length > 0 && l.fileExtensions.length <= 20 && l.fileExtensions.every(x => s(x, 15)), 'language.fileExtensions fehlt');
    need(l.keywords === undefined || (Array.isArray(l.keywords) && l.keywords.length <= 500 && l.keywords.every(x => s(x, 40))), 'language.keywords: max. 500 Wörter');
    need(l.lineComment === undefined || s(l.lineComment, 8), 'language.lineComment max. 8 Zeichen');
    need(l.blockComment === undefined || (Array.isArray(l.blockComment) && l.blockComment.length === 2 && l.blockComment.every(x => s(x, 8))), 'language.blockComment: ["start", "ende"]');
    need(l.stringDelimiters === undefined || (Array.isArray(l.stringDelimiters) && l.stringDelimiters.length <= 4 && l.stringDelimiters.every(x => s(x, 3))), 'language.stringDelimiters: max. 4');
  } else if (e.kind === 'snippets') {
    snippetGroup(e.snippets, need, s);
  } else if (e.kind === 'tasks') {
    const t = e.tasks || {};
    need(e.platforms && e.platforms.length === 1 && e.platforms[0] === 'windows', 'tasks: platforms muss ["windows"] sein');
    need(Array.isArray(t.items) && t.items.length > 0 && t.items.length <= 50, 'tasks.items: 1–50 Einträge');
    for (const task of t.items || []) {
      const label = task.label || '?';
      need(s(task.label, 60), `Aufgabe „${label}“: label fehlt (max. 60)`);
      need(s(task.command, 300) && !/[\u0000-\u001f]/.test(task.command), `Aufgabe „${label}“: command fehlt (eine Zeile, max. 300)`);
      need(task.cwd === undefined || task.cwd === 'folder' || task.cwd === 'file', `Aufgabe „${label}“: cwd "folder" oder "file"`);
      const inputs = task.inputs || [];
      need(Array.isArray(inputs) && inputs.length <= 5, `Aufgabe „${label}“: max. 5 inputs`);
      for (const i of inputs) need(i && /^[a-z][a-zA-Z0-9]{0,19}$/.test(i.id) && s(i.prompt, 80) && (i.default === undefined || (typeof i.default === 'string' && SAFE_VALUE.test(i.default))), `Aufgabe „${label}“: input „${i?.id}“ ungültig`);
      for (const [, name] of String(task.command).matchAll(/\$\{([^}]*)\}/g)) {
        const m = /^input:(.+)$/.exec(name);
        need(name === 'file' || name === 'folder' || (m && inputs.some(i => i.id === m[1])), `Aufgabe „${label}“: Platzhalter \${${name}} unbekannt`);
      }
    }
    need(t.snippets === undefined || (Array.isArray(t.snippets) && t.snippets.length <= 10), 'tasks.snippets: max. 10 Gruppen');
    for (const g of t.snippets || []) snippetGroup(g, need, s);
  } else if (e.kind === 'plugin') {
    const p = e.plugin || {};
    need(e.platforms && e.platforms.length === 1 && e.platforms[0] === 'windows', 'plugin: platforms muss ["windows"] sein');
    need(p.main === 'main.js', 'plugin.main muss "main.js" sein');
    need(Array.isArray(p.permissions) && p.permissions.every(x => PERMISSIONS.includes(x)) && new Set(p.permissions).size === p.permissions.length, `plugin.permissions: nur ${PERMISSIONS.join(', ')}`);
    const main = path.join(dir, folder, 'main.js');
    need(fs.existsSync(main), 'plugin: main.js fehlt');
    if (fs.existsSync(main)) {
      const code = fs.readFileSync(main, 'utf8');
      need(Buffer.byteLength(code) <= 500_000, 'main.js größer als 500 KB');
      need(!/\b(require|process|eval|Function)\s*\(|import\s*\(/.test(code), 'main.js: kein require/process/eval/Function/import() – nur die basalt-API');
    }
  } else {
    errors.push('kind muss "theme", "language", "snippets", "tasks" oder "plugin" sein');
  }
  return errors;
}

const dir = path.join(ROOT, 'extensions');
const list = [];
let failed = false;
for (const folder of fs.readdirSync(dir).sort()) {
  const file = path.join(dir, folder, 'extension.json');
  if (!fs.existsSync(file)) { console.error(`✗ ${folder}: extension.json fehlt`); failed = true; continue; }
  const text = fs.readFileSync(file, 'utf8');
  if (Buffer.byteLength(text) > 200_000) { console.error(`✗ ${folder}: größer als 200 KB`); failed = true; continue; }
  if (!fs.existsSync(path.join(dir, folder, 'README.md'))) { console.error(`✗ ${folder}: README.md fehlt`); failed = true; }
  let e;
  try { e = JSON.parse(text); } catch (err) { console.error(`✗ ${folder}: kein gültiges JSON (${err.message})`); failed = true; continue; }
  const errors = check(e, folder);
  if (errors.length) { failed = true; for (const m of errors) console.error(`✗ ${folder}: ${m}`); continue; }
  console.log(`✓ ${folder}`);
  list.push({
    id: e.id, name: e.name, version: e.version, description: e.description || '', author: e.author, license: e.license, kind: e.kind,
    platforms: e.platforms || (['tasks', 'plugin'].includes(e.kind) ? ['windows'] : ['windows', 'ipad']),
    path: `extensions/${folder}/extension.json`,
    sha256: crypto.createHash('sha256').update(text).digest('hex'),
    ...(e.kind === 'plugin' ? {
      permissions: e.plugin.permissions,
      script: `extensions/${folder}/main.js`,
      scriptSha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, folder, 'main.js'), 'utf8')).digest('hex'),
    } : {}),
  });
}
if (failed) { console.error('\nPrüfung fehlgeschlagen.'); process.exit(1); }
if (!process.argv.includes('--check')) {
  fs.writeFileSync(path.join(ROOT, 'index.json'), JSON.stringify({ version: 1, generated: new Date().toISOString(), extensions: list }, null, 2) + '\n');
  console.log(`\nindex.json mit ${list.length} Extensions geschrieben.`);
}
