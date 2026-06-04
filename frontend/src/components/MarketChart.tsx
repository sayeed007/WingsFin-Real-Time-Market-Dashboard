import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { useMemo } from 'react'
import { Card, Tag, Typography, theme } from 'antd'

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
  const { token } = theme.useToken()

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
        top: 20,
        right: 28,
        bottom: 34,
        left: 56,
        containLabel: true,
      },
      tooltip: {
        backgroundColor: token.colorBgElevated,
        borderColor: token.colorBorderSecondary,
        trigger: 'item',
        textStyle: {
          color: token.colorText,
          fontFamily: token.fontFamily,
        },
        formatter: (params: unknown) =>
          formatChartTooltip(params, yesterdayClose, symbol, timezone),
      },
      xAxis: {
        type: 'time',
        min: sessionStart,
        max: sessionEnd,
        axisLabel: {
          color: token.colorTextDescription,
          formatter: (value: number) => formatMinute(value, timezone),
          hideOverlap: true,
        },
        axisLine: {
          lineStyle: {
            color: token.colorBorderSecondary,
          },
        },
        axisTick: {
          lineStyle: {
            color: token.colorBorderSecondary,
          },
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: {
          color: token.colorTextDescription,
        },
        splitLine: {
          lineStyle: {
            color: token.colorBorderSecondary,
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
            color: token.colorTextHeading,
            width: 2,
          },
          markLine: {
            symbol: 'none',
            silent: true,
            data: [{ yAxis: yesterdayClose }],
            lineStyle: {
              type: 'dashed',
              color: token.colorPrimaryActive,
              width: 1.5,
            },
            label: {
              color: token.colorTextDescription,
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
            color: latestPoint ? POINT_COLORS[latestPoint.status] : POINT_COLORS.above,
          },
          zlevel: 2,
        },
      ],
    }
  }, [
    points,
    sessionStart,
    sessionEnd,
    yesterdayClose,
    symbol,
    latestPoint,
    timezone,
    token.colorBgElevated,
    token.colorBorderSecondary,
    token.colorPrimaryActive,
    token.colorText,
    token.colorTextDescription,
    token.colorTextHeading,
    token.fontFamily,
  ])

  return (
    <Card
      className="relative overflow-hidden !border-[var(--border)] !bg-[var(--surface)] shadow-[var(--shadow)]"
      classNames={{ body: 'p-4' }}
      variant="outlined"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--brand-green),var(--brand-green-deep))]" />
      <div className="mb-1 flex items-start justify-between gap-4 pt-1 max-[860px]:grid">
        <div>
          <Tag
            className="!m-0 !mb-1.5 inline-flex rounded-full !bg-[var(--surface-green)] px-2.5 py-[3px] text-[11px] font-extrabold tracking-[0.06em] !text-[var(--brand-green-deep)]"
            color="success"
            variant="filled"
          >
            {type}
          </Tag>
          <Typography.Title
            className="!m-0 ![font-family:var(--serif)] !text-[24px] !font-medium !leading-[1.12] !text-[var(--brand-ink)] max-[860px]:!text-[22px]"
            level={2}
          >
            {symbol} {type === 'INDEX' ? 'Index' : 'Stock'}
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !mt-1 !text-[14px] !text-[var(--brand-text)]">
            Yesterday close: {yesterdayClose.toFixed(2)}
          </Typography.Paragraph>
        </div>
        {latestPoint ? <LatestValueBadge value={latestPoint.value} type={type} /> : null}
      </div>
      <ReactECharts
        option={option}
        className="h-[clamp(460px,calc(100vh_-_390px),640px)] w-full max-[860px]:h-[430px]"
        lazyUpdate
      />
    </Card>
  )
}
