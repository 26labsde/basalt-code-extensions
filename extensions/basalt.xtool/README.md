# xtool (iOS-Apps)

iPhone- und iPad-Apps mit SwiftPM und [xtool](https://github.com/xtool-org/xtool) direkt aus Basalt Code bauen und aufs Gerät bringen. Unter Windows läuft xtool im Windows-Subsystem für Linux (WSL). Jeder Befehl öffnet ein Terminal und startet dort `wsl.exe` im geöffneten Ordner.

## Einmal einrichten

1. WSL mit Ubuntu installieren.
2. In WSL installieren:
   - das Swift-Toolchain,
   - `usbmuxd`,
   - xtool selbst (AppImage nach `/usr/local/bin/xtool`).

   Die Anleitung dazu: [Installation-Linux](https://github.com/xtool-org/xtool/blob/main/Documentation/xtool.docc/Installation-Linux.md).
3. In Basalt: **xtool: Einrichten** ausführen. Das fragt nach deinem Apple-Konto und dem Pfad zu `Xcode.xip`.
4. Fürs Gerät per USB [usbipd-win](https://github.com/dorssel/usbipd-win) installieren:
   - Einmal als Administrator: `usbipd bind --busid <BUSID>`.
   - Danach reicht **xtool: iPhone/iPad per USB an WSL weiterreichen**.
   - Auf dem Gerät „Vertrauen“ tippen und den Entwicklermodus einschalten.

## Befehle (Strg+Umschalt+P, „xtool“)

| Befehl | xtool |
| --- | --- |
| Bauen, installieren und starten | `xtool dev`. In Ordnern mit `xtool.yml` geht das auch über **▶ xtool** in der Statusleiste. |
| Nur bauen | `xtool dev build`. Die App liegt danach unter `xtool/<App>.app`. |
| Neues Projekt anlegen | `xtool new <Name>` legt einen Unterordner an. |
| Geräte anzeigen | `xtool devices` |
| Einrichten / Apple-Anmeldung | `xtool setup` / `xtool auth` |
| Hilfe | `xtool --help`, `xtool help dev` |

In `xtool.yml` gibt es Vervollständigung für `bundleID`, `iconPath`, `infoPath`, `entitlementsPath` und `resources`.

Tipp: Unter `/mnt/c/…` baut WSL deutlich langsamer als im WSL-eigenen Ordner, zum Beispiel `~/projekte`. Den erreichst du in Basalt über `\\wsl$\Ubuntu\home\<name>`.

## Rechte

- **workspace**: prüfen, ob `xtool.yml` existiert.
- **terminal**: WSL, xtool und usbipd im Terminal starten.

Lizenz: MIT. xtool steht unter der MIT-Lizenz.
