import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { useMemo } from 'react'

import type { ChartPoint, SymbolType } from '../types/market'
import { POINT_COLORS } from '../utils/chartColors'
import { formatMinute } from '../utils/time'
import { formatChartTooltip } from '../utils/tooltip'
import { LatestValueBadge } from './LatestValueBadge'

type MarketChartProps = {
  symbol: string
  type: SymbolType
  points: ChartPoint[]
  sessionStart: string
  sessionEnd: string
  yesterdayClose: number
  timezone: string
}

export function MarketChart({
  symbol,
  type,
  points,
  sessionStart,
  sessionEnd,
  yesterdayClose,
  timezone,
}: MarketChartProps) {
  const latestPoint = points[points.length - 1]

  const option = useMemo<EChartsOption>(() => {
    const seriesData = points.map((point) => ({
      value: [point.time, point.value],
      itemStyle: {
        color: POINT_COLORS[point.status],
      },
    }))

    return {
      animation: true,
      grid: {
        top: 42,
        right: 28,
        bottom: 42,
        left: 56,
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) =>
          formatChartTooltip(params, yesterdayClose, symbol, timezone),
      },
      xAxis: {
        type: 'time',
        min: sessionStart,
        max: sessionEnd,
        axisLabel: {
          formatter: (value: number) => formatMinute(value, timezone),
          hideOverlap: true,
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine: {
          lineStyle: {
            color: '#E6ECE5',
          },
        },
      },
      series: [
        {
          name: symbol,
          type: 'line',
          showSymbol: true,
          symbolSize: 7,
          smooth: false,
          data: seriesData,
          lineStyle: {
            color: '#282B2A',
            width: 2,
          },
          markLine: {
            symbol: 'none',
            silent: true,
            data: [{ yAxis: yesterdayClose }],
            lineStyle: {
              type: 'dashed',
              color: '#359F2F',
              width: 1.5,
            },
            label: {
              formatter: 'Yesterday close',
            },
          },
        },
        {
          name: 'Latest',
          type: 'effectScatter',
          data: latestPoint ? [[latestPoint.time, latestPoint.value]] : [],
          symbolSize: 10,
          rippleEffect: {
            scale: 3,
            brushType: 'stroke',
          },
          itemStyle: {
            color: latestPoint ? POINT_COLORS[latestPoint.status] : '#7327F5',
          },
          zlevel: 2,
        },
      ],
    }
  }, [points, sessionStart, sessionEnd, yesterdayClose, symbol, latestPoint, timezone])

  return (
    <section className="chart-panel">
      <div className="chart-panel__header">
        <div>
          <span className="instrument-badge">{type}</span>
          <h2>
            {symbol} {type === 'INDEX' ? 'Index' : 'Stock'}
          </h2>
          <p>Yesterday close: {yesterdayClose.toFixed(2)}</p>
        </div>
        {latestPoint ? <LatestValueBadge value={latestPoint.value} type={type} /> : null}
      </div>
      <ReactECharts option={option} className="chart" lazyUpdate />
    </section>
  )
}
