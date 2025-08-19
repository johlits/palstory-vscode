# PalStory Tools (VS Code Extension)

Helper tools for PalStory development: run migrations, open the game, and control a local LAMP stack via Docker Compose.

## Features
- Run migration endpoint and show response JSON/text
- Open game in default browser
- Docker Compose Up/Down (LAMP)
- Quick Actions menu and status bar shortcut

## Commands
- PalStory: Run Migration (`palstory.runMigration`)
- PalStory: Open Game (`palstory.openGame`)
- PalStory: Docker Compose Up (LAMP) (`palstory.dockerComposeUp`)
- PalStory: Docker Compose Down (LAMP) (`palstory.dockerComposeDown`)
- PalStory: Quick Actions (`palstory.quickActions`, default: Ctrl+Alt+P)

## Settings
- `palstory.baseUrl` (string, default: `http://localhost`)
- `palstory.migrationPath` (string, default: `/migration_runner.php`)
- `palstory.migrationToken` (string, default: `change_me_secure_token`)
- `palstory.gamePath` (string, default: `/story/`)
- `palstory.lampPath` (string, default: empty) ← Set this to your Docker Compose folder for LAMP.
- `palstory.showStatusBarMigration` (boolean, default: `true`)

Note: If `palstory.lampPath` is empty, Docker commands will prompt you to configure it.

## Development
- Open this folder in VS Code
- Press F5 to “Run Extension” (launches an Extension Development Host)

## Packaging
- Prereqs: Node.js and VSCE
  - `npm install -g @vscode/vsce`
- From this folder:
  - `vsce package`
- Install the generated `.vsix` in VS Code:
  - Extensions panel → … menu → Install from VSIX…

## Publishing
- Ensure no personal paths remain (defaults are neutral)
- Commit and push to your public repo
- Optionally publish to Marketplace with your publisher account via VSCE

## Troubleshooting
- Migration errors: check `baseUrl`, `migrationPath`, `migrationToken`
- Docker errors: ensure Docker Desktop is running and `palstory.lampPath` points at the compose directory
- Networking: verify localhost/ports and firewall