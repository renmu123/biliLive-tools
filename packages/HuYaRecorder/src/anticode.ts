// @ts-nocheck
/* eslint-disable */
/**
 * 该文件是从 vplayer.js 中提取出来的，保留的部分注释掉的代码是为了标明改动前的代码逻辑
 */

const PLATFORM_TYPE = {
  adr: 2,
  huya_liveshareh5: 104,
  ios: 3,
  mini_app: 102,
  wap: 103,
  web: 100,
};

const PLATFORM_TYPE_NAME = {
  web: "web",
  wap: "wap",
};

function pe(e, t) {
  var i = (65535 & e) + (65535 & t);
  return (((e >> 16) + (t >> 16) + (i >> 16)) << 16) | (65535 & i);
}
function fe(e, t, i, s, a, r) {
  return pe(((n = pe(pe(t, e), pe(s, r))) << (o = a)) | (n >>> (32 - o)), i);
  var n, o;
}
function _e(e, t, i, s, a, r, n) {
  return fe((t & i) | (~t & s), e, t, a, r, n);
}
function me(e, t, i, s, a, r, n) {
  return fe((t & s) | (i & ~s), e, t, a, r, n);
}
function ye(e, t, i, s, a, r, n) {
  return fe(t ^ i ^ s, e, t, a, r, n);
}
function ve(e, t, i, s, a, r, n) {
  return fe(i ^ (t | ~s), e, t, a, r, n);
}
function ge(e, t) {
  var i, s, a, r, n;
  (e[t >> 5] |= 128 << t % 32), (e[14 + (((t + 64) >>> 9) << 4)] = t);
  var o = 1732584193,
    h = -271733879,
    u = -1732584194,
    l = 271733878;
  for (i = 0; i < e.length; i += 16)
    (s = o),
      (a = h),
      (r = u),
      (n = l),
      (o = _e(o, h, u, l, e[i], 7, -680876936)),
      (l = _e(l, o, h, u, e[i + 1], 12, -389564586)),
      (u = _e(u, l, o, h, e[i + 2], 17, 606105819)),
      (h = _e(h, u, l, o, e[i + 3], 22, -1044525330)),
      (o = _e(o, h, u, l, e[i + 4], 7, -176418897)),
      (l = _e(l, o, h, u, e[i + 5], 12, 1200080426)),
      (u = _e(u, l, o, h, e[i + 6], 17, -1473231341)),
      (h = _e(h, u, l, o, e[i + 7], 22, -45705983)),
      (o = _e(o, h, u, l, e[i + 8], 7, 1770035416)),
      (l = _e(l, o, h, u, e[i + 9], 12, -1958414417)),
      (u = _e(u, l, o, h, e[i + 10], 17, -42063)),
      (h = _e(h, u, l, o, e[i + 11], 22, -1990404162)),
      (o = _e(o, h, u, l, e[i + 12], 7, 1804603682)),
      (l = _e(l, o, h, u, e[i + 13], 12, -40341101)),
      (u = _e(u, l, o, h, e[i + 14], 17, -1502002290)),
      (o = me(o, (h = _e(h, u, l, o, e[i + 15], 22, 1236535329)), u, l, e[i + 1], 5, -165796510)),
      (l = me(l, o, h, u, e[i + 6], 9, -1069501632)),
      (u = me(u, l, o, h, e[i + 11], 14, 643717713)),
      (h = me(h, u, l, o, e[i], 20, -373897302)),
      (o = me(o, h, u, l, e[i + 5], 5, -701558691)),
      (l = me(l, o, h, u, e[i + 10], 9, 38016083)),
      (u = me(u, l, o, h, e[i + 15], 14, -660478335)),
      (h = me(h, u, l, o, e[i + 4], 20, -405537848)),
      (o = me(o, h, u, l, e[i + 9], 5, 568446438)),
      (l = me(l, o, h, u, e[i + 14], 9, -1019803690)),
      (u = me(u, l, o, h, e[i + 3], 14, -187363961)),
      (h = me(h, u, l, o, e[i + 8], 20, 1163531501)),
      (o = me(o, h, u, l, e[i + 13], 5, -1444681467)),
      (l = me(l, o, h, u, e[i + 2], 9, -51403784)),
      (u = me(u, l, o, h, e[i + 7], 14, 1735328473)),
      (o = ye(o, (h = me(h, u, l, o, e[i + 12], 20, -1926607734)), u, l, e[i + 5], 4, -378558)),
      (l = ye(l, o, h, u, e[i + 8], 11, -2022574463)),
      (u = ye(u, l, o, h, e[i + 11], 16, 1839030562)),
      (h = ye(h, u, l, o, e[i + 14], 23, -35309556)),
      (o = ye(o, h, u, l, e[i + 1], 4, -1530992060)),
      (l = ye(l, o, h, u, e[i + 4], 11, 1272893353)),
      (u = ye(u, l, o, h, e[i + 7], 16, -155497632)),
      (h = ye(h, u, l, o, e[i + 10], 23, -1094730640)),
      (o = ye(o, h, u, l, e[i + 13], 4, 681279174)),
      (l = ye(l, o, h, u, e[i], 11, -358537222)),
      (u = ye(u, l, o, h, e[i + 3], 16, -722521979)),
      (h = ye(h, u, l, o, e[i + 6], 23, 76029189)),
      (o = ye(o, h, u, l, e[i + 9], 4, -640364487)),
      (l = ye(l, o, h, u, e[i + 12], 11, -421815835)),
      (u = ye(u, l, o, h, e[i + 15], 16, 530742520)),
      (o = ve(o, (h = ye(h, u, l, o, e[i + 2], 23, -995338651)), u, l, e[i], 6, -198630844)),
      (l = ve(l, o, h, u, e[i + 7], 10, 1126891415)),
      (u = ve(u, l, o, h, e[i + 14], 15, -1416354905)),
      (h = ve(h, u, l, o, e[i + 5], 21, -57434055)),
      (o = ve(o, h, u, l, e[i + 12], 6, 1700485571)),
      (l = ve(l, o, h, u, e[i + 3], 10, -1894986606)),
      (u = ve(u, l, o, h, e[i + 10], 15, -1051523)),
      (h = ve(h, u, l, o, e[i + 1], 21, -2054922799)),
      (o = ve(o, h, u, l, e[i + 8], 6, 1873313359)),
      (l = ve(l, o, h, u, e[i + 15], 10, -30611744)),
      (u = ve(u, l, o, h, e[i + 6], 15, -1560198380)),
      (h = ve(h, u, l, o, e[i + 13], 21, 1309151649)),
      (o = ve(o, h, u, l, e[i + 4], 6, -145523070)),
      (l = ve(l, o, h, u, e[i + 11], 10, -1120210379)),
      (u = ve(u, l, o, h, e[i + 2], 15, 718787259)),
      (h = ve(h, u, l, o, e[i + 9], 21, -343485551)),
      (o = pe(o, s)),
      (h = pe(h, a)),
      (u = pe(u, r)),
      (l = pe(l, n));
  return [o, h, u, l];
}
function Se(e) {
  var t,
    i = "",
    s = 32 * e.length;
  for (t = 0; t < s; t += 8) i += String.fromCharCode((e[t >> 5] >>> t % 32) & 255);
  return i;
}
function Te(e) {
  var t,
    i = [];
  for (i[(e.length >> 2) - 1] = void 0, t = 0; t < i.length; t += 1) i[t] = 0;
  var s = 8 * e.length;
  for (t = 0; t < s; t += 8) i[t >> 5] |= (255 & e.charCodeAt(t / 8)) << t % 32;
  return i;
}
function Pe(e) {
  var t,
    i,
    s = "";
  for (i = 0; i < e.length; i += 1)
    (t = e.charCodeAt(i)),
      (s += "0123456789abcdef".charAt((t >>> 4) & 15) + "0123456789abcdef".charAt(15 & t));
  return s;
}
function Ee(e) {
  return unescape(encodeURIComponent(e));
}
function Ce(e) {
  return (function (e) {
    return Se(ge(Te(e), 8 * e.length));
  })(Ee(e));
}
function Ae(e, t) {
  return (function (e, t) {
    var i,
      s,
      a = Te(e),
      r = [],
      n = [];
    for (r[15] = n[15] = void 0, a.length > 16 && (a = ge(a, 8 * e.length)), i = 0; i < 16; i += 1)
      (r[i] = 909522486 ^ a[i]), (n[i] = 1549556828 ^ a[i]);
    return (s = ge(r.concat(Te(t)), 512 + 8 * t.length)), Se(ge(n.concat(s), 640));
  })(Ee(e), Ee(t));
}
var keHash = function (e, t, i) {
  return t ? (i ? Ae(t, e) : Pe(Ae(t, e))) : i ? Ce(e) : Pe(Ce(e));
};

