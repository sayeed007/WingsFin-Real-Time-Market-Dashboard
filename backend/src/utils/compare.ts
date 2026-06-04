import type { PointStatus } from '@src/modules/market/market.types';

const EPSILON = 0.0001;

export function compareToReference(value: number, reference: number): PointStatus {
  if (Math.abs(value - reference) < EPSILON) {
    return 'equal';
  }
  return value > reference ? 'above' : 'below';
}

export function roundMarketValue(value: number): number {
  return Number(value.toFixed(4));
}
