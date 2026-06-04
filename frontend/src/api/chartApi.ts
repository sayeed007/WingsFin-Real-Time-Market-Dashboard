import { apiGet } from './client'
import type { ChartHistoryResponse, SymbolType } from '../types/market'

export function fetchChartHistory(params: {
  type: SymbolType
  symbol: string
}): Promise<ChartHistoryResponse> {
  const search = new URLSearchParams({
    type: params.type,
    symbol: params.symbol,
  })
  return apiGet<ChartHistoryResponse>(`/api/chart/history?${search.toString()}`)
}
