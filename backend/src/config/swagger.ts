import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'WingsFin Market Dashboard API',
      version: '1.0.0',
      description:
        'Real-time financial market data API for the WingsFin dashboard. ' +
        'Provides market status, symbol listings, historical chart data, ' +
        'market simulation endpoints, and a full financial audit trail.',
      contact: {
        name: 'WingsFin',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API base path',
      },
    ],
    tags: [
      { name: 'Health', description: 'Service health check' },
      { name: 'Market', description: 'Market session status' },
      { name: 'Symbols', description: 'Tradeable instruments' },
      { name: 'Chart', description: 'Historical chart data' },
      { name: 'Simulator', description: 'Market data ingestion / simulation' },
      { name: 'Audit', description: 'Financial event audit trail' },
    ],
    components: {
      schemas: {
        AuditEvent: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            category: {
              type: 'string',
              enum: ['MARKET_DATA', 'SIMULATOR', 'REALTIME', 'SESSION', 'SYSTEM', 'API'],
            },
            action: { type: 'string' },
            actor: { type: 'string' },
            severity: { type: 'string', enum: ['INFO', 'WARN', 'ERROR'] },
            symbol: { type: 'string', nullable: true },
            symbolType: { type: 'string', enum: ['INDEX', 'STOCK'], nullable: true },
            value: { type: 'number', nullable: true },
            durationMs: { type: 'integer', nullable: true },
            meta: { type: 'object', nullable: true },
          },
        },
        MarketStatus: {
          type: 'object',
          properties: {
            isOpen: { type: 'boolean' },
            timezone: { type: 'string' },
            marketOpenTime: { type: 'string' },
            marketCloseTime: { type: 'string' },
            sessionStart: { type: 'string', format: 'date-time' },
            sessionEnd: { type: 'string', format: 'date-time' },
            currentTime: { type: 'string', format: 'date-time' },
            message: { type: 'string' },
          },
        },
        ChartPoint: {
          type: 'object',
          properties: {
            time: { type: 'string', format: 'date-time' },
            minute: { type: 'string' },
            value: { type: 'number' },
            status: { type: 'string', enum: ['above', 'below', 'equal'] },
          },
        },
        MarketUpdatePayload: {
          type: 'object',
          properties: {
            symbol: { type: 'string' },
            type: { type: 'string', enum: ['INDEX', 'STOCK'] },
            time: { type: 'string', format: 'date-time' },
            minuteTime: { type: 'string', format: 'date-time' },
            value: { type: 'number' },
            yesterdayClose: { type: 'number' },
            status: { type: 'string', enum: ['above', 'below', 'equal'] },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, '../modules/**/*.routes.ts'),
    path.join(__dirname, '../modules/**/*.routes.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
