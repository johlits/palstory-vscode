// PalStory VS Code Extension
// Implements: Run Migration (fetch JSON), Open Game, LAMP controls

const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const output = vscode.window.createOutputChannel('PalStory');

  const getCfg = () => vscode.workspace.getConfiguration('palstory');

  const getUrl = (base, path) => {
    if (!base) return path || '';
    if (!path) return base;
    const slash = base.endsWith('/') || path.startsWith('/') ? '' : '/';
    return `${base}${slash}${path}`.replace(/(?<!:)\/\/+/, '/');
  };

  const quickActions = async () => {
    const items = [
      { label: '$(play) Docker Compose Up (LAMP)', action: dockerComposeUp },
      { label: '$(link-external) Open Game', action: openGame },
      { label: '$(database) Open phpMyAdmin', action: openPhpMyAdmin },
      { label: '$(rocket) Run Migration', action: runMigration },
      { label: '$(stop-circle) Docker Compose Down (LAMP)', action: dockerComposeDown },
      { label: '$(zap) Full Cycle: Up → Open Game → Migrate', action: async () => {
          await dockerComposeUp();
          // tiny delay to allow terminal to spawn
          await new Promise(r => setTimeout(r, 400));
          await openGame();
          await runMigration();
        }
      },
    ];
    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: 'PalStory Quick Actions',
      ignoreFocusOut: true,
    });
    if (picked && picked.action) {
      await picked.action();
    }
  };

  const runMigration = async () => {
    try {
      const cfg = getCfg();
      const baseUrl = cfg.get('baseUrl');
      const migrationPath = cfg.get('migrationPath');
      const token = cfg.get('migrationToken');
      const url = new URL(getUrl(baseUrl, migrationPath), baseUrl);
      if (token) {
        url.searchParams.set('token', token);
      }

      output.appendLine(`[PalStory] Running migration: ${url.toString()}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeout);

      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* leave as text */ }

      if (!res.ok) {
        vscode.window.showErrorMessage(`Migration HTTP ${res.status}: ${res.statusText}`);
        output.appendLine(`HTTP ${res.status}: ${res.statusText}`);
        output.appendLine(text);
        output.show(true);
        return;
      }

      if (json) {
        const success = typeof json.success === 'boolean' ? json.success : undefined;
        const msg = json.message || json.error || (success === true ? 'Migration OK' : 'Migration result');
        if (success === false) {
          vscode.window.showErrorMessage(`Migration failed: ${msg}`);
        } else {
          vscode.window.showInformationMessage(`Migration completed: ${msg}`);
        }
        output.appendLine('--- Migration JSON Response ---');
        output.appendLine(JSON.stringify(json, null, 2));
        output.appendLine('--------------------------------');
      } else {
        vscode.window.showInformationMessage('Migration completed (non-JSON response).');
        output.appendLine('--- Migration Response (text) ---');
        output.appendLine(text);
        output.appendLine('---------------------------------');
      }
      output.show(true);
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      vscode.window.showErrorMessage(`Migration error: ${msg}`);
    }
  };

  const openGame = async () => {
    const cfg = getCfg();
    const baseUrl = cfg.get('baseUrl');
    const gamePath = cfg.get('gamePath');
    const webPort = cfg.get('webPort');
    // Use URL to attach port reliably
    const urlObj = new URL(getUrl(baseUrl, gamePath), baseUrl);
    if (webPort) { urlObj.port = String(webPort); }
    vscode.env.openExternal(vscode.Uri.parse(urlObj.toString()));
  };

  const openPhpMyAdmin = async () => {
    const cfg = getCfg();
    const baseUrl = cfg.get('baseUrl');
    const pmaPort = cfg.get('phpMyAdminPort');
    // Open base with phpMyAdmin port (no extra path needed)
    const urlObj = new URL(baseUrl);
    if (pmaPort) { urlObj.port = String(pmaPort); }
    vscode.env.openExternal(vscode.Uri.parse(urlObj.toString()));
  };

  const dockerComposeUp = async () => {
    try {
      const cfg = getCfg();
      /** @type {string} */
      const lampPath = cfg.get('lampPath');
      if (!lampPath) {
        vscode.window.showErrorMessage('PalStory LAMP path is not configured (palstory.lampPath).');
        return;
      }
      output.appendLine(`[PalStory] Docker Compose Up in: ${lampPath}`);
      const term = vscode.window.createTerminal({ name: 'PalStory LAMP', cwd: lampPath });
      term.show(true);
      term.sendText('docker compose up -d', true);
      vscode.window.showInformationMessage('Running: docker compose up -d (PalStory LAMP)');
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      vscode.window.showErrorMessage(`Docker compose error: ${msg}`);
    }
  };

  const dockerComposeDown = async () => {
    try {
      const cfg = getCfg();
      /** @type {string} */
      const lampPath = cfg.get('lampPath');
      if (!lampPath) {
        vscode.window.showErrorMessage('PalStory LAMP path is not configured (palstory.lampPath).');
        return;
      }
      output.appendLine(`[PalStory] Docker Compose Down in: ${lampPath}`);
      const term = vscode.window.createTerminal({ name: 'PalStory LAMP', cwd: lampPath });
      term.show(true);
      term.sendText('docker compose down', true);
      vscode.window.showInformationMessage('Running: docker compose down (PalStory LAMP)');
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      vscode.window.showErrorMessage(`Docker compose error: ${msg}`);
    }
  };

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('palstory.runMigration', runMigration),
    vscode.commands.registerCommand('palstory.openGame', openGame),
    vscode.commands.registerCommand('palstory.openPhpMyAdmin', openPhpMyAdmin),
    vscode.commands.registerCommand('palstory.dockerComposeUp', dockerComposeUp),
    vscode.commands.registerCommand('palstory.dockerComposeDown', dockerComposeDown),
    vscode.commands.registerCommand('palstory.quickActions', quickActions),
  );

  // Status bar button
  let statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusItem.command = 'palstory.quickActions';
  statusItem.text = '$(chevron-up) Pal Actions';
  statusItem.tooltip = 'PalStory Quick Actions (menu)';

  const applyStatusVisibility = () => {
    const show = getCfg().get('showStatusBarMigration');
    if (show) statusItem.show(); else statusItem.hide();
  };

  applyStatusVisibility();
  context.subscriptions.push(statusItem);

  // React to config changes for show/hide
  const cfgWatcher = vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('palstory.showStatusBarMigration')) {
      applyStatusVisibility();
    }
  });
  context.subscriptions.push(cfgWatcher);
}

function deactivate() {}

module.exports = { activate, deactivate };
