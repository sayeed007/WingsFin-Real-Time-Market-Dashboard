import { useQuery } from '@tanstack/react-query'

import { fetchMarketStatus, fetchSymbols } from '../api/marketApi'

export function useMarketStatus() {
  return useQuery({
    queryKey: ['market-status'],
    queryFn: fetchMarketStatus,
    staleTime: 10_000,
    refetchInterval: 30_000,
  })
}

export function useSymbols() {
  return useQuery({
    queryKey: ['symbols'],
    queryFn: fetchSymbols,
    staleTime: 5 * 60_000,
  })
}
