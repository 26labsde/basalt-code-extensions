# Eigene Extension veröffentlichen

1. Repository forken.
2. Ordner `extensions/<dein-name>.<extension>/` anlegen, z. B. `extensions/max.solarized/`. Der Ordnername ist die `id`.
3. Darin `extension.json` und `README.md` (kurze Beschreibung, Lizenz) anlegen.
4. Prüfen: `node scripts/build-index.js --check`
5. Pull Request öffnen. `index.json` **nicht** ändern – das macht GitHub Actions nach dem Merge.

## Regeln

- Open-Source-Lizenz Pflicht (SPDX-Kennung): MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, MPL-2.0, GPL-2.0-only, GPL-3.0-only, GPL-3.0-or-later, LGPL-3.0-only, AGPL-3.0-only, Unlicense, CC0-1.0, 0BSD, Zlib.
- Nur eigene Arbeit oder Inhalte, deren Lizenz die Weitergabe erlaubt.
- Neue Version = `version` erhöhen (x.y.z).
- Max. 200 KB pro Datei.

## Gemeinsame Felder

```json
{
  "id": "max.solarized",
  "name": "Solarized",
  "version": "1.0.0",
  "description": "Kurzer Satz.",
  "author": "Max Mustermann",
  "license": "MIT",
  "repository": "https://github.com/max/solarized-basalt",
  "kind": "theme"
}
```

`repository` und `description` sind optional. `platforms` (`["windows", "ipad"]`) ist optional.

## theme

```json
"theme": {
  "id": "max.solarized",
  "name": "Solarized",
  "dark": true,
  "background": "002B36",
  "foreground": "839496",
  "colors": { "keyword": "859900", "type": "B58900", "function": "268BD2", "string": "2AA198", "number": "D33682", "comment": "586E75" }
}
```

`theme.id`/`theme.name` = `id`/`name`.

## language

```json
"language": {
  "id": "lua-ext",
  "name": "Lua",
  "fileExtensions": ["lua"],
  "keywords": ["local", "function", "end"],
  "lineComment": "--",
  "blockComment": ["--[[", "]]"],
  "stringDelimiters": ["\"", "'"],
  "bracketIndent": false
}
```

## snippets (nur Windows)

```json
"snippets": {
  "language": "javascript",
  "items": [
    { "prefix": "log", "body": "console.log($1);", "description": "console.log" }
  ]
}
```

`body` nutzt die Snippet-Syntax von VS Code (`$1`, `${1:name}`, `$0`).

## tasks (nur Windows)

Feste Terminal-Befehle, die der Nutzer selbst in der Befehlspalette startet. Sie laufen sichtbar in einem neuen PowerShell-Terminal.

```json
"platforms": ["windows"],
"tasks": {
  "items": [
    {
      "label": "Docker: Image bauen",
      "command": "docker build -t ${input:image} .",
      "inputs": [{ "id": "image", "prompt": "Name des Images", "default": "meine-app" }]
    }
  ],
  "snippets": [
    { "language": "dockerfile", "items": [{ "prefix": "node", "body": "FROM node:22-alpine" }] }
  ]
}
```

- `command`: eine Zeile, max. 300 Zeichen.
- Platzhalter: `${folder}` (geöffneter Ordner), `${file}` (geöffnete Datei) und `${input:<id>}`. Pfade werden automatisch in Anführungszeichen gesetzt.
- Eingaben dürfen nur Buchstaben, Ziffern und `_ . : / @ = , + -` enthalten und nicht mit `-` beginnen.
- `cwd`: `"folder"` (Standard) oder `"file"` (Ordner der geöffneten Datei).
- Befehle müssen tun, was ihr `label` sagt. Nichts herunterladen und ausführen, keine versteckten Nebenwirkungen. Pull Requests mit `tasks` werden besonders genau geprüft.

## plugin (nur Windows) – Extensions mit Code

Eigenes JavaScript in `main.js` im selben Ordner. Es läuft in Basalt Code abgeschirmt:
- in einem eigenen, unsichtbaren Fenster ohne Node.js,
- ohne Internet und ohne Zugriff auf andere Ordner,
- es spricht nur über das Objekt `basalt` mit dem Editor.

Vor der Installation sieht der Nutzer, welche Rechte die Extension verlangt.

```json
"platforms": ["windows"],
"plugin": { "main": "main.js", "permissions": ["workspace", "terminal"] }
```

| Recht | Erlaubt |
| --- | --- |
| *(keins)* | Befehle, Statusleiste, Dialoge, Ausgabe, Vervollständigung |
| `workspace` | `basalt.workspace.exists/read/write/list/open` – nur im geöffneten Ordner, `.git` gesperrt |
| `terminal` | `basalt.terminal.run(befehl)` – sichtbar in einem neuen PowerShell-Terminal; `basalt.system.findProgram(namen, ordner)` |

API (alles gibt Promises zurück, `await` ist in `main.js` direkt erlaubt):

```js
await basalt.commands.register('run', 'Mein Tool: Starten', async () => { … });  // Befehlspalette
await basalt.ui.statusItem('run', '▶ Mein Tool', 'run', 'Tooltip');             // null als Text entfernt es
await basalt.ui.toast('Hallo');  await basalt.ui.output('Log-Zeile');
const name = await basalt.ui.input('Name?', 'vorgabe');                          // null = abgebrochen
const ok = await basalt.ui.confirm('Wirklich?', 'Ja');
const i = await basalt.ui.pick(['A', 'B'], 'Auswählen');                         // -1 = abgebrochen
await basalt.ui.openExternal('https://…');                                       // fragt den Nutzer
await basalt.languages.completions('lua', [{ label: 'foo', insert: 'foo(${1:x})', detail: 'foo(x)', doc: 'Hilfe', kind: 'function' }]);
const root = await basalt.workspace.root();  basalt.workspace.onFolder(dir => { … });
```

Regeln für Pull Requests mit `plugin`:
- Der Code muss lesbar sein: nicht minifiziert, nicht verschleiert.
- `require`, `process`, `eval`, `Function(…)` und `import()` sind verboten; das Prüfskript lehnt sie ab.
- Nur die Rechte, die die Extension wirklich braucht.
- Befehle im Terminal müssen tun, was der Befehlsname sagt.
- Jede Änderung an `main.js` wird vor dem Merge von Hand geprüft. `index.json` enthält die Prüfsumme von `main.js`, die App installiert nichts anderes.
