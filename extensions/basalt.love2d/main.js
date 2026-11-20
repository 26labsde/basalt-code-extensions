// LÖVE 2D for Basalt Code. Runs sandboxed; uses only the basalt API (permissions: workspace, terminal).
// LÖVE itself is not bundled: https://love2d.org (zlib license).

const LOVE_DIRS = ['%ProgramFiles%\\LOVE', '%ProgramFiles(x86)%\\LOVE', '%LOCALAPPDATA%\\Programs\\LOVE', 'C:\\Program Files\\LOVE', 'C:\\Program Files (x86)\\LOVE'];

// lovec.exe keeps a console window, so print() output appears in Basalt's terminal.
const findLove = () => basalt.system.findProgram(['lovec.exe', 'love.exe'], LOVE_DIRS);
const ps = s => `'${String(s).replace(/'/g, "''")}'`; // PowerShell single-quoted string

async function ready() {
  if (!(await basalt.workspace.root())) { basalt.ui.toast('Zuerst einen Ordner öffnen.'); return null; }
  if (!(await basalt.workspace.exists('main.lua'))) {
    if (await basalt.ui.confirm('In diesem Ordner gibt es kein main.lua. Eine LÖVE-Vorlage anlegen?', 'Vorlage anlegen')) await template();
    return null;
  }
  const exe = await findLove();
  if (!exe) {
    if (await basalt.ui.confirm('LÖVE ist nicht installiert (love.exe nicht gefunden). Die Download-Seite öffnen?', 'love2d.org öffnen')) await basalt.ui.openExternal('https://love2d.org/');
    return null;
  }
  return exe;
}

async function run() {
  const exe = await ready();
  if (exe) await basalt.terminal.run(`& ${ps(exe)} .`, { name: 'LÖVE' });
}

const MAIN_LUA = `-- Startpunkt des Spiels. F5 in LÖVE: love.load, dann pro Bild love.update und love.draw.
local player = { x = 400, y = 300, speed = 220, size = 24 }

function love.load()
  love.window.setTitle("Mein Spiel")
  love.graphics.setBackgroundColor(0.08, 0.09, 0.11)
end

function love.update(dt)
  if love.keyboard.isDown("left", "a") then player.x = player.x - player.speed * dt end
  if love.keyboard.isDown("right", "d") then player.x = player.x + player.speed * dt end
  if love.keyboard.isDown("up", "w") then player.y = player.y - player.speed * dt end
  if love.keyboard.isDown("down", "s") then player.y = player.y + player.speed * dt end
end

function love.draw()
  love.graphics.setColor(0.31, 0.85, 0.72)
  love.graphics.rectangle("fill", player.x - player.size / 2, player.y - player.size / 2, player.size, player.size)
  love.graphics.setColor(1, 1, 1)
  love.graphics.print("Pfeiltasten oder WASD – Esc beendet", 12, 12)
end

function love.keypressed(key)
  if key == "escape" then love.event.quit() end
end
`;

const CONF_LUA = `function love.conf(t)
  t.identity = "mein-spiel"   -- Ordnername für Spielstände (love.filesystem)
  t.version = "11.5"
  t.console = false
  t.window.title = "Mein Spiel"
  t.window.width = 800
  t.window.height = 600
  t.window.resizable = false
  t.window.vsync = 1
end
`;

async function template() {
  if (!(await basalt.workspace.root())) return basalt.ui.toast('Zuerst einen Ordner öffnen.');
  const exists = (await basalt.workspace.exists('main.lua')) || (await basalt.workspace.exists('conf.lua'));
  if (exists && !(await basalt.ui.confirm('main.lua oder conf.lua gibt es schon. Überschreiben?', 'Überschreiben'))) return;
  await basalt.workspace.write('main.lua', MAIN_LUA);
  await basalt.workspace.write('conf.lua', CONF_LUA);
  await basalt.workspace.open('main.lua', 1);
  updateStatus();
}

// .love = zip of the game folder with main.lua at the top level.
const PACK = `$n = Split-Path -Leaf (Get-Location); $z = Join-Path $env:TEMP "basalt-love-$PID.zip"; ` +
  `Compress-Archive -Path (Get-ChildItem -Force | Where-Object { $_.Name -notin @('.git', 'dist') -and $_.Extension -ne '.love' }) -DestinationPath $z -Force; ` +
  `Move-Item $z "$n.love" -Force; Write-Host "Fertig: $n.love"`;

