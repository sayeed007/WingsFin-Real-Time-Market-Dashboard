import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

import { env } from '@src/config/env';
import type {
  MarketUpdatePayload,
  SymbolType,
} from '@src/modules/market/market.types';
import {
  replaceSubscription,
  roomName,
} from '@src/modules/realtime/subscription.store';
import { subscribeSchema } from '@src/validation/marketPayload.schema';

let io: Server | undefined;

export function attachSocketServer(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: env.corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('subscribe', (payload) => {
      const result = subscribeSchema.safeParse(payload);
      if (!result.success) {
        socket.emit('subscription:error', {
          message: 'Invalid subscription payload.',
        });
        return;
      }

      replaceSubscription(socket, result.data);
      socket.emit('subscription:ready', result.data);
    });
  });

  return io;
}

export function emitMarketUpdate(payload: MarketUpdatePayload): void {
  io?.to(roomName(payload.type, payload.symbol)).emit('market:update', payload);
}

export function emitMarketClosed(payload: {
  message: string;
  closedAt: string;
}): void {
  io?.emit('market:closed', payload);
}

export async function closeSocketServer(): Promise<void> {
  if (!io) {
    return;
  }

  const server = io;
  io = undefined;
  await server.close();
}

export function getSocketRoomSize(type: SymbolType, symbol: string): number {
  const adapter = io?.sockets.adapter;
  return adapter?.rooms.get(roomName(type, symbol))?.size ?? 0;
}
