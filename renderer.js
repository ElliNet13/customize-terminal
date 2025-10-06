const { Terminal } = require('@xterm/xterm');
const { FitAddon } = require('@xterm/addon-fit');
const { ipcRenderer } = require('electron');

const params = new URLSearchParams(window.location.search);
const windowId = params.get('windowId');

const term = new Terminal();
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
fitAddon.fit();

// Send user input to main process PTY
term.onData((data) => ipcRenderer.send(`pty-input-${windowId}`, data));

// Receive data from PTY
ipcRenderer.on('pty-data', (_, data) => {
  term.write(data);
});

// Handle window resize
window.addEventListener('resize', () => {
  fitAddon.fit();
  ipcRenderer.send(`pty-resize-${windowId}`, term.cols, term.rows);
});
