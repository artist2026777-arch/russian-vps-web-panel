const socket = io();

// Initialize xterm.js
const term = new Terminal({
    cursorBlink: true,
    theme: {
        background: '#000000',
        foreground: '#f0f0f0'
    },
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: 14
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
fitAddon.fit();

// Handle resizing
window.addEventListener('resize', () => {
    fitAddon.fit();
    socket.emit('resize', { cols: term.cols, rows: term.rows });
});

// Send Input
term.onData(data => {
    socket.emit('terminal-input', data);
});

// Receive Output
socket.on('terminal-output', data => {
    term.write(data);
});

// Update Stats
socket.on('stats', data => {
    document.getElementById('cpu-val').innerText = data.cpu + '%';
    document.getElementById('ram-val').innerText = `${data.ramUsed} / ${data.ramTotal} GB`;
    document.getElementById('uptime-val').innerText = data.uptime + ' ч.';
});

// Initial greeting
term.writeln('\x1b[1;32mДобро пожаловать в вашу VPS Веб-Панель!\x1b[0m');
term.writeln('Соединение установлено...');
term.writeln('');