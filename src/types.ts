import * as WebSocket from 'ws';

export interface ConnectionMap {
  [sessionId: string]: WebSocket | undefined;
}

export type Group = {
  connectionMap: ConnectionMap;
  id: string;
};

export type GroupMap = { [groupId: string]: Group | undefined };

export interface MessageData {
  from: string;
  groupIds: string[];
  groupAuthorities: string[];
  to: {
    sessionId?: string;
    groupId?: string;
  };
}
