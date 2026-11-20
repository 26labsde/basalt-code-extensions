# Docker

Docker-Images bauen und Container starten – direkt aus Basalt Code. Benötigt [Docker Desktop](https://www.docker.com/products/docker-desktop/).

## Befehle

Befehlspalette öffnen (`Strg+Umschalt+P`) und „Docker“ oder „Compose“ tippen. Jeder Befehl läuft sichtbar in einem neuen Terminal im geöffneten Ordner.

| Befehl | Ausgeführt wird |
| --- | --- |
| Docker: Image bauen | `docker build -t <image> .` |
| Docker: Image aus geöffnetem Dockerfile bauen | `docker build -f <datei> -t <image> .` |
| Docker: Container starten | `docker run --rm -it -p <port> --name <name> <image>` |
| Docker: Container im Hintergrund starten | `docker run -d -p <port> --name <name> <image>` |
| Docker: Laufende / Alle Container anzeigen | `docker ps` / `docker ps -a` |
| Docker: Images anzeigen | `docker images` |
| Docker: Container stoppen / entfernen | `docker stop <name>` / `docker rm -f <name>` |
| Docker: Logs verfolgen | `docker logs -f <name>` |
| Docker: Shell im Container öffnen | `docker exec -it <name> sh` |
| Compose: Starten / Im Hintergrund starten | `docker compose up --build` / `docker compose up -d --build` |
| Compose: Stoppen / Logs / Status | `docker compose down` / `docker compose logs -f` / `docker compose ps` |
| Docker: Aufräumen | `docker system prune` (fragt vorher nach) |

## Snippets

- **Dockerfile:** `node`, `python`, `static`, `multistage`, `healthcheck`, `user`
- **compose.yaml:** `compose`, `compose-db`, `service`, `volume`, `env`

Lizenz: MIT
