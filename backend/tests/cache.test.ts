import { TtlCache, KeyedTtlCache } from '@src/utils/cache';

describe('TtlCache', () => {
  it('returns undefined before first set', () => {
    const cache = new TtlCache<string>(1000);
    expect(cache.get()).toBeUndefined();
  });

  it('returns the cached value within TTL', () => {
    const cache = new TtlCache<number>(5000);
    cache.set(42);
    expect(cache.get()).toBe(42);
  });

  it('returns undefined after TTL expires', async () => {
    const cache = new TtlCache<number>(50);
    cache.set(42);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(cache.get()).toBeUndefined();
  });

  it('invalidate clears the cache', () => {
    const cache = new TtlCache<string>(5000);
    cache.set('hello');
    cache.invalidate();
    expect(cache.get()).toBeUndefined();
  });
});

describe('KeyedTtlCache', () => {
  it('stores and retrieves by key', () => {
    const cache = new KeyedTtlCache<number>(5000);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
  });

  it('returns undefined for missing key', () => {
    const cache = new KeyedTtlCache<number>(5000);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('returns undefined after per-key TTL expires', async () => {
    const cache = new KeyedTtlCache<number>(50);
    cache.set('x', 99);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(cache.get('x')).toBeUndefined();
  });
});
