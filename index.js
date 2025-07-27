const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const http = require('http');

const server = http.createServer();
const wss = new WebSocketServer({ server });

const clients = new Map();

wss.on('connection', (ws) => {
  const id = uuidv4();
  const metadata = { id };
  clients.set(ws, metadata);

  ws.send(JSON.stringify({ type: 'id', id }));

  ws.on('message', (messageAsString) => {
    const message = JSON.parse(messageAsString);
    const metadata = clients.get(ws);
    message.sender = metadata.id;

    const outbound = JSON.stringify(message);
    for (const client of clients.keys()) {
      if (client.readyState === ws.OPEN) {
        client.send(outbound);
      }
    }
  });

  ws.on('close', () => {
    const metadata = clients.get(ws);
    if (metadata) {
      const disconnectMessage = JSON.stringify({ type: 'disconnect', id: metadata.id });
      for (const client of clients.keys()) {
        if (client !== ws && client.readyState === ws.OPEN) {
          client.send(disconnectMessage);
        }
      }
      clients.delete(ws);
      console.log(`Client ${metadata.id} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
