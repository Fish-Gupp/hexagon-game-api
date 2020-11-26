import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import session from 'express-session';

import indexRouter from './routes/index';

const port = process.env.PORT || 3001;

const app = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
const sessionParser = session({
  resave: false,
  secret: 'hexagon is the bestagon',
});
app.use(sessionParser);

app.use('/', indexRouter);

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws: WebSocket, req: any) => {
  ws.on('message', (message: string) => {
    console.log('received: %s', message);
    ws.send(`Hello, you sent -> ${message}`);
  });
  ws.send('Hi there, I am a WebSocket server ' + req.session.id);
});

server.on('upgrade', (req, socket, head) => {
  sessionParser(req, {} as any, () => {
    wss.handleUpgrade(req, socket, head, (socket) => {
      wss.emit('connection', socket, req);
    });
  });
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
