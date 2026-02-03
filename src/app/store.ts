import Store from 'electron-store';

export interface ServerConnection {
  id: string;
  name: string;
  ipAddress: string;
  port: string;
  username: string;
  password: string;
  createdAt: number;
  lastUsed?: number;
}

interface StoreSchema {
  connections: ServerConnection[];
  activeConnectionId: string | null;
}

const store = new Store<StoreSchema>({
  name: 'ams2-dedicated-server-toolbox',
  defaults: {
    connections: [],
    activeConnectionId: null,
  },
});

export default store;