import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import session from 'express-session';

import indexRouter from './routes/index';
import { ConnectionMap, Group, GroupMap, MessageData } from './types';

const port = process.env.PORT || 3001;
const pingTimeoutMs = 10000;

const app = express();
const sessionParser = session({
  resave: false,
  saveUninitialized: true,
  secret: 'hexagon is the bestagon',
});
app.use(sessionParser);

app.use('/', indexRouter);

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const groupMap: GroupMap = {};
const connectionMap: ConnectionMap = {};
const groupAuthorities: { [id: string]: string | undefined } = {};
const pingTimes: { [id: string]: number } = {};

wss.on('connection', (ws: WebSocket, req: any) => {
  const sessionId: string = req.session.id;

  const close = () => {
    groupAuthorities[sessionId] = undefined;
    connectionMap[sessionId] = undefined;
    Object.values(groupMap).forEach((group) => {
      if (group) {
        group.connectionMap[sessionId] = undefined;
      }
    });
    ws.close();
  };

  if (!sessionId) {
    close();
    throw new Error('Invalid connection attempt.');
  }

  // connections by sessionId
  connectionMap[sessionId] = ws;
  pingTimes[sessionId] = new Date().getTime();

  // MOTD
  ws.send('Hi there, I am a WebSocket server ' + sessionId);

  const intervalRef = setInterval(() => {
    if (new Date().getTime() > pingTimes[sessionId] + pingTimeoutMs) {
      clearInterval(intervalRef);
      close();
    }
  }, 3000);

  ws.on('message', (message: string) => {
    try {
      console.log('received: %s', message);
      pingTimes[sessionId] = new Date().getTime();
      const parsed: MessageData = JSON.parse(message);
      const data: MessageData = {
        ...parsed,
        from: sessionId,
        groupAuthorities: parsed.groupIds.map((groupId: string) => {
          if (!groupAuthorities[groupId]) {
            groupAuthorities[groupId] = sessionId;
          }
          return groupAuthorities[groupId] || sessionId;
        }),
      };

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
          toWs.send(JSON.stringify(data));
        }
      }

      // send group messages
      if (data.to.groupId) {
        const group = groupMap[data.to.groupId];
        if (group) {
          Object.values(group.connectionMap).forEach((toWs) => {
            if (toWs && toWs.OPEN) {
              toWs.send(JSON.stringify(data));
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
