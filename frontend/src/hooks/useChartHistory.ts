import { useQuery } from '@tanstack/react-query'

import { fetchChartHistory } from '../api/chartApi'
import type { SymbolType } from '../types/market'

export function useChartHistory(params: {
  type: SymbolType
  symbol: string
  enabled: boolean
}) {
  return useQuery({
    queryKey: ['chart-history', params.type, params.symbol],
    queryFn: () => fetchChartHistory({ type: params.type, symbol: params.symbol }),
    enabled: params.enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  })
}
