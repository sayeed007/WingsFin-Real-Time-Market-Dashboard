import type { Socket } from 'socket.io';

import type { SymbolType } from '@src/modules/market/market.types';

const activeRooms = new WeakMap<Socket, string>();

export function roomName(type: SymbolType, symbol: string): string {
  return `${type}:${symbol}`;
}

export function replaceSubscription(
  socket: Socket,
  subscription: { type: SymbolType; symbol: string },
): string {
  const previousRoom = activeRooms.get(socket);
  if (previousRoom) {
    void socket.leave(previousRoom);
  }

  const nextRoom = roomName(subscription.type, subscription.symbol);
  void socket.join(nextRoom);
  activeRooms.set(socket, nextRoom);
  return nextRoom;
}
