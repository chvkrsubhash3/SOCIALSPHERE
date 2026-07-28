import { Server as SocketServer } from 'socket.io';

export function setupSocketHandlers(io: SocketServer) {
  io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });
}
