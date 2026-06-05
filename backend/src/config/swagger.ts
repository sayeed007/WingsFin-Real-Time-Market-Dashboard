export const swaggerSpec = {
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
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
        required: ['error'],
      },
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
        required: ['id', 'timestamp', 'category', 'action', 'actor', 'severity'],
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
      Symbol: {
        type: 'object',
        properties: {
          symbol: { type: 'string' },
          type: { type: 'string', enum: ['INDEX', 'STOCK'] },
          displayName: { type: 'string', nullable: true },
          yesterdayClose: { type: 'number' },
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
      ChartHistoryResponse: {
        type: 'object',
        properties: {
          symbol: { type: 'string' },
          type: { type: 'string', enum: ['INDEX', 'STOCK'] },
          isMarketOpen: { type: 'boolean' },
          timezone: { type: 'string' },
          sessionStart: { type: 'string', format: 'date-time' },
          sessionEnd: { type: 'string', format: 'date-time' },
          currentMinute: { type: 'string', format: 'date-time' },
          yesterdayClose: { type: 'number' },
          latestValue: { type: 'number' },
          points: {
            type: 'array',
            items: { $ref: '#/components/schemas/ChartPoint' },
          },
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
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Returns service status and current server time. Also verifies database connectivity.',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    time: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          503: {
            description: 'Database unavailable',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/market/status': {
      get: {
        summary: 'Get current market session status',
        description:
          'Returns whether the Dhaka Stock Exchange is currently open, along with session start/end times and current server time in market timezone.',
        tags: ['Market'],
        responses: {
          200: {
            description: 'Market status object',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MarketStatus' },
              },
            },
          },
        },
      },
    },
    '/symbols': {
      get: {
        summary: 'List all tradeable symbols',
        description: 'Returns all registered market symbols. Response is cached for 5 minutes.',
        tags: ['Symbols'],
        responses: {
          200: {
            description: 'Array of symbols',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    symbols: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Symbol' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/chart/history': {
      get: {
        summary: 'Get chart history for a symbol',
        description:
          'Returns minute-by-minute chart data for the current trading session. When the market is closed, returns an empty points array with the last known value.',
        tags: ['Chart'],
        parameters: [
          {
            in: 'query',
            name: 'type',
            required: true,
            schema: { type: 'string', enum: ['INDEX', 'STOCK'] },
            description: 'Symbol type',
          },
          {
            in: 'query',
            name: 'symbol',
            required: true,
            schema: { type: 'string' },
            description: 'Symbol identifier, such as DSEX or GP',
          },
        ],
        responses: {
          200: {
            description: 'Chart history for the current session',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChartHistoryResponse' },
              },
            },
          },
          400: {
            description: 'Missing or invalid query parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Symbol not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/simulate/index': {
      post: {
        summary: 'Ingest an index market update',
        description:
          'Records a new market tick for an index symbol, validates the timestamp, and triggers a WebSocket broadcast to subscribed clients.',
        tags: ['Simulator'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['index_id', 'capital_value', 'percentage_change_from_yesterday_close_value'],
                properties: {
                  index_id: { type: 'string', example: 'DSEX' },
                  capital_value: { type: 'number', example: 5234.56 },
                  percentage_change_from_yesterday_close_value: { type: 'number', example: 0.65 },
                  time: {
                    type: 'integer',
                    description: 'Unix epoch milliseconds. Defaults to current server time.',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Tick recorded and broadcast',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MarketUpdatePayload' },
              },
            },
          },
          400: {
            description: 'Invalid payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          409: {
            description: 'Market is closed or future timestamp',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          429: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/simulate/stock': {
      post: {
        summary: 'Ingest a stock market update',
        description:
          'Records a new market tick for a stock symbol, validates the timestamp, and triggers a WebSocket broadcast to subscribed clients.',
        tags: ['Simulator'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['trade_code', 'close_price', 'yesterday_close_price'],
                properties: {
                  trade_code: { type: 'string', example: 'GP' },
                  close_price: { type: 'number', example: 239.5 },
                  yesterday_close_price: { type: 'number', example: 238.88 },
                  time: {
                    type: 'integer',
                    description: 'Unix epoch milliseconds. Defaults to current server time.',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Tick recorded and broadcast',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MarketUpdatePayload' },
              },
            },
          },
          400: {
            description: 'Invalid payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          409: {
            description: 'Market is closed or future timestamp',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          429: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/audit/events': {
      get: {
        summary: 'Query audit trail events',
        description:
          'Returns persisted financial audit events from the database. This endpoint is intentionally open during the current development phase.',
        tags: ['Audit'],
        parameters: [
          {
            in: 'query',
            name: 'category',
            schema: {
              type: 'string',
              enum: ['MARKET_DATA', 'SIMULATOR', 'REALTIME', 'SESSION', 'SYSTEM', 'API'],
            },
            description: 'Filter by event category',
          },
          {
            in: 'query',
            name: 'severity',
            schema: { type: 'string', enum: ['INFO', 'WARN', 'ERROR'] },
            description: 'Filter by severity level',
          },
          {
            in: 'query',
            name: 'symbol',
            schema: { type: 'string' },
            description: 'Filter by market symbol',
          },
          {
            in: 'query',
            name: 'from',
            schema: { type: 'string', format: 'date-time' },
            description: 'Start of time range in ISO 8601 format',
          },
          {
            in: 'query',
            name: 'to',
            schema: { type: 'string', format: 'date-time' },
            description: 'End of time range in ISO 8601 format',
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 500, default: 100 },
            description: 'Maximum number of events to return',
          },
        ],
        responses: {
          200: {
            description: 'List of audit events ordered by timestamp descending',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    events: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AuditEvent' },
                    },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid audit query filter',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          429: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
} as const;
