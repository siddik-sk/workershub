const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./sockets');

let server;

async function start() {
  await connectDB();
  server = http.createServer(app);
  initSocket(server);

  server.listen(config.port, () => {
    console.log(`WorkConnect API listening on http://localhost:${config.port} (${config.nodeEnv})`);
  });
}

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  } else {
    await disconnectDB();
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
