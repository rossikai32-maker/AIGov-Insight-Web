const path = require('path');
const { createServer } = require('http');

const dir = path.join(__dirname);

process.env.NODE_ENV = 'production';
process.chdir(__dirname);

const currentPort = parseInt(process.env.PORT, 10) || 3000;
const listenHost = process.env.LISTEN_HOST || '0.0.0.0';

const next = require('next');
const app = next({ 
  dev: false, 
  dir
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(handle);
  
  server.listen(currentPort, listenHost, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`> Ready on http://${listenHost}:${currentPort}`);
  });
  
  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err);
  process.exit(1);
});
