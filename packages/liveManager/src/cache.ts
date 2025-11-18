/**
 * Cache system for RecorderManager
 * 提供统一的缓存接口用于处理持久化事务
 */

export interface CacheStore {
  get<T = any>(key: string): Promise<T | undefined>;
  set<T = any>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

export interface RecorderCache {
  /**
   * 为每个录制器创建独立的命名空间
   * @param recorderId 录制器 ID
   */
  createNamespace(recorderId: string): NamespacedCache;

  /**
   * 获取全局缓存
   */
  global(): NamespacedCache;
}

export interface NamespacedCache {
  /**
   * 通用的 key-value 存储
   */
  get<T = any>(key: string): Promise<T | undefined>;

  /**
   * 通用的 key-value 存储
   */
  set<T = any>(key: string, value: T): Promise<void>;

  /**
   * 删除指定 key
   */
  delete(key: string): Promise<void>;
}

/**
 * 内存缓存实现
 */
export class MemoryCacheStore implements CacheStore {
  private store: Map<string, { value: any; expireAt?: number }> = new Map();

  async get<T = any>(key: string): Promise<T | undefined> {
    const item = this.store.get(key);
    if (!item) return undefined;

    if (item.expireAt && Date.now() > item.expireAt) {
      this.store.delete(key);
      return undefined;
    }

    return item.value;
  }

  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    const item: { value: T; expireAt?: number } = { value };
    if (ttl) {
      item.expireAt = Date.now() + ttl;
    }
    this.store.set(key, item);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }
}

/**
 * RecorderCache 实现
 */
export class RecorderCacheImpl implements RecorderCache {
  constructor(private store: CacheStore) {}

  createNamespace(recorderId: string): NamespacedCache {
    return new NamespacedCacheImpl(this.store, `recorder:${recorderId}`);
  }

  global(): NamespacedCache {
    return new NamespacedCacheImpl(this.store, "global");
  }
}

/**
 * 命名空间缓存实现
 */
class NamespacedCacheImpl implements NamespacedCache {
  constructor(
    private store: CacheStore,
    private namespace: string,
  ) {}

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
  async get<T = any>(key: string): Promise<T | undefined> {
    return this.store.get<T>(this.getKey(key));
  }

  async set<T = any>(key: string, value: T): Promise<void> {
    return this.store.set(this.getKey(key), value);
  }

  async delete(key: string): Promise<void> {
    return this.store.delete(this.getKey(key));
  }
}
