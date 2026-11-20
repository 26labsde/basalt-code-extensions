# Basalt Code Extensions

Der Extension-Marketplace von Basalt Code. Alles in diesem Repository erscheint direkt in der App unter **Extensions** (Seitenleiste).

- Jede Extension ist Open Source (Lizenz siehe `license` in ihrer `extension.json`).
- `theme`, `language`, `snippets` und `tasks` sind reine Daten (JSON). `tasks` enthalten feste Terminal-Befehle, die nur auf Klick des Nutzers laufen.
- `plugin` bringt JavaScript mit. Es läuft in der App abgeschirmt (ohne Node.js und Internet) und darf nur, was seine Rechte erlauben. Solche Pull Requests vor dem Merge immer selbst lesen.
- Die Apps installieren nur Dateien, deren SHA-256 mit `index.json` übereinstimmt. `index.json` wird ausschließlich von GitHub Actions erzeugt.

| Art | Inhalt | Plattform |
| --- | --- | --- |
| `theme` | Farbdesign für den Editor | Windows, iPad |
| `language` | Syntaxhervorhebung für eine Sprache | Windows, iPad |
| `snippets` | Code-Bausteine für die Autovervollständigung | Windows |
| `tasks` | Terminal-Befehle für die Befehlspalette (+ Snippets) | Windows |
| `plugin` | Eigener Code (abgeschirmt, mit Rechten) – z. B. LÖVE 2D | Windows |

Eigene Extension veröffentlichen: [CONTRIBUTING.md](CONTRIBUTING.md)

## Für Betreuer

1. Repository öffentlich auf GitHub anlegen, z. B. `basalt-code-extensions`, Standardbranch `main`.
2. Unter *Settings › Actions › General* „Read and write permissions“ für Workflows erlauben (der Workflow committet `index.json`).
3. Unter *Settings › Branches* eine Regel für `main`: Pull Request mit Review und erfolgreichem Check `check` nötig.
4. In der App `marketplaceRepo` in `src/main/features.js` (Windows) auf `<owner>/basalt-code-extensions` setzen.

Lokal testen: `node scripts/build-index.js`, dann Basalt Code mit `BASALT_MARKET_DIR=<Pfad zu diesem Ordner>` starten.
