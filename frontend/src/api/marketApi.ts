import { apiGet } from './client'
import type { MarketStatusResponse, SymbolsResponse } from '../types/market'

export function fetchMarketStatus(): Promise<MarketStatusResponse> {
  return apiGet<MarketStatusResponse>('/api/market/status')
}

export function fetchSymbols(): Promise<SymbolsResponse> {
  return apiGet<SymbolsResponse>('/api/symbols')
}