async function pack() {
  if (!(await ready())) return;
  await basalt.terminal.run(PACK, { name: 'LÖVE: .love' });
}

// Windows game: love.exe + game.love fused into one .exe, plus LÖVE's DLLs and license (zlib: keep it).
async function exportWindows() {
  const exe = await ready();
  if (!exe) return;
  const dir = exe.replace(/\\[^\\]+$/, '');
  // love.exe followed by the .love file = one runnable game (same as "copy /b love.exe+game.love game.exe").
  const cmd = PACK + `; $d = Join-Path $PWD (Join-Path 'dist' $n); New-Item -ItemType Directory $d -Force | Out-Null; ` +
    `$o = [IO.File]::Create((Join-Path $d "$n.exe")); foreach ($f in @((Join-Path ${ps(dir)} 'love.exe'), (Join-Path $PWD "$n.love"))) { $i = [IO.File]::OpenRead($f); $i.CopyTo($o); $i.Close() }; $o.Close(); ` +
    `Copy-Item (Join-Path ${ps(dir)} '*.dll') $d; Copy-Item (Join-Path ${ps(dir)} 'license.txt') $d -ErrorAction SilentlyContinue; ` +
    `Write-Host "Fertig: dist\\$n\\$n.exe (Ordner komplett weitergeben)"`;
  await basalt.terminal.run(cmd, { name: 'LÖVE: Export' });
}

async function docs() {
  const pages = ['Übersicht (love)', 'love.graphics', 'love.keyboard', 'love.physics', 'love.audio', 'Tutorials'];
  const urls = ['https://love2d.org/wiki/love', 'https://love2d.org/wiki/love.graphics', 'https://love2d.org/wiki/love.keyboard', 'https://love2d.org/wiki/love.physics', 'https://love2d.org/wiki/love.audio', 'https://love2d.org/wiki/Category:Tutorials'];
  const i = await basalt.ui.pick(pages, 'LÖVE-Dokumentation');
  if (i >= 0) await basalt.ui.openExternal(urls[i]);
}

async function updateStatus() {
  const isGame = (await basalt.workspace.root()) && (await basalt.workspace.exists('main.lua'));
  await basalt.ui.statusItem('run', isGame ? '▶ LÖVE' : null, 'run', 'Spiel mit LÖVE starten');
}

