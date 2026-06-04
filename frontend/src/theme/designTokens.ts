import type { PointStatus } from '../types/market'

export const brandTokens = {
  border: '#DCE7DC',
  danger: '#F52738',
  green: '#4EB648',
  greenDeep: '#359F2F',
  greenHover: '#43AA3D',
  ink: '#282B2A',
  layout: '#F5F7F3',
  shadow: '0 22px 58px rgba(40, 43, 42, 0.11)',
  surface: '#FFFFFF',
  surfaceGreen: '#EEF8ED',
  surfaceSoft: '#F7FAF6',
  text: '#7A7A7A',
  violet: '#7327F5',
  magenta: '#EE27F5',
  controlOutline: 'rgb(78 182 72 / 0.26)',
} as const

export const fontTokens = {
  sans: '"Open Sans", Arial, sans-serif',
  serif: '"Bree Serif", Georgia, serif',
} as const

export const pointColors = {
  above: brandTokens.violet,
  below: brandTokens.danger,
  equal: brandTokens.magenta,
} satisfies Record<PointStatus, string>
