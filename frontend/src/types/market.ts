export type SymbolType = 'INDEX' | 'STOCK'
export type PointStatus = 'above' | 'below' | 'equal'

export type MarketStatusResponse = {
  isOpen: boolean
  timezone: string
  marketOpenTime: string
  marketCloseTime: string
  sessionStart: string
  sessionEnd: string
  currentTime: string
  message?: string
}

export type MarketSymbol = {
  symbol: string
  type: SymbolType
  displayName: string | null
  yesterdayClose: number
}

export type SymbolsResponse = {
  symbols: MarketSymbol[]
}

export type ChartPoint = {
  time: string
  minute: string
  value: number
  status: PointStatus
}

export type ChartHistoryResponse = {
  symbol: string
  type: SymbolType
  isMarketOpen: boolean
  timezone: string
  sessionStart: string
  sessionEnd: string
  currentMinute: string
  yesterdayClose: number
  latestValue: number
  points: ChartPoint[]
}

export type MarketUpdatePayload = {
  symbol: string
  type: SymbolType
  time: string
  minuteTime: string
  value: number
  yesterdayClose: number
  status: PointStatus
}