// ---------------------------------------------------------------- love API for completion and hover help
// [name, parameters, short description] – LÖVE 11.5
const API = [
  // callbacks
  ['love.load', 'arg', 'Wird einmal beim Start aufgerufen.', 'cb'],
  ['love.update', 'dt', 'Jedes Bild; dt = Sekunden seit dem letzten Bild.', 'cb'],
  ['love.draw', '', 'Jedes Bild zum Zeichnen.', 'cb'],
  ['love.keypressed', 'key, scancode, isrepeat', 'Taste gedrückt.', 'cb'],
  ['love.keyreleased', 'key, scancode', 'Taste losgelassen.', 'cb'],
  ['love.textinput', 'text', 'Text eingegeben (Unicode).', 'cb'],
  ['love.mousepressed', 'x, y, button, istouch, presses', 'Maustaste gedrückt.', 'cb'],
  ['love.mousereleased', 'x, y, button, istouch, presses', 'Maustaste losgelassen.', 'cb'],
  ['love.mousemoved', 'x, y, dx, dy, istouch', 'Maus bewegt.', 'cb'],
  ['love.wheelmoved', 'x, y', 'Mausrad gedreht.', 'cb'],
  ['love.touchpressed', 'id, x, y, dx, dy, pressure', 'Touch begonnen.', 'cb'],
  ['love.gamepadpressed', 'joystick, button', 'Gamepad-Taste gedrückt.', 'cb'],
  ['love.resize', 'w, h', 'Fenstergröße geändert.', 'cb'],
  ['love.focus', 'focused', 'Fenster hat den Fokus bekommen oder verloren.', 'cb'],
  ['love.quit', '', 'Vor dem Beenden; true zurückgeben bricht ab.', 'cb'],
  ['love.conf', 't', 'In conf.lua: Fenster, Module und Kennung einstellen.', 'cb'],
  // graphics
  ['love.graphics.rectangle', 'mode, x, y, width, height', 'Rechteck; mode = "fill" oder "line".'],
  ['love.graphics.circle', 'mode, x, y, radius', 'Kreis.'],
  ['love.graphics.ellipse', 'mode, x, y, radiusx, radiusy', 'Ellipse.'],
  ['love.graphics.line', 'x1, y1, x2, y2', 'Linie durch beliebig viele Punkte.'],
  ['love.graphics.polygon', 'mode, vertices', 'Polygon aus x,y-Paaren.'],
  ['love.graphics.points', 'x, y', 'Einzelne Punkte.'],
  ['love.graphics.arc', 'mode, x, y, radius, angle1, angle2', 'Kreisbogen (Winkel im Bogenmaß).'],
  ['love.graphics.print', 'text, x, y, r, sx, sy', 'Text zeichnen.'],
  ['love.graphics.printf', 'text, x, y, limit, align', 'Text mit Umbruch; align = "left", "center", "right", "justify".'],
  ['love.graphics.draw', 'drawable, x, y, r, sx, sy, ox, oy', 'Bild, Canvas, Text, Mesh oder SpriteBatch zeichnen.'],
  ['love.graphics.newImage', 'filename', 'Bild laden (PNG, JPG …).'],
  ['love.graphics.newQuad', 'x, y, width, height, sw, sh', 'Ausschnitt eines Bildes (Spritesheets).'],
  ['love.graphics.newFont', 'filename, size', 'Schrift laden; nur Größe = Standardschrift.'],
  ['love.graphics.setFont', 'font', 'Schrift für print setzen.'],
  ['love.graphics.newCanvas', 'width, height', 'Offscreen-Zeichenfläche.'],
  ['love.graphics.setCanvas', 'canvas', 'Auf Canvas zeichnen; ohne Argument zurück zum Bildschirm.'],
  ['love.graphics.newSpriteBatch', 'image, maxsprites', 'Viele Ausschnitte eines Bildes schnell zeichnen.'],
  ['love.graphics.newShader', 'code', 'GLSL-Shader erstellen.'],
  ['love.graphics.setShader', 'shader', 'Shader aktivieren; ohne Argument aus.'],
  ['love.graphics.setColor', 'r, g, b, a', 'Zeichenfarbe, Werte 0–1.'],
  ['love.graphics.getColor', '', 'Aktuelle Zeichenfarbe.'],
  ['love.graphics.setBackgroundColor', 'r, g, b, a', 'Hintergrundfarbe, Werte 0–1.'],
  ['love.graphics.clear', 'r, g, b, a', 'Fläche leeren.'],
  ['love.graphics.setLineWidth', 'width', 'Linienbreite.'],
  ['love.graphics.setBlendMode', 'mode', 'Mischmodus, z. B. "alpha", "add".'],
  ['love.graphics.setDefaultFilter', 'min, mag', '"nearest" für scharfe Pixelgrafik.'],
  ['love.graphics.push', '', 'Transformation sichern.'],
  ['love.graphics.pop', '', 'Gesicherte Transformation wiederherstellen.'],
  ['love.graphics.translate', 'dx, dy', 'Verschieben (z. B. Kamera).'],
  ['love.graphics.rotate', 'angle', 'Drehen (Bogenmaß).'],
  ['love.graphics.scale', 'sx, sy', 'Skalieren.'],
  ['love.graphics.origin', '', 'Transformation zurücksetzen.'],
  ['love.graphics.setScissor', 'x, y, width, height', 'Zeichnen auf ein Rechteck begrenzen.'],
  ['love.graphics.getWidth', '', 'Breite des Fensters.'],
  ['love.graphics.getHeight', '', 'Höhe des Fensters.'],
  ['love.graphics.getDimensions', '', 'Breite und Höhe des Fensters.'],
  ['love.graphics.captureScreenshot', 'filename', 'Screenshot speichern (Spielordner).'],
  // window
  ['love.window.setTitle', 'title', 'Fenstertitel.'],
  ['love.window.setMode', 'width, height, flags', 'Fenstergröße und Optionen.'],
  ['love.window.setFullscreen', 'fullscreen', 'Vollbild an/aus.'],
  ['love.window.getMode', '', 'Größe und Optionen des Fensters.'],
  ['love.window.showMessageBox', 'title, message, type', 'Meldungsfenster.'],
  // keyboard / mouse / touch / joystick
  ['love.keyboard.isDown', 'key, ...', 'Ist (eine der) Tasten gedrückt? z. B. "left", "space".'],
  ['love.keyboard.isScancodeDown', 'scancode, ...', 'Taste nach Position (unabhängig vom Layout).'],
  ['love.keyboard.setKeyRepeat', 'enable', 'Wiederholte keypressed beim Gedrückthalten.'],
  ['love.keyboard.setTextInput', 'enable', 'Texteingabe (love.textinput) an/aus.'],
  ['love.mouse.getPosition', '', 'Mausposition x, y.'],
  ['love.mouse.getX', '', 'Maus x.'],
  ['love.mouse.getY', '', 'Maus y.'],
  ['love.mouse.isDown', 'button, ...', 'Maustaste gedrückt? 1 = links, 2 = rechts, 3 = Mitte.'],
  ['love.mouse.setVisible', 'visible', 'Mauszeiger zeigen/verstecken.'],
  ['love.mouse.setGrabbed', 'grab', 'Maus im Fenster halten.'],
  ['love.mouse.setRelativeMode', 'enable', 'Relative Mausbewegung (z. B. Ego-Steuerung).'],
  ['love.touch.getTouches', '', 'Aktive Berührungen.'],
  ['love.touch.getPosition', 'id', 'Position einer Berührung.'],
  ['love.joystick.getJoysticks', '', 'Verbundene Controller.'],
  // timer / math / event / system
  ['love.timer.getTime', '', 'Zeit seit Start in Sekunden (genau).'],
  ['love.timer.getFPS', '', 'Bilder pro Sekunde.'],
  ['love.timer.getDelta', '', 'dt des letzten Bildes.'],
  ['love.timer.sleep', 's', 'Warten (blockiert).'],
  ['love.math.random', 'min, max', 'Zufallszahl.'],
  ['love.math.setRandomSeed', 'seed', 'Startwert des Zufalls.'],
  ['love.math.noise', 'x, y', 'Simplex-/Perlin-Rauschen 0–1.'],
  ['love.math.newRandomGenerator', 'seed', 'Eigener Zufallsgenerator.'],
  ['love.math.colorFromBytes', 'r, g, b, a', '0–255 in 0–1 umrechnen.'],
  ['love.event.quit', 'exitstatus', 'Spiel beenden ("restart" startet neu).'],
  ['love.system.getOS', '', 'Betriebssystem.'],
  ['love.system.getClipboardText', '', 'Text aus der Zwischenablage.'],
  ['love.system.setClipboardText', 'text', 'Text in die Zwischenablage.'],
  ['love.system.openURL', 'url', 'Link im Browser öffnen.'],
  // audio
  ['love.audio.newSource', 'filename, type', 'Ton laden; type = "static" (kurz) oder "stream" (Musik).'],
  ['love.audio.play', 'source', 'Abspielen.'],
  ['love.audio.stop', 'source', 'Stoppen; ohne Argument alle.'],
  ['love.audio.pause', 'source', 'Pausieren.'],
  ['love.audio.setVolume', 'volume', 'Gesamtlautstärke 0–1.'],
  // filesystem
  ['love.filesystem.read', 'name', 'Datei lesen (Spielordner oder Speicherordner).'],
  ['love.filesystem.write', 'name, data', 'Datei in den Speicherordner schreiben (Spielstände).'],
  ['love.filesystem.append', 'name, data', 'An Datei anhängen.'],
  ['love.filesystem.getInfo', 'path', 'Infos zu Datei/Ordner oder nil.'],
  ['love.filesystem.getDirectoryItems', 'dir', 'Inhalt eines Ordners.'],
  ['love.filesystem.load', 'name', 'Lua-Datei als Funktion laden.'],
  ['love.filesystem.createDirectory', 'name', 'Ordner im Speicherordner anlegen.'],
  ['love.filesystem.remove', 'name', 'Datei/Ordner im Speicherordner löschen.'],
  ['love.filesystem.getSaveDirectory', '', 'Pfad des Speicherordners.'],
  ['love.filesystem.setIdentity', 'name', 'Name des Speicherordners.'],
  // physics
  ['love.physics.newWorld', 'xg, yg, sleep', 'Physik-Welt mit Schwerkraft (Box2D).'],
  ['love.physics.newBody', 'world, x, y, type', 'Körper; type = "static", "dynamic", "kinematic".'],
  ['love.physics.newRectangleShape', 'width, height', 'Rechteck-Form.'],
  ['love.physics.newCircleShape', 'radius', 'Kreis-Form.'],
  ['love.physics.newPolygonShape', 'x1, y1, x2, y2, x3, y3', 'Polygon-Form (max. 8 Ecken).'],
  ['love.physics.newEdgeShape', 'x1, y1, x2, y2', 'Linie als Form.'],
  ['love.physics.newFixture', 'body, shape, density', 'Form an Körper hängen.'],
  ['love.physics.setMeter', 'scale', 'Pixel pro Meter (Standard 30).'],
  // data / thread
  ['love.data.compress', 'container, format, data', 'Daten komprimieren.'],
  ['love.data.encode', 'container, format, data', 'z. B. Base64 kodieren.'],
  ['love.thread.newThread', 'filename', 'Lua-Code in eigenem Thread.'],
  ['love.thread.getChannel', 'name', 'Kanal zum Austausch zwischen Threads.'],
  ['love.image.newImageData', 'width, height', 'Pixeldaten im Speicher.'],
];

