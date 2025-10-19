export class Cache {
  private static instance: Cache;
  private data: Map<string, any>;

  private constructor() {
    this.data = new Map<string, any>();
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public set(key: string, value: any): void {
    this.data.set(key, value);
  }

  public get(key: string): any {
    return this.data.get(key);
  }

  public has(key: string): boolean {
    return this.data.has(key);
  }

  public delete(key: string): boolean {
    return this.data.delete(key);
  }

  public clear(): void {
    this.data.clear();
  }

  public get size(): number {
    return this.data.size;
  }

  public keys(): IterableIterator<string> {
    return this.data.keys();
  }

  public values(): IterableIterator<any> {
    return this.data.values();
  }

  public entries(): IterableIterator<[string, any]> {
    return this.data.entries();
  }

  public forEach(
    callbackfn: (value: any, key: string, map: Map<string, any>) => void,
    thisArg?: any,
  ): void {
    this.data.forEach(callbackfn, thisArg);
  }

  // 实现 Symbol.iterator 接口，支持 for...of 循环
  public [Symbol.iterator](): IterableIterator<[string, any]> {
    return this.data[Symbol.iterator]();
  }
}
