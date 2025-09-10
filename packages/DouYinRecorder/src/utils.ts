import fs from "node:fs";
import path from "node:path";

/**
 * 接收 fn ，返回一个和 fn 签名一致的函数 fn'。当已经有一个 fn' 在运行时，再调用
 * fn' 会直接返回运行中 fn' 的 Promise，直到 Promise 结束 pending 状态
 */
export function singleton<Fn extends (...args: any) => Promise<any>>(fn: Fn): Fn {
  let latestPromise: Promise<unknown> | null = null;

  return function (...args) {
    if (latestPromise) return latestPromise;
    // @ts-ignore
    const promise = fn.apply(this, args).finally(() => {
      if (promise === latestPromise) {
        latestPromise = null;
      }
    });

    latestPromise = promise;
    return promise;
  } as Fn;
}

export function ensureFolderExist(fileOrFolderPath: string): void {
  const folder = path.dirname(fileOrFolderPath);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}

export function assert(assertion: unknown, msg?: string): asserts assertion {
  if (!assertion) {
    throw new Error(msg);
  }
}

export function assertStringType(data: unknown, msg?: string): asserts data is string {
  assert(typeof data === "string", msg);
}

export function assertNumberType(data: unknown, msg?: string): asserts data is number {
  assert(typeof data === "number", msg);
}

export function assertObjectType(data: unknown, msg?: string): asserts data is object {
  assert(typeof data === "object", msg);
}

export function replaceExtName(filePath: string, newExtName: string) {
  return path.join(
    path.dirname(filePath),
    path.basename(filePath, path.extname(filePath)) + newExtName,
  );
}

export function get__ac_signature(one_time_stamp, one_site, one_nonce, ua_n) {
  function cal_one_str(one_str, orgi_iv) {
    var k = orgi_iv;
    for (var i = 0; i < one_str.length; i++) {
      var a = one_str.charCodeAt(i);
      k = ((k ^ a) * 65599) >>> 0;
    }
    return k;
  }
  function cal_one_str_3(one_str, orgi_iv) {
    // 用于计算后两位
    var k = orgi_iv;
    for (var i = 0; i < one_str.length; i++) {
      k = (k * 65599 + one_str.charCodeAt(i)) >>> 0;
    }
    return k;
  }
  function get_one_chr(enc_chr_code) {
    if (enc_chr_code < 26) {
      return String.fromCharCode(enc_chr_code + 65);
    } else if (enc_chr_code < 52) {
      return String.fromCharCode(enc_chr_code + 71);
    } else if (enc_chr_code < 62) {
      return String.fromCharCode(enc_chr_code - 4);
    } else {
      return String.fromCharCode(enc_chr_code - 17);
    }
  }
  function enc_num_to_str(one_orgi_enc) {
    var s = "";
    for (var i = 24; i >= 0; i -= 6) {
      s += get_one_chr((one_orgi_enc >> i) & 63);
    }
    return s;
  }
  // var time_stamp = 1740635781
  // var site = 'www.douyin.com/';  提取自window.location.href
  // var data_url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAQCAYAAABQrvyxAAAAAXNSR0IArs4c6QAAAV5JREFUSEvFlU1OAkEQhT9WLlyx5BqujTfhAMTbsNIYj+EpXLjyDCzhAgbSZMoUb6q6GwWGhMxM/8y8ej/VM05/e3kuj7NhrMzZfbBskqF9BMiAKmAt7trFRGR6Qsv9SQHZBt103DiRGiNSlcWIdW8h75NrK6Ce9M74nYsK0I1ZBnyxme0ytWpZy8IUqT7KQE0BA6MqeDCl2FZhmf1qttR3VhU4h3HPsKoQFaIkeAeEDA9IM7umITYmLcARy1GLrYHuAat5a+VsVIC3QM0KNvcCfAGvclb0WLHVQLxV08woK1GAvBo6/wk8A+Ua2cnWRx7uKcCAZ+dV82RtBesHuAPK1fs7A/eXblWz0b8zUCy0crJkjGXZUJtkbb1LgZ4u4tfsgHnWtC883p0BDbHvQjZXQG8b7e3C+PPXRdIsgE2yZQmsgUfg+2YoKx+KCngCPoD3IZz3wMPwfxPPT17DAcLKggYInDZeAAAAAElFTkSuQmCC'
  // var ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0";
  // var nonce = '067bffadf00143f576ddf';
  // var result = '_02B4Z6wo00f01HBw-fgAAIDA-rdLmXfuMxxwUP1AAHurb5'
  var sign_head = "_02B4Z6wo00f01",
    time_stamp_s = one_time_stamp + "";

  var a = cal_one_str(one_site, cal_one_str(time_stamp_s, 0)) % 65521;
  var b = parseInt(
      "10000000110000" +
        // @ts-ignore
        parseInt((one_time_stamp ^ (a * 65521)) >>> 0)
          .toString(2)
          .padStart(32, "0"),
      2,
    ),
    b_s = b + "";
  var c = cal_one_str(b_s, 0);
  var d = enc_num_to_str(b >> 2);
  var e = (b / 4294967296) >>> 0;
  var f = enc_num_to_str((b << 28) | (e >>> 4));
  var g = 582085784 ^ b;
  var h = enc_num_to_str((e << 26) | (g >>> 6));
  var i = get_one_chr(g & 63);
  var j = (cal_one_str(ua_n, c) % 65521 << 16) | cal_one_str(one_nonce, c) % 65521;
  var k = enc_num_to_str(j >> 2);
  var l = enc_num_to_str((j << 28) | ((524576 ^ b) >>> 4));
  var m = enc_num_to_str(a);
  var n = sign_head + d + f + h + i + k + l + m;
  var o = parseInt(cal_one_str_3(n, 0)).toString(16).slice(-2);
  var signature = n + o;
  return signature;
}
