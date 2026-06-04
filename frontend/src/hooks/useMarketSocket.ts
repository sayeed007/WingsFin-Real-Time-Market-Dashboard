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
}) {
  const { enabled, onClosed, onUpdate, symbol, type } = params
  const onUpdateRef = useRef(params.onUpdate)
  const onClosedRef = useRef(params.onClosed)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    onClosedRef.current = onClosed
  }, [onClosed])

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

    socket.on('connect', subscribe)
    socket.on('market:update', (payload: MarketUpdatePayload) => {
      if (payload.type === type && payload.symbol === symbol) {
        onUpdateRef.current(payload)
      }
    })
    socket.on('market:closed', () => {
      onClosedRef.current()
    })

    return () => {
      socket.off('connect', subscribe)
      socket.off('market:update')
      socket.off('market:closed')
      socket.disconnect()
    }
  }, [enabled, symbol, type])
}