function randomInt(e, t) {
  return Math.floor(Math.random() * (t - e + 1) + e);
}

class Anticode {
  uuid = randomInt(4e9, 5e9);
  uid = Date.now();
  convertUid = Date.now();

  init(e, t, i, s) {
    this._sFlvUrl = e;
    this._sStreamName = t;
    this.parseAnticode(i);
    this._nimoTid = s;
  }

  parseAnticode(e) {
    var self = this;
    this._fm = "";
    this["_wsTime"] = "";
    this["_ctype"] = "";
    this["_params"] = [];
    this._sFlvAnticode = e;

    e.split("&").forEach(function (e) {
      let [key, val] = e.split("=");
      if (key === "fm") {
        val = decodeURI(val);
        val = unescape(val);
        val = atob(val);
        self._fm = val;
      } else if (key === "wsTime") {
        self["_wsTime"] = val;
        var r = 1e3 * parseInt(val, 16) + 3e5;
        self["_invalidTime"] = performance.now() + (r - Date.now());
        self["_nextRefreshTime"] = self["_invalidTime"] - 3e4;
      } else
        key == "ctype" ? (self["_ctype"] = val) : key !== "wsSecret" && self["_params"].push(e);
    });
  }

  hasAnticode() {
    return "" !== this._sFlvAnticode;
  }

