import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeWebSocket } from './app/lib/websocket.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 1234;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize WebSocket server
  const io = initializeWebSocket(server);
  console.log('WebSocket server initialized');

  // Start the server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});