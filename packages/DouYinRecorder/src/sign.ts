// abogus.ts
// 这是对 Rust 版 ABogus 的 TypeScript 实现
// 代码来自：https://github.com/hua0512/rust-srec/blob/6444641014ea58628af9b0fa51b099620a01d0d0/crates/platforms/src/extractor/platforms/douyin/abogus.rs
// 依赖 sm3、rc4、random 等库

import { sm3 } from "sm-crypto"; // npm install sm-crypto

export class StringProcessor {
  static toCharStr(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => String.fromCharCode(b))
      .join("");
  }

  static toCharArray(s: string): number[] {
    return Array.from(s).map((c) => c.charCodeAt(0));
  }

  static generateRandomBytes(length: number): string {
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const rd = Math.floor(Math.random() * 10000);
      result.push((rd & 255 & 170) | 1);
      result.push((rd & 255 & 85) | 2);
      result.push(((rd >> 8) & 170) | 5);
      result.push(((rd >> 8) & 85) | 40);
    }
    return this.toCharStr(Uint8Array.from(result));
  }
}

export class CryptoUtility {
  salt: string;
  base64Alphabet: string[][];
  bigArray: number[];

  constructor(salt: string, customBase64Alphabet: string[]) {
    this.salt = salt;
    this.base64Alphabet = customBase64Alphabet.map((s) => Array.from(s));
    this.bigArray = [
      121, 243, 55, 234, 103, 36, 47, 228, 30, 231, 106, 6, 115, 95, 78, 101, 250, 207, 198, 50,
      139, 227, 220, 105, 97, 143, 34, 28, 194, 215, 18, 100, 159, 160, 43, 8, 169, 217, 180, 120,
      247, 45, 90, 11, 27, 197, 46, 3, 84, 72, 5, 68, 62, 56, 221, 75, 144, 79, 73, 161, 178, 81,
      64, 187, 134, 117, 186, 118, 16, 241, 130, 71, 89, 147, 122, 129, 65, 40, 88, 150, 110, 219,
      199, 255, 181, 254, 48, 4, 195, 248, 208, 32, 116, 167, 69, 201, 17, 124, 125, 104, 96, 83,
      80, 127, 236, 108, 154, 126, 204, 15, 20, 135, 112, 158, 13, 1, 188, 164, 210, 237, 222, 98,
      212, 77, 253, 42, 170, 202, 26, 22, 29, 182, 251, 10, 173, 152, 58, 138, 54, 141, 185, 33,
      157, 31, 252, 132, 233, 235, 102, 196, 191, 223, 240, 148, 39, 123, 92, 82, 128, 109, 57, 24,
      38, 113, 209, 245, 2, 119, 153, 229, 189, 214, 230, 174, 232, 63, 52, 205, 86, 140, 66, 175,
      111, 171, 246, 133, 238, 193, 99, 60, 74, 91, 225, 51, 76, 37, 145, 211, 166, 151, 213, 206,
      0, 200, 244, 176, 218, 44, 184, 172, 49, 216, 93, 168, 53, 21, 183, 41, 67, 85, 224, 155, 226,
      242, 87, 177, 146, 70, 190, 12, 162, 19, 137, 114, 25, 165, 163, 192, 23, 59, 9, 94, 179, 107,
      35, 7, 142, 131, 239, 203, 149, 136, 61, 249, 14, 156,
    ];
  }

  static sm3ToArray(input: Uint8Array | string): number[] {
    const hash = sm3(input instanceof Uint8Array ? Buffer.from(input) : input);
    return Buffer.from(hash, "hex").toJSON().data;
  }

  addSalt(param: string): string {
    return param + this.salt;
  }

  paramsToArray(param: string, addSalt: boolean): number[] {
    const processed = addSalt ? this.addSalt(param) : param;
    return CryptoUtility.sm3ToArray(processed);
  }

  transformBytes(valuesList: number[]): number[] {
    const result: number[] = [];
    let indexB = this.bigArray[1];
    let initialValue = 0,
      valueE = 0;
    const arrayLen = this.bigArray.length;

    for (let index = 0; index < valuesList.length; index++) {
      let sumInitial;
      if (index === 0) {
        initialValue = this.bigArray[indexB];
        sumInitial = indexB + initialValue;
        this.bigArray[1] = initialValue;
        this.bigArray[indexB] = indexB;
      } else {
        sumInitial = initialValue + valueE;
      }
      const sumInitialIdx = sumInitial % arrayLen;
      const valueF = this.bigArray[sumInitialIdx];
      result.push(valuesList[index] ^ valueF);

      const nextIdx = (index + 2) % arrayLen;
      valueE = this.bigArray[nextIdx];
      const newSumInitialIdx = (indexB + valueE) % arrayLen;
      initialValue = this.bigArray[newSumInitialIdx];

      [this.bigArray[newSumInitialIdx], this.bigArray[nextIdx]] = [
        this.bigArray[nextIdx],
        this.bigArray[newSumInitialIdx],
      ];
      indexB = newSumInitialIdx;
    }
    return result;
  }

  base64Encode(bytes: Uint8Array, selectedAlphabet: number): string {
    const alphabet = this.base64Alphabet[selectedAlphabet];
    let output = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const b1 = bytes[i];
      const b2 = bytes[i + 1] || 0;
      const b3 = bytes[i + 2] || 0;
      const combined = (b1 << 16) | (b2 << 8) | b3;
      output += alphabet[(combined >> 18) & 63];
      output += alphabet[(combined >> 12) & 63];
      output += i + 1 < bytes.length ? alphabet[(combined >> 6) & 63] : "";
      output += i + 2 < bytes.length ? alphabet[combined & 63] : "";
    }
    while (output.length % 4 !== 0) output += "=";
    return output;
  }

  abogusEncode(values: number[], selectedAlphabet: number): string {
    const alphabet = this.base64Alphabet[selectedAlphabet];
    let abogus = "";
    for (let i = 0; i < values.length; i += 3) {
      const v1 = values[i];
      const v2 = values[i + 1] || 0;
      const v3 = values[i + 2] || 0;
      const n = (v1 << 16) | (v2 << 8) | v3;
      abogus += alphabet[(n & 0xfc0000) >> 18];
      abogus += alphabet[(n & 0x03f000) >> 12];
      abogus += i + 1 < values.length ? alphabet[(n & 0x0fc0) >> 6] : "";
      abogus += i + 2 < values.length ? alphabet[n & 0x3f] : "";
    }
    while (abogus.length % 4 !== 0) abogus += "=";
    return abogus;
  }

  static rc4Encrypt(key: number[], plaintext: string): Uint8Array {
    // 推荐用 npm 包 rc4 或自己实现
    const S = Array.from({ length: 256 }, (_, i) => i);
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + S[i] + key[i % key.length]) & 0xff;
      [S[i], S[j]] = [S[j], S[i]];
    }
    let i = 0;
    j = 0;
    const ptBytes = StringProcessor.toCharArray(plaintext);
    const ct: any[] = [];
    for (const charVal of ptBytes) {
      i = (i + 1) & 0xff;
      j = (j + S[i]) & 0xff;
      [S[i], S[j]] = [S[j], S[i]];
      const k = S[(S[i] + S[j]) & 0xff];
      ct.push(charVal ^ k);
    }
    return Uint8Array.from(ct);
  }
}

export class BrowserFingerprintGenerator {
  static generateFingerprint(browserType: string): string {
    switch (browserType) {
      case "Chrome":
      case "Edge":
      case "Firefox":
        return this._generateFingerprint("Win32");
      case "Safari":
        return this._generateFingerprint("MacIntel");
      default:
        return this._generateFingerprint("Win32");
    }
  }

  private static _generateFingerprint(platform: string): string {
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const innerWidth = rand(1024, 1920);
    const innerHeight = rand(768, 1080);
    const outerWidth = innerWidth + rand(24, 32);
    const outerHeight = innerHeight + rand(75, 90);
    const screenX = 0;
    const screenY = [0, 30][rand(0, 1)];
    const sizeWidth = rand(1024, 1920);
    const sizeHeight = rand(768, 1080);
    const availWidth = rand(1280, 1920);
    const availHeight = rand(800, 1080);
    return `${innerWidth}|${innerHeight}|${outerWidth}|${outerHeight}|${screenX}|${screenY}|0|0|${sizeWidth}|${sizeHeight}|${availWidth}|${availHeight}|${innerWidth}|${innerHeight}|24|24|${platform}`;
  }
}

export class ABogus {
  cryptoUtility: CryptoUtility;
  userAgent: string;
  browserFp: string;
  options: number[];
  pageId: number;
  aid: number;
  uaKey: number[];
  sortIndex: number[];
  sortIndex2: number[];

  constructor(fp?: string, userAgent?: string, options?: number[]) {
    const salt = "cus";
    const character = "Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe";
    const character2 = "ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzmFjJnryx9HVGDaStCe";
    const characterList = [character, character2];
    this.cryptoUtility = new CryptoUtility(salt, characterList);
    this.userAgent =
      userAgent && userAgent.length > 0
        ? userAgent
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0";
    this.browserFp =
      fp && fp.length > 0 ? fp : BrowserFingerprintGenerator.generateFingerprint("Edge");
    this.options = options || [0, 1, 14];
    this.pageId = 0;
    this.aid = 6383;
    this.uaKey = [0x00, 0x01, 0x0e];
    this.sortIndex = [
      18, 20, 52, 26, 30, 34, 58, 38, 40, 53, 42, 21, 27, 54, 55, 31, 35, 57, 39, 41, 43, 22, 28,
      32, 60, 36, 23, 29, 33, 37, 44, 45, 59, 46, 47, 48, 49, 50, 24, 25, 65, 66, 70, 71,
    ];
    this.sortIndex2 = [
      18, 20, 26, 30, 34, 38, 40, 42, 21, 27, 31, 35, 39, 41, 43, 22, 28, 32, 36, 23, 29, 33, 37,
      44, 45, 46, 47, 48, 49, 50, 24, 25, 52, 53, 54, 55, 57, 58, 59, 60, 65, 66, 70, 71,
    ];
  }

