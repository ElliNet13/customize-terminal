import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import pty from 'node-pty';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

const store = new Store();

// These two lines recreate __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveWithPATH(fileName) {
  // If it's already an absolute path, just return it if it exists
  if (path.isAbsolute(fileName) && fs.existsSync(fileName)) {
    return fileName;
  }

  // Get PATH dirs
  const pathDirs = process.env.PATH.split(path.delimiter); // ; on Windows

  // Search each dir
  for (const dir of pathDirs) {
    const fullPath = path.join(dir, fileName);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Not found
  return null;
}


let ptyProcess;

function windowsTerminalPreference() {
  const preference = store.get('windowsTerminalPreference');
  if (preference) {
    return preference;
  }

  return new Promise((resolve, reject) => {
    const prefWin = new BrowserWindow({
      width: 400,
      height: 300,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    prefWin.loadFile(path.join(__dirname, 'preference.html'));

    // Listen for preference from renderer
    ipcMain.once('terminal-choice', (_, pref) => {
      const terminalPath = resolveWithPATH(pref);

      if (!terminalPath) {
        prefWin.webContents.send('error', 'The specified terminal was not found in your PATH. Please try again.');
        reject(new Error('Terminal not found'));
        prefWin.close();
        return;
      }

      store.set('windowsTerminalPreference', terminalPath);
      resolve(terminalPath);
      prefWin.close();
    });
  });
}


function createTerminalWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'), {
    query: {
      windowId: win.id,
    },
  });

  const shell = os.platform() === 'win32' ? windowsTerminalPreference() : process.env.SHELL;
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env: process.env,
  });

  // Send PTY data to this window only
  ptyProcess.onData((data) => {
    if (!win.isDestroyed()) {
      win.webContents.send('pty-data', data);
    }
  });

  // Window-specific IPC listeners
  const resizeListener = (_, cols, rows) => {
    ptyProcess.resize(cols, rows);
  };
  const inputListener = (_, input) => {
    ptyProcess.write(input);
  };

  ipcMain.on(`pty-resize-${win.id}`, resizeListener);
  ipcMain.on(`pty-input-${win.id}`, inputListener);

  // Clean up when window closes
  win.on('closed', () => {
    ptyProcess.kill();
    ipcMain.removeListener(`pty-resize-${win.id}`, resizeListener);
    ipcMain.removeListener(`pty-input-${win.id}`, inputListener);
  });

  return win;
}

// Update your menu template
const template = [
  {
    label: 'Window',
    submenu: [
      { 
        label: 'New Window', 
        click: () => { createTerminalWindow(); } 
      },
      { type: 'separator' },
      { label: 'Exit', role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', role: 'undo' },
      { label: 'Redo', role: 'redo' },
      { type: 'separator' },
      { label: 'Cut', role: 'cut' },
      { label: 'Copy', role: 'copy' },
      { label: 'Paste', role: 'paste' }
    ]
  },
  {
    label: "Development",
    submenu: [
      { role: 'toggleDevTools' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);

app.on('ready', () => {
  createTerminalWindow(); // open the first window
  Menu.setApplicationMenu(menu);
});
