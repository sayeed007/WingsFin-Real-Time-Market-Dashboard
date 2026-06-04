import {
  indexUpdateSchema,
  stockUpdateSchema,
  subscribeSchema,
} from '@src/validation/marketPayload.schema';

describe('market payload validation', () => {
  describe('index update', () => {
    it('accepts valid index payloads', () => {
      const result = indexUpdateSchema.safeParse({
        index_id: 'DSEX',
        capital_value: 5222.22,
        percentage_change_from_yesterday_close_value: 4.12,
      });

      expect(result.success).toBe(true);
    });

    it('accepts index payload with optional time', () => {
      const result = indexUpdateSchema.safeParse({
        index_id: 'DSEX',
        time: 1779336701000,
        capital_value: 5222.22,
        percentage_change_from_yesterday_close_value: 4.12,
      });

      expect(result.success).toBe(true);
    });

    it('rejects empty index_id', () => {
      const result = indexUpdateSchema.safeParse({
        index_id: '',
        capital_value: 5222.22,
        percentage_change_from_yesterday_close_value: 4.12,
      });

      expect(result.success).toBe(false);
    });

    it('rejects negative capital_value', () => {
      const result = indexUpdateSchema.safeParse({
        index_id: 'DSEX',
        capital_value: -1,
        percentage_change_from_yesterday_close_value: 4.12,
      });

      expect(result.success).toBe(false);
    });

    it('accepts zero capital_value', () => {
      const result = indexUpdateSchema.safeParse({
        index_id: 'DSEX',
        capital_value: 0,
        percentage_change_from_yesterday_close_value: 0,
      });

      expect(result.success).toBe(true);
    });

    it('accepts negative percentage change', () => {
      const result = indexUpdateSchema.safeParse({
        index_id: 'DSEX',
        capital_value: 5100,
        percentage_change_from_yesterday_close_value: -1.92,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('stock update', () => {
    it('accepts valid stock payloads', () => {
      const result = stockUpdateSchema.safeParse({
        trade_code: 'GP',
        close_price: 238.79,
        yesterday_close_price: 238.88,
      });

      expect(result.success).toBe(true);
    });

    it('accepts stock payload with optional time', () => {
      const result = stockUpdateSchema.safeParse({
        trade_code: 'GP',
        time: 1779336913000,
        close_price: 238.79,
        yesterday_close_price: 238.88,
      });

      expect(result.success).toBe(true);
    });

    it('rejects negative close_price', () => {
      const result = stockUpdateSchema.safeParse({
        trade_code: 'GP',
        close_price: -1,
        yesterday_close_price: 238.88,
      });

      expect(result.success).toBe(false);
    });

    it('accepts zero yesterday_close_price', () => {
      const result = stockUpdateSchema.safeParse({
        trade_code: 'GP',
        close_price: 238.79,
        yesterday_close_price: 0,
      });

      expect(result.success).toBe(true);
    });

    it('rejects empty trade_code', () => {
      const result = stockUpdateSchema.safeParse({
        trade_code: '',
        close_price: 238.79,
        yesterday_close_price: 238.88,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('subscribe', () => {
    it('accepts valid subscribe payload', () => {
      const result = subscribeSchema.safeParse({
        type: 'INDEX',
        symbol: 'DSEX',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid type', () => {
      const result = subscribeSchema.safeParse({
        type: 'FUTURE',
        symbol: 'DSEX',
      });

      expect(result.success).toBe(false);
    });

    it('rejects empty symbol', () => {
      const result = subscribeSchema.safeParse({
        type: 'STOCK',
        symbol: '',
      });

      expect(result.success).toBe(false);
    });
  });
});
