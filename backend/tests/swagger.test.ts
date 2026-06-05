import { swaggerSpec } from '@src/config/swagger';

describe('swaggerSpec', () => {
  it('documents every public API path without JSDoc scanning', () => {
    expect(Object.keys(swaggerSpec.paths).sort()).toEqual([
      '/audit/events',
      '/chart/history',
      '/health',
      '/market/status',
      '/simulate/index',
      '/simulate/stock',
      '/symbols',
    ]);
  });
});
