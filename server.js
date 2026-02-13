const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const os = require('os');
const pty = require('node-pty');
const si = require('systeminformation');

const PORT = process.env.PORT || 3000;

// Static files
app.use(express.static('public'));

// System Stats Loop
setInterval(async () => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const disk = await si.fsSize();
    
    io.emit('stats', {
      cpu: Math.round(cpu.currentLoad),
      ramUsed: (mem.active / 1024 / 1024 / 1024).toFixed(2),
      ramTotal: (mem.total / 1024 / 1024 / 1024).toFixed(2),
      uptime: (os.uptime() / 3600).toFixed(1)
    });
  } catch (e) {
    console.error('Stats error', e);
  }
}, 2000);

// Terminal Session
io.on('connection', (socket) => {
  console.log('Новое подключение / New connection');

  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  // Send data from PTY to Client
  ptyProcess.on('data', (data) => {
    socket.emit('terminal-output', data);
  });

  // Receive input from Client
  socket.on('terminal-input', (data) => {
    ptyProcess.write(data);
  });

  // Handle resize
  socket.on('resize', (size) => {
    ptyProcess.resize(size.cols, size.rows);
  });

  socket.on('disconnect', () => {
    ptyProcess.kill();
  });
});

http.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});