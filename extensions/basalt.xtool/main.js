// xtool for Basalt Code: build and run iOS apps (SwiftPM) from Windows. xtool runs in WSL
// (https://github.com/xtool-org/xtool, MIT); every command starts `wsl.exe --cd <open folder>` in a visible terminal.
// Runs sandboxed; uses only the basalt API (permissions: workspace, terminal).

const DOCS = 'https://github.com/xtool-org/xtool';
const LINUX_SETUP = 'https://github.com/xtool-org/xtool/blob/main/Documentation/xtool.docc/Installation-Linux.md';

// Command inside WSL, started in the folder that is open in Basalt.
const inWsl = cmd => `wsl.exe --cd "$((Get-Location).Path)" -e bash -lc '${cmd}'`;

async function wslReady() {
  if (await basalt.system.findProgram(['wsl.exe'], ['%SystemRoot%\\System32'])) return true;
  if (await basalt.ui.confirm('xtool braucht unter Windows das Windows-Subsystem für Linux (WSL). Anleitung öffnen?', 'Anleitung öffnen')) {
    await basalt.ui.openExternal(LINUX_SETUP);
  }
  return false;
}

async function project() {
  if (!(await basalt.workspace.root())) { await basalt.ui.toast('Zuerst einen Ordner öffnen.'); return false; }
  if (await basalt.workspace.exists('xtool.yml')) return true;
  if (await basalt.ui.confirm('In diesem Ordner gibt es kein xtool.yml. Ein neues xtool-Projekt anlegen?', 'Neues Projekt')) await create();
  return false;
}

async function run(cmd, name, needsProject = true) {
  if (!(await wslReady())) return;
  if (needsProject && !(await project())) return;
  if (!needsProject && !(await basalt.workspace.root())) return basalt.ui.toast('Zuerst einen Ordner öffnen.');
  await basalt.terminal.run(inWsl(cmd), { name });
}

async function create() {
  if (!(await wslReady())) return;
  if (!(await basalt.workspace.root())) return basalt.ui.toast('Zuerst einen Ordner öffnen.');
  const name = await basalt.ui.input('Name der App (Buchstaben und Ziffern, z. B. Hello)', 'Hello');
  if (name == null) return;
  if (!/^[A-Za-z][A-Za-z0-9]{0,40}$/.test(name)) return basalt.ui.toast('Nur Buchstaben und Ziffern, mit einem Buchstaben am Anfang.');
  await basalt.terminal.run(inWsl(`xtool new ${name}`), { name: 'xtool new' });
  await basalt.ui.toast(`Projekt entsteht im Unterordner „${name}“ – danach diesen Ordner öffnen.`);
}

// iPhone/iPad over USB into WSL (usbipd-win). "bind" needs admin rights once, "attach" not.
async function usb() {
  if (!(await basalt.system.findProgram(['usbipd.exe'], ['%ProgramFiles%\\usbipd-win']))) {
    if (await basalt.ui.confirm('Für USB-Geräte in WSL braucht es usbipd-win. Download-Seite öffnen?', 'Öffnen')) await basalt.ui.openExternal('https://github.com/dorssel/usbipd-win/releases');
    return;
  }
  await basalt.terminal.run('usbipd list', { name: 'usbipd' });
  const busid = await basalt.ui.input('BUSID des iPhones/iPads aus der Liste im Terminal (z. B. 2-3). Beim ersten Mal vorher als Administrator: usbipd bind --busid <BUSID>', '');
  if (busid == null || !busid.trim()) return;
  if (!/^\d+-\d+(\.\d+)*$/.test(busid.trim())) return basalt.ui.toast('Ungültige BUSID, Beispiel: 2-3');
  await basalt.terminal.run(`usbipd attach --wsl --busid ${busid.trim()}`, { name: 'usbipd' });
}

async function updateStatus() {
  const ok = (await basalt.workspace.root()) && (await basalt.workspace.exists('xtool.yml'));
  await basalt.ui.statusItem('dev', ok ? '▶ xtool' : null, 'dev', 'Bauen, aufs Gerät installieren und starten (xtool dev)');
}

// xtool.yml fields (from the xtool documentation).
const YML = [
  ['version', 'version: 1', 'Format-Version von xtool.yml.'],
  ['bundleID', 'bundleID: ${1:com.example.App}', 'Bundle-ID der App (Pflicht). Bei kostenlosen Apple-IDs stellt xtool ein Team-Präfix davor.'],
  ['infoPath', 'infoPath: ${1:Info.plist}', 'Eigene Info.plist, wird mit der erzeugten zusammengeführt.'],
  ['iconPath', 'iconPath: ${1:Resources/AppIcon.png}', 'App-Symbol als PNG, ideal 1024×1024.'],
  ['entitlementsPath', 'entitlementsPath: ${1:App.entitlements}', 'Entitlements-Datei der App.'],
  ['resources', 'resources:\n  - ${1:Resources/Datei.plist}', 'Dateien, die direkt ins App-Bundle kopiert werden.'],
];

await basalt.commands.register('dev', 'xtool: Bauen, installieren und starten', () => run('xtool dev', 'xtool dev'));
await basalt.commands.register('build', 'xtool: Nur bauen', () => run('xtool dev build', 'xtool build'));
await basalt.commands.register('new', 'xtool: Neues Projekt anlegen', create);
await basalt.commands.register('devices', 'xtool: Geräte anzeigen', () => run('xtool devices', 'xtool devices', false));
await basalt.commands.register('usb', 'xtool: iPhone/iPad per USB an WSL weiterreichen', usb);
await basalt.commands.register('setup', 'xtool: Einrichten (Apple-Konto, Xcode.xip)', () => run('xtool setup', 'xtool setup', false));
await basalt.commands.register('auth', 'xtool: Apple-Anmeldung verwalten', () => run('xtool auth', 'xtool auth', false));
await basalt.commands.register('help', 'xtool: Hilfe im Terminal', () => run('xtool --help && xtool help dev', 'xtool help', false));
await basalt.commands.register('docs', 'xtool: Dokumentation öffnen', () => basalt.ui.openExternal(DOCS));
await basalt.languages.completions('yaml', YML.map(([label, insert, doc]) => ({ label, insert, doc, detail: 'xtool.yml', kind: 'field' })));
basalt.workspace.onFolder(updateStatus);
await updateStatus();