  getAnticode(e) {
    if ("" === this._fm) return this._sFlvAnticode;

    const platform = "web";
    const i = PLATFORM_TYPE[platform] || PLATFORM_TYPE.web;
    this._seqid = Number(this.uid) + Date.now();
    var s = keHash("".concat(this._seqid, "|").concat(this._ctype, "|").concat(i));
    var uid = platform === PLATFORM_TYPE_NAME.wap ? this.uid : this.convertUid;
    var r = this._fm
      .replace("$0", uid)
      .replace("$1", this._sStreamName)
      .replace("$2", s)
      .replace("$3", this._wsTime);
    if (e) r += Ye;

    var n = ""
      .concat("wsSecret")
      .concat("=")
      .concat(keHash(r))
      .concat("&")
      .concat("wsTime")
      .concat("=")
      .concat(this._wsTime)
      .concat("&")
      .concat("seqid")
      .concat("=")
      .concat(this._seqid)
      .concat("&")
      .concat("ctype")
      .concat("=")
      .concat(this._ctype)
      .concat("&")
      .concat("ver=1");
    if (this._params.length > 0) {
      n += "&" + this._params.join("&");
    }
    return n;
  }
}

export function initInfo(
  info: {
    baseUrl: string;
    antiCode: string;
    sStreamName: string;
    _sessionId: number;
    suffix: string;
  },
  t?: unknown,
) {
  if (info.baseUrl && info.sStreamName) {
    info.url = "".concat(info.baseUrl, "/").concat(info.sStreamName, `.${info.suffix}`);
  }
  var i = [];
  const anticode = new Anticode();
  anticode.init(info.baseUrl, info.sStreamName, info.antiCode);
  if (anticode.hasAnticode()) {
    i.push(anticode.getAnticode(t));
    // c.a.log('FlvPlayer.initInfo, anticode='.concat(this.anticode.getAnticode(t)))
  }

  // if (-1 !== l.a.useChangeRate.indexOf(Number(e.presenterUid))) {
  //   i.push('ratio='.concat(e.curBitrate))
  // } else if (e.iBitRate > 0) {
  //   i.push('ratio='.concat(e.iBitRate))
  // } else {
  //   localStorage._ratio && i.push('&ratio='.concat(localStorage._ratio))
  // }
  // i.push('ratio='.concat(info.curBitrate))

  // if (
  //   !info.httpDomainOnly &&
  //   !(
  //     -1 === info.url.indexOf('va.huya.com') &&
  //     -1 === info.url.indexOf('cdnweb.huya.com') &&
  //     -1 === info.url.indexOf('va-cmcc.huya.com')
  //   )
  // ) {
  //   i.push('&https=1')
  // }

  if (i.length > 0) {
    info.url += (-1 !== info.url.indexOf("?") ? "&" : "?") + "".concat(i.join("&"));
  }

  // if (this.isUseAV1(e)) e.url += '&codec=av1'
  // else if (this.h265Proxy.isReady || this.h265Proxy.isH265MseCodec) this.h265Proxy.checkUrl(e)
  info.url += "&codec=264";

  // info.url += '&dMod='.concat(getDMod(info._dMod, info._sMod))
  // this.url = info.url
  // this.lineType = info.lineType

  info.url = _getUrlParams(info.url, !1, "firstCdn");

  function _getUrlParams(url, t, i) {
    var s = "";
    // s += t ? "pulltype=pcdn&" : "sdkPcdn=".concat(this._cdnCnt, "_").concat(this._getSdkPcdnReason(i), "&");
    s += t ? "pulltype=pcdn&" : "sdkPcdn=".concat(1, "_").concat(1, "&");
    var platform = "web";
    var r = PLATFORM_TYPE[platform] || PLATFORM_TYPE.web;
    var n =
      platform === PLATFORM_TYPE_NAME.wap
        ? "uid=".concat(anticode.uid, "&uuid=").concat(anticode.uuid)
        : "u=".concat(anticode.convertUid);

    // s += ''.concat(n, '&t=').concat(r, '&sv=').concat(2401040319, '&sdk_sid=').concat(this._flvPlayer.info._sessionId)
    s += ""
      .concat(n, "&t=")
      .concat(r, "&sv=")
      .concat(2401040319, "&sdk_sid=")
      .concat(info._sessionId);
    -1 === url.indexOf("?") ? (url += "?") : (url += "&");
    return url + s;
  }

  return info.url;
}

function getDMod(e, t) {
  return (
    "mseh" !== e && "wcs" !== e && "wasm" !== e && "mses" !== e && (e = "unknow"),
    (t = Number(t)),
    isNaN(t) && (t = 0),
    "".concat(e, "-").concat(t)
  );
}
