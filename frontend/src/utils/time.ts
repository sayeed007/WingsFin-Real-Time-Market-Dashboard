export const MINUTE_MS = 60_000
export const MARKET_TIMEZONE = 'Asia/Dhaka'

export function minuteEpoch(value: string | number | Date): number {
  return Math.floor(new Date(value).getTime() / MINUTE_MS) * MINUTE_MS
}

export function formatMinute(epoch: number, timeZone = MARKET_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date(epoch))
}

export function formatDisplayTime(value: string, timeZone = MARKET_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(new Date(value))
}
