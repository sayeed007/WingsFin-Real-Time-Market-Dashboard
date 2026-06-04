import { z } from 'zod';

export const symbolTypeSchema = z.enum(['INDEX', 'STOCK']);

export const indexUpdateSchema = z.object({
  index_id: z.string().min(1).max(32),
  time: z.number().int().positive().optional(),
  capital_value: z.number().nonnegative(),
  percentage_change_from_yesterday_close_value: z.number(),
});

export const stockUpdateSchema = z.object({
  trade_code: z.string().min(1).max(32),
  time: z.number().int().positive().optional(),
  close_price: z.number().nonnegative(),
  yesterday_close_price: z.number().nonnegative(),
});

export const subscribeSchema = z.object({
  type: symbolTypeSchema,
  symbol: z.string().min(1).max(32),
});

export type IndexUpdateInput = z.infer<typeof indexUpdateSchema>;
export type StockUpdateInput = z.infer<typeof stockUpdateSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
