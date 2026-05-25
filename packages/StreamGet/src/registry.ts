/**
 * 平台注册表
 */

import type { PlatformParser, RequestOptions } from "./types.js";

class PlatformRegistry {
  private parsers = new Map<string, (options?: RequestOptions) => PlatformParser>();

  register(platform: string, factory: (options?: RequestOptions) => PlatformParser): void {
    this.parsers.set(platform.toLowerCase(), factory);
  }

  detectPlatform(url: string): string | null {
    for (const [platform, factory] of this.parsers.entries()) {
      const parser = factory();
      if (parser.matchURL(url)) {
        return platform;
      }
    }
    return null;
  }

  create(platform: string, options?: RequestOptions): PlatformParser | null {
    const factory = this.parsers.get(platform.toLowerCase());
    return factory ? factory(options) : null;
  }

  list(): string[] {
    return Array.from(this.parsers.keys());
  }
}

export const registry = new PlatformRegistry();