// Common object methods (after ':').
const METHODS = [
  ['source:play', '', 'Ton abspielen.'], ['source:stop', '', 'Ton stoppen.'], ['source:setLooping', 'loop', 'Wiederholen.'],
  ['source:setVolume', 'volume', 'Lautstärke 0–1.'], ['source:setPitch', 'pitch', 'Tonhöhe.'], ['source:isPlaying', '', 'Läuft der Ton?'],
  ['image:getWidth', '', 'Breite.'], ['image:getHeight', '', 'Höhe.'], ['image:getDimensions', '', 'Breite und Höhe.'], ['image:setFilter', 'min, mag', '"nearest" oder "linear".'],
  ['body:getPosition', '', 'Position x, y.'], ['body:setLinearVelocity', 'x, y', 'Geschwindigkeit.'], ['body:getLinearVelocity', '', 'Geschwindigkeit.'],
  ['body:applyForce', 'fx, fy', 'Kraft anwenden.'], ['body:applyLinearImpulse', 'ix, iy', 'Stoß.'], ['body:getAngle', '', 'Drehwinkel.'], ['body:destroy', '', 'Körper entfernen.'],
  ['world:update', 'dt', 'Physik einen Schritt weiterrechnen (in love.update).'], ['world:setCallbacks', 'beginContact, endContact, preSolve, postSolve', 'Kollisions-Callbacks.'],
  ['spriteBatch:add', 'quad, x, y, r, sx, sy', 'Sprite hinzufügen.'], ['spriteBatch:clear', '', 'Alle Sprites entfernen.'],
  ['font:getWidth', 'text', 'Breite eines Textes in Pixeln.'], ['font:getHeight', '', 'Zeilenhöhe.'],
];

