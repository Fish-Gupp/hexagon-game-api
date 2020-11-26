import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import session from 'express-session';

import indexRouter from './routes/index';
import { ConnectionMap, Group, GroupMap, MessageData } from './types';

const port = process.env.PORT || 3001;

const app = express();
const sessionParser = session({
  resave: false,
  secret: 'hexagon is the bestagon',
});
app.use(sessionParser);

app.use('/', indexRouter);

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const groupMap: GroupMap = {};
const connectionMap: ConnectionMap = {};

wss.on('connection', (ws: WebSocket, req: any) => {
  const sessionId: string = req.session.id;

  if (!sessionId) {
    throw new Error('Invalid connection attempt.');
  }

  // connections by sessionId
  connectionMap[sessionId] = ws;

  // MOTD
  ws.send('Hi there, I am a WebSocket server ' + sessionId);

  ws.on('message', (message: string) => {
    console.log('received: %s', message);
    ws.send(`Hello, you sent -> ${message}`);
    try {
      const data: MessageData = JSON.parse(message);

      // connections by groupId
      if (!data.groupIds || data.groupIds.constructor !== [].constructor) {
        throw new Error('Invalid groups.');
      }
      data.groupIds.forEach((groupId) => {
        const group: Group = groupMap[groupId] || {
          connectionMap: {},
          id: groupId,
        };
        group.connectionMap[sessionId] = ws;
        groupMap[groupId] = group;
      });

      if (data.to.sessionId && data.to.groupId) {
        throw new Error('Invalid destination.');
      }

      // send direct messages
      if (data.to.sessionId) {
        const toWs = connectionMap[data.to.sessionId];
        if (toWs && toWs.OPEN) {
          toWs.send(message);
        }
      }

      // send group messages
      if (data.to.groupId) {
        const group = groupMap[data.to.groupId];
        if (group) {
          Object.values(group.connectionMap).forEach((toWs) => {
            if (toWs && toWs.OPEN) {
              toWs.send(message);
            }
          });
        }
      }
    } catch (e) {
      ws.send('Invalid messgae.');
    }
  });
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
