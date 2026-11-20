# LÖVE 2D

2D-Spiele mit [LÖVE](https://love2d.org) (Lua) in Basalt Code entwickeln. LÖVE selbst ist nicht enthalten. Installiere es vorher von love2d.org; die Extension findet es im Standard-Installationsordner oder im PATH.

## Funktionen

Befehlspalette (Strg+Umschalt+P), Eingabe „LÖVE“:

| Befehl | Wirkung |
| --- | --- |
| **LÖVE: Spiel starten** | Startet das Spiel aus dem geöffneten Ordner. Ausgaben von `print()` erscheinen im Terminal. In Ordnern mit `main.lua` geht das auch über **▶ LÖVE** in der Statusleiste. |
| **LÖVE: Vorlage anlegen** | Legt `main.lua` (bewegliches Quadrat, Esc beendet) und `conf.lua` an. |
| **LÖVE: Als .love packen** | Erzeugt `<Ordner>.love`. |
| **LÖVE: Als Windows-Spiel exportieren** | Erzeugt `dist/<Ordner>/<Ordner>.exe` mit den DLLs und der Lizenz von LÖVE. Gib den ganzen Ordner weiter. |
| **LÖVE: Dokumentation öffnen** | Öffnet das LÖVE-Wiki. |

In `.lua`-Dateien gibt es Vervollständigung und Hover-Hilfe für die `love`-API. Tippe zum Beispiel `love.graphics.` oder `function love.update`.

## Rechte

- **workspace**: Vorlage schreiben und prüfen, ob `main.lua` existiert.
- **terminal**: LÖVE finden und starten, Packen und Exportieren mit PowerShell.

Lizenz: MIT. LÖVE steht unter der zlib-Lizenz.
