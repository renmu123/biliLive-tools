// Polyfill for File API in Node.js environment
import { Blob } from "node:buffer";

// @ts-ignore
if (typeof globalThis.File === "undefined") {
  // @ts-ignore
  globalThis.File = class File extends Blob {
    name: string;
    lastModified: number;

    constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
      // @ts-ignore
      super(bits, options);
      this.name = name;
      this.lastModified = options?.lastModified ?? Date.now();
    }

    get [Symbol.toStringTag]() {
      return "File";
    }
  };
}
