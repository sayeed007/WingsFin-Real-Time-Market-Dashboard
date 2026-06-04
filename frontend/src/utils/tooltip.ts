import { formatDisplayTime } from './time'

type TooltipData = {
  value?: [string, number]
  data?: {
    value?: [string, number]
  }
}

export function formatChartTooltip(
  params: unknown,
  reference: number,
  symbol: string,
): string {
  const first = Array.isArray(params) ? (params[0] as TooltipData | undefined) : params
  const tuple = (first as TooltipData | undefined)?.data?.value ?? (first as TooltipData | undefined)?.value

  if (!tuple) {
    return ''
  }

  const [time, value] = tuple
  const change = value - reference
  const sign = change >= 0 ? '+' : ''

  return [
    `${symbol}`,
    `Time: ${formatDisplayTime(time)}`,
    `Value: ${value.toFixed(2)}`,
    `Reference: ${reference.toFixed(2)}`,
    `Change: ${sign}${change.toFixed(2)}`,
  ].join('<br/>')
}