  generateAbogus(params: string, body: string): [string, string, string, string] {
    const abDir: Record<number, number> = {
      8: 3,
      18: 44,
      66: 0,
      69: 0,
      70: 0,
      71: 0,
    };
    const startEncryption = Date.now();
    // Hash(Hash(params))
    const paramsHash1 = this.cryptoUtility.paramsToArray(params, true);
    // @ts-ignore
    const array1 = CryptoUtility.sm3ToArray(paramsHash1);
    // Hash(Hash(body))
    const bodyHash1 = this.cryptoUtility.paramsToArray(body, true);
    // @ts-ignore
    const array2 = CryptoUtility.sm3ToArray(bodyHash1);
    // Hash(Base64(RC4(user_agent)))
    const rc4Ua = CryptoUtility.rc4Encrypt(this.uaKey, this.userAgent);
    const uaB64 = this.cryptoUtility.base64Encode(rc4Ua, 1);
    const array3 = this.cryptoUtility.paramsToArray(uaB64, false);
    const endEncryption = Date.now();

    // 动态填充 abDir
    abDir[20] = (startEncryption >> 24) & 255;
    abDir[21] = (startEncryption >> 16) & 255;
    abDir[22] = (startEncryption >> 8) & 255;
    abDir[23] = startEncryption & 255;
    abDir[24] = Math.floor(startEncryption / 0x100000000);
    abDir[25] = Math.floor(startEncryption / 0x10000000000);

    abDir[26] = (this.options[0] >> 24) & 255;
    abDir[27] = (this.options[0] >> 16) & 255;
    abDir[28] = (this.options[0] >> 8) & 255;
    abDir[29] = this.options[0] & 255;

    abDir[30] = Math.floor(this.options[1] / 256) & 255;
    abDir[31] = this.options[1] % 256;
    abDir[32] = (this.options[1] >> 24) & 255;
    abDir[33] = (this.options[1] >> 16) & 255;

    abDir[34] = (this.options[2] >> 24) & 255;
    abDir[35] = (this.options[2] >> 16) & 255;
    abDir[36] = (this.options[2] >> 8) & 255;
    abDir[37] = this.options[2] & 255;

    abDir[38] = array1[21];
    abDir[39] = array1[22];
    abDir[40] = array2[21];
    abDir[41] = array2[22];
    abDir[42] = array3[23];
    abDir[43] = array3[24];

    abDir[44] = (endEncryption >> 24) & 255;
    abDir[45] = (endEncryption >> 16) & 255;
    abDir[46] = (endEncryption >> 8) & 255;
    abDir[47] = endEncryption & 255;
    abDir[48] = abDir[8];
    abDir[49] = Math.floor(endEncryption / 0x100000000);
    abDir[50] = Math.floor(endEncryption / 0x10000000000);

    abDir[51] = (this.pageId >> 24) & 255;
    abDir[52] = (this.pageId >> 16) & 255;
    abDir[53] = (this.pageId >> 8) & 255;
    abDir[54] = this.pageId & 255;
    abDir[55] = this.pageId;
    abDir[56] = this.aid;
    abDir[57] = this.aid & 255;
    abDir[58] = (this.aid >> 8) & 255;
    abDir[59] = (this.aid >> 16) & 255;
    abDir[60] = (this.aid >> 24) & 255;

    abDir[64] = this.browserFp.length;
    abDir[65] = this.browserFp.length;

    const sortedValues = this.sortIndex.map((i) => abDir[i] || 0);
    const fpArray = StringProcessor.toCharArray(this.browserFp);

    let abXor = 0;
    this.sortIndex2.forEach((key, idx) => {
      const val = abDir[key] || 0;
      abXor = idx === 0 ? val : abXor ^ val;
    });

    const allValues = [...sortedValues, ...fpArray, abXor];
    const transformedValues = this.cryptoUtility.transformBytes(allValues);
    const randomPrefix = StringProcessor.generateRandomBytes(3)
      .split("")
      .map((c) => c.charCodeAt(0));
    const finalValues = [...randomPrefix, ...transformedValues];
    const abogus = this.cryptoUtility.abogusEncode(finalValues, 0);
    const finalParams = `${params}&a_bogus=${abogus}`;
    return [finalParams, abogus, this.userAgent, body];
  }
}
