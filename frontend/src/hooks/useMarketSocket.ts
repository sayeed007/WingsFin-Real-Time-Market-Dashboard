import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

import { SOCKET_URL } from '../api/client'
import type { MarketUpdatePayload, SymbolType } from '../types/market'

export function useMarketSocket(params: {
  enabled: boolean
  type: SymbolType
  symbol: string
  onUpdate: (payload: MarketUpdatePayload) => void
  onClosed: () => void
  onReconnect?: () => void
}) {
  const { enabled, onClosed, onReconnect, onUpdate, symbol, type } = params
  const onUpdateRef = useRef(params.onUpdate)
  const onClosedRef = useRef(params.onClosed)
  const onReconnectRef = useRef(params.onReconnect)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    onClosedRef.current = onClosed
  }, [onClosed])

  useEffect(() => {
    onReconnectRef.current = onReconnect
  }, [onReconnect])

  useEffect(() => {
    if (!enabled || !symbol) {
      return undefined
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    })

    const subscribe = () => {
      socket.emit('subscribe', { type, symbol })
    }

    const handleReconnect = () => {
      onReconnectRef.current?.()
    }

    socket.on('connect', subscribe)
    socket.on('market:update', (payload: MarketUpdatePayload) => {
      if (payload.type === type && payload.symbol === symbol) {
        onUpdateRef.current(payload)
      }
    })
    socket.on('market:closed', () => {
      onClosedRef.current()
    })
    // Manager-level reconnect: re-fetch authoritative history to heal any gap
    // missed while the socket was down (subscribe also re-fires via 'connect').
    socket.io.on('reconnect', handleReconnect)

    return () => {
      socket.off('connect', subscribe)
      socket.off('market:update')
      socket.off('market:closed')
      socket.io.off('reconnect', handleReconnect)
      socket.disconnect()
    }
  }, [enabled, symbol, type])
}
