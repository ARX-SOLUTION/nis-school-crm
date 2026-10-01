import { io, Socket } from 'socket.io-client';
import { tokenStore } from './token-store';

const WS_URL = import.meta.env.VITE_API_URL || '';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = tokenStore.getAccess();
    socket = io(`${WS_URL}/events`, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  const token = tokenStore.getAccess();
  if (token) {
    s.auth = { token };
    if (s.disconnected) {
      s.connect();
    }
  }
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

let prevToken = tokenStore.getAccess();
tokenStore.subscribe(() => {
  const currentToken = tokenStore.getAccess();
  if (currentToken && currentToken !== prevToken) {
    connectSocket();
  } else if (!currentToken && socket) {
    disconnectSocket();
  }
  prevToken = currentToken;
});
