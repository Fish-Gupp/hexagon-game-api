import * as WebSocket from 'ws';

export interface ConnectionMap {
  [sessionId: string]: WebSocket | undefined;
}

export type Group = {
  id: string;
  connectionMap: ConnectionMap;
};

export type GroupMap = { [groupId: string]: Group | undefined };

export interface MessageData {
  groupIds: string[];
  to: {
    sessionId?: string;
    groupId?: string;
  };
}