function completionItems() {
  const items = API.map(([name, params, doc, cb]) => {
    const args = params ? params.split(',').map(s => s.trim()) : [];
    if (cb) {
      return { label: `function ${name}`, kind: 'snippet', detail: `function ${name}(${params})`, doc,
        insert: `function ${name}(${args.map((a, i) => `\${${i + 1}:${a}}`).join(', ')})\n\t$0\nend` };
    }
    return { label: name, kind: 'function', detail: `${name}(${params})`, doc,
      insert: `${name}(${args.filter(a => a !== '...').map((a, i) => `\${${i + 1}:${a}}`).join(', ')})` };
  });
  for (const [name, params, doc, cb] of API) if (cb) items.push({ label: name, kind: 'function', detail: `${name}(${params})`, doc, insert: name });
  for (const [name, params, doc] of METHODS) {
    const method = name.split(':')[1];
    const args = params ? params.split(',').map(s => s.trim()) : [];
    items.push({ label: `:${method}`, kind: 'field', detail: `${name}(${params})`, doc, insert: `:${method}(${args.map((a, i) => `\${${i + 1}:${a}}`).join(', ')})` });
  }
  return items;
}

// ---------------------------------------------------------------- start
await basalt.commands.register('run', 'LÖVE: Spiel starten', run);
await basalt.commands.register('template', 'LÖVE: Vorlage anlegen (main.lua, conf.lua)', template);
await basalt.commands.register('pack', 'LÖVE: Als .love packen', pack);
await basalt.commands.register('export', 'LÖVE: Als Windows-Spiel exportieren (.exe)', exportWindows);
await basalt.commands.register('docs', 'LÖVE: Dokumentation öffnen', docs);
await basalt.languages.completions('lua', completionItems());
basalt.workspace.onFolder(updateStatus);
await updateStatus();
