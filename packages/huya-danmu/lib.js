/* eslint-disable */

var Taf = Taf || {};
(Taf.INT8 = function () {
  (this._clone = function () {
    return 0;
  }),
    (this._write = function (t, e, i) {
      return t.writeInt8(e, i);
    }),
    (this._read = function (t, e, i) {
      return t.readInt8(e, !0, i);
    }),
    (this._className = function () {
      return Taf.CHAR;
    });
}),
  (Taf.INT16 = function () {
    (this._clone = function () {
      return 0;
    }),
      (this._write = function (t, e, i) {
        return t.writeInt16(e, i);
      }),
      (this._read = function (t, e, i) {
        return t.readInt16(e, !0, i);
      }),
      (this._className = function () {
        return Taf.SHORT;
      });
  }),
  (Taf.INT32 = function () {
    (this._clone = function () {
      return 0;
    }),
      (this._write = function (t, e, i) {
        return t.writeInt32(e, i);
      }),
      (this._read = function (t, e, i) {
        return t.readInt32(e, !0, i);
      }),
      (this._className = function () {
        return Taf.INT32;
      });
  }),
  (Taf.INT64 = function () {
    (this._clone = function () {
      return 0;
    }),
      (this._write = function (t, e, i) {
        return t.writeInt64(e, i);
      }),
      (this._read = function (t, e, i) {
        return t.readInt64(e, !0, i);
      }),
      (this._className = function () {
        return Taf.INT64;
      });
  }),
  (Taf.UINT8 = function () {
    (this._clone = function () {
      return 0;
    }),
      (this._write = function (t, e, i) {
        return t.writeInt16(e, i);
      }),
      (this._read = function (t, e, i) {
        return t.readInt16(e, !0, i);
      }),
      (this._className = function () {
        return Taf.SHORT;
      });
  }),
  (Taf.UInt16 = function () {
    (this._clone = function () {
      return 0;
    }),
      (this._write = function (t, e, i) {
        return t.writeInt32(e, i);
      }),
      (this._read = function (t, e, i) {
        return t.readInt32(e, !0, i);
      }),
      (this._className = function () {
        return Taf.INT32;
      });
  }),
  (Taf.UInt32 = function () {
    (this._clone = function () {
      return 0;
    }),
      (this._write = function (t, e, i) {
        return t.writeInt64(e, i);
      }),
      (this._read = function (t, e, i) {
        return t.readInt64(e, !0, i);
      }),
      (this._className = function () {
        return Taf.INT64;
      });
  }),
  (Taf.Float = function () {
    (this._clone = function () {
      return 0;
    }),
      (this._write = function (t, e, i) {
        return t.writeFloat(e, i);
      }),
      (this._read = function (t, e, i) {
        return t.readFloat(e, !0, i);
      }),
      (this._className = function () {
        return Taf.FLOAT;
      });
  }),
  (Taf.Double = function () {
    (this._clone = function () {
      return 0;
    }),
      (this._write = function (t, e, i) {
        return t.writeDouble(e, i);
      }),
      (this._read = function (t, e, i) {
        return t.readDouble(e, !0, i);
      }),
      (this._className = function () {
        return Taf.DOUBLE;
      });
  }),
  (Taf.STRING = function () {
    (this._clone = function () {
      return 0;
    }),
      (this._write = function (t, e, i) {
        return t.writeString(e, i);
      }),
      (this._read = function (t, e, i) {
        return t.readString(e, !0, i);
      }),
      (this._className = function () {
        return Taf.STRING;
      });
  }),
  (Taf.BOOLEAN = function () {
    (this._clone = function () {
      return !1;
    }),
      (this._write = function (t, e, i) {
        return t.writeBoolean(e, i);
      }),
      (this._read = function (t, e, i) {
        return t.readBoolean(e, !0, i);
      }),
      (this._className = function () {
        return Taf.BOOLEAN;
      });
  }),
  (Taf.ENUM = function () {
    (this._clone = function () {
      return 0;
    }),
      (this._write = function (t, e, i) {
        return t.writeInt32(e, i);
      }),
      (this._read = function (t, e, i) {
        return t.readInt32(e, !0, i);
      });
  }),
  (Taf.Vector = function (t) {
    (this.proto = t), (this.value = new Array());
  }),
  (Taf.Vector.prototype._clone = function () {
    return new Taf.Vector(this.proto);
  }),
  (Taf.Vector.prototype._write = function (t, e, i) {
    return t.writeVector(e, i);
  }),
  (Taf.Vector.prototype._read = function (t, e, i) {
    return t.readVector(e, !0, i);
  }),
  (Taf.Vector.prototype._className = function () {
    return Taf.TypeHelp.VECTOR.replace("$t", this.proto._className());
  }),
  (Taf.Map = function (t, e) {
    (this.kproto = t), (this.vproto = e), (this.value = new Object());
  }),
  (Taf.Map.prototype._clone = function () {
    return new Taf.Map(this.kproto, this.vproto);
  }),
  (Taf.Map.prototype._write = function (t, e, i) {
    return t.writeMap(e, i);
  }),
  (Taf.Map.prototype._read = function (t, e, i) {
    return t.readMap(e, !0, i);
  }),
  (Taf.Map.prototype.put = function (t, e) {
    this.value[t] = e;
  }),
  (Taf.Map.prototype.get = function (t) {
    return this.value[t];
  }),
  (Taf.Map.prototype.remove = function (t) {
    delete this.value[t];
  }),
  (Taf.Map.prototype.clear = function () {
    this.value = new Object();
  }),
  (Taf.Map.prototype.size = function () {
    var t = 0;
    for (var e in this.value) t++;
    return t;
  }),
  (Taf.Vector.prototype._className = function () {
    return Taf.TypeHelp.Map.replace("$k", this.kproto._className()).replace(
      "$v",
      this.vproto._className(),
    );
  });
var Taf = Taf || {};
(Taf.DataHelp = {
  EN_INT8: 0,
  EN_INT16: 1,
  EN_INT32: 2,
  EN_INT64: 3,
  EN_FLOAT: 4,
  EN_DOUBLE: 5,
  EN_STRING1: 6,
  EN_STRING4: 7,
  EN_MAP: 8,
  EN_LIST: 9,
  EN_STRUCTBEGIN: 10,
  EN_STRUCTEND: 11,
  EN_ZERO: 12,
  EN_SIMPLELIST: 13,
}),
  (Taf.TypeHelp = {
    BOOLEAN: "bool",
    CHAR: "char",
    SHORT: "short",
    INT32: "int32",
    INT64: "int64",
    FLOAT: "float",
    DOUBLE: "double",
    STRING: "string",
    VECTOR: "list<$t>",
    MAP: "map<$k, $v>",
  }),
  (Taf.BinBuffer = function (t) {
    (this.buf = null),
      (this.vew = null),
      (this.len = 0),
      (this.position = 0),
      null != t &&
        void 0 != t &&
        t instanceof Taf.BinBuffer &&
        ((this.buf = t.buf),
        (this.vew = new DataView(this.buf)),
        (this.len = t.length),
        (this.position = t.position)),
      null != t &&
        void 0 != t &&
        t instanceof ArrayBuffer &&
        ((this.buf = t),
        (this.vew = new DataView(this.buf)),
        (this.len = this.vew.byteLength),
        (this.position = 0)),
      this.__defineGetter__("length", function () {
        return this.len;
      }),
      this.__defineGetter__("buffer", function () {
        return this.buf;
      });
  }),
  (Taf.BinBuffer.prototype._write = function (t, e, i) {
    return t.writeBytes(e, i);
  }),
  (Taf.BinBuffer.prototype._read = function (t, e, i) {
    return t.readBytes(e, !0, i);
  }),
  (Taf.BinBuffer.prototype._clone = function () {
    return new Taf.BinBuffer();
  }),
  (Taf.BinBuffer.prototype.allocate = function (t) {
    if (((t = this.position + t), !(null != this.buf && this.buf.length > t))) {
      var e = new ArrayBuffer(Math.max(256, 2 * t));
      null != this.buf && (new Uint8Array(e).set(new Uint8Array(this.buf)), (this.buf = void 0)),
        (this.buf = e),
        (this.vew = void 0),
        (this.vew = new DataView(this.buf));
    }
  }),
  (Taf.BinBuffer.prototype.getBuffer = function () {
    var t = new ArrayBuffer(this.len);
    return new Uint8Array(t).set(new Uint8Array(this.buf, 0, this.len)), t;
  }),
  (Taf.BinBuffer.prototype.memset = function (t, e, i) {
    this.allocate(i), new Uint8Array(this.buf).set(new Uint8Array(t, e, i), this.position);
  }),
  (Taf.BinBuffer.prototype.writeInt8 = function (t) {
    this.allocate(1),
      this.vew.setInt8(this.position, t),
      (this.position += 1),
      (this.len = this.position);
  }),
  (Taf.BinBuffer.prototype.writeUInt8 = function (t) {
    this.allocate(1), this.vew.setUint8(this.position++, t), (this.len = this.position);
  }),
  (Taf.BinBuffer.prototype.writeInt16 = function (t) {
    this.allocate(2),
      this.vew.setInt16(this.position, t),
      (this.position += 2),
      (this.len = this.position);
  }),
  (Taf.BinBuffer.prototype.writeUInt16 = function (t) {
    this.allocate(2),
      this.vew.setUint16(this.position, t),
      (this.position += 2),
      (this.len = this.position);
  }),
  (Taf.BinBuffer.prototype.writeInt32 = function (t) {
    this.allocate(4),
      this.vew.setInt32(this.position, t),
      (this.position += 4),
      (this.len = this.position);
  }),
  (Taf.BinBuffer.prototype.writeUInt32 = function (t) {
    this.allocate(4),
      this.vew.setUint32(this.position, t),
      (this.position += 4),
      (this.len = this.position);
  }),
  (Taf.BinBuffer.prototype.writeInt64 = function (t) {
    this.allocate(8),
      this.vew.setUint32(this.position, parseInt(t / 4294967296)),
      this.vew.setUint32(this.position + 4, t % 4294967296),
      (this.position += 8),
      (this.len = this.position);
  }),
  (Taf.BinBuffer.prototype.writeFloat = function (t) {
    this.allocate(4),
      this.vew.setFloat32(this.position, t),
      (this.position += 4),
      (this.len = this.position);
  }),
  (Taf.BinBuffer.prototype.writeDouble = function (t) {
    this.allocate(8),
      this.vew.setFloat64(this.position, t),
      (this.position += 8),
      (this.len = this.position);
  }),
  (Taf.BinBuffer.prototype.writeString = function (t) {
    for (var e = [], i = 0; i < t.length; i++) e.push(255 & t.charCodeAt(i));
    this.allocate(e.length),
      new Uint8Array(this.buf).set(new Uint8Array(e), this.position),
      (this.position += e.length),
      (this.len = this.position);
  }),
  (Taf.BinBuffer.prototype.writeBytes = function (t) {
    0 != t.length &&
      null != t.buf &&
      (this.allocate(t.length),
      new Uint8Array(this.buf).set(new Uint8Array(t.buf, 0, t.length), this.position),
      (this.position += t.length),
      (this.len = this.position));
  }),
  (Taf.BinBuffer.prototype.readInt8 = function () {
    return this.vew.getInt8(this.position++);
  }),
  (Taf.BinBuffer.prototype.readInt16 = function () {
    return (this.position += 2), this.vew.getInt16(this.position - 2);
  }),
  (Taf.BinBuffer.prototype.readInt32 = function () {
    return (this.position += 4), this.vew.getInt32(this.position - 4);
  }),
  (Taf.BinBuffer.prototype.readUInt8 = function () {
    return (this.position += 1), this.vew.getUint8(this.position - 1);
  }),
  (Taf.BinBuffer.prototype.readUInt16 = function () {
    return (this.position += 2), this.vew.getUint16(this.position - 2);
  }),
  (Taf.BinBuffer.prototype.readUInt32 = function () {
    return (this.position += 4), this.vew.getUint32(this.position - 4);
  }),
  (Taf.BinBuffer.prototype.readInt64 = function () {
    var t = this.vew.getUint32(this.position),
      e = this.vew.getUint32(this.position + 4);
    return (this.position += 8), 4294967296 * t + e;
  }),
  (Taf.BinBuffer.prototype.readFloat = function () {
    var t = this.vew.getFloat32(this.position);
    return (this.position += 4), t;
  }),
  (Taf.BinBuffer.prototype.readDouble = function () {
    var t = this.vew.getFloat64(this.position);
    return (this.position += 8), t;
  }),
  (Taf.BinBuffer.prototype.readString = function (t) {
    for (var e = [], i = 0; t > i; i++)
      e.push(String.fromCharCode(this.vew.getUint8(this.position++)));
    var r = e.join("");
    try {
      r = decodeURIComponent(escape(r));
    } catch (n) {}
    return r;
  }),
  (Taf.BinBuffer.prototype.readBytes = function (t) {
    var e = new Taf.BinBuffer();
    return (
      e.allocate(t),
      e.memset(this.buf, this.position, t),
      (e.position = 0),
      (e.len = t),
      (this.position = this.position + t),
      e
    );
  }),
  (Taf.JceOutputStream = function () {
    (this.buf = new Taf.BinBuffer()),
      (this.getBinBuffer = function () {
        return this.buf;
      }),
      (this.getBuffer = function () {
        return this.buf.getBuffer();
      });
  }),
  (Taf.JceOutputStream.prototype.writeTo = function (t, e) {
    15 > t ? this.buf.writeUInt8(((t << 4) & 240) | e) : this.buf.writeUInt16(((240 | e) << 8) | t);
  }),
  (Taf.JceOutputStream.prototype.writeBoolean = function (t, e) {
    this.writeInt8(t, 1 == e ? 1 : 0);
  }),
  (Taf.JceOutputStream.prototype.writeInt8 = function (t, e) {
    0 == e
      ? this.writeTo(t, Taf.DataHelp.EN_ZERO)
      : (this.writeTo(t, Taf.DataHelp.EN_INT8), this.buf.writeInt8(e));
  }),
  (Taf.JceOutputStream.prototype.writeInt16 = function (t, e) {
    e >= -128 && 127 >= e
      ? this.writeInt8(t, e)
      : (this.writeTo(t, Taf.DataHelp.EN_INT16), this.buf.writeInt16(e));
  }),
  (Taf.JceOutputStream.prototype.writeInt32 = function (t, e) {
    e >= -32768 && 32767 >= e
      ? this.writeInt16(t, e)
      : (this.writeTo(t, Taf.DataHelp.EN_INT32), this.buf.writeInt32(e));
  }),
  (Taf.JceOutputStream.prototype.writeInt64 = function (t, e) {
    e >= -2147483648 && 2147483647 >= e
      ? this.writeInt32(t, e)
      : (this.writeTo(t, Taf.DataHelp.EN_INT64), this.buf.writeInt64(e));
  }),
  (Taf.JceOutputStream.prototype.writeUInt8 = function (t, e) {
    this.writeInt16(t, e);
  }),
  (Taf.JceOutputStream.prototype.writeUInt16 = function (t, e) {
    this.writeInt32(t, e);
  }),
  (Taf.JceOutputStream.prototype.writeUInt32 = function (t, e) {
    this.writeInt64(t, e);
  }),
  (Taf.JceOutputStream.prototype.writeFloat = function (t, e) {
    0 == e
      ? this.writeTo(t, Taf.DataHelp.EN_ZERO)
      : (this.writeTo(t, Taf.DataHelp.EN_FLOAT), this.buf.writeFloat(e));
  }),
  (Taf.JceOutputStream.prototype.writeDouble = function (t, e) {
    0 == e
      ? this.writeTo(t, Taf.DataHelp.EN_ZERO)
      : (this.writeTo(t, Taf.DataHelp.EN_DOUBLE), this.buf.writeDouble(e));
  }),
  (Taf.JceOutputStream.prototype.writeStruct = function (t, e) {
    if (void 0 == e.writeTo) throw Error("not defined writeTo Function");
    this.writeTo(t, Taf.DataHelp.EN_STRUCTBEGIN),
      e.writeTo(this),
      this.writeTo(0, Taf.DataHelp.EN_STRUCTEND);
  }),
  (Taf.JceOutputStream.prototype.writeString = function (t, e) {
    var i = e;
    try {
      i = unescape(encodeURIComponent(i));
    } catch (r) {}
    i.length > 255
      ? (this.writeTo(t, Taf.DataHelp.EN_STRING4), this.buf.writeUInt32(i.length))
      : (this.writeTo(t, Taf.DataHelp.EN_STRING1), this.buf.writeUInt8(i.length)),
      this.buf.writeString(i);
  }),
  (Taf.JceOutputStream.prototype.writeBytes = function (t, e) {
    if (!(e instanceof Taf.BinBuffer)) throw Error("value not instanceof Taf.BinBuffer");
    this.writeTo(t, Taf.DataHelp.EN_SIMPLELIST),
      this.writeTo(0, Taf.DataHelp.EN_INT8),
      this.writeInt32(0, e.length),
      this.buf.writeBytes(e);
  }),
  (Taf.JceOutputStream.prototype.writeVector = function (t, e) {
    this.writeTo(t, Taf.DataHelp.EN_LIST), this.writeInt32(0, e.value.length);
    for (var i = 0; i < e.value.length; i++) e.proto._write(this, 0, e.value[i]);
  }),
  (Taf.JceOutputStream.prototype.writeMap = function (t, e) {
    this.writeTo(t, Taf.DataHelp.EN_MAP), this.writeInt32(0, e.size());
    for (var i in e.value) e.kproto._write(this, 0, i), e.vproto._write(this, 1, e.value[i]);
  }),
  (Taf.JceInputStream = function (t) {
    this.buf = new Taf.BinBuffer(t);
  }),
  (Taf.JceInputStream.prototype.readFrom = function () {
    var t = this.buf.readUInt8(),
      e = (240 & t) >> 4,
      i = 15 & t;
    return (
      e >= 15 && (e = this.buf.readUInt8()),
      {
        tag: e,
        type: i,
      }
    );
  }),
  (Taf.JceInputStream.prototype.peekFrom = function () {
    var t = this.buf.position,
      e = this.readFrom();
    return (
      (this.buf.position = t),
      {
        tag: e.tag,
        type: e.type,
        size: e.tag >= 15 ? 2 : 1,
      }
    );
  }),
  (Taf.JceInputStream.prototype.skipField = function (type) {
    switch (type) {
      case Taf.DataHelp.EN_INT8:
        this.buf.position += 1;
        break;
      case Taf.DataHelp.EN_INT16:
        this.buf.position += 2;
        break;
      case Taf.DataHelp.EN_INT32:
        this.buf.position += 4;
        break;
      case Taf.DataHelp.EN_INT64:
        this.buf.position += 8;
        break;
      case Taf.DataHelp.EN_STRING1:
        var a = this.buf.readUInt8();
        this.buf.position += a;
        break;
      case Taf.DataHelp.EN_STRING4:
        var b = this.buf.readInt32();
        this.buf.position += b;
        break;
      case Taf.DataHelp.EN_STRUCTBEGIN:
        this.skipToStructEnd();
        break;
      case Taf.DataHelp.EN_STRUCTEND:
      case Taf.DataHelp.EN_ZERO:
        break;
      case Taf.DataHelp.EN_MAP: {
        var size = this.readInt32(0, true);
        for (var i = 0; i < size * 2; ++i) {
          var head = this.readFrom();
          this.skipField(head.type);
        }
        break;
      }
      case Taf.DataHelp.EN_SIMPLELIST: {
        var head = this.readFrom();
        if (head.type != Taf.DataHelp.EN_INT8) {
          throw Error("skipField with invalid type, type value: " + type + "," + head.type);
        }
        var a = this.readInt32(0, true);
        this.buf.position += a;
        break;
      }
      case Taf.DataHelp.EN_LIST: {
        var size = this.readInt32(0, true);
        for (var i = 0; i < size; ++i) {
          var head = this.readFrom();
          this.skipField(head.type);
        }
        break;
      }
      default:
        throw new Error("skipField with invalid type, type value: " + type);
    }
  }),
  (Taf.JceInputStream.prototype.skipToStructEnd = function () {
    for (;;) {
      var t = this.readFrom();
      if ((this.skipField(t.type), t.type == Taf.DataHelp.EN_STRUCTEND)) return;
    }
  }),
  (Taf.JceInputStream.prototype.skipToTag = function (t, e) {
    for (; this.buf.position < this.buf.length; ) {
      var i = this.peekFrom();
      if (t <= i.tag || i.type == Taf.DataHelp.EN_STRUCTEND)
        return i.type == Taf.DataHelp.EN_STRUCTEND ? !1 : t == i.tag;
      (this.buf.position += i.size), this.skipField(i.type);
    }
    if (e) throw Error("require field not exist, tag:" + t);
    return !1;
  }),
  (Taf.JceInputStream.prototype.readBoolean = function (t, e, i) {
    return 1 == this.readInt8(t, e, i) ? !0 : !1;
  }),
  (Taf.JceInputStream.prototype.readInt8 = function (t, e, i) {
    if (0 == this.skipToTag(t, e)) return i;
    var r = this.readFrom();
    switch (r.type) {
      case Taf.DataHelp.EN_ZERO:
        return 0;
      case Taf.DataHelp.EN_INT8:
        return this.buf.readInt8();
    }
    throw Error("read int8 type mismatch, tag:" + t + ", get type:" + r.type);
  }),
  (Taf.JceInputStream.prototype.readInt16 = function (t, e, i) {
    if (0 == this.skipToTag(t, e)) return i;
    var r = this.readFrom();
    switch (r.type) {
      case Taf.DataHelp.EN_ZERO:
        return 0;
      case Taf.DataHelp.EN_INT8:
        return this.buf.readInt8();
      case Taf.DataHelp.EN_INT16:
        return this.buf.readInt16();
    }
    throw Error("read int8 type mismatch, tag:" + t + ", get type:" + r.type);
  }),
  (Taf.JceInputStream.prototype.readInt32 = function (t, e, i) {
    if (0 == this.skipToTag(t, e)) return i;
    var r = this.readFrom();
    switch (r.type) {
      case Taf.DataHelp.EN_ZERO:
        return 0;
      case Taf.DataHelp.EN_INT8:
        return this.buf.readInt8();
      case Taf.DataHelp.EN_INT16:
        return this.buf.readInt16();
      case Taf.DataHelp.EN_INT32:
        return this.buf.readInt32();
    }
    throw Error("read int8 type mismatch, tag:" + t + ", get type:" + r.type);
  }),
  (Taf.JceInputStream.prototype.readInt64 = function (t, e, i) {
    if (0 == this.skipToTag(t, e)) return i;
    var r = this.readFrom();
    switch (r.type) {
      case Taf.DataHelp.EN_ZERO:
        return 0;
      case Taf.DataHelp.EN_INT8:
        return this.buf.readInt8();
      case Taf.DataHelp.EN_INT16:
        return this.buf.readInt16();
      case Taf.DataHelp.EN_INT32:
        return this.buf.readInt32();
      case Taf.DataHelp.EN_INT64:
        return this.buf.readInt64();
    }
    throw Error("read int64 type mismatch, tag:" + t + ", get type:" + h.type);
  }),
  (Taf.JceInputStream.prototype.readFloat = function (t, e, i) {
    if (0 == this.skipToTag(t, e)) return i;
    var r = this.readFrom();
    switch (r.type) {
      case Taf.DataHelp.EN_ZERO:
        return 0;
      case Taf.DataHelp.EN_FLOAT:
        return this.buf.readFloat();
    }
    throw Error("read float type mismatch, tag:" + t + ", get type:" + h.type);
  }),
  (Taf.JceInputStream.prototype.readDouble = function (t, e, i) {
    if (0 == this.skipToTag(t, e)) return i;
    var r = this.readFrom();
    switch (r.type) {
      case Taf.DataHelp.EN_ZERO:
        return 0;
      case Taf.DataHelp.EN_DOUBLE:
        return this.buf.readDouble();
    }
    throw Error("read double type mismatch, tag:" + t + ", get type:" + h.type);
  }),
  (Taf.JceInputStream.prototype.readUInt8 = function (t, e, i) {
    return this.readInt16(t, e, i);
  }),
  (Taf.JceInputStream.prototype.readUInt16 = function (t, e, i) {
    return this.readInt32(t, e, i);
  }),
  (Taf.JceInputStream.prototype.readUInt32 = function (t, e, i) {
    return this.readInt64(t, e, i);
  }),
  (Taf.JceInputStream.prototype.readStruct = function (t, e, i) {
    if (0 == this.skipToTag(t, e)) return i;
    var r = this.readFrom();
    if (r.type != Taf.DataHelp.EN_STRUCTBEGIN)
      throw Error("read struct type mismatch, tag: " + t + ", get type:" + r.type);
    return i.readFrom(this), this.skipToStructEnd(), i;
  }),
  (Taf.JceInputStream.prototype.readString = function (t, e, i) {
    if (0 == this.skipToTag(t, e)) return i;
    var r = this.readFrom();
    if (r.type == Taf.DataHelp.EN_STRING1) return this.buf.readString(this.buf.readUInt8());
    if (r.type == Taf.DataHelp.EN_STRING4) return this.buf.readString(this.buf.readUInt32());
    throw Error("read 'string' type mismatch, tag: " + t + ", get type: " + r.type + ".");
  }),
  (Taf.JceInputStream.prototype.readString2 = function (t, e, i) {
    if (0 == this.skipToTag(t, e)) return i;
    var r = this.readFrom();
    if (r.type == Taf.DataHelp.EN_STRING1) return this.buf.readBytes(this.buf.readUInt8());
    if (r.type == Taf.DataHelp.EN_STRING4) return this.buf.readBytes(this.buf.readUInt32());
    throw Error("read 'string' type mismatch, tag: " + t + ", get type: " + r.type + ".");
  }),
  (Taf.JceInputStream.prototype.readBytes = function (t, e, i) {
    if (0 == this.skipToTag(t, e)) return i;
    var r = this.readFrom();
    if (r.type == Taf.DataHelp.EN_SIMPLELIST) {
      var n = this.readFrom();
      if (n.type != Taf.DataHelp.EN_INT8)
        throw Error("type mismatch, tag:" + t + ",type:" + r.type + "," + n.type);
      var s = this.readInt32(0, !0);
      if (0 > s) throw Error("invalid size, tag:" + t + ",type:" + r.type + "," + n.type);
      return this.buf.readBytes(s);
    }
    if (r.type == Taf.DataHelp.EN_LIST) {
      var s = this.readInt32(0, !0);
      return this.buf.readBytes(s);
    }
    throw Error("type mismatch, tag:" + t + ",type:" + r.type);
  }),
  (Taf.JceInputStream.prototype.readVector = function (t, e, i) {
    if (0 == this.skipToTag(t, e)) return i;
    var r = this.readFrom();
    if (r.type != Taf.DataHelp.EN_LIST)
      throw Error("read 'vector' type mismatch, tag: " + t + ", get type: " + r.type);
    var n = this.readInt32(0, !0);
    if (0 > n) throw Error("invalid size, tag: " + t + ", type: " + r.type + ", size: " + n);
    for (var s = 0; n > s; ++s) i.value.push(i.proto._read(this, 0, i.proto._clone()));
    return i;
  }),
  (Taf.JceInputStream.prototype.readMap = function (t, e, i) {
    if (0 == this.skipToTag(t, e)) return i;
    var r = this.readFrom();
    if (r.type != Taf.DataHelp.EN_MAP)
      throw Error("read 'map' type mismatch, tag: " + t + ", get type: " + r.type);
    var n = this.readInt32(0, !0);
    if (0 > n) throw Error("invalid map, tag: " + t + ", size: " + n);
    for (var s = 0; n > s; s++) {
      var o = i.kproto._read(this, 0, i.kproto._clone()),
        a = i.vproto._read(this, 1, i.vproto._clone());
      i.put(o, a);
    }
    return i;
  });
var Taf = Taf || {};
(Taf.Wup = function () {
  (this.iVersion = 3),
    (this.cPacketType = 0),
    (this.iMessageType = 0),
    (this.iRequestId = 0),
    (this.sServantName = ""),
    (this.sFuncName = ""),
    (this.sBuffer = new Taf.BinBuffer()),
    (this.iTimeout = 0),
    (this.context = new Taf.Map(new Taf.STRING(), new Taf.STRING())),
    (this.status = new Taf.Map(new Taf.STRING(), new Taf.STRING())),
    (this.data = new Taf.Map(new Taf.STRING(), new Taf.Map(new Taf.STRING(), new Taf.BinBuffer()))),
    (this.newdata = new Taf.Map(new Taf.STRING(), new Taf.BinBuffer()));
}),
  (Taf.Wup.prototype.setVersion = function (t) {
    this.iVersion = t;
  }),
  (Taf.Wup.prototype.getVersion = function () {
    return this.iVersion;
  }),
  (Taf.Wup.prototype.setServant = function (t) {
    this.sServantName = t;
  }),
  (Taf.Wup.prototype.setFunc = function (t) {
    this.sFuncName = t;
  }),
  (Taf.Wup.prototype.setRequestId = function (t) {
    this.iRequestId = t ? t : ++this.iRequestid;
  }),
  (Taf.Wup.prototype.getRequestId = function () {
    return this.iRequestId;
  }),
  (Taf.Wup.prototype.setTimeOut = function (t) {
    this.iTimeout = t;
  }),
  (Taf.Wup.prototype.getTimeOut = function () {
    return this.iTimeout;
  }),
  (Taf.Wup.prototype.writeTo = function () {
    var t = new Taf.JceOutputStream();
    return (
      t.writeInt16(1, this.iVersion),
      t.writeInt8(2, this.cPacketType),
      t.writeInt32(3, this.iMessageType),
      t.writeInt32(4, this.iRequestId),
      t.writeString(5, this.sServantName),
      t.writeString(6, this.sFuncName),
      t.writeBytes(7, this.sBuffer),
      t.writeInt32(8, this.iTimeout),
      t.writeMap(9, this.context),
      t.writeMap(10, this.status),
      new Taf.BinBuffer(t.getBuffer())
    );
  }),
  (Taf.Wup.prototype.encode = function () {
    var t = new Taf.JceOutputStream();
    3 == this.iVersion ? t.writeMap(0, this.newdata) : t.writeMap(0, this.data),
      (this.sBuffer = t.getBinBuffer());
    var e = new Taf.BinBuffer();
    e = this.writeTo();
    var i = new Taf.BinBuffer();
    return i.writeInt32(4 + e.len), i.writeBytes(e), i;
  }),
  (Taf.Wup.prototype.writeBoolean = function (t, e) {
    var i = new Taf.JceOutputStream();
    if ((i.writeBoolean(0, e), 3 == this.iVersion))
      this.newdata.put(t, new Taf.BinBuffer(i.getBuffer()));
    else {
      var r = this.data.get(t),
        n = TAF.TypeHelp.BOOLEAN;
      if (void 0 == r) {
        var s = new Taf.Map(Taf.STRING, Taf.STRING);
        r = s;
      }
      r.put(n, new Taf.BinBuffer(i.getBuffer())), this.data.put(t, r);
    }
  }),
  (Taf.Wup.prototype.writeInt8 = function (t, e) {
    var i = new Taf.JceOutputStream();
    if ((i.writeInt8(0, e), 3 == this.iVersion))
      this.newdata.put(t, new Taf.BinBuffer(i.getBuffer()));
    else {
      var r = this.data.get(t),
        n = TAF.TypeHelp.CHAR;
      if (void 0 == r) {
        var s = new Taf.Map(Taf.STRING, Taf.STRING);
        r = s;
      }
      r.put(n, new Taf.BinBuffer(i.getBuffer())), this.data.put(t, r);
    }
  }),
  (Taf.Wup.prototype.writeInt16 = function (t, e) {
    var i = new Taf.JceOutputStream();
    if ((i.writeInt16(0, e), 3 == this.iVersion))
      this.newdata.put(t, new Taf.BinBuffer(i.getBuffer()));
    else {
      var r = this.data.get(t),
        n = TAF.TypeHelp.SHORT;
      if (void 0 == r) {
        var s = new Taf.Map(Taf.STRING, Taf.STRING);
        r = s;
      }
      r.put(n, new Uint8Array(i.getBuffer())), this.data.put(t, r);
    }
  }),
  (Taf.Wup.prototype.writeInt32 = function (t, e) {
    var i = new Taf.JceOutputStream();
    if ((i.writeInt32(0, e), 3 == this.iVersion))
      this.newdata.put(t, new Taf.BinBuffer(i.getBuffer()));
    else {
      var r = this.data.get(t),
        n = TAF.TypeHelp.INT32;
      if (void 0 == r) {
        var s = new Taf.Map(Taf.STRING, Taf.STRING);
        r = s;
      }
      r.put(n, new Uint8Array(i.getBuffer())), this.data.put(t, r);
    }
  }),
  (Taf.Wup.prototype.writeInt64 = function (t, e) {
    var i = new Taf.JceOutputStream();
    if ((i.writeInt64(0, e), 3 == this.iVersion))
      this.newdata.put(t, new Taf.BinBuffer(i.getBuffer()));
    else {
      var r = this.data.get(t),
        n = TAF.TypeHelp.INT64;
      if (void 0 == r) {
        var s = new Taf.Map(Taf.STRING, Taf.STRING);
        r = s;
      }
      r.put(n, new Uint8Array(i.getBuffer())), this.data.put(t, r);
    }
  }),
  (Taf.Wup.prototype.writeFloat = function (t, e) {
    var i = new Taf.JceOutputStream();
    if ((i.writeFloat(0, e), 3 == this.iVersion))
      this.newdata.put(t, new Taf.BinBuffer(i.getBuffer()));
    else {
      var r = this.data.get(t),
        n = TAF.TypeHelp.FLOAT;
      if (void 0 == r) {
        var s = new Taf.Map(Taf.STRING, Taf.STRING);
        r = s;
      }
      r.put(n, new Uint8Array(i.getBuffer())), this.data.put(t, r);
    }
  }),
  (Taf.Wup.prototype.writeDouble = function (t, e) {
    var i = new Taf.JceOutputStream();
    if ((i.writeDouble(0, e), 3 == this.iVersion))
      this.newdata.put(t, new Taf.BinBuffer(i.getBuffer()));
    else {
      var r = this.data.get(t),
        n = TAF.TypeHelp.DOUBLE;
      if (void 0 == r) {
        var s = new Taf.Map(Taf.STRING, Taf.STRING);
        r = s;
      }
      r.put(n, new Uint8Array(i.getBuffer())), this.data.put(t, r);
    }
  }),
  (Taf.Wup.prototype.writeString = function (t, e) {
    var i = new Taf.JceOutputStream();
    if ((i.writeString(0, e), 3 == this.iVersion))
      this.newdata.put(t, new Taf.BinBuffer(i.getBuffer()));
    else {
      var r = this.data.get(t),
        n = Taf.TypeHelp.STRING;
      if (void 0 == r) {
        var s = new Taf.Map(Taf.STRING, Taf.STRING);
        r = s;
      }
      r.put(n, new Uint8Array(i.getBuffer())), this.data.put(t, r);
    }
  }),
  (Taf.Wup.prototype.writeVector = function (t, e) {
    var i = new Taf.JceOutputStream();
    if ((i.writeVector(0, e), 3 == this.iVersion))
      this.newdata.put(t, new Taf.BinBuffer(i.getBinBuffer()));
    else {
      var r = this.data.get(t),
        n = e._className();
      if (void 0 == r) {
        var s = new Taf.Map(Taf.STRING, Taf.STRING);
        r = s;
      }
      r.put(n, new Uint8Array(i.getBuffer())), this.data.put(t, r);
    }
  }),
  (Taf.Wup.prototype.writeStruct = function (t, e) {
    var i = new Taf.JceOutputStream();
    if ((i.writeStruct(0, e), 3 == this.iVersion))
      this.newdata.put(t, new Taf.BinBuffer(i.getBuffer()));
    else {
      var r = this.data.get(t),
        n = " ";
      if (void 0 == r) {
        var s = new Taf.Map(Taf.STRING, Taf.STRING);
        r = s;
      }
      r.put(n, new Uint8Array(i.getBuffer())), this.data.put(t, r);
    }
  }),
  (Taf.Wup.prototype.writeBytes = function (t, e) {
    var i = new Taf.JceOutputStream();
    if ((i.writeBytes(0, e), 3 == this.iVersion))
      this.newdata.put(t, new Taf.BinBuffer(i.getBuffer()));
    else {
      var r = this.data.get(t),
        n = "vec";
      if (void 0 == r) {
        var s = new Taf.Map(Taf.STRING, Taf.STRING);
        r = s;
      }
      r.put(n, new Uint8Array(i.getBuffer())), this.data.put(t, r);
    }
  }),
  (Taf.Wup.prototype.writeMap = function (t, e) {
    var i = new Taf.JceOutputStream();
    if ((i.writeMap(0, e), 3 == this.iVersion))
      this.newdata.put(t, new Taf.BinBuffer(i.getBuffer()));
    else {
      var r = this.data.get(t),
        n = Taf.Util.getClassType(e);
      if (void 0 == r) {
        var s = new Taf.Map(Taf.STRING, Taf.STRING);
        r = s;
      }
      r.put(n, new Uint8Array(i.getBuffer())), this.data.put(t, r);
    }
  }),
  (Taf.Wup.prototype.readFrom = function (t) {
    (this.iVersion = t.readInt16(1, !0)),
      (this.cPacketType = t.readInt8(2, !0)),
      (this.iMessageType = t.readInt32(3, !0)),
      (this.iRequestId = t.readInt32(4, !0)),
      (this.sServantName = t.readString(5, !0)),
      (this.sFuncName = t.readString(6, !0)),
      (this.sBuffer = t.readBytes(7, !0)),
      (this.iTimeout = t.readInt32(8, !0)),
      (this.context = t.readMap(9, !0)),
      (this.status = t.readMap(10, !0));
  }),
  (Taf.Wup.prototype.decode = function (t) {
    var e = new Taf.JceInputStream(t),
      i = e.buf.vew.getInt32(e.buf.position);
    if (4 > i) throw Error("packet length too short");
    (e.buf.position += 4),
      this.readFrom(e),
      (e = new Taf.JceInputStream(this.sBuffer.getBuffer())),
      3 == this.iVersion
        ? (this.newdata.clear(), e.readMap(0, !0, this.newdata))
        : (this.data.clear(), e.readMap(0, !0, this.newdata));
  }),
  (Taf.Wup.prototype.readBoolean = function (t) {
    var e, i;
    if (3 == this.iVersion) {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var r = new Taf.JceInputStream(e.buffer);
      i = r.readBoolean(0, !0, i);
    } else {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var n = Taf.TypeHelp.BOOLEAN,
        s = e.get(n);
      if (void 0 == s) throw Error("UniAttribute not found type:" + n);
      var r = new Taf.JceInputStream(s);
      i = r.readBoolean(0, !0, i);
    }
    return i;
  }),
  (Taf.Wup.prototype.readInt8 = function (t) {
    var e, i;
    if (3 == this.iVersion) {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var r = new Taf.JceInputStream(e.buffer);
      i = r.readInt8(0, !0, i);
    } else {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var n = Taf.TypeHelp.CHAR,
        s = e.get(n);
      if (void 0 == s) throw Error("UniAttribute not found type:" + n);
      var r = new Taf.JceInputStream(s);
      i = r.readInt8(0, !0, i);
    }
    return i;
  }),
  (Taf.Wup.prototype.readInt16 = function (t) {
    var e, i;
    if (3 == this.iVersion) {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var r = new Taf.JceInputStream(e.buffer);
      i = r.readInt16(0, !0, i);
    } else {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var n = Taf.TypeHelp.SHORT,
        s = e.get(n),
        r = new Taf.JceInputStream(s);
      if (void 0 == s) throw Error("UniAttribute not found type:" + n);
      i = r.readInt16(0, !0, i);
    }
    return i;
  }),
  (Taf.Wup.prototype.readInt32 = function (t) {
    var e, i;
    if (3 == this.iVersion) {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var r = new Taf.JceInputStream(e.buffer);
      i = r.readInt32(0, !0, i);
    } else {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var n = Taf.TypeHelp.INT32,
        s = e.get(n);
      if (void 0 == s) throw Error("UniAttribute not found type:" + n);
      var r = new Taf.JceInputStream(s);
      i = r.readInt32(0, !0, i);
    }
    return i;
  }),
  (Taf.Wup.prototype.readInt64 = function (t) {
    var e, i;
    if (3 == this.iVersion) {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var r = new Taf.JceInputStream(e.buffer);
      i = r.readInt64(0, !0, i);
    } else {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var n = Taf.TypeHelp.INT64,
        s = e.get(n);
      if (void 0 == s) throw Error("UniAttribute not found type:" + n);
      var r = new Taf.JceInputStream(s);
      i = r.readInt64(0, !0, i);
    }
    return i;
  }),
  (Taf.Wup.prototype.readFloat = function (t) {
    var e, i;
    if (3 == this.iVersion) {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var r = new Taf.JceInputStream(e.buffer);
      i = r.readFloat(0, !0, i);
    } else {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var n = Taf.TypeHelp.FLOAT,
        s = e.get(n);
      if (void 0 == s) throw Error("UniAttribute not found type:" + n);
      var r = new Taf.JceInputStream(s);
      i = r.readFloat(0, !0, i);
    }
    return i;
  }),
  (Taf.Wup.prototype.readDouble = function (t) {
    var e;
    if (3 == this.iVersion) {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var i = new Taf.JceInputStream(e.buffer);
      def = i.readDouble(0, !0, def);
    } else {
      if (((e = this.newdata.get(t)), void 0 == e)) throw Error("UniAttribute not found key:" + t);
      var r = Taf.TypeHelp.DOUBLE,
        n = e.get(r);
      if (void 0 == n) throw Error("UniAttribute not found type:" + r);
      var i = new Taf.JceInputStream(n);
      def = i.readDouble(0, !0, def);
    }
    return def;
  }),
  (Taf.Wup.prototype.readVector = function (t, e, i) {
    var r;
    if (3 == this.iVersion) {
      if (((r = this.newdata.get(t)), void 0 == r)) throw Error("UniAttribute not found key:" + t);
      var n = new Taf.JceInputStream(r.buffer);
      e = n.readVector(0, !0, e);
    } else {
      if (((r = this.newdata.get(t)), void 0 == r)) throw Error("UniAttribute not found key:" + t);
      var s = r.get(i);
      if (void 0 == s) throw Error("UniAttribute not found type:" + i);
      var n = new Taf.JceInputStream(s);
      e = n.readVector(0, !0, e);
    }
    return e;
  }),
  (Taf.Wup.prototype.readStruct = function (t, e, i) {
    var r;
    if (3 == this.iVersion) {
      if (((r = this.newdata.get(t)), void 0 == r)) throw Error("UniAttribute not found key:" + t);
      var n = new Taf.JceInputStream(r.buffer);
      e = n.readStruct(0, !0, e);
    } else {
      if (((r = this.newdata.get(t)), void 0 == r)) throw Error("UniAttribute not found key:" + t);
      var s = r.get(i);
      if (void 0 == s) throw Error("UniAttribute not found type:" + i);
      var n = new Taf.JceInputStream(s);
      e = n.readStruct(0, !0, e);
    }
    return e;
  }),
  (Taf.Wup.prototype.readMap = function (t, e, i) {
    var r;
    if (3 == this.iVersion) {
      if (((r = this.newdata.get(t)), void 0 == r)) throw Error("UniAttribute not found key:" + t);
      var n = new Taf.JceInputStream(r.buffer);
      e = n.readMap(0, !0, e);
    } else {
      if (((r = this.newdata.get(t)), void 0 == r)) throw Error("UniAttribute not found key:" + t);
      var s = r.get(i);
      if (void 0 == s) throw Error("UniAttribute not found type:" + i);
      var n = new Taf.JceInputStream(s);
      e = n.readMap(0, !0, e);
    }
    return e;
  }),
  (Taf.Wup.prototype.readBytes = function (t, e, i) {
    var r;
    if (3 == this.iVersion) {
      if (((r = this.newdata.get(t)), void 0 == r)) throw Error("UniAttribute not found key:" + t);
      var n = new Taf.JceInputStream(r.buffer);
      e = n.readBytes(0, !0, e);
    } else {
      if (((r = this.newdata.get(t)), void 0 == r)) throw Error("UniAttribute not found key:" + t);
      var s = r.get(i);
      if (void 0 == s) throw Error("UniAttribute not found type:" + i);
      var n = new Taf.JceInputStream(s);
      e = n.readBytes(0, !0, e);
    }
    return e;
  });
var Taf = Taf || {};
(Taf.Util = Taf.Util || {}),
  (Taf.Util.jcestream = function (t) {
    if (null == t || void 0 == t)
      return void console.log("Taf.Util.jcestream::value is null or undefined");
    if (!(t instanceof ArrayBuffer))
      return void console.log("Taf.Util.jcestream::value is not ArrayBuffer");
    for (var e = new Uint8Array(t), i = "", r = 0; r < e.length; r++)
      0 != r && r % 16 == 0 ? (i += "\n") : 0 != r && (i += " "),
        (i += (e[r] > 15 ? "" : "0") + e[r].toString(16));
    console.log(i.toUpperCase());
  }),
  (Taf.Util.str2ab = function (t) {
    var e,
      i = t.length,
      r = new Array(i);
    for (e = 0; i > e; ++e) r[e] = t.charCodeAt(e);
    return new Uint8Array(r).buffer;
  }),
  (Taf.Util.ajax = function (t, e, i, r) {
    var n = new XMLHttpRequest();
    n.overrideMimeType("text/plain; charset=x-user-defined");
    var s = function () {
      4 === n.readyState &&
        (200 === n.status || 304 === n.status ? i(Taf.Util.str2ab(n.response)) : r(n.status),
        n.removeEventListener("readystatechange", s),
        (n = void 0));
    };
    n.addEventListener("readystatechange", s), n.open("post", t), n.send(e);
  });
var HUYA = HUYA || {};
(HUYA.EWebSocketCommandType = {
  EWSCmd_NULL: 0,
  EWSCmd_RegisterReq: 1,
  EWSCmd_RegisterRsp: 2,
  EWSCmd_WupReq: 3,
  EWSCmd_WupRsp: 4,
  EWSCmdC2S_HeartBeat: 5,
  EWSCmdS2C_HeartBeatAck: 6,
  EWSCmdS2C_MsgPushReq: 7,
  EWSCmdC2S_DeregisterReq: 8,
  EWSCmdS2C_DeRegisterRsp: 9,
  EWSCmdC2S_VerifyCookieReq: 10,
  EWSCmdS2C_VerifyCookieRsp: 11,
  EWSCmdC2S_VerifyHuyaTokenReq: 12,
  EWSCmdS2C_VerifyHuyaTokenRsp: 13,
}),
  (HUYA.ELiveSource = {
    PC_YY: 0,
    PC_HUYA: 1,
    MOBILE_HUYA: 2,
    WEB_HUYA: 3,
  }),
  (HUYA.EGender = {
    MALE: 0,
    FEMALE: 1,
  }),
  (HUYA.EClientTemplateType = {
    TPL_PC: 64,
    TPL_WEB: 32,
    TPL_JIEDAI: 16,
    TPL_TEXAS: 8,
    TPL_MATCH: 4,
    TPL_HUYAAPP: 2,
    TPL_MIRROR: 1,
  }),
  (HUYA.TemplateType = {
    PRIMARY: 1,
    RECEPTION: 2,
  }),
  (HUYA.EStreamLineType = {
    STREAM_LINE_OLD_YY: 0,
    STREAM_LINE_WS: 1,
    STREAM_LINE_NEW_YY: 2,
    STREAM_LINE_AL: 3,
    STREAM_LINE_HUYA: 4,
  }),
  (HUYA.eUserOperation = {
    USER_IN: 1,
    USER_OUT: 2,
    USER_MOVE: 3,
  }),
  (HUYA.WebSocketCommand = function () {
    (this.iCmdType = 0), (this.vData = new Taf.BinBuffer());
  }),
  (HUYA.WebSocketCommand.prototype._clone = function () {
    return new HUYA.WebSocketCommand();
  }),
  (HUYA.WebSocketCommand.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.WebSocketCommand.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.WebSocketCommand.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iCmdType), t.writeBytes(1, this.vData);
  }),
  (HUYA.WebSocketCommand.prototype.readFrom = function (t) {
    (this.iCmdType = t.readInt32(0, !1, this.iCmdType)),
      (this.vData = t.readBytes(1, !1, this.vData));
  }),
  (HUYA.WSRegisterRsp = function () {
    (this.iResCode = 0), (this.lRequestId = 0), (this.sMessage = "");
  }),
  (HUYA.WSRegisterRsp.prototype._clone = function () {
    return new HUYA.WSRegisterRsp();
  }),
  (HUYA.WSRegisterRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.WSRegisterRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.WSRegisterRsp.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iResCode),
      t.writeInt64(1, this.lRequestId),
      t.writeString(2, this.sMessage);
  }),
  (HUYA.WSRegisterRsp.prototype.readFrom = function (t) {
    (this.iResCode = t.readInt32(0, !1, this.iResCode)),
      (this.lRequestId = t.readInt64(1, !1, this.lRequestId)),
      (this.sMessage = t.readString(2, !1, this.sMessage));
  }),
  (HUYA.WSPushMessage = function () {
    (this.ePushType = 0),
      (this.iUri = 0),
      (this.sMsg = new Taf.BinBuffer()),
      (this.iProtocolType = 0);
  }),
  (HUYA.WSPushMessage.prototype._clone = function () {
    return new HUYA.WSPushMessage();
  }),
  (HUYA.WSPushMessage.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.WSPushMessage.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.WSPushMessage.prototype.writeTo = function (t) {
    t.writeInt32(0, this.ePushType),
      t.writeInt64(1, this.iUri),
      t.writeBytes(2, this.sMsg),
      t.writeInt32(3, this.iProtocolType);
  }),
  (HUYA.WSPushMessage.prototype.readFrom = function (t) {
    (this.ePushType = t.readInt32(0, !1, this.ePushType)),
      (this.iUri = t.readInt64(1, !1, this.iUri)),
      (this.sMsg = t.readBytes(2, !1, this.sMsg)),
      (this.iProtocolType = t.readInt32(3, !1, this.iProtocolType));
  }),
  (HUYA.WSHeartBeat = function () {
    this.iState = 0;
  }),
  (HUYA.WSHeartBeat.prototype._clone = function () {
    return new HUYA.WSHeartBeat();
  }),
  (HUYA.WSHeartBeat.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.WSHeartBeat.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.WSHeartBeat.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iState);
  }),
  (HUYA.WSHeartBeat.prototype.readFrom = function (t) {
    this.iState = t.readInt32(0, !1, this.iState);
  }),
  (HUYA.WSUserInfo = function () {
    (this.lUid = 0),
      (this.bAnonymous = !0),
      (this.sGuid = ""),
      (this.sToken = ""),
      (this.lTid = 0),
      (this.lSid = 0),
      (this.lGroupId = 0),
      (this.lGroupType = 0);
  }),
  (HUYA.WSUserInfo.prototype._clone = function () {
    return new HUYA.WSUserInfo();
  }),
  (HUYA.WSUserInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.WSUserInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.WSUserInfo.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeBoolean(1, this.bAnonymous),
      t.writeString(2, this.sGuid),
      t.writeString(3, this.sToken),
      t.writeInt64(4, this.lTid),
      t.writeInt64(5, this.lSid),
      t.writeInt64(6, this.lGroupId),
      t.writeInt64(7, this.lGroupType);
  }),
  (HUYA.WSUserInfo.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.bAnonymous = t.readBoolean(1, !1, this.bAnonymous)),
      (this.sGuid = t.readString(2, !1, this.sGuid)),
      (this.sToken = t.readString(3, !1, this.sToken)),
      (this.lTid = t.readInt64(4, !1, this.lTid)),
      (this.lSid = t.readInt64(5, !1, this.lSid)),
      (this.lGroupId = t.readInt64(6, !1, this.lGroupId)),
      (this.lGroupType = t.readInt64(7, !1, this.lGroupType));
  }),
  (HUYA.WSVerifyCookieReq = function () {
    (this.lUid = 0), (this.sUA = ""), (this.sCookie = "");
  }),
  (HUYA.WSVerifyCookieReq.prototype._clone = function () {
    return new HUYA.WSVerifyCookieReq();
  }),
  (HUYA.WSVerifyCookieReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.WSVerifyCookieReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.WSVerifyCookieReq.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid), t.writeString(1, this.sUA), t.writeString(2, this.sCookie);
  }),
  (HUYA.WSVerifyCookieReq.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.sUA = t.readString(1, !1, this.sUA)),
      (this.sCookie = t.readString(2, !1, this.sCookie));
  }),
  (HUYA.WSVerifyCookieRsp = function () {
    this.iValidate = 0;
  }),
  (HUYA.WSVerifyCookieRsp.prototype._clone = function () {
    return new HUYA.WSVerifyCookieRsp();
  }),
  (HUYA.WSVerifyCookieRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.WSVerifyCookieRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.WSVerifyCookieRsp.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iValidate);
  }),
  (HUYA.WSVerifyCookieRsp.prototype.readFrom = function (t) {
    this.iValidate = t.readInt32(0, !1, this.iValidate);
  }),
  (HUYA.UserId = function () {
    (this.lUid = 0),
      (this.sGuid = ""),
      (this.sToken = ""),
      (this.sHuYaUA = ""),
      (this.sCookie = "");
  }),
  (HUYA.UserId.prototype._clone = function () {
    return new HUYA.UserId();
  }),
  (HUYA.UserId.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.UserId.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.UserId.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeString(1, this.sGuid),
      t.writeString(2, this.sToken),
      t.writeString(3, this.sHuYaUA),
      t.writeString(4, this.sCookie);
  }),
  (HUYA.UserId.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.sGuid = t.readString(1, !1, this.sGuid)),
      (this.sToken = t.readString(2, !1, this.sToken)),
      (this.sHuYaUA = t.readString(3, !1, this.sHuYaUA)),
      (this.sCookie = t.readString(4, !1, this.sCookie));
  }),
  (HUYA.UserEventReq = function () {
    (this.tId = new HUYA.UserId()),
      (this.lTid = 0),
      (this.lSid = 0),
      (this.lShortTid = 0),
      (this.eOp = 0),
      (this.sChan = ""),
      (this.eSource = 0),
      (this.lPid = 0),
      (this.bWatchVideo = !1),
      (this.bAnonymous = !1),
      (this.eTemplateType = HUYA.TemplateType.PRIMARY);
  }),
  (HUYA.UserEventReq.prototype._clone = function () {
    return new HUYA.UserEventReq();
  }),
  (HUYA.UserEventReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.UserEventReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.UserEventReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId),
      t.writeInt64(1, this.lTid),
      t.writeInt64(2, this.lSid),
      t.writeInt64(3, this.lShortTid),
      t.writeInt32(4, this.eOp),
      t.writeString(5, this.sChan),
      t.writeInt32(6, this.eSource),
      t.writeInt64(7, this.lPid),
      t.writeBoolean(8, this.bWatchVideo),
      t.writeBoolean(9, this.bAnonymous),
      t.writeInt32(10, this.eTemplateType);
  }),
  (HUYA.UserEventReq.prototype.readFrom = function (t) {
    (this.tId = t.readStruct(0, !1, this.tId)),
      (this.lTid = t.readInt64(1, !1, this.lTid)),
      (this.lSid = t.readInt64(2, !1, this.lSid)),
      (this.lShortTid = t.readInt64(3, !1, this.lShortTid)),
      (this.eOp = t.readInt32(4, !1, this.eOp)),
      (this.sChan = t.readString(5, !1, this.sChan)),
      (this.eSource = t.readInt32(6, !1, this.eSource)),
      (this.lPid = t.readInt64(7, !1, this.lPid)),
      (this.bWatchVideo = t.readBoolean(8, !1, this.bWatchVideo)),
      (this.bAnonymous = t.readBoolean(9, !1, this.bAnonymous)),
      (this.eTemplateType = t.readInt32(10, !1, this.eTemplateType));
  }),
  (HUYA.UserEventRsp = function () {
    (this.lTid = 0),
      (this.lSid = 0),
      (this.iUserHeartBeatInterval = 60),
      (this.iPresentHeartBeatInterval = 60);
  }),
  (HUYA.UserEventRsp.prototype._clone = function () {
    return new HUYA.UserEventRsp();
  }),
  (HUYA.UserEventRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.UserEventRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.UserEventRsp.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lTid),
      t.writeInt64(1, this.lSid),
      t.writeInt32(2, this.iUserHeartBeatInterval),
      t.writeInt32(3, this.iPresentHeartBeatInterval);
  }),
  (HUYA.UserEventRsp.prototype.readFrom = function (t) {
    (this.lTid = t.readInt64(0, !1, this.lTid)),
      (this.lSid = t.readInt64(1, !1, this.lSid)),
      (this.iUserHeartBeatInterval = t.readInt32(2, !1, this.iUserHeartBeatInterval)),
      (this.iPresentHeartBeatInterval = t.readInt32(3, !1, this.iPresentHeartBeatInterval));
  }),
  (HUYA.UserHeartBeatReq = function () {
    (this.tId = new HUYA.UserId()),
      (this.lTid = 0),
      (this.lSid = 0),
      (this.lShortTid = 0),
      (this.lPid = 0),
      (this.bWatchVideo = !1),
      (this.eLineType = HUYA.EStreamLineType.STREAM_LINE_OLD_YY),
      (this.iFps = 0),
      (this.iAttendee = 0),
      (this.iBandwidth = 0),
      (this.iLastHeartElapseTime = 0);
  }),
  (HUYA.UserHeartBeatReq.prototype._clone = function () {
    return new HUYA.UserHeartBeatReq();
  }),
  (HUYA.UserHeartBeatReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.UserHeartBeatReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.UserHeartBeatReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId),
      t.writeInt64(1, this.lTid),
      t.writeInt64(2, this.lSid),
      t.writeInt64(3, this.lShortTid),
      t.writeInt64(4, this.lPid),
      t.writeBoolean(5, this.bWatchVideo),
      t.writeInt32(6, this.eLineType),
      t.writeInt32(7, this.iFps),
      t.writeInt32(8, this.iAttendee),
      t.writeInt32(9, this.iBandwidth),
      t.writeInt32(10, this.iLastHeartElapseTime);
  }),
  (HUYA.UserHeartBeatReq.prototype.readFrom = function (t) {
    (this.tId = t.readStruct(0, !1, this.tId)),
      (this.lTid = t.readInt64(1, !1, this.lTid)),
      (this.lSid = t.readInt64(2, !1, this.lSid)),
      (this.lShortTid = t.readInt64(3, !1, this.lShortTid)),
      (this.lPid = t.readInt64(4, !1, this.lPid)),
      (this.bWatchVideo = t.readBoolean(5, !1, this.bWatchVideo)),
      (this.eLineType = t.readInt32(6, !1, this.eLineType)),
      (this.iFps = t.readInt32(7, !1, this.iFps)),
      (this.iAttendee = t.readInt32(8, !1, this.iAttendee)),
      (this.iBandwidth = t.readInt32(9, !1, this.iBandwidth)),
      (this.iLastHeartElapseTime = t.readInt32(10, !1, this.iLastHeartElapseTime));
  }),
  (HUYA.UserHeartBeatRsp = function () {
    this.iRet = 0;
  }),
  (HUYA.UserHeartBeatRsp.prototype._clone = function () {
    return new HUYA.UserHeartBeatRsp();
  }),
  (HUYA.UserHeartBeatRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.UserHeartBeatRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.UserHeartBeatRsp.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iRet);
  }),
  (HUYA.UserHeartBeatRsp.prototype.readFrom = function (t) {
    this.iRet = t.readInt32(0, !1, this.iRet);
  }),
  (HUYA.VipListReq = function () {
    (this.tUserId = new HUYA.UserId()),
      (this.lTid = 0),
      (this.lSid = 0),
      (this.iStart = 0),
      (this.iCount = 0);
  }),
  (HUYA.VipListReq.prototype._clone = function () {
    return new HUYA.VipListReq();
  }),
  (HUYA.VipListReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.VipListReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.VipListReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tUserId),
      t.writeInt64(1, this.lTid),
      t.writeInt64(2, this.lSid),
      t.writeInt32(3, this.iStart),
      t.writeInt32(4, this.iCount);
  }),
  (HUYA.VipListReq.prototype.readFrom = function (t) {
    (this.tUserId = t.readStruct(0, !1, this.tUserId)),
      (this.lTid = t.readInt64(1, !1, this.lTid)),
      (this.lSid = t.readInt64(2, !1, this.lSid)),
      (this.iStart = t.readInt32(3, !1, this.iStart)),
      (this.iCount = t.readInt32(4, !1, this.iCount));
  }),
  (HUYA.VipBarListRsp = function () {
    (this.iStart = 0),
      (this.iCount = 0),
      (this.iTotal = 0),
      (this.vVipBarItem = new Taf.Vector(new HUYA.VipBarItem())),
      (this.sBadgeName = ""),
      (this.iChangedHighestRank = 0);
  }),
  (HUYA.VipBarListRsp.prototype._clone = function () {
    return new HUYA.VipBarListRsp();
  }),
  (HUYA.VipBarListRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.VipBarListRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.VipBarListRsp.prototype.writeTo = function (t) {
    t.writeInt32(1, this.iStart),
      t.writeInt32(2, this.iCount),
      t.writeInt32(3, this.iTotal),
      t.writeVector(4, this.vVipBarItem),
      t.writeString(5, this.sBadgeName),
      t.writeInt32(6, this.iChangedHighestRank);
  }),
  (HUYA.VipBarListRsp.prototype.readFrom = function (t) {
    (this.iStart = t.readInt32(1, !1, this.iStart)),
      (this.iCount = t.readInt32(2, !1, this.iCount)),
      (this.iTotal = t.readInt32(3, !1, this.iTotal)),
      (this.vVipBarItem = t.readVector(4, !1, this.vVipBarItem)),
      (this.sBadgeName = t.readString(5, !1, this.sBadgeName)),
      (this.iChangedHighestRank = t.readInt32(6, !1, this.iChangedHighestRank));
  }),
  (HUYA.VipBarItem = function () {
    (this.lUid = 0),
      (this.iTypes = 0),
      (this.tNobleInfo = new HUYA.NobleInfo()),
      (this.tGuardInfo = new HUYA.GuardInfo()),
      (this.tFansInfo = new HUYA.FansInfo()),
      (this.sNickName = ""),
      (this.iSuperPupleLevel = 0),
      (this.iPotentialTypes = 0),
      (this.sLogo = ""),
      (this.lExpiredTS = 0);
  }),
  (HUYA.VipBarItem.prototype._clone = function () {
    return new HUYA.VipBarItem();
  }),
  (HUYA.VipBarItem.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.VipBarItem.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.VipBarItem.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeInt32(1, this.iTypes),
      t.writeStruct(2, this.tNobleInfo),
      t.writeStruct(3, this.tGuardInfo),
      t.writeStruct(4, this.tFansInfo),
      t.writeString(5, this.sNickName),
      t.writeInt32(6, this.iSuperPupleLevel),
      t.writeInt32(7, this.iPotentialTypes),
      t.writeString(8, this.sLogo),
      t.writeInt64(9, this.lExpiredTS);
  }),
  (HUYA.VipBarItem.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.iTypes = t.readInt32(1, !1, this.iTypes)),
      (this.tNobleInfo = t.readStruct(2, !1, this.tNobleInfo)),
      (this.tGuardInfo = t.readStruct(3, !1, this.tGuardInfo)),
      (this.tFansInfo = t.readStruct(4, !1, this.tFansInfo)),
      (this.sNickName = t.readString(5, !1, this.sNickName)),
      (this.iSuperPupleLevel = t.readInt32(6, !1, this.iSuperPupleLevel)),
      (this.iPotentialTypes = t.readInt32(7, !1, this.iPotentialTypes)),
      (this.sLogo = t.readString(8, !1, this.sLogo)),
      (this.lExpiredTS = t.readInt64(9, !1, this.lExpiredTS));
  }),
  (HUYA.WeekRankItem = function () {
    (this.lUid = 0),
      (this.sNickName = ""),
      (this.iScore = 0),
      (this.iGuardLevel = 0),
      (this.iNobleLevel = 0),
      (this.sLogo = "");
  }),
  (HUYA.WeekRankItem.prototype._clone = function () {
    return new HUYA.WeekRankItem();
  }),
  (HUYA.WeekRankItem.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.WeekRankItem.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.WeekRankItem.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeString(1, this.sNickName),
      t.writeInt32(2, this.iScore),
      t.writeInt32(3, this.iGuardLevel),
      t.writeInt32(4, this.iNobleLevel),
      t.writeString(5, this.sLogo);
  }),
  (HUYA.WeekRankItem.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.sNickName = t.readString(1, !1, this.sNickName)),
      (this.iScore = t.readInt32(2, !1, this.iScore)),
      (this.iGuardLevel = t.readInt32(3, !1, this.iGuardLevel)),
      (this.iNobleLevel = t.readInt32(4, !1, this.iNobleLevel)),
      (this.sLogo = t.readString(5, !1, this.sLogo));
  }),
  (HUYA.WeekRankListReq = function () {
    (this.tUserId = new HUYA.UserId()), (this.lTid = 0), (this.lSid = 0);
  }),
  (HUYA.WeekRankListReq.prototype._clone = function () {
    return new HUYA.WeekRankListReq();
  }),
  (HUYA.WeekRankListReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.WeekRankListReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.WeekRankListReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tUserId), t.writeInt64(1, this.lTid), t.writeInt64(2, this.lSid);
  }),
  (HUYA.WeekRankListReq.prototype.readFrom = function (t) {
    (this.tUserId = t.readStruct(0, !1, this.tUserId)),
      (this.lTid = t.readInt64(1, !1, this.lTid)),
      (this.lSid = t.readInt64(2, !1, this.lSid));
  }),
  (HUYA.WeekRankListRsp = function () {
    (this.vWeekRankItem = new Taf.Vector(new HUYA.WeekRankItem())),
      (this.iStart = 0),
      (this.iCount = 0),
      (this.iTotal = 0);
  }),
  (HUYA.WeekRankListRsp.prototype._clone = function () {
    return new HUYA.WeekRankListRsp();
  }),
  (HUYA.WeekRankListRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.WeekRankListRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.WeekRankListRsp.prototype.writeTo = function (t) {
    t.writeVector(0, this.vWeekRankItem),
      t.writeInt32(1, this.iStart),
      t.writeInt32(2, this.iCount),
      t.writeInt32(3, this.iTotal);
  }),
  (HUYA.WeekRankListRsp.prototype.readFrom = function (t) {
    (this.vWeekRankItem = t.readVector(0, !1, this.vWeekRankItem)),
      (this.iStart = t.readInt32(1, !1, this.iStart)),
      (this.iCount = t.readInt32(2, !1, this.iCount)),
      (this.iTotal = t.readInt32(3, !1, this.iTotal));
  }),
  (HUYA.WeekRankEnterBanner = function () {
    (this.lUid = 0), (this.sNickName = ""), (this.iRank = 0), (this.lPid = 0);
  }),
  (HUYA.WeekRankEnterBanner.prototype._clone = function () {
    return new HUYA.WeekRankEnterBanner();
  }),
  (HUYA.WeekRankEnterBanner.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.WeekRankEnterBanner.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.WeekRankEnterBanner.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeString(1, this.sNickName),
      t.writeInt32(2, this.iRank),
      t.writeInt64(3, this.lPid);
  }),
  (HUYA.WeekRankEnterBanner.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.sNickName = t.readString(1, !1, this.sNickName)),
      (this.iRank = t.readInt32(2, !1, this.iRank)),
      (this.lPid = t.readInt64(3, !1, this.lPid));
  }),
  (HUYA.LiveListRsp = function () {
    (this.vGameLiveInfos = new Taf.Vector(new HUYA.GameLiveInfo())), (this.lNextBeginId = 0);
  }),
  (HUYA.LiveListRsp.prototype._clone = function () {
    return new HUYA.LiveListRsp();
  }),
  (HUYA.LiveListRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.LiveListRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.LiveListRsp.prototype.writeTo = function (t) {
    t.writeVector(0, this.vGameLiveInfos), t.writeInt64(1, this.lNextBeginId);
  }),
  (HUYA.LiveListRsp.prototype.readFrom = function (t) {
    (this.vGameLiveInfos = t.readVector(0, !1, this.vGameLiveInfos)),
      (this.lNextBeginId = t.readInt64(1, !1, this.lNextBeginId));
  }),
  (HUYA.UserChannelReq = function () {
    (this.tId = new HUYA.UserId()),
      (this.lTopcid = 0),
      (this.lSubcid = 0),
      (this.sSendContent = "");
  }),
  (HUYA.UserChannelReq.prototype._clone = function () {
    return new HUYA.UserChannelReq();
  }),
  (HUYA.UserChannelReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.UserChannelReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.UserChannelReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId),
      t.writeInt64(1, this.lTopcid),
      t.writeInt64(2, this.lSubcid),
      t.writeString(3, this.sSendContent);
  }),
  (HUYA.UserChannelReq.prototype.readFrom = function (t) {
    (this.tId = t.readStruct(0, !1, this.tId)),
      (this.lTopcid = t.readInt64(1, !1, this.lTopcid)),
      (this.lSubcid = t.readInt64(2, !1, this.lSubcid)),
      (this.sSendContent = t.readString(3, !1, this.sSendContent));
  }),
  (HUYA.BadgeReq = function () {
    (this.tUserId = new HUYA.UserId()), (this.lBadgeId = 0);
  }),
  (HUYA.BadgeReq.prototype._clone = function () {
    return new HUYA.BadgeReq();
  }),
  (HUYA.BadgeReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.BadgeReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.BadgeReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tUserId), t.writeInt64(1, this.lBadgeId);
  }),
  (HUYA.BadgeReq.prototype.readFrom = function (t) {
    (this.tUserId = t.readStruct(0, !1, this.tUserId)),
      (this.lBadgeId = t.readInt64(1, !1, this.lBadgeId));
  }),
  (HUYA.BadgeInfo = function () {
    (this.lUid = 0),
      (this.lBadgeId = 0),
      (this.sPresenterNickName = ""),
      (this.sBadgeName = ""),
      (this.iBadgeLevel = 0),
      (this.iRank = 0),
      (this.iScore = 0),
      (this.iNextScore = 0),
      (this.iQuotaUsed = 0),
      (this.iQuota = 0),
      (this.lQuotaTS = 0);
  }),
  (HUYA.BadgeInfo.prototype._clone = function () {
    return new HUYA.BadgeInfo();
  }),
  (HUYA.BadgeInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.BadgeInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.BadgeInfo.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeInt64(1, this.lBadgeId),
      t.writeString(2, this.sPresenterNickName),
      t.writeString(3, this.sBadgeName),
      t.writeInt32(4, this.iBadgeLevel),
      t.writeInt32(5, this.iRank),
      t.writeInt32(6, this.iScore),
      t.writeInt32(7, this.iNextScore),
      t.writeInt32(8, this.iQuotaUsed),
      t.writeInt32(9, this.iQuota),
      t.writeInt64(10, this.lQuotaTS);
  }),
  (HUYA.BadgeInfo.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.lBadgeId = t.readInt64(1, !1, this.lBadgeId)),
      (this.sPresenterNickName = t.readString(2, !1, this.sPresenterNickName)),
      (this.sBadgeName = t.readString(3, !1, this.sBadgeName)),
      (this.iBadgeLevel = t.readInt32(4, !1, this.iBadgeLevel)),
      (this.iRank = t.readInt32(5, !1, this.iRank)),
      (this.iScore = t.readInt32(6, !1, this.iScore)),
      (this.iNextScore = t.readInt32(7, !1, this.iNextScore)),
      (this.iQuotaUsed = t.readInt32(8, !1, this.iQuotaUsed)),
      (this.iQuota = t.readInt32(9, !1, this.iQuota)),
      (this.lQuotaTS = t.readInt64(10, !1, this.lQuotaTS));
  }),
  (HUYA.BadgeScoreChanged = function () {
    (this.iScoreChanged = 0),
      (this.iBadgeLevelChanged = 0),
      (this.iOverBadgeCountLimit = 0),
      (this.tBadgeInfo = new HUYA.BadgeInfo());
  }),
  (HUYA.BadgeScoreChanged.prototype._clone = function () {
    return new HUYA.BadgeScoreChanged();
  }),
  (HUYA.BadgeScoreChanged.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.BadgeScoreChanged.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.BadgeScoreChanged.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iScoreChanged),
      t.writeInt32(1, this.iBadgeLevelChanged),
      t.writeInt32(2, this.iOverBadgeCountLimit),
      t.writeStruct(3, this.tBadgeInfo);
  }),
  (HUYA.BadgeScoreChanged.prototype.readFrom = function (t) {
    (this.iScoreChanged = t.readInt32(0, !1, this.iScoreChanged)),
      (this.iBadgeLevelChanged = t.readInt32(1, !1, this.iBadgeLevelChanged)),
      (this.iOverBadgeCountLimit = t.readInt32(2, !1, this.iOverBadgeCountLimit)),
      (this.tBadgeInfo = t.readStruct(3, !1, this.tBadgeInfo));
  }),
  (HUYA.FansTips = function () {
    (this.iType = 0), (this.tBadgeInfo = new HUYA.BadgeInfo());
  }),
  (HUYA.FansTips.prototype._clone = function () {
    return new HUYA.FansTips();
  }),
  (HUYA.FansTips.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.FansTips.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.FansTips.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iType), t.writeStruct(1, this.tBadgeInfo);
  }),
  (HUYA.FansTips.prototype.readFrom = function (t) {
    (this.iType = t.readInt32(0, !1, this.iType)),
      (this.tBadgeInfo = t.readStruct(1, !1, this.tBadgeInfo));
  }),
  (HUYA.FansInfoNotice = function () {
    (this.iFansLevel = 0), (this.iGreenPopUpCount = 0), (this.tTips = new HUYA.FansTips());
  }),
  (HUYA.FansInfoNotice.prototype._clone = function () {
    return new HUYA.FansInfoNotice();
  }),
  (HUYA.FansInfoNotice.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.FansInfoNotice.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.FansInfoNotice.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iFansLevel),
      t.writeInt32(1, this.iGreenPopUpCount),
      t.writeStruct(2, this.tTips);
  }),
  (HUYA.FansInfoNotice.prototype.readFrom = function (t) {
    (this.iFansLevel = t.readInt32(0, !1, this.iFansLevel)),
      (this.iGreenPopUpCount = t.readInt32(1, !1, this.iGreenPopUpCount)),
      (this.tTips = t.readStruct(2, !1, this.tTips));
  }),
  (HUYA.BadgeInfoListReq = function () {
    this.tUserId = new HUYA.UserId();
  }),
  (HUYA.BadgeInfoListReq.prototype._clone = function () {
    return new HUYA.BadgeInfoListReq();
  }),
  (HUYA.BadgeInfoListReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.BadgeInfoListReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.BadgeInfoListReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tUserId);
  }),
  (HUYA.BadgeInfoListReq.prototype.readFrom = function (t) {
    this.tUserId = t.readStruct(0, !1, this.tUserId);
  }),
  (HUYA.BadgeInfoListRsp = function () {
    (this.vBadgeInfo = new Taf.Vector(new HUYA.BadgeInfo())), (this.lUsingBadgeId = 0);
  }),
  (HUYA.BadgeInfoListRsp.prototype._clone = function () {
    return new HUYA.BadgeInfoListRsp();
  }),
  (HUYA.BadgeInfoListRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.BadgeInfoListRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.BadgeInfoListRsp.prototype.writeTo = function (t) {
    t.writeVector(0, this.vBadgeInfo), t.writeInt64(1, this.lUsingBadgeId);
  }),
  (HUYA.BadgeInfoListRsp.prototype.readFrom = function (t) {
    (this.vBadgeInfo = t.readVector(0, !1, this.vBadgeInfo)),
      (this.lUsingBadgeId = t.readInt64(1, !1, this.lUsingBadgeId));
  }),
  (HUYA.EnterPushInfo = function () {
    this.tNobleInfo = new HUYA.NobleInfo();
  }),
  (HUYA.EnterPushInfo.prototype._clone = function () {
    return new HUYA.EnterPushInfo();
  }),
  (HUYA.EnterPushInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.EnterPushInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.EnterPushInfo.prototype.writeTo = function (t) {
    t.writeStruct(1, this.tNobleInfo);
  }),
  (HUYA.EnterPushInfo.prototype.readFrom = function (t) {
    this.tNobleInfo = t.readStruct(1, !1, this.tNobleInfo);
  }),
  (HUYA.GameAdvertisement = function () {
    (this.sGameUrl = ""),
      (this.sPCLogoUrl = ""),
      (this.iPCLogoHeight = 0),
      (this.sGameAdName = ""),
      (this.iStatus = 0),
      (this.sWebLogoUrl = "");
  }),
  (HUYA.GameAdvertisement.prototype._clone = function () {
    return new HUYA.GameAdvertisement();
  }),
  (HUYA.GameAdvertisement.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GameAdvertisement.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GameAdvertisement.prototype.writeTo = function (t) {
    t.writeString(0, this.sGameUrl),
      t.writeString(1, this.sPCLogoUrl),
      t.writeInt32(2, this.iPCLogoHeight),
      t.writeString(3, this.sGameAdName),
      t.writeInt32(4, this.iStatus),
      t.writeString(5, this.sWebLogoUrl);
  }),
  (HUYA.GameAdvertisement.prototype.readFrom = function (t) {
    (this.sGameUrl = t.readString(0, !1, this.sGameUrl)),
      (this.sPCLogoUrl = t.readString(1, !1, this.sPCLogoUrl)),
      (this.iPCLogoHeight = t.readInt32(2, !1, this.iPCLogoHeight)),
      (this.sGameAdName = t.readString(3, !1, this.sGameAdName)),
      (this.iStatus = t.readInt32(4, !1, this.iStatus)),
      (this.sWebLogoUrl = t.readString(5, !1, this.sWebLogoUrl));
  }),
  (HUYA.AdvanceUserEnterNotice = function () {
    (this.lUid = 0), (this.sNickName = ""), (this.iWeekRank = 0), (this.iGuardLevel = 0);
  }),
  (HUYA.AdvanceUserEnterNotice.prototype._clone = function () {
    return new HUYA.AdvanceUserEnterNotice();
  }),
  (HUYA.AdvanceUserEnterNotice.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.AdvanceUserEnterNotice.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.AdvanceUserEnterNotice.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeString(1, this.sNickName),
      t.writeInt32(2, this.iWeekRank),
      t.writeInt32(3, this.iGuardLevel);
  }),
  (HUYA.AdvanceUserEnterNotice.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.sNickName = t.readString(1, !1, this.sNickName)),
      (this.iWeekRank = t.readInt32(2, !1, this.iWeekRank)),
      (this.iGuardLevel = t.readInt32(3, !1, this.iGuardLevel));
  }),
  (HUYA.FansRankListRsp = function () {
    (this.lBadgeId = 0),
      (this.sBadgeName = ""),
      (this.vFansRankItem = new Taf.Vector(new HUYA.FansRankItem()));
  }),
  (HUYA.FansRankListRsp.prototype._clone = function () {
    return new HUYA.FansRankListRsp();
  }),
  (HUYA.FansRankListRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.FansRankListRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.FansRankListRsp.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lBadgeId),
      t.writeString(1, this.sBadgeName),
      t.writeVector(2, this.vFansRankItem);
  }),
  (HUYA.FansRankListRsp.prototype.readFrom = function (t) {
    (this.lBadgeId = t.readInt64(0, !1, this.lBadgeId)),
      (this.sBadgeName = t.readString(1, !1, this.sBadgeName)),
      (this.vFansRankItem = t.readVector(2, !1, this.vFansRankItem));
  }),
  (HUYA.UserGiftNotice = function () {
    (this.tFansGiftInfo = new HUYA.GiftInfo()), (this.tSuperPupleGiftInfo = new HUYA.GiftInfo());
  }),
  (HUYA.UserGiftNotice.prototype._clone = function () {
    return new HUYA.UserGiftNotice();
  }),
  (HUYA.UserGiftNotice.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.UserGiftNotice.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.UserGiftNotice.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tFansGiftInfo), t.writeStruct(1, this.tSuperPupleGiftInfo);
  }),
  (HUYA.UserGiftNotice.prototype.readFrom = function (t) {
    (this.tFansGiftInfo = t.readStruct(0, !1, this.tFansGiftInfo)),
      (this.tSuperPupleGiftInfo = t.readStruct(1, !1, this.tSuperPupleGiftInfo));
  }),
  (HUYA.GrandCeremonyChampionPresenter = function () {
    (this.lUid = 0), (this.sNick = "");
  }),
  (HUYA.GrandCeremonyChampionPresenter.prototype._clone = function () {
    return new HUYA.GrandCeremonyChampionPresenter();
  }),
  (HUYA.GrandCeremonyChampionPresenter.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GrandCeremonyChampionPresenter.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GrandCeremonyChampionPresenter.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid), t.writeString(1, this.sNick);
  }),
  (HUYA.GrandCeremonyChampionPresenter.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)), (this.sNick = t.readString(1, !1, this.sNick));
  }),
  (HUYA.FansRankItem = function () {
    (this.lUid = 0), (this.sNickName = ""), (this.iScore = 0), (this.iLevel = 0);
  }),
  (HUYA.FansRankItem.prototype._clone = function () {
    return new HUYA.FansRankItem();
  }),
  (HUYA.FansRankItem.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.FansRankItem.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.FansRankItem.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeString(1, this.sNickName),
      t.writeInt32(2, this.iScore),
      t.writeInt32(3, this.iLevel);
  }),
  (HUYA.FansRankItem.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.sNickName = t.readString(1, !1, this.sNickName)),
      (this.iScore = t.readInt32(2, !1, this.iScore)),
      (this.iLevel = t.readInt32(3, !1, this.iLevel));
  }),
  (HUYA.GuardInfo = function () {
    (this.lUid = 0), (this.lPid = 0), (this.iGuardLevel = 0), (this.lEndTime = 0);
  }),
  (HUYA.GuardInfo.prototype._clone = function () {
    return new HUYA.GuardInfo();
  }),
  (HUYA.GuardInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GuardInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GuardInfo.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeInt64(1, this.lPid),
      t.writeInt32(2, this.iGuardLevel),
      t.writeInt64(3, this.lEndTime);
  }),
  (HUYA.GuardInfo.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.lPid = t.readInt64(1, !1, this.lPid)),
      (this.iGuardLevel = t.readInt32(2, !1, this.iGuardLevel)),
      (this.lEndTime = t.readInt64(3, !1, this.lEndTime));
  }),
  (HUYA.GetLivingInfoReq = function () {
    (this.tId = new HUYA.UserId()),
      (this.lTopSid = 0),
      (this.lSubSid = 0),
      (this.lPresenterUid = 0);
  }),
  (HUYA.GetLivingInfoReq.prototype._clone = function () {
    return new HUYA.GetLivingInfoReq();
  }),
  (HUYA.GetLivingInfoReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetLivingInfoReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetLivingInfoReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId),
      t.writeInt64(1, this.lTopSid),
      t.writeInt64(2, this.lSubSid),
      t.writeInt64(3, this.lPresenterUid);
  }),
  (HUYA.GetLivingInfoReq.prototype.readFrom = function (t) {
    (this.tId = t.readStruct(0, !1, this.tId)),
      (this.lTopSid = t.readInt64(1, !1, this.lTopSid)),
      (this.lSubSid = t.readInt64(2, !1, this.lSubSid)),
      (this.lPresenterUid = t.readInt64(3, !1, this.lPresenterUid));
  }),
  (HUYA.GetLivingInfoRsp = function () {
    (this.bIsLiving = 0),
      (this.tNotice = new HUYA.BeginLiveNotice()),
      (this.tStreamSettingNotice = new HUYA.StreamSettingNotice()),
      (this.bIsSelfLiving = 0);
  }),
  (HUYA.GetLivingInfoRsp.prototype._clone = function () {
    return new HUYA.GetLivingInfoRsp();
  }),
  (HUYA.GetLivingInfoRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetLivingInfoRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetLivingInfoRsp.prototype.writeTo = function (t) {
    t.writeInt32(0, this.bIsLiving),
      t.writeStruct(1, this.tNotice),
      t.writeStruct(2, this.tStreamSettingNotice),
      t.writeInt32(3, this.bIsSelfLiving);
  }),
  (HUYA.GetLivingInfoRsp.prototype.readFrom = function (t) {
    (this.bIsLiving = t.readInt32(0, !1, this.bIsLiving)),
      (this.tNotice = t.readStruct(1, !1, this.tNotice)),
      (this.tStreamSettingNotice = t.readStruct(2, !1, this.tStreamSettingNotice)),
      (this.bIsSelfLiving = t.readInt32(3, !1, this.bIsSelfLiving));
  }),
  (HUYA.StreamInfo = function () {
    (this.sCdnType = ""),
      (this.iIsMaster = 0),
      (this.lChannelId = 0),
      (this.lSubChannelId = 0),
      (this.lPresenterUid = 0),
      (this.sStreamName = ""),
      (this.sFlvUrl = ""),
      (this.sFlvUrlSuffix = ""),
      (this.sFlvAntiCode = ""),
      (this.sHlsUrl = ""),
      (this.sHlsUrlSuffix = ""),
      (this.sHlsAntiCode = ""),
      (this.iLineIndex = 0),
      (this.iIsMultiStream = 0),
      (this.iPCPriorityRate = 0),
      (this.iWebPriorityRate = 0),
      (this.iMobilePriorityRate = 0);
  }),
  (HUYA.StreamInfo.prototype._clone = function () {
    return new HUYA.StreamInfo();
  }),
  (HUYA.StreamInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.StreamInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.StreamInfo.prototype.writeTo = function (t) {
    t.writeString(0, this.sCdnType),
      t.writeInt32(1, this.iIsMaster),
      t.writeInt64(2, this.lChannelId),
      t.writeInt64(3, this.lSubChannelId),
      t.writeInt64(4, this.lPresenterUid),
      t.writeString(5, this.sStreamName),
      t.writeString(6, this.sFlvUrl),
      t.writeString(7, this.sFlvUrlSuffix),
      t.writeString(8, this.sFlvAntiCode),
      t.writeString(9, this.sHlsUrl),
      t.writeString(10, this.sHlsUrlSuffix),
      t.writeString(11, this.sHlsAntiCode),
      t.writeInt32(12, this.iLineIndex),
      t.writeInt32(13, this.iIsMultiStream),
      t.writeInt32(14, this.iPCPriorityRate),
      t.writeInt32(15, this.iWebPriorityRate),
      t.writeInt32(16, this.iMobilePriorityRate);
  }),
  (HUYA.StreamInfo.prototype.readFrom = function (t) {
    (this.sCdnType = t.readString(0, !1, this.sCdnType)),
      (this.iIsMaster = t.readInt32(1, !1, this.iIsMaster)),
      (this.lChannelId = t.readInt64(2, !1, this.lChannelId)),
      (this.lSubChannelId = t.readInt64(3, !1, this.lSubChannelId)),
      (this.lPresenterUid = t.readInt64(4, !1, this.lPresenterUid)),
      (this.sStreamName = t.readString(5, !1, this.sStreamName)),
      (this.sFlvUrl = t.readString(6, !1, this.sFlvUrl)),
      (this.sFlvUrlSuffix = t.readString(7, !1, this.sFlvUrlSuffix)),
      (this.sFlvAntiCode = t.readString(8, !1, this.sFlvAntiCode)),
      (this.sHlsUrl = t.readString(9, !1, this.sHlsUrl)),
      (this.sHlsUrlSuffix = t.readString(10, !1, this.sHlsUrlSuffix)),
      (this.sHlsAntiCode = t.readString(11, !1, this.sHlsAntiCode)),
      (this.iLineIndex = t.readInt32(12, !1, this.iLineIndex)),
      (this.iIsMultiStream = t.readInt32(13, !1, this.iIsMultiStream)),
      (this.iPCPriorityRate = t.readInt32(14, !1, this.iPCPriorityRate)),
      (this.iWebPriorityRate = t.readInt32(15, !1, this.iWebPriorityRate)),
      (this.iMobilePriorityRate = t.readInt32(16, !1, this.iMobilePriorityRate));
  }),
  (HUYA.MultiStreamInfo = function () {
    (this.sDisplayName = ""),
      (this.iBitRate = 0),
      (this.iCodecType = 0),
      (this.iCompatibleFlag = 0);
  }),
  (HUYA.MultiStreamInfo.prototype._clone = function () {
    return new HUYA.MultiStreamInfo();
  }),
  (HUYA.MultiStreamInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.MultiStreamInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.MultiStreamInfo.prototype.writeTo = function (t) {
    t.writeString(0, this.sDisplayName),
      t.writeInt32(1, this.iBitRate),
      t.writeInt32(2, this.iCodecType),
      t.writeInt32(3, this.iCompatibleFlag);
  }),
  (HUYA.MultiStreamInfo.prototype.readFrom = function (t) {
    (this.sDisplayName = t.readString(0, !1, this.sDisplayName)),
      (this.iBitRate = t.readInt32(1, !1, this.iBitRate)),
      (this.iCodecType = t.readInt32(2, !1, this.iCodecType)),
      (this.iCompatibleFlag = t.readInt32(3, !1, this.iCompatibleFlag));
  }),
  (HUYA.StreamSettingNotice = function () {
    (this.lPresenterUid = 0),
      (this.iBitRate = 0),
      (this.iResolution = 0),
      (this.iFrameRate = 0),
      (this.lLiveId = 0),
      (this.sDisplayName = "");
  }),
  (HUYA.StreamSettingNotice.prototype._clone = function () {
    return new HUYA.StreamSettingNotice();
  }),
  (HUYA.StreamSettingNotice.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.StreamSettingNotice.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.StreamSettingNotice.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lPresenterUid),
      t.writeInt32(1, this.iBitRate),
      t.writeInt32(2, this.iResolution),
      t.writeInt32(3, this.iFrameRate),
      t.writeInt64(4, this.lLiveId),
      t.writeString(5, this.sDisplayName);
  }),
  (HUYA.StreamSettingNotice.prototype.readFrom = function (t) {
    (this.lPresenterUid = t.readInt64(0, !1, this.lPresenterUid)),
      (this.iBitRate = t.readInt32(1, !1, this.iBitRate)),
      (this.iResolution = t.readInt32(2, !1, this.iResolution)),
      (this.iFrameRate = t.readInt32(3, !1, this.iFrameRate)),
      (this.lLiveId = t.readInt64(4, !1, this.lLiveId)),
      (this.sDisplayName = t.readString(5, !1, this.sDisplayName));
  }),
  (HUYA.FansInfo = function () {
    (this.lUid = 0), (this.lBadgeId = 0), (this.iBadgeLevel = 0), (this.iScore = 0);
  }),
  (HUYA.FansInfo.prototype._clone = function () {
    return new HUYA.FansInfo();
  }),
  (HUYA.FansInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.FansInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.FansInfo.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeInt64(1, this.lBadgeId),
      t.writeInt32(2, this.iBadgeLevel),
      t.writeInt32(3, this.iScore);
  }),
  (HUYA.FansInfo.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.lBadgeId = t.readInt64(1, !1, this.lBadgeId)),
      (this.iBadgeLevel = t.readInt32(2, !1, this.iBadgeLevel)),
      (this.iScore = t.readInt32(3, !1, this.iScore));
  }),
  (HUYA.GetCdnTokenReq = function () {
    (this.url = ""), (this.cdn_type = ""), (this.stream_name = ""), (this.presenter_uid = 0);
  }),
  (HUYA.GetCdnTokenReq.prototype._clone = function () {
    return new HUYA.GetCdnTokenReq();
  }),
  (HUYA.GetCdnTokenReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetCdnTokenReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetCdnTokenReq.prototype.writeTo = function (t) {
    t.writeString(0, this.url),
      t.writeString(1, this.cdn_type),
      t.writeString(2, this.stream_name),
      t.writeInt64(3, this.presenter_uid);
  }),
  (HUYA.GetCdnTokenReq.prototype.readFrom = function (t) {
    (this.url = t.readString(0, !1, this.url)),
      (this.cdn_type = t.readString(1, !1, this.cdn_type)),
      (this.stream_name = t.readString(2, !1, this.stream_name)),
      (this.presenter_uid = t.readInt64(3, !1, this.presenter_uid));
  }),
  (HUYA.GetCdnTokenRsp = function () {
    (this.url = ""),
      (this.cdn_type = ""),
      (this.stream_name = ""),
      (this.presenter_uid = 0),
      (this.anti_code = ""),
      (this.sTime = ""),
      (this.flv_anti_code = ""),
      (this.hls_anti_code = "");
  }),
  (HUYA.GetCdnTokenRsp.prototype._clone = function () {
    return new HUYA.GetCdnTokenRsp();
  }),
  (HUYA.GetCdnTokenRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetCdnTokenRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetCdnTokenRsp.prototype.writeTo = function (t) {
    t.writeString(0, this.url),
      t.writeString(1, this.cdn_type),
      t.writeString(2, this.stream_name),
      t.writeInt64(3, this.presenter_uid),
      t.writeString(4, this.anti_code),
      t.writeString(5, this.sTime),
      t.writeString(6, this.flv_anti_code),
      t.writeString(7, this.hls_anti_code);
  }),
  (HUYA.GetCdnTokenRsp.prototype.readFrom = function (t) {
    (this.url = t.readString(0, !1, this.url)),
      (this.cdn_type = t.readString(1, !1, this.cdn_type)),
      (this.stream_name = t.readString(2, !1, this.stream_name)),
      (this.presenter_uid = t.readInt64(3, !1, this.presenter_uid)),
      (this.anti_code = t.readString(4, !1, this.anti_code)),
      (this.sTime = t.readString(5, !1, this.sTime)),
      (this.flv_anti_code = t.readString(6, !1, this.flv_anti_code)),
      (this.hls_anti_code = t.readString(7, !1, this.hls_anti_code));
  }),
  (HUYA.LiveLaunchReq = function () {
    (this.tId = new HUYA.UserId()), (this.tLiveUB = new HUYA.LiveUserbase());
  }),
  (HUYA.LiveLaunchReq.prototype._clone = function () {
    return new HUYA.LiveLaunchReq();
  }),
  (HUYA.LiveLaunchReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.LiveLaunchReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.LiveLaunchReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId), t.writeStruct(1, this.tLiveUB);
  }),
  (HUYA.LiveLaunchReq.prototype.readFrom = function (t) {
    (this.tId = t.readStruct(0, !1, this.tId)), (this.tLiveUB = t.readStruct(1, !1, this.tLiveUB));
  }),
  (HUYA.LiveLaunchRsp = function () {
    (this.sGuid = ""),
      (this.iTime = 0),
      (this.vProxyList = new Taf.Vector(new HUYA.LiveProxyValue())),
      (this.eAccess = 0);
  }),
  (HUYA.LiveLaunchRsp.prototype._clone = function () {
    return new HUYA.LiveLaunchRsp();
  }),
  (HUYA.LiveLaunchRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.LiveLaunchRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.LiveLaunchRsp.prototype.writeTo = function (t) {
    t.writeString(0, this.sGuid),
      t.writeInt32(1, this.iTime),
      t.writeVector(2, this.vProxyList),
      t.writeInt32(3, this.eAccess);
  }),
  (HUYA.LiveLaunchRsp.prototype.readFrom = function (t) {
    (this.sGuid = t.readString(0, !1, this.sGuid)),
      (this.iTime = t.readInt32(1, !1, this.iTime)),
      (this.vProxyList = t.readVector(2, !1, this.vProxyList)),
      (this.eAccess = t.readInt32(3, !1, this.eAccess));
  }),
  (HUYA.LiveAppUAEx = function () {
    (this.sIMEI = ""), (this.sAPN = ""), (this.sNetType = "");
  }),
  (HUYA.LiveAppUAEx.prototype._clone = function () {
    return new HUYA.LiveAppUAEx();
  }),
  (HUYA.LiveAppUAEx.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.LiveAppUAEx.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.LiveAppUAEx.prototype.writeTo = function (t) {
    t.writeString(1, this.sIMEI), t.writeString(2, this.sAPN), t.writeString(3, this.sNetType);
  }),
  (HUYA.LiveAppUAEx.prototype.readFrom = function (t) {
    (this.sIMEI = t.readString(1, !1, this.sIMEI)),
      (this.sAPN = t.readString(2, !1, this.sAPN)),
      (this.sNetType = t.readString(3, !1, this.sNetType));
  }),
  (HUYA.LiveUserbase = function () {
    (this.eSource = 0), (this.eType = 0), (this.tUAEx = new HUYA.LiveAppUAEx());
  }),
  (HUYA.LiveUserbase.prototype._clone = function () {
    return new HUYA.LiveUserbase();
  }),
  (HUYA.LiveUserbase.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.LiveUserbase.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.LiveUserbase.prototype.writeTo = function (t) {
    t.writeInt32(0, this.eSource), t.writeInt32(1, this.eType), t.writeStruct(2, this.tUAEx);
  }),
  (HUYA.LiveUserbase.prototype.readFrom = function (t) {
    (this.eSource = t.readInt32(0, !1, this.eSource)),
      (this.eType = t.readInt32(1, !1, this.eType)),
      (this.tUAEx = t.readStruct(2, !1, this.tUAEx));
  }),
  (HUYA.LiveProxyValue = function () {
    (this.eProxyType = 0), (this.sProxy = new Taf.Vector(new Taf.STRING()));
  }),
  (HUYA.LiveProxyValue.prototype._clone = function () {
    return new HUYA.LiveProxyValue();
  }),
  (HUYA.LiveProxyValue.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.LiveProxyValue.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.LiveProxyValue.prototype.writeTo = function (t) {
    t.writeInt32(0, this.eProxyType), t.writeVector(1, this.sProxy);
  }),
  (HUYA.LiveProxyValue.prototype.readFrom = function (t) {
    (this.eProxyType = t.readInt32(0, !1, this.eProxyType)),
      (this.sProxy = t.readVector(1, !1, this.sProxy));
  }),
  (HUYA.SendCardPackageItemReq = function () {
    (this.tId = new HUYA.UserId()),
      (this.lSid = 0),
      (this.lSubSid = 0),
      (this.iShowFreeitemInfo = 0),
      (this.iItemType = 0),
      (this.iItemCount = 0),
      (this.lPresenterUid = 0),
      (this.sPayId = ""),
      (this.sSendContent = ""),
      (this.sSenderNick = ""),
      (this.sPresenterNick = ""),
      (this.iPayPloy = 0),
      (this.iItemCountByGroup = 0),
      (this.iItemGroup = 0),
      (this.iSuperPupleLevel = 0),
      (this.iFromType = 0),
      (this.sExpand = ""),
      (this.sToken = ""),
      (this.iTemplateType = 0),
      (this.sTokencaKey = ""),
      (this.sPassport = ""),
      (this.iSenderShortSid = 0),
      (this.iPayByFreeItem = 0),
      (this.tExtUser = new HUYA.ExternalUser());
  }),
  (HUYA.SendCardPackageItemReq.prototype._clone = function () {
    return new HUYA.SendCardPackageItemReq();
  }),
  (HUYA.SendCardPackageItemReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.SendCardPackageItemReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.SendCardPackageItemReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId),
      t.writeInt64(1, this.lSid),
      t.writeInt64(2, this.lSubSid),
      t.writeInt32(3, this.iShowFreeitemInfo),
      t.writeInt32(4, this.iItemType),
      t.writeInt32(5, this.iItemCount),
      t.writeInt64(6, this.lPresenterUid),
      t.writeString(7, this.sPayId),
      t.writeString(9, this.sSendContent),
      t.writeString(10, this.sSenderNick),
      t.writeString(11, this.sPresenterNick),
      t.writeInt32(12, this.iPayPloy),
      t.writeInt32(13, this.iItemCountByGroup),
      t.writeInt32(14, this.iItemGroup),
      t.writeInt32(15, this.iSuperPupleLevel),
      t.writeInt32(16, this.iFromType),
      t.writeString(17, this.sExpand),
      t.writeString(18, this.sToken),
      t.writeInt32(19, this.iTemplateType),
      t.writeString(20, this.sTokencaKey),
      t.writeString(21, this.sPassport),
      t.writeInt64(22, this.iSenderShortSid),
      t.writeInt32(23, this.iPayByFreeItem),
      t.writeStruct(24, this.tExtUser);
  }),
  (HUYA.SendCardPackageItemReq.prototype.readFrom = function (t) {
    (this.tId = t.readStruct(0, !1, this.tId)),
      (this.lSid = t.readInt64(1, !1, this.lSid)),
      (this.lSubSid = t.readInt64(2, !1, this.lSubSid)),
      (this.iShowFreeitemInfo = t.readInt32(3, !1, this.iShowFreeitemInfo)),
      (this.iItemType = t.readInt32(4, !1, this.iItemType)),
      (this.iItemCount = t.readInt32(5, !1, this.iItemCount)),
      (this.lPresenterUid = t.readInt64(6, !1, this.lPresenterUid)),
      (this.sPayId = t.readString(7, !1, this.sPayId)),
      (this.sSendContent = t.readString(9, !1, this.sSendContent)),
      (this.sSenderNick = t.readString(10, !1, this.sSenderNick)),
      (this.sPresenterNick = t.readString(11, !1, this.sPresenterNick)),
      (this.iPayPloy = t.readInt32(12, !1, this.iPayPloy)),
      (this.iItemCountByGroup = t.readInt32(13, !1, this.iItemCountByGroup)),
      (this.iItemGroup = t.readInt32(14, !1, this.iItemGroup)),
      (this.iSuperPupleLevel = t.readInt32(15, !1, this.iSuperPupleLevel)),
      (this.iFromType = t.readInt32(16, !1, this.iFromType)),
      (this.sExpand = t.readString(17, !1, this.sExpand)),
      (this.sToken = t.readString(18, !1, this.sToken)),
      (this.iTemplateType = t.readInt32(19, !1, this.iTemplateType)),
      (this.sTokencaKey = t.readString(20, !1, this.sTokencaKey)),
      (this.sPassport = t.readString(21, !1, this.sPassport)),
      (this.iSenderShortSid = t.readInt64(22, !1, this.iSenderShortSid)),
      (this.iPayByFreeItem = t.readInt32(23, !1, this.iPayByFreeItem)),
      (this.tExtUser = t.readStruct(24, !1, this.tExtUser));
  }),
  (HUYA.SendCardPackageItemRsp = function () {
    (this.iPayRespCode = 0),
      (this.iItemType = 0),
      (this.iItemCount = 0),
      (this.strPayId = ""),
      (this.strPayConfirmUrl = ""),
      (this.strSendContent = ""),
      (this.iItemCountByGroup = 0),
      (this.iItemGroup = 0),
      (this.lPresenterUid = 0),
      (this.sExpand = ""),
      (this.strPayItemInfo = "");
  }),
  (HUYA.SendCardPackageItemRsp.prototype._clone = function () {
    return new HUYA.SendCardPackageItemRsp();
  }),
  (HUYA.SendCardPackageItemRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.SendCardPackageItemRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.SendCardPackageItemRsp.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iPayRespCode),
      t.writeInt32(1, this.iItemType),
      t.writeInt32(2, this.iItemCount),
      t.writeString(3, this.strPayId),
      t.writeString(4, this.strPayConfirmUrl),
      t.writeString(5, this.strSendContent),
      t.writeInt32(6, this.iItemCountByGroup),
      t.writeInt32(7, this.iItemGroup),
      t.writeInt64(8, this.lPresenterUid),
      t.writeString(9, this.sExpand),
      t.writeString(10, this.strPayItemInfo);
  }),
  (HUYA.SendCardPackageItemRsp.prototype.readFrom = function (t) {
    (this.iPayRespCode = t.readInt32(0, !1, this.iPayRespCode)),
      (this.iItemType = t.readInt32(1, !1, this.iItemType)),
      (this.iItemCount = t.readInt32(2, !1, this.iItemCount)),
      (this.strPayId = t.readString(3, !1, this.strPayId)),
      (this.strPayConfirmUrl = t.readString(4, !1, this.strPayConfirmUrl)),
      (this.strSendContent = t.readString(5, !1, this.strSendContent)),
      (this.iItemCountByGroup = t.readInt32(6, !1, this.iItemCountByGroup)),
      (this.iItemGroup = t.readInt32(7, !1, this.iItemGroup)),
      (this.lPresenterUid = t.readInt64(8, !1, this.lPresenterUid)),
      (this.sExpand = t.readString(9, !1, this.sExpand)),
      (this.strPayItemInfo = t.readString(10, !1, this.strPayItemInfo));
  }),
  (HUYA.GetVerificationStatusReq = function () {
    this.tId = new HUYA.UserId();
  }),
  (HUYA.GetVerificationStatusReq.prototype._clone = function () {
    return new HUYA.GetVerificationStatusReq();
  }),
  (HUYA.GetVerificationStatusReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetVerificationStatusReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetVerificationStatusReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId);
  }),
  (HUYA.GetVerificationStatusReq.prototype.readFrom = function (t) {
    this.tId = t.readStruct(0, !1, this.tId);
  }),
  (HUYA.GetFirstRechargePkgStatusReq = function () {
    this.tId = new HUYA.UserId();
  }),
  (HUYA.GetFirstRechargePkgStatusReq.prototype._clone = function () {
    return new HUYA.GetFirstRechargePkgStatusReq();
  }),
  (HUYA.GetFirstRechargePkgStatusReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetFirstRechargePkgStatusReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetFirstRechargePkgStatusReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId);
  }),
  (HUYA.GetFirstRechargePkgStatusReq.prototype.readFrom = function (t) {
    this.tId = t.readStruct(0, !1, this.tId);
  }),
  (HUYA.MuteRoomUserReq = function () {
    (this.tId = new HUYA.UserId()),
      (this.lUid = 0),
      (this.sText = ""),
      (this.lPresenterUid = 0),
      (this.lSubcid = 0),
      (this.iMutedTime = 0);
  }),
  (HUYA.MuteRoomUserReq.prototype._clone = function () {
    return new HUYA.MuteRoomUserReq();
  }),
  (HUYA.MuteRoomUserReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.MuteRoomUserReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.MuteRoomUserReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId),
      t.writeInt64(1, this.lUid),
      t.writeString(2, this.sText),
      t.writeInt64(3, this.lPresenterUid),
      t.writeInt64(4, this.lSubcid),
      t.writeInt32(5, this.iMutedTime);
  }),
  (HUYA.MuteRoomUserReq.prototype.readFrom = function (t) {
    (this.tId = t.readStruct(0, !1, this.tId)),
      (this.lUid = t.readInt64(1, !1, this.lUid)),
      (this.sText = t.readString(2, !1, this.sText)),
      (this.lPresenterUid = t.readInt64(3, !1, this.lPresenterUid)),
      (this.lSubcid = t.readInt64(4, !1, this.lSubcid)),
      (this.iMutedTime = t.readInt32(5, !1, this.iMutedTime));
  }),
  (HUYA.GetVerificationStatusResp = function () {
    (this.iStatus = 0), (this.lExpenditure = 0);
  }),
  (HUYA.GetVerificationStatusResp.prototype._clone = function () {
    return new HUYA.GetVerificationStatusResp();
  }),
  (HUYA.GetVerificationStatusResp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetVerificationStatusResp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetVerificationStatusResp.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iStatus), t.writeInt64(1, this.lExpenditure);
  }),
  (HUYA.GetVerificationStatusResp.prototype.readFrom = function (t) {
    (this.iStatus = t.readInt32(0, !1, this.iStatus)),
      (this.lExpenditure = t.readInt64(1, !1, this.lExpenditure));
  }),
  (HUYA.GetFirstRechargePkgStatusResp = function () {
    this.iStatus = 0;
  }),
  (HUYA.GetFirstRechargePkgStatusResp.prototype._clone = function () {
    return new HUYA.GetFirstRechargePkgStatusResp();
  }),
  (HUYA.GetFirstRechargePkgStatusResp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetFirstRechargePkgStatusResp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetFirstRechargePkgStatusResp.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iStatus);
  }),
  (HUYA.GetFirstRechargePkgStatusResp.prototype.readFrom = function (t) {
    this.iStatus = t.readInt32(0, !1, this.iStatus);
  }),
  (HUYA.MuteRoomUserRsp = function () {
    (this.iRetCode = 0), (this.sMsg = "");
  }),
  (HUYA.MuteRoomUserRsp.prototype._clone = function () {
    return new HUYA.MuteRoomUserRsp();
  }),
  (HUYA.MuteRoomUserRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.MuteRoomUserRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.MuteRoomUserRsp.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iRetCode), t.writeString(1, this.sMsg);
  }),
  (HUYA.MuteRoomUserRsp.prototype.readFrom = function (t) {
    (this.iRetCode = t.readInt32(0, !1, this.iRetCode)),
      (this.sMsg = t.readString(1, !1, this.sMsg));
  }),
  (HUYA.SendItemSubBroadcastPacket = function () {
    (this.iItemType = 0),
      (this.strPayId = ""),
      (this.iItemCount = 0),
      (this.lPresenterUid = 0),
      (this.lSenderUid = 0),
      (this.sPresenterNick = ""),
      (this.sSenderNick = ""),
      (this.sSendContent = ""),
      (this.iItemCountByGroup = 0),
      (this.iItemGroup = 0),
      (this.iSuperPupleLevel = 0),
      (this.iComboScore = 0),
      (this.iDisplayInfo = 0),
      (this.iEffectType = 0),
      (this.iSenderIcon = ""),
      (this.iPresenterIcon = ""),
      (this.iTemplateType = 0),
      (this.sExpand = ""),
      (this.bBusi = !1),
      (this.iColorEffectType = 0);
  }),
  (HUYA.SendItemSubBroadcastPacket.prototype._clone = function () {
    return new HUYA.SendItemSubBroadcastPacket();
  }),
  (HUYA.SendItemSubBroadcastPacket.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.SendItemSubBroadcastPacket.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.SendItemSubBroadcastPacket.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iItemType),
      t.writeString(1, this.strPayId),
      t.writeInt32(2, this.iItemCount),
      t.writeInt64(3, this.lPresenterUid),
      t.writeInt64(4, this.lSenderUid),
      t.writeString(5, this.sPresenterNick),
      t.writeString(6, this.sSenderNick),
      t.writeString(7, this.sSendContent),
      t.writeInt32(8, this.iItemCountByGroup),
      t.writeInt32(9, this.iItemGroup),
      t.writeInt32(10, this.iSuperPupleLevel),
      t.writeInt32(11, this.iComboScore),
      t.writeInt32(12, this.iDisplayInfo),
      t.writeInt32(13, this.iEffectType),
      t.writeString(14, this.iSenderIcon),
      t.writeString(15, this.iPresenterIcon),
      t.writeInt32(16, this.iTemplateType),
      t.writeString(17, this.sExpand),
      t.writeBoolean(18, this.bBusi),
      t.writeInt32(19, this.iColorEffectType);
  }),
  (HUYA.SendItemSubBroadcastPacket.prototype.readFrom = function (t) {
    (this.iItemType = t.readInt32(0, !1, this.iItemType)),
      (this.strPayId = t.readString(1, !1, this.strPayId)),
      (this.iItemCount = t.readInt32(2, !1, this.iItemCount)),
      (this.lPresenterUid = t.readInt64(3, !1, this.lPresenterUid)),
      (this.lSenderUid = t.readInt64(4, !1, this.lSenderUid)),
      (this.sPresenterNick = t.readString(5, !1, this.sPresenterNick)),
      (this.sSenderNick = t.readString(6, !1, this.sSenderNick)),
      (this.sSendContent = t.readString(7, !1, this.sSendContent)),
      (this.iItemCountByGroup = t.readInt32(8, !1, this.iItemCountByGroup)),
      (this.iItemGroup = t.readInt32(9, !1, this.iItemGroup)),
      (this.iSuperPupleLevel = t.readInt32(10, !1, this.iSuperPupleLevel)),
      (this.iComboScore = t.readInt32(11, !1, this.iComboScore)),
      (this.iDisplayInfo = t.readInt32(12, !1, this.iDisplayInfo)),
      (this.iEffectType = t.readInt32(13, !1, this.iEffectType)),
      (this.iSenderIcon = t.readString(14, !1, this.iSenderIcon)),
      (this.iPresenterIcon = t.readString(15, !1, this.iPresenterIcon)),
      (this.iTemplateType = t.readInt32(16, !1, this.iTemplateType)),
      (this.sExpand = t.readString(17, !1, this.sExpand)),
      (this.bBusi = t.readBoolean(18, !1, this.bBusi)),
      (this.iColorEffectType = t.readInt32(19, !1, this.iColorEffectType));
  }),
  (HUYA.SendItemNoticeWordBroadcastPacket = function () {
    (this.iItemType = 0),
      (this.iItemCount = 0),
      (this.lSenderSid = 0),
      (this.lSenderUid = 0),
      (this.sSenderNick = ""),
      (this.lPresenterUid = 0),
      (this.sPresenterNick = ""),
      (this.lNoticeChannelCount = 0),
      (this.iItemCountByGroup = 0),
      (this.iItemGroup = 0),
      (this.iDisplayInfo = 0),
      (this.iSuperPupleLevel = 0),
      (this.iTemplateType = 0),
      (this.sExpand = ""),
      (this.bBusi = !1);
  }),
  (HUYA.SendItemNoticeWordBroadcastPacket.prototype._clone = function () {
    return new HUYA.SendItemNoticeWordBroadcastPacket();
  }),
  (HUYA.SendItemNoticeWordBroadcastPacket.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.SendItemNoticeWordBroadcastPacket.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.SendItemNoticeWordBroadcastPacket.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iItemType),
      t.writeInt32(1, this.iItemCount),
      t.writeInt64(2, this.lSenderSid),
      t.writeInt64(3, this.lSenderUid),
      t.writeString(4, this.sSenderNick),
      t.writeInt64(5, this.lPresenterUid),
      t.writeString(6, this.sPresenterNick),
      t.writeInt64(7, this.lNoticeChannelCount),
      t.writeInt32(8, this.iItemCountByGroup),
      t.writeInt32(9, this.iItemGroup),
      t.writeInt32(10, this.iDisplayInfo),
      t.writeInt32(11, this.iSuperPupleLevel),
      t.writeInt32(12, this.iTemplateType),
      t.writeString(13, this.sExpand),
      t.writeBoolean(14, this.bBusi);
  }),
  (HUYA.SendItemNoticeWordBroadcastPacket.prototype.readFrom = function (t) {
    (this.iItemType = t.readInt32(0, !1, this.iItemType)),
      (this.iItemCount = t.readInt32(1, !1, this.iItemCount)),
      (this.lSenderSid = t.readInt64(2, !1, this.lSenderSid)),
      (this.lSenderUid = t.readInt64(3, !1, this.lSenderUid)),
      (this.sSenderNick = t.readString(4, !1, this.sSenderNick)),
      (this.lPresenterUid = t.readInt64(5, !1, this.lPresenterUid)),
      (this.sPresenterNick = t.readString(6, !1, this.sPresenterNick)),
      (this.lNoticeChannelCount = t.readInt64(7, !1, this.lNoticeChannelCount)),
      (this.iItemCountByGroup = t.readInt32(8, !1, this.iItemCountByGroup)),
      (this.iItemGroup = t.readInt32(9, !1, this.iItemGroup)),
      (this.iDisplayInfo = t.readInt32(10, !1, this.iDisplayInfo)),
      (this.iSuperPupleLevel = t.readInt32(11, !1, this.iSuperPupleLevel)),
      (this.iTemplateType = t.readInt32(12, !1, this.iTemplateType)),
      (this.sExpand = t.readString(13, !1, this.sExpand)),
      (this.bBusi = t.readBoolean(14, !1, this.bBusi));
  }),
  (HUYA.BeginLiveNotice = function () {
    (this.lPresenterUid = 0),
      (this.iGameId = 0),
      (this.sGameName = ""),
      (this.iRandomRange = 0),
      (this.iStreamType = 0),
      (this.vStreamInfo = new Taf.Vector(new HUYA.StreamInfo())),
      (this.vCdnList = new Taf.Vector(new Taf.STRING())),
      (this.lLiveId = 0),
      (this.iPCDefaultBitRate = 0),
      (this.iWebDefaultBitRate = 0),
      (this.iMobileDefaultBitRate = 0),
      (this.lMultiStreamFlag = 0),
      (this.sNick = ""),
      (this.lYYId = 0),
      (this.lAttendeeCount = 0),
      (this.iCodecType = 0),
      (this.iScreenType = 0),
      (this.vMultiStreamInfo = new Taf.Vector(new HUYA.MultiStreamInfo())),
      (this.sLiveDesc = ""),
      (this.lLiveCompatibleFlag = 0),
      (this.sAvatarUrl = ""),
      (this.iSourceType = 0),
      (this.sSubchannelName = ""),
      (this.sVideoCaptureUrl = ""),
      (this.iStartTime = 0),
      (this.lChannelId = 0),
      (this.lSubChannelId = 0),
      (this.sLocation = "");
  }),
  (HUYA.BeginLiveNotice.prototype._clone = function () {
    return new HUYA.BeginLiveNotice();
  }),
  (HUYA.BeginLiveNotice.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.BeginLiveNotice.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.BeginLiveNotice.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lPresenterUid),
      t.writeInt32(1, this.iGameId),
      t.writeString(2, this.sGameName),
      t.writeInt32(3, this.iRandomRange),
      t.writeInt32(4, this.iStreamType),
      t.writeVector(5, this.vStreamInfo),
      t.writeVector(6, this.vCdnList),
      t.writeInt64(7, this.lLiveId),
      t.writeInt32(8, this.iPCDefaultBitRate),
      t.writeInt32(9, this.iWebDefaultBitRate),
      t.writeInt32(10, this.iMobileDefaultBitRate),
      t.writeInt64(11, this.lMultiStreamFlag),
      t.writeString(12, this.sNick),
      t.writeInt64(13, this.lYYId),
      t.writeInt64(14, this.lAttendeeCount),
      t.writeInt32(15, this.iCodecType),
      t.writeInt32(16, this.iScreenType),
      t.writeVector(17, this.vMultiStreamInfo),
      t.writeString(18, this.sLiveDesc),
      t.writeInt64(19, this.lLiveCompatibleFlag),
      t.writeString(20, this.sAvatarUrl),
      t.writeInt32(21, this.iSourceType),
      t.writeString(22, this.sSubchannelName),
      t.writeString(23, this.sVideoCaptureUrl),
      t.writeInt32(24, this.iStartTime),
      t.writeInt64(25, this.lChannelId),
      t.writeInt64(26, this.lSubChannelId),
      t.writeString(27, this.sLocation);
  }),
  (HUYA.BeginLiveNotice.prototype.readFrom = function (t) {
    (this.lPresenterUid = t.readInt64(0, !1, this.lPresenterUid)),
      (this.iGameId = t.readInt32(1, !1, this.iGameId)),
      (this.sGameName = t.readString(2, !1, this.sGameName)),
      (this.iRandomRange = t.readInt32(3, !1, this.iRandomRange)),
      (this.iStreamType = t.readInt32(4, !1, this.iStreamType)),
      (this.vStreamInfo = t.readVector(5, !1, this.vStreamInfo)),
      (this.vCdnList = t.readVector(6, !1, this.vCdnList)),
      (this.lLiveId = t.readInt64(7, !1, this.lLiveId)),
      (this.iPCDefaultBitRate = t.readInt32(8, !1, this.iPCDefaultBitRate)),
      (this.iWebDefaultBitRate = t.readInt32(9, !1, this.iWebDefaultBitRate)),
      (this.iMobileDefaultBitRate = t.readInt32(10, !1, this.iMobileDefaultBitRate)),
      (this.lMultiStreamFlag = t.readInt64(11, !1, this.lMultiStreamFlag)),
      (this.sNick = t.readString(12, !1, this.sNick)),
      (this.lYYId = t.readInt64(13, !1, this.lYYId)),
      (this.lAttendeeCount = t.readInt64(14, !1, this.lAttendeeCount)),
      (this.iCodecType = t.readInt32(15, !1, this.iCodecType)),
      (this.iScreenType = t.readInt32(16, !1, this.iScreenType)),
      (this.vMultiStreamInfo = t.readVector(17, !1, this.vMultiStreamInfo)),
      (this.sLiveDesc = t.readString(18, !1, this.sLiveDesc)),
      (this.lLiveCompatibleFlag = t.readInt64(19, !1, this.lLiveCompatibleFlag)),
      (this.sAvatarUrl = t.readString(20, !1, this.sAvatarUrl)),
      (this.iSourceType = t.readInt32(21, !1, this.iSourceType)),
      (this.sSubchannelName = t.readString(22, !1, this.sSubchannelName)),
      (this.sVideoCaptureUrl = t.readString(23, !1, this.sVideoCaptureUrl)),
      (this.iStartTime = t.readInt32(24, !1, this.iStartTime)),
      (this.lChannelId = t.readInt64(25, !1, this.lChannelId)),
      (this.lSubChannelId = t.readInt64(26, !1, this.lSubChannelId)),
      (this.sLocation = t.readString(27, !1, this.sLocation));
  }),
  (HUYA.EndLiveNotice = function () {
    (this.lPresenterUid = 0), (this.iReason = 0), (this.lLiveId = 0);
  }),
  (HUYA.EndLiveNotice.prototype._clone = function () {
    return new HUYA.EndLiveNotice();
  }),
  (HUYA.EndLiveNotice.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.EndLiveNotice.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.EndLiveNotice.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lPresenterUid),
      t.writeInt32(1, this.iReason),
      t.writeInt64(2, this.lLiveId);
  }),
  (HUYA.EndLiveNotice.prototype.readFrom = function (t) {
    (this.lPresenterUid = t.readInt64(0, !1, this.lPresenterUid)),
      (this.iReason = t.readInt32(1, !1, this.iReason)),
      (this.lLiveId = t.readInt64(2, !1, this.lLiveId));
  }),
  (HUYA.NobleEnterNotice = function () {
    this.tNobleInfo = new HUYA.NobleBase();
  }),
  (HUYA.NobleEnterNotice.prototype._clone = function () {
    return new HUYA.NobleEnterNotice();
  }),
  (HUYA.NobleEnterNotice.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.NobleEnterNotice.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.NobleEnterNotice.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tNobleInfo);
  }),
  (HUYA.NobleEnterNotice.prototype.readFrom = function (t) {
    this.tNobleInfo = t.readStruct(0, !1, this.tNobleInfo);
  }),
  (HUYA.NobleSpeakResp = function () {
    (this.iRespCode = 0), (this.lUid = 0), (this.lTid = 0), (this.lSid = 0), (this.lPid = 0);
  }),
  (HUYA.NobleSpeakResp.prototype._clone = function () {
    return new HUYA.NobleSpeakResp();
  }),
  (HUYA.NobleSpeakResp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.NobleSpeakResp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.NobleSpeakResp.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iRespCode),
      t.writeInt64(1, this.lUid),
      t.writeInt64(2, this.lTid),
      t.writeInt64(3, this.lSid),
      t.writeInt64(4, this.lPid);
  }),
  (HUYA.NobleSpeakResp.prototype.readFrom = function (t) {
    (this.iRespCode = t.readInt32(0, !1, this.iRespCode)),
      (this.lUid = t.readInt64(1, !1, this.lUid)),
      (this.lTid = t.readInt64(2, !1, this.lTid)),
      (this.lSid = t.readInt64(3, !1, this.lSid)),
      (this.lPid = t.readInt64(4, !1, this.lPid));
  }),
  (HUYA.NobleSpeakReq = function () {
    (this.tUserId = new HUYA.UserId()),
      (this.lTid = 0),
      (this.lSid = 0),
      (this.lPid = 0),
      (this.sMsg = ""),
      (this.tSender = new HUYA.SenderItem()),
      (this.tNoble = new HUYA.NobleItem()),
      (this.tFans = new HUYA.FansItem()),
      (this.tVipSimle = new HUYA.VipSmileItem()),
      (this.tStamp = new HUYA.StampItem()),
      (this.tMass = new HUYA.MassItem()),
      (this.mReserver = new Taf.Map(new Taf.STRING(), new Taf.STRING()));
  }),
  (HUYA.NobleSpeakReq.prototype._clone = function () {
    return new HUYA.NobleSpeakReq();
  }),
  (HUYA.NobleSpeakReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.NobleSpeakReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.NobleSpeakReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tUserId),
      t.writeInt64(1, this.lTid),
      t.writeInt64(2, this.lSid),
      t.writeInt64(3, this.lPid),
      t.writeString(4, this.sMsg),
      t.writeStruct(5, this.tSender),
      t.writeStruct(6, this.tNoble),
      t.writeStruct(7, this.tFans),
      t.writeStruct(8, this.tVipSimle),
      t.writeStruct(9, this.tStamp),
      t.writeStruct(10, this.tMass),
      t.writeMap(11, this.mReserver);
  }),
  (HUYA.NobleSpeakReq.prototype.readFrom = function (t) {
    (this.tUserId = t.readStruct(0, !1, this.tUserId)),
      (this.lTid = t.readInt64(1, !1, this.lTid)),
      (this.lSid = t.readInt64(2, !1, this.lSid)),
      (this.lPid = t.readInt64(3, !1, this.lPid)),
      (this.sMsg = t.readString(4, !1, this.sMsg)),
      (this.tSender = t.readStruct(5, !1, this.tSender)),
      (this.tNoble = t.readStruct(6, !1, this.tNoble)),
      (this.tFans = t.readStruct(7, !1, this.tFans)),
      (this.tVipSimle = t.readStruct(8, !1, this.tVipSimle)),
      (this.tStamp = t.readStruct(9, !1, this.tStamp)),
      (this.tMass = t.readStruct(10, !1, this.tMass)),
      (this.mReserver = t.readMap(11, !1, this.mReserver));
  }),
  (HUYA.NobleSpeakBrst = function () {
    (this.tUserId = new HUYA.UserId()),
      (this.lTid = 0),
      (this.lSid = 0),
      (this.lPid = 0),
      (this.sMsg = ""),
      (this.tSender = new HUYA.SenderItem()),
      (this.tNoble = new HUYA.NobleItem()),
      (this.tFans = new HUYA.FansItem()),
      (this.tVipSimle = new HUYA.VipSmileItem()),
      (this.tStamp = new HUYA.StampItem()),
      (this.tMass = new HUYA.MassItem()),
      (this.mReserver = new Taf.Map(new Taf.STRING(), new Taf.STRING())),
      (this.iChatCache = 0),
      (this.iRoomAuditLevel = 0);
  }),
  (HUYA.NobleSpeakBrst.prototype._clone = function () {
    return new HUYA.NobleSpeakBrst();
  }),
  (HUYA.NobleSpeakBrst.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.NobleSpeakBrst.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.NobleSpeakBrst.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tUserId),
      t.writeInt64(1, this.lTid),
      t.writeInt64(2, this.lSid),
      t.writeInt64(3, this.lPid),
      t.writeString(4, this.sMsg),
      t.writeStruct(5, this.tSender),
      t.writeStruct(6, this.tNoble),
      t.writeStruct(7, this.tFans),
      t.writeStruct(8, this.tVipSimle),
      t.writeStruct(9, this.tStamp),
      t.writeStruct(10, this.tMass),
      t.writeMap(11, this.mReserver),
      t.writeInt32(12, this.iChatCache),
      t.writeInt32(13, this.iRoomAuditLevel);
  }),
  (HUYA.NobleSpeakBrst.prototype.readFrom = function (t) {
    (this.tUserId = t.readStruct(0, !1, this.tUserId)),
      (this.lTid = t.readInt64(1, !1, this.lTid)),
      (this.lSid = t.readInt64(2, !1, this.lSid)),
      (this.lPid = t.readInt64(3, !1, this.lPid)),
      (this.sMsg = t.readString(4, !1, this.sMsg)),
      (this.tSender = t.readStruct(5, !1, this.tSender)),
      (this.tNoble = t.readStruct(6, !1, this.tNoble)),
      (this.tFans = t.readStruct(7, !1, this.tFans)),
      (this.tVipSimle = t.readStruct(8, !1, this.tVipSimle)),
      (this.tStamp = t.readStruct(9, !1, this.tStamp)),
      (this.tMass = t.readStruct(10, !1, this.tMass)),
      (this.mReserver = t.readMap(11, !1, this.mReserver)),
      (this.iChatCache = t.readInt32(12, !1, this.iChatCache)),
      (this.iRoomAuditLevel = t.readInt32(13, !1, this.iRoomAuditLevel));
  }),
  (HUYA.SenderItem = function () {
    (this.lSenderUid = 0),
      (this.lYYid = 0),
      (this.iSenderRole = 0),
      (this.iSenderGender = 0),
      (this.sSenderNick = "");
  }),
  (HUYA.SenderItem.prototype._clone = function () {
    return new HUYA.SenderItem();
  }),
  (HUYA.SenderItem.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.SenderItem.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.SenderItem.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lSenderUid),
      t.writeInt64(1, this.lYYid),
      t.writeInt32(2, this.iSenderRole),
      t.writeInt32(3, this.iSenderGender),
      t.writeString(4, this.sSenderNick);
  }),
  (HUYA.SenderItem.prototype.readFrom = function (t) {
    (this.lSenderUid = t.readInt64(0, !1, this.lSenderUid)),
      (this.lYYid = t.readInt64(1, !1, this.lYYid)),
      (this.iSenderRole = t.readInt32(2, !1, this.iSenderRole)),
      (this.iSenderGender = t.readInt32(3, !1, this.iSenderGender)),
      (this.sSenderNick = t.readString(4, !1, this.sSenderNick));
  }),
  (HUYA.NobleItem = function () {
    (this.iNobleLevel = 0), (this.lDeadLine = 0);
  }),
  (HUYA.NobleItem.prototype._clone = function () {
    return new HUYA.NobleItem();
  }),
  (HUYA.NobleItem.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.NobleItem.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.NobleItem.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iNobleLevel), t.writeInt64(1, this.lDeadLine);
  }),
  (HUYA.NobleItem.prototype.readFrom = function (t) {
    (this.iNobleLevel = t.readInt32(0, !1, this.iNobleLevel)),
      (this.lDeadLine = t.readInt64(1, !1, this.lDeadLine));
  }),
  (HUYA.FansItem = function () {
    (this.iFansLevel = 0), (this.sFansNick = ""), (this.sFansPresenterNick = "");
  }),
  (HUYA.FansItem.prototype._clone = function () {
    return new HUYA.FansItem();
  }),
  (HUYA.FansItem.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.FansItem.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.FansItem.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iFansLevel),
      t.writeString(1, this.sFansNick),
      t.writeString(2, this.sFansPresenterNick);
  }),
  (HUYA.FansItem.prototype.readFrom = function (t) {
    (this.iFansLevel = t.readInt32(0, !1, this.iFansLevel)),
      (this.sFansNick = t.readString(1, !1, this.sFansNick)),
      (this.sFansPresenterNick = t.readString(2, !1, this.sFansPresenterNick));
  }),
  (HUYA.VipSmileItem = function () {
    (this.sVipSmileKey = ""), (this.sVipSmilePath = "");
  }),
  (HUYA.VipSmileItem.prototype._clone = function () {
    return new HUYA.VipSmileItem();
  }),
  (HUYA.VipSmileItem.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.VipSmileItem.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.VipSmileItem.prototype.writeTo = function (t) {
    t.writeString(0, this.sVipSmileKey), t.writeString(1, this.sVipSmilePath);
  }),
  (HUYA.VipSmileItem.prototype.readFrom = function (t) {
    (this.sVipSmileKey = t.readString(0, !1, this.sVipSmileKey)),
      (this.sVipSmilePath = t.readString(1, !1, this.sVipSmilePath));
  }),
  (HUYA.StampItem = function () {
    (this.sSealIconPath = ""),
      (this.sKeyImg = ""),
      (this.lStampTime = 0),
      (this.lStampEndTime = 0),
      (this.iValidity = 0),
      (this.sStampUserNick = "");
  }),
  (HUYA.StampItem.prototype._clone = function () {
    return new HUYA.StampItem();
  }),
  (HUYA.StampItem.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.StampItem.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.StampItem.prototype.writeTo = function (t) {
    t.writeString(0, this.sSealIconPath),
      t.writeString(1, this.sKeyImg),
      t.writeInt64(2, this.lStampTime),
      t.writeInt64(3, this.lStampEndTime),
      t.writeInt32(4, this.iValidity),
      t.writeString(5, this.sStampUserNick);
  }),
  (HUYA.StampItem.prototype.readFrom = function (t) {
    (this.sSealIconPath = t.readString(0, !1, this.sSealIconPath)),
      (this.sKeyImg = t.readString(1, !1, this.sKeyImg)),
      (this.lStampTime = t.readInt64(2, !1, this.lStampTime)),
      (this.lStampEndTime = t.readInt64(3, !1, this.lStampEndTime)),
      (this.iValidity = t.readInt32(4, !1, this.iValidity)),
      (this.sStampUserNick = t.readString(5, !1, this.sStampUserNick));
  }),
  (HUYA.MassItem = function () {
    (this.iGoldHostLevel = 0),
      (this.iSuperPupleLevel = 0),
      (this.iVipLevel = 0),
      (this.iUserLevel = 0),
      (this.iIsVipRed = 0),
      (this.iAtSomebody = 0),
      (this.sAtSomebodyNick = ""),
      (this.ibarrageColor = 0),
      (this.sDevSourceType = "");
  }),
  (HUYA.MassItem.prototype._clone = function () {
    return new HUYA.MassItem();
  }),
  (HUYA.MassItem.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.MassItem.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.MassItem.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iGoldHostLevel),
      t.writeInt32(1, this.iSuperPupleLevel),
      t.writeInt32(2, this.iVipLevel),
      t.writeInt32(3, this.iUserLevel),
      t.writeInt32(4, this.iIsVipRed),
      t.writeInt32(5, this.iAtSomebody),
      t.writeString(6, this.sAtSomebodyNick),
      t.writeInt32(7, this.ibarrageColor),
      t.writeString(8, this.sDevSourceType);
  }),
  (HUYA.MassItem.prototype.readFrom = function (t) {
    (this.iGoldHostLevel = t.readInt32(0, !1, this.iGoldHostLevel)),
      (this.iSuperPupleLevel = t.readInt32(1, !1, this.iSuperPupleLevel)),
      (this.iVipLevel = t.readInt32(2, !1, this.iVipLevel)),
      (this.iUserLevel = t.readInt32(3, !1, this.iUserLevel)),
      (this.iIsVipRed = t.readInt32(4, !1, this.iIsVipRed)),
      (this.iAtSomebody = t.readInt32(5, !1, this.iAtSomebody)),
      (this.sAtSomebodyNick = t.readString(6, !1, this.sAtSomebodyNick)),
      (this.ibarrageColor = t.readInt32(7, !1, this.ibarrageColor)),
      (this.sDevSourceType = t.readString(8, !1, this.sDevSourceType));
  }),
  (HUYA.NobleInfoReq = function () {
    this.tUserId = new HUYA.UserId();
  }),
  (HUYA.NobleInfoReq.prototype._clone = function () {
    return new HUYA.NobleInfoReq();
  }),
  (HUYA.NobleInfoReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.NobleInfoReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.NobleInfoReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tUserId);
  }),
  (HUYA.NobleInfoReq.prototype.readFrom = function (t) {
    this.tUserId = t.readStruct(0, !1, this.tUserId);
  }),
  (HUYA.NobleInfoRsp = function () {
    this.tInfo = new HUYA.NobleInfo();
  }),
  (HUYA.NobleInfoRsp.prototype._clone = function () {
    return new HUYA.NobleInfoRsp();
  }),
  (HUYA.NobleInfoRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.NobleInfoRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.NobleInfoRsp.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tInfo);
  }),
  (HUYA.NobleInfoRsp.prototype.readFrom = function (t) {
    this.tInfo = t.readStruct(0, !1, this.tInfo);
  }),
  (HUYA.NobleInfo = function () {
    (this.lUid = 0),
      (this.lPid = 0),
      (this.lValidDate = 0),
      (this.sNobleName = ""),
      (this.iNobleLevel = 0),
      (this.iNoblePet = 0),
      (this.iNobleStatus = 0),
      (this.iNobleType = 0);
  }),
  (HUYA.NobleInfo.prototype._clone = function () {
    return new HUYA.NobleInfo();
  }),
  (HUYA.NobleInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.NobleInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.NobleInfo.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeInt64(1, this.lPid),
      t.writeInt64(2, this.lValidDate),
      t.writeString(3, this.sNobleName),
      t.writeInt32(4, this.iNobleLevel),
      t.writeInt32(5, this.iNoblePet),
      t.writeInt32(6, this.iNobleStatus),
      t.writeInt32(7, this.iNobleType);
  }),
  (HUYA.NobleInfo.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.lPid = t.readInt64(1, !1, this.lPid)),
      (this.lValidDate = t.readInt64(2, !1, this.lValidDate)),
      (this.sNobleName = t.readString(3, !1, this.sNobleName)),
      (this.iNobleLevel = t.readInt32(4, !1, this.iNobleLevel)),
      (this.iNoblePet = t.readInt32(5, !1, this.iNoblePet)),
      (this.iNobleStatus = t.readInt32(6, !1, this.iNobleStatus)),
      (this.iNobleType = t.readInt32(7, !1, this.iNobleType));
  }),
  (HUYA.GetPropsListReq = function () {
    (this.tUserId = new HUYA.UserId()),
      (this.sMd5 = ""),
      (this.iTemplateType = 64),
      (this.sVersion = ""),
      (this.iAppId = 0),
      (this.lPresenterUid = 0),
      (this.lSid = 0),
      (this.lSubSid = 0);
  }),
  (HUYA.GetPropsListReq.prototype._clone = function () {
    return new HUYA.GetPropsListReq();
  }),
  (HUYA.GetPropsListReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetPropsListReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetPropsListReq.prototype.writeTo = function (t) {
    t.writeStruct(1, this.tUserId),
      t.writeString(2, this.sMd5),
      t.writeInt32(3, this.iTemplateType),
      t.writeString(4, this.sVersion),
      t.writeInt32(5, this.iAppId),
      t.writeInt64(6, this.lPresenterUid),
      t.writeInt64(7, this.lSid),
      t.writeInt64(8, this.lSubSid);
  }),
  (HUYA.GetPropsListReq.prototype.readFrom = function (t) {
    (this.tUserId = t.readStruct(1, !1, this.tUserId)),
      (this.sMd5 = t.readString(2, !1, this.sMd5)),
      (this.iTemplateType = t.readInt32(3, !1, this.iTemplateType)),
      (this.sVersion = t.readString(4, !1, this.sVersion)),
      (this.iAppId = t.readInt32(5, !1, this.iAppId)),
      (this.lPresenterUid = t.readInt64(6, !1, this.lPresenterUid)),
      (this.lSid = t.readInt64(7, !1, this.lSid)),
      (this.lSubSid = t.readInt64(8, !1, this.lSubSid));
  }),
  (HUYA.GetPropsListRsp = function () {
    (this.vPropsItemList = new Taf.Vector(new HUYA.PropsItem())),
      (this.sMd5 = ""),
      (this.iNewEffectSwitch = 0),
      (this.iMirrorRoomShowNum = 0),
      (this.iGameRoomShowNum = 0);
  }),
  (HUYA.GetPropsListRsp.prototype._clone = function () {
    return new HUYA.GetPropsListRsp();
  }),
  (HUYA.GetPropsListRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetPropsListRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetPropsListRsp.prototype.writeTo = function (t) {
    t.writeVector(1, this.vPropsItemList),
      t.writeString(2, this.sMd5),
      t.writeInt16(3, this.iNewEffectSwitch),
      t.writeInt16(4, this.iMirrorRoomShowNum),
      t.writeInt16(5, this.iGameRoomShowNum);
  }),
  (HUYA.GetPropsListRsp.prototype.readFrom = function (t) {
    (this.vPropsItemList = t.readVector(1, !1, this.vPropsItemList)),
      (this.sMd5 = t.readString(2, !1, this.sMd5)),
      (this.iNewEffectSwitch = t.readInt16(3, !1, this.iNewEffectSwitch)),
      (this.iMirrorRoomShowNum = t.readInt16(4, !1, this.iMirrorRoomShowNum)),
      (this.iGameRoomShowNum = t.readInt16(5, !1, this.iGameRoomShowNum));
  }),
  (HUYA.PropsItem = function () {
    (this.iPropsId = 0),
      (this.sPropsName = ""),
      (this.iPropsYb = 0),
      (this.iPropsGreenBean = 0),
      (this.iPropsWhiteBean = 0),
      (this.iPropsGoldenBean = 0),
      (this.iPropsRed = 0),
      (this.iPropsPopular = 0),
      (this.iPropsExpendNum = -1),
      (this.iPropsFansValue = -1),
      (this.vPropsNum = new Taf.Vector(new Taf.INT32())),
      (this.iPropsMaxNum = 0),
      (this.iPropsBatterFlag = 0),
      (this.vPropsChannel = new Taf.Vector(new Taf.INT32())),
      (this.sPropsToolTip = ""),
      (this.vPropsIdentity = new Taf.Vector(new HUYA.PropsIdentity())),
      (this.iPropsWeights = 0),
      (this.iPropsLevel = 0),
      (this.tDisplayInfo = new HUYA.DisplayInfo()),
      (this.tSpecialInfo = new HUYA.SpecialInfo()),
      (this.iPropsGrade = 0),
      (this.iPropsGroupNum = 0),
      (this.sPropsCommBannerResource = ""),
      (this.sPropsOwnBannerResource = ""),
      (this.iPropsShowFlag = 0),
      (this.iTemplateType = 0),
      (this.iShelfStatus = 0),
      (this.sAndroidLogo = ""),
      (this.sIpadLogo = ""),
      (this.sIphoneLogo = ""),
      (this.sPropsCommBannerResourceEx = ""),
      (this.sPropsOwnBannerResourceEx = ""),
      (this.vPresenterUid = new Taf.Vector(new Taf.INT64())),
      (this.vPropView = new Taf.Vector(new HUYA.PropView())),
      (this.iFaceUSwitch = 0);
  }),
  (HUYA.PropsItem.prototype._clone = function () {
    return new HUYA.PropsItem();
  }),
  (HUYA.PropsItem.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.PropsItem.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.PropsItem.prototype.writeTo = function (t) {
    t.writeInt32(1, this.iPropsId),
      t.writeString(2, this.sPropsName),
      t.writeInt32(3, this.iPropsYb),
      t.writeInt32(4, this.iPropsGreenBean),
      t.writeInt32(5, this.iPropsWhiteBean),
      t.writeInt32(6, this.iPropsGoldenBean),
      t.writeInt32(7, this.iPropsRed),
      t.writeInt32(8, this.iPropsPopular),
      t.writeInt32(9, this.iPropsExpendNum),
      t.writeInt32(10, this.iPropsFansValue),
      t.writeVector(11, this.vPropsNum),
      t.writeInt32(12, this.iPropsMaxNum),
      t.writeInt32(13, this.iPropsBatterFlag),
      t.writeVector(14, this.vPropsChannel),
      t.writeString(15, this.sPropsToolTip),
      t.writeVector(16, this.vPropsIdentity),
      t.writeInt32(17, this.iPropsWeights),
      t.writeInt32(18, this.iPropsLevel),
      t.writeStruct(19, this.tDisplayInfo),
      t.writeStruct(20, this.tSpecialInfo),
      t.writeInt32(21, this.iPropsGrade),
      t.writeInt32(22, this.iPropsGroupNum),
      t.writeString(23, this.sPropsCommBannerResource),
      t.writeString(24, this.sPropsOwnBannerResource),
      t.writeInt32(25, this.iPropsShowFlag),
      t.writeInt32(26, this.iTemplateType),
      t.writeInt32(27, this.iShelfStatus),
      t.writeString(28, this.sAndroidLogo),
      t.writeString(29, this.sIpadLogo),
      t.writeString(30, this.sIphoneLogo),
      t.writeString(31, this.sPropsCommBannerResourceEx),
      t.writeString(32, this.sPropsOwnBannerResourceEx),
      t.writeVector(33, this.vPresenterUid),
      t.writeVector(34, this.vPropView),
      t.writeInt16(35, this.iFaceUSwitch);
  }),
  (HUYA.PropsItem.prototype.readFrom = function (t) {
    (this.iPropsId = t.readInt32(1, !1, this.iPropsId)),
      (this.sPropsName = t.readString(2, !1, this.sPropsName)),
      (this.iPropsYb = t.readInt32(3, !1, this.iPropsYb)),
      (this.iPropsGreenBean = t.readInt32(4, !1, this.iPropsGreenBean)),
      (this.iPropsWhiteBean = t.readInt32(5, !1, this.iPropsWhiteBean)),
      (this.iPropsGoldenBean = t.readInt32(6, !1, this.iPropsGoldenBean)),
      (this.iPropsRed = t.readInt32(7, !1, this.iPropsRed)),
      (this.iPropsPopular = t.readInt32(8, !1, this.iPropsPopular)),
      (this.iPropsExpendNum = t.readInt32(9, !1, this.iPropsExpendNum)),
      (this.iPropsFansValue = t.readInt32(10, !1, this.iPropsFansValue)),
      (this.vPropsNum = t.readVector(11, !1, this.vPropsNum)),
      (this.iPropsMaxNum = t.readInt32(12, !1, this.iPropsMaxNum)),
      (this.iPropsBatterFlag = t.readInt32(13, !1, this.iPropsBatterFlag)),
      (this.vPropsChannel = t.readVector(14, !1, this.vPropsChannel)),
      (this.sPropsToolTip = t.readString(15, !1, this.sPropsToolTip)),
      (this.vPropsIdentity = t.readVector(16, !1, this.vPropsIdentity)),
      (this.iPropsWeights = t.readInt32(17, !1, this.iPropsWeights)),
      (this.iPropsLevel = t.readInt32(18, !1, this.iPropsLevel)),
      (this.tDisplayInfo = t.readStruct(19, !1, this.tDisplayInfo)),
      (this.tSpecialInfo = t.readStruct(20, !1, this.tSpecialInfo)),
      (this.iPropsGrade = t.readInt32(21, !1, this.iPropsGrade)),
      (this.iPropsGroupNum = t.readInt32(22, !1, this.iPropsGroupNum)),
      (this.sPropsCommBannerResource = t.readString(23, !1, this.sPropsCommBannerResource)),
      (this.sPropsOwnBannerResource = t.readString(24, !1, this.sPropsOwnBannerResource)),
      (this.iPropsShowFlag = t.readInt32(25, !1, this.iPropsShowFlag)),
      (this.iTemplateType = t.readInt32(26, !1, this.iTemplateType)),
      (this.iShelfStatus = t.readInt32(27, !1, this.iShelfStatus)),
      (this.sAndroidLogo = t.readString(28, !1, this.sAndroidLogo)),
      (this.sIpadLogo = t.readString(29, !1, this.sIpadLogo)),
      (this.sIphoneLogo = t.readString(30, !1, this.sIphoneLogo)),
      (this.sPropsCommBannerResourceEx = t.readString(31, !1, this.sPropsCommBannerResourceEx)),
      (this.sPropsOwnBannerResourceEx = t.readString(32, !1, this.sPropsOwnBannerResourceEx)),
      (this.vPresenterUid = t.readVector(33, !1, this.vPresenterUid)),
      (this.vPropView = t.readVector(34, !1, this.vPropView)),
      (this.iFaceUSwitch = t.readInt16(35, !1, this.iFaceUSwitch));
  }),
  (HUYA.PropsIdentity = function () {
    (this.iPropsIdType = 0),
      (this.sPropsPic18 = ""),
      (this.sPropsPic24 = ""),
      (this.sPropsPicGif = ""),
      (this.sPropsBannerResource = ""),
      (this.sPropsBannerSize = ""),
      (this.sPropsBannerMaxTime = ""),
      (this.sPropsChatBannerResource = ""),
      (this.sPropsChatBannerSize = ""),
      (this.sPropsChatBannerMaxTime = ""),
      (this.iPropsChatBannerPos = 0),
      (this.iPropsChatBannerIsCombo = 0),
      (this.sPropsRollContent = ""),
      (this.iPropsBannerAnimationstyle = 0),
      (this.sPropFaceu = ""),
      (this.sPropH5Resource = ""),
      (this.sPropsWeb = ""),
      (this.sWitch = 0),
      (this.sCornerMark = ""),
      (this.iPropViewId = 0),
      (this.sPropStreamerResource = ""),
      (this.iStreamerFrameRate = 0),
      (this.sPropsPic108 = ""),
      (this.sPcBannerResource = "");
  }),
  (HUYA.PropsIdentity.prototype._clone = function () {
    return new HUYA.PropsIdentity();
  }),
  (HUYA.PropsIdentity.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.PropsIdentity.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.PropsIdentity.prototype.writeTo = function (t) {
    t.writeInt32(1, this.iPropsIdType),
      t.writeString(2, this.sPropsPic18),
      t.writeString(3, this.sPropsPic24),
      t.writeString(4, this.sPropsPicGif),
      t.writeString(5, this.sPropsBannerResource),
      t.writeString(6, this.sPropsBannerSize),
      t.writeString(7, this.sPropsBannerMaxTime),
      t.writeString(8, this.sPropsChatBannerResource),
      t.writeString(9, this.sPropsChatBannerSize),
      t.writeString(10, this.sPropsChatBannerMaxTime),
      t.writeInt32(11, this.iPropsChatBannerPos),
      t.writeInt32(12, this.iPropsChatBannerIsCombo),
      t.writeString(13, this.sPropsRollContent),
      t.writeInt32(14, this.iPropsBannerAnimationstyle),
      t.writeString(15, this.sPropFaceu),
      t.writeString(16, this.sPropH5Resource),
      t.writeString(17, this.sPropsWeb),
      t.writeInt32(18, this.sWitch),
      t.writeString(19, this.sCornerMark),
      t.writeInt32(20, this.iPropViewId),
      t.writeString(21, this.sPropStreamerResource),
      t.writeInt16(22, this.iStreamerFrameRate),
      t.writeString(23, this.sPropsPic108),
      t.writeString(24, this.sPcBannerResource);
  }),
  (HUYA.PropsIdentity.prototype.readFrom = function (t) {
    (this.iPropsIdType = t.readInt32(1, !1, this.iPropsIdType)),
      (this.sPropsPic18 = t.readString(2, !1, this.sPropsPic18)),
      (this.sPropsPic24 = t.readString(3, !1, this.sPropsPic24)),
      (this.sPropsPicGif = t.readString(4, !1, this.sPropsPicGif)),
      (this.sPropsBannerResource = t.readString(5, !1, this.sPropsBannerResource)),
      (this.sPropsBannerSize = t.readString(6, !1, this.sPropsBannerSize)),
      (this.sPropsBannerMaxTime = t.readString(7, !1, this.sPropsBannerMaxTime)),
      (this.sPropsChatBannerResource = t.readString(8, !1, this.sPropsChatBannerResource)),
      (this.sPropsChatBannerSize = t.readString(9, !1, this.sPropsChatBannerSize)),
      (this.sPropsChatBannerMaxTime = t.readString(10, !1, this.sPropsChatBannerMaxTime)),
      (this.iPropsChatBannerPos = t.readInt32(11, !1, this.iPropsChatBannerPos)),
      (this.iPropsChatBannerIsCombo = t.readInt32(12, !1, this.iPropsChatBannerIsCombo)),
      (this.sPropsRollContent = t.readString(13, !1, this.sPropsRollContent)),
      (this.iPropsBannerAnimationstyle = t.readInt32(14, !1, this.iPropsBannerAnimationstyle)),
      (this.sPropFaceu = t.readString(15, !1, this.sPropFaceu)),
      (this.sPropH5Resource = t.readString(16, !1, this.sPropH5Resource)),
      (this.sPropsWeb = t.readString(17, !1, this.sPropsWeb)),
      (this.sWitch = t.readInt32(18, !1, this.sWitch)),
      (this.sCornerMark = t.readString(19, !1, this.sCornerMark)),
      (this.iPropViewId = t.readInt32(20, !1, this.iPropViewId)),
      (this.sPropStreamerResource = t.readString(21, !1, this.sPropStreamerResource)),
      (this.iStreamerFrameRate = t.readInt16(22, !1, this.iStreamerFrameRate)),
      (this.sPropsPic108 = t.readString(23, !1, this.sPropsPic108)),
      (this.sPcBannerResource = t.readString(24, !1, this.sPcBannerResource));
  }),
  (HUYA.PropView = function () {
    (this.id = 0),
      (this.name = ""),
      (this.uids = new Taf.Map(new Taf.INT64(), new Taf.INT16())),
      (this.tips = "");
  }),
  (HUYA.PropView.prototype._clone = function () {
    return new HUYA.PropView();
  }),
  (HUYA.PropView.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.PropView.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.PropView.prototype.writeTo = function (t) {
    t.writeInt32(0, this.id),
      t.writeString(1, this.name),
      t.writeMap(2, this.uids),
      t.writeString(3, this.tips);
  }),
  (HUYA.PropView.prototype.readFrom = function (t) {
    (this.id = t.readInt32(0, !1, this.id)),
      (this.name = t.readString(1, !1, this.name)),
      (this.uids = t.readMap(2, !1, this.uids)),
      (this.tips = t.readString(3, !1, this.tips));
  }),
  (HUYA.DisplayInfo = function () {
    (this.iMarqueeScopeMin = 0),
      (this.iMarqueeScopeMax = 0),
      (this.iCurrentVideoNum = 0),
      (this.iCurrentVideoMin = 0),
      (this.iCurrentVideoMax = 0),
      (this.iAllVideoNum = 0),
      (this.iAllVideoMin = 0),
      (this.iAllVideoMax = 0),
      (this.iCurrentScreenNum = 0),
      (this.iCurrentScreenMin = 0),
      (this.iCurrentScreenMax = 0);
  }),
  (HUYA.DisplayInfo.prototype._clone = function () {
    return new HUYA.DisplayInfo();
  }),
  (HUYA.DisplayInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.DisplayInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.DisplayInfo.prototype.writeTo = function (t) {
    t.writeInt32(1, this.iMarqueeScopeMin),
      t.writeInt32(2, this.iMarqueeScopeMax),
      t.writeInt32(3, this.iCurrentVideoNum),
      t.writeInt32(4, this.iCurrentVideoMin),
      t.writeInt32(5, this.iCurrentVideoMax),
      t.writeInt32(6, this.iAllVideoNum),
      t.writeInt32(7, this.iAllVideoMin),
      t.writeInt32(8, this.iAllVideoMax),
      t.writeInt32(9, this.iCurrentScreenNum),
      t.writeInt32(10, this.iCurrentScreenMin),
      t.writeInt32(11, this.iCurrentScreenMax);
  }),
  (HUYA.DisplayInfo.prototype.readFrom = function (t) {
    (this.iMarqueeScopeMin = t.readInt32(1, !1, this.iMarqueeScopeMin)),
      (this.iMarqueeScopeMax = t.readInt32(2, !1, this.iMarqueeScopeMax)),
      (this.iCurrentVideoNum = t.readInt32(3, !1, this.iCurrentVideoNum)),
      (this.iCurrentVideoMin = t.readInt32(4, !1, this.iCurrentVideoMin)),
      (this.iCurrentVideoMax = t.readInt32(5, !1, this.iCurrentVideoMax)),
      (this.iAllVideoNum = t.readInt32(6, !1, this.iAllVideoNum)),
      (this.iAllVideoMin = t.readInt32(7, !1, this.iAllVideoMin)),
      (this.iAllVideoMax = t.readInt32(8, !1, this.iAllVideoMax)),
      (this.iCurrentScreenNum = t.readInt32(9, !1, this.iCurrentScreenNum)),
      (this.iCurrentScreenMin = t.readInt32(10, !1, this.iCurrentScreenMin)),
      (this.iCurrentScreenMax = t.readInt32(11, !1, this.iCurrentScreenMax));
  }),
  (HUYA.SpecialInfo = function () {
    (this.iFirstSingle = 0),
      (this.iFirstGroup = 0),
      (this.sFirstTips = ""),
      (this.iSecondSingle = 0),
      (this.iSecondGroup = 0),
      (this.sSecondTips = ""),
      (this.iThirdSingle = 0),
      (this.iThirdGroup = 0),
      (this.sThirdTips = ""),
      (this.iWorldSingle = 0),
      (this.iWorldGroup = 0);
  }),
  (HUYA.SpecialInfo.prototype._clone = function () {
    return new HUYA.SpecialInfo();
  }),
  (HUYA.SpecialInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.SpecialInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.SpecialInfo.prototype.writeTo = function (t) {
    t.writeInt32(1, this.iFirstSingle),
      t.writeInt32(2, this.iFirstGroup),
      t.writeString(3, this.sFirstTips),
      t.writeInt32(4, this.iSecondSingle),
      t.writeInt32(5, this.iSecondGroup),
      t.writeString(6, this.sSecondTips),
      t.writeInt32(7, this.iThirdSingle),
      t.writeInt32(8, this.iThirdGroup),
      t.writeString(9, this.sThirdTips),
      t.writeInt32(10, this.iWorldSingle),
      t.writeInt32(11, this.iWorldGroup);
  }),
  (HUYA.SpecialInfo.prototype.readFrom = function (t) {
    (this.iFirstSingle = t.readInt32(1, !1, this.iFirstSingle)),
      (this.iFirstGroup = t.readInt32(2, !1, this.iFirstGroup)),
      (this.sFirstTips = t.readString(3, !1, this.sFirstTips)),
      (this.iSecondSingle = t.readInt32(4, !1, this.iSecondSingle)),
      (this.iSecondGroup = t.readInt32(5, !1, this.iSecondGroup)),
      (this.sSecondTips = t.readString(6, !1, this.sSecondTips)),
      (this.iThirdSingle = t.readInt32(7, !1, this.iThirdSingle)),
      (this.iThirdGroup = t.readInt32(8, !1, this.iThirdGroup)),
      (this.sThirdTips = t.readString(9, !1, this.sThirdTips)),
      (this.iWorldSingle = t.readInt32(10, !1, this.iWorldSingle)),
      (this.iWorldGroup = t.readInt32(11, !1, this.iWorldGroup));
  }),
  (HUYA.TokenCdnInfo = function () {
    (this.sCdnName = ""), (this.sUrl = "");
  }),
  (HUYA.TokenCdnInfo.prototype._clone = function () {
    return new HUYA.TokenCdnInfo();
  }),
  (HUYA.TokenCdnInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.TokenCdnInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.TokenCdnInfo.prototype.writeTo = function (t) {
    t.writeString(0, this.sCdnName), t.writeString(1, this.sUrl);
  }),
  (HUYA.TokenCdnInfo.prototype.readFrom = function (t) {
    (this.sCdnName = t.readString(0, !1, this.sCdnName)),
      (this.sUrl = t.readString(1, !1, this.sUrl));
  }),
  (HUYA.CdnAntiCodeInfo = function () {
    (this.sCdnName = ""), (this.sFlvAntiCode = ""), (this.sHlsAntiCode = "");
  }),
  (HUYA.CdnAntiCodeInfo.prototype._clone = function () {
    return new HUYA.CdnAntiCodeInfo();
  }),
  (HUYA.CdnAntiCodeInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.CdnAntiCodeInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.CdnAntiCodeInfo.prototype.writeTo = function (t) {
    t.writeString(0, this.sCdnName),
      t.writeString(1, this.sFlvAntiCode),
      t.writeString(2, this.sHlsAntiCode);
  }),
  (HUYA.CdnAntiCodeInfo.prototype.readFrom = function (t) {
    (this.sCdnName = t.readString(0, !1, this.sCdnName)),
      (this.sFlvAntiCode = t.readString(1, !1, this.sFlvAntiCode)),
      (this.sHlsAntiCode = t.readString(2, !1, this.sHlsAntiCode));
  }),
  (HUYA.BatchGetCdnTokenReq = function () {
    (this.vCdnInfos = new Taf.Vector(new HUYA.TokenCdnInfo())), (this.sStreamName = "");
  }),
  (HUYA.BatchGetCdnTokenReq.prototype._clone = function () {
    return new HUYA.BatchGetCdnTokenReq();
  }),
  (HUYA.BatchGetCdnTokenReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.BatchGetCdnTokenReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.BatchGetCdnTokenReq.prototype.writeTo = function (t) {
    t.writeVector(0, this.vCdnInfos), t.writeString(1, this.sStreamName);
  }),
  (HUYA.BatchGetCdnTokenReq.prototype.readFrom = function (t) {
    (this.vCdnInfos = t.readVector(0, !1, this.vCdnInfos)),
      (this.sStreamName = t.readString(1, !1, this.sStreamName));
  }),
  (HUYA.BatchGetCdnTokenRsp = function () {
    this.vCdnAntiCodes = new Taf.Vector(new HUYA.CdnAntiCodeInfo());
  }),
  (HUYA.BatchGetCdnTokenRsp.prototype._clone = function () {
    return new HUYA.BatchGetCdnTokenRsp();
  }),
  (HUYA.BatchGetCdnTokenRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.BatchGetCdnTokenRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.BatchGetCdnTokenRsp.prototype.writeTo = function (t) {
    t.writeVector(0, this.vCdnAntiCodes);
  }),
  (HUYA.BatchGetCdnTokenRsp.prototype.readFrom = function (t) {
    this.vCdnAntiCodes = t.readVector(0, !1, this.vCdnAntiCodes);
  }),
  (HUYA.NobleBase = function () {
    (this.lUid = 0),
      (this.sNickName = ""),
      (this.iLevel = 0),
      (this.sName = ""),
      (this.iPet = 0),
      (this.lPid = 0),
      (this.lTid = 0),
      (this.lSid = 0),
      (this.lStartTime = 0),
      (this.lEndTime = 0),
      (this.iLeftDay = 0),
      (this.iStatus = 0),
      (this.iOpenFlag = 0);
  }),
  (HUYA.NobleBase.prototype._clone = function () {
    return new HUYA.NobleBase();
  }),
  (HUYA.NobleBase.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.NobleBase.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.NobleBase.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeString(1, this.sNickName),
      t.writeInt32(2, this.iLevel),
      t.writeString(3, this.sName),
      t.writeInt32(4, this.iPet),
      t.writeInt64(5, this.lPid),
      t.writeInt64(6, this.lTid),
      t.writeInt64(7, this.lSid),
      t.writeInt64(8, this.lStartTime),
      t.writeInt64(9, this.lEndTime),
      t.writeInt32(10, this.iLeftDay),
      t.writeInt32(11, this.iStatus),
      t.writeInt32(12, this.iOpenFlag);
  }),
  (HUYA.NobleBase.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.sNickName = t.readString(1, !1, this.sNickName)),
      (this.iLevel = t.readInt32(2, !1, this.iLevel)),
      (this.sName = t.readString(3, !1, this.sName)),
      (this.iPet = t.readInt32(4, !1, this.iPet)),
      (this.lPid = t.readInt64(5, !1, this.lPid)),
      (this.lTid = t.readInt64(6, !1, this.lTid)),
      (this.lSid = t.readInt64(7, !1, this.lSid)),
      (this.lStartTime = t.readInt64(8, !1, this.lStartTime)),
      (this.lEndTime = t.readInt64(9, !1, this.lEndTime)),
      (this.iLeftDay = t.readInt32(10, !1, this.iLeftDay)),
      (this.iStatus = t.readInt32(11, !1, this.iStatus)),
      (this.iOpenFlag = t.readInt32(12, !1, this.iOpenFlag));
  }),
  (HUYA.GetWebdbUserInfoReq = function () {
    (this.lUid = 0),
      (this.lImid = 0),
      (this.sPassport = ""),
      (this.sAccount = ""),
      (this.bCacheFirst = !0);
  }),
  (HUYA.GetWebdbUserInfoReq.prototype._clone = function () {
    return new HUYA.GetWebdbUserInfoReq();
  }),
  (HUYA.GetWebdbUserInfoReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetWebdbUserInfoReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetWebdbUserInfoReq.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeInt64(1, this.lImid),
      t.writeString(2, this.sPassport),
      t.writeString(3, this.sAccount),
      t.writeBoolean(4, this.bCacheFirst);
  }),
  (HUYA.GetWebdbUserInfoReq.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.lImid = t.readInt64(1, !1, this.lImid)),
      (this.sPassport = t.readString(2, !1, this.sPassport)),
      (this.sAccount = t.readString(3, !1, this.sAccount)),
      (this.bCacheFirst = t.readBoolean(4, !1, this.bCacheFirst));
  }),
  (HUYA.GetWebdbUserInfoRsp = function () {
    this.tUserInfo = new HUYA.DBUserInfo();
  }),
  (HUYA.GetWebdbUserInfoRsp.prototype._clone = function () {
    return new HUYA.GetWebdbUserInfoRsp();
  }),
  (HUYA.GetWebdbUserInfoRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetWebdbUserInfoRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetWebdbUserInfoRsp.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tUserInfo);
  }),
  (HUYA.GetWebdbUserInfoRsp.prototype.readFrom = function (t) {
    this.tUserInfo = t.readStruct(0, !1, this.tUserInfo);
  }),
  (HUYA.DBUserInfo = function () {
    (this.lUid = 0),
      (this.sPassport = ""),
      (this.sAccount = ""),
      (this.sNick = ""),
      (this.iSex = 0),
      (this.iBirthday = 0),
      (this.sArea = ""),
      (this.sProvince = ""),
      (this.sCity = ""),
      (this.sSign = ""),
      (this.sIntro = ""),
      (this.iJifen = 0),
      (this.sRegisterTime = ""),
      (this.sHdlogo = ""),
      (this.sSessionCard = ""),
      (this.lImid = 0),
      (this.iLogoIndex = 0);
  }),
  (HUYA.DBUserInfo.prototype._clone = function () {
    return new HUYA.DBUserInfo();
  }),
  (HUYA.DBUserInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.DBUserInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.DBUserInfo.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeString(1, this.sPassport),
      t.writeString(2, this.sAccount),
      t.writeString(3, this.sNick),
      t.writeInt32(4, this.iSex),
      t.writeInt32(5, this.iBirthday),
      t.writeString(6, this.sArea),
      t.writeString(7, this.sProvince),
      t.writeString(8, this.sCity),
      t.writeString(9, this.sSign),
      t.writeString(10, this.sIntro),
      t.writeInt32(11, this.iJifen),
      t.writeString(12, this.sRegisterTime),
      t.writeString(13, this.sHdlogo),
      t.writeString(14, this.sSessionCard),
      t.writeInt64(16, this.lImid),
      t.writeInt32(17, this.iLogoIndex);
  }),
  (HUYA.DBUserInfo.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.sPassport = t.readString(1, !1, this.sPassport)),
      (this.sAccount = t.readString(2, !1, this.sAccount)),
      (this.sNick = t.readString(3, !1, this.sNick)),
      (this.iSex = t.readInt32(4, !1, this.iSex)),
      (this.iBirthday = t.readInt32(5, !1, this.iBirthday)),
      (this.sArea = t.readString(6, !1, this.sArea)),
      (this.sProvince = t.readString(7, !1, this.sProvince)),
      (this.sCity = t.readString(8, !1, this.sCity)),
      (this.sSign = t.readString(9, !1, this.sSign)),
      (this.sIntro = t.readString(10, !1, this.sIntro)),
      (this.iJifen = t.readInt32(11, !1, this.iJifen)),
      (this.sRegisterTime = t.readString(12, !1, this.sRegisterTime)),
      (this.sHdlogo = t.readString(13, !1, this.sHdlogo)),
      (this.sSessionCard = t.readString(14, !1, this.sSessionCard)),
      (this.lImid = t.readInt64(16, !1, this.lImid)),
      (this.iLogoIndex = t.readInt32(17, !1, this.iLogoIndex));
  }),
  (HUYA.GiftInfo = function () {
    (this.iItemType = 0), (this.iItemCount = 0);
  }),
  (HUYA.GiftInfo.prototype._clone = function () {
    return new HUYA.GiftInfo();
  }),
  (HUYA.GiftInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GiftInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GiftInfo.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iItemType), t.writeInt32(1, this.iItemCount);
  }),
  (HUYA.GiftInfo.prototype.readFrom = function (t) {
    (this.iItemType = t.readInt32(0, !1, this.iItemType)),
      (this.iItemCount = t.readInt32(1, !1, this.iItemCount));
  }),
  (HUYA.GetUserBoxInfoReq = function () {
    this.tId = new HUYA.UserId();
  }),
  (HUYA.GetUserBoxInfoReq.prototype._clone = function () {
    return new HUYA.GetUserBoxInfoReq();
  }),
  (HUYA.GetUserBoxInfoReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetUserBoxInfoReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetUserBoxInfoReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId);
  }),
  (HUYA.GetUserBoxInfoReq.prototype.readFrom = function (t) {
    this.tId = t.readStruct(0, !1, this.tId);
  }),
  (HUYA.GetUserBoxInfoRsp = function () {
    (this.lUid = 0),
      (this.tTask1 = new HUYA.BoxTaskInfo()),
      (this.tTask2 = new HUYA.BoxTaskInfo()),
      (this.tTask3 = new HUYA.BoxTaskInfo()),
      (this.tTask4 = new HUYA.BoxTaskInfo()),
      (this.tTask5 = new HUYA.BoxTaskInfo()),
      (this.tTask6 = new HUYA.BoxTaskInfo());
  }),
  (HUYA.GetUserBoxInfoRsp.prototype._clone = function () {
    return new HUYA.GetUserBoxInfoRsp();
  }),
  (HUYA.GetUserBoxInfoRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.GetUserBoxInfoRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.GetUserBoxInfoRsp.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeStruct(1, this.tTask1),
      t.writeStruct(2, this.tTask2),
      t.writeStruct(3, this.tTask3),
      t.writeStruct(4, this.tTask4),
      t.writeStruct(5, this.tTask5),
      t.writeStruct(7, this.tTask6);
  }),
  (HUYA.GetUserBoxInfoRsp.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.tTask1 = t.readStruct(1, !1, this.tTask1)),
      (this.tTask2 = t.readStruct(2, !1, this.tTask2)),
      (this.tTask3 = t.readStruct(3, !1, this.tTask3)),
      (this.tTask4 = t.readStruct(4, !1, this.tTask4)),
      (this.tTask5 = t.readStruct(5, !1, this.tTask5)),
      (this.tTask6 = t.readStruct(7, !1, this.tTask6));
  }),
  (HUYA.FinishTaskNoticeReq = function () {
    (this.tId = new HUYA.UserId()),
      (this.lSid = 0),
      (this.lSubSid = 0),
      (this.iTaskId = 0),
      (this.sPassport = ""),
      (this.iFromType = 0),
      (this.fVersion = 1),
      (this.sTime = ""),
      (this.sMd5 = "");
  }),
  (HUYA.FinishTaskNoticeReq.prototype._clone = function () {
    return new HUYA.FinishTaskNoticeReq();
  }),
  (HUYA.FinishTaskNoticeReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.FinishTaskNoticeReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.FinishTaskNoticeReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId),
      t.writeInt64(1, this.lSid),
      t.writeInt64(2, this.lSubSid),
      t.writeInt32(3, this.iTaskId),
      t.writeString(4, this.sPassport),
      t.writeInt32(5, this.iFromType),
      t.writeFloat(6, this.fVersion),
      t.writeString(7, this.sTime),
      t.writeString(8, this.sMd5);
  }),
  (HUYA.FinishTaskNoticeReq.prototype.readFrom = function (t) {
    (this.tId = t.readStruct(0, !1, this.tId)),
      (this.lSid = t.readInt64(1, !1, this.lSid)),
      (this.lSubSid = t.readInt64(2, !1, this.lSubSid)),
      (this.iTaskId = t.readInt32(3, !1, this.iTaskId)),
      (this.sPassport = t.readString(4, !1, this.sPassport)),
      (this.iFromType = t.readInt32(5, !1, this.iFromType)),
      (this.fVersion = t.readFloat(6, !1, this.fVersion)),
      (this.sTime = t.readString(7, !1, this.sTime)),
      (this.sMd5 = t.readString(8, !1, this.sMd5));
  }),
  (HUYA.FinishTaskNoticeRsp = function () {
    (this.iRspCode = 0), (this.iTaskId = 0);
  }),
  (HUYA.FinishTaskNoticeRsp.prototype._clone = function () {
    return new HUYA.FinishTaskNoticeRsp();
  }),
  (HUYA.FinishTaskNoticeRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.FinishTaskNoticeRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.FinishTaskNoticeRsp.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iRspCode), t.writeInt32(1, this.iTaskId);
  }),
  (HUYA.FinishTaskNoticeRsp.prototype.readFrom = function (t) {
    (this.iRspCode = t.readInt32(0, !1, this.iRspCode)),
      (this.iTaskId = t.readInt32(1, !1, this.iTaskId));
  }),
  (HUYA.AwardBoxPrizeReq = function () {
    (this.tId = new HUYA.UserId()),
      (this.lSid = 0),
      (this.lSubSid = 0),
      (this.iTaskId = 0),
      (this.sPassport = ""),
      (this.iFromType = 0),
      (this.fVersion = 1),
      (this.sTime = ""),
      (this.sMd5 = "");
  }),
  (HUYA.AwardBoxPrizeReq.prototype._clone = function () {
    return new HUYA.AwardBoxPrizeReq();
  }),
  (HUYA.AwardBoxPrizeReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.AwardBoxPrizeReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.AwardBoxPrizeReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId),
      t.writeInt64(1, this.lSid),
      t.writeInt64(2, this.lSubSid),
      t.writeInt32(3, this.iTaskId),
      t.writeString(4, this.sPassport),
      t.writeInt32(5, this.iFromType),
      t.writeFloat(6, this.fVersion),
      t.writeString(7, this.sTime),
      t.writeString(8, this.sMd5);
  }),
  (HUYA.AwardBoxPrizeReq.prototype.readFrom = function (t) {
    (this.tId = t.readStruct(0, !1, this.tId)),
      (this.lSid = t.readInt64(1, !1, this.lSid)),
      (this.lSubSid = t.readInt64(2, !1, this.lSubSid)),
      (this.iTaskId = t.readInt32(3, !1, this.iTaskId)),
      (this.sPassport = t.readString(4, !1, this.sPassport)),
      (this.iFromType = t.readInt32(5, !1, this.iFromType)),
      (this.fVersion = t.readFloat(6, !1, this.fVersion)),
      (this.sTime = t.readString(7, !1, this.sTime)),
      (this.sMd5 = t.readString(8, !1, this.sMd5));
  }),
  (HUYA.AwardBoxPrizeRsp = function () {
    (this.iRspCode = 0), (this.iTaskId = 0), (this.iItemType = 0), (this.iCount = 0);
  }),
  (HUYA.AwardBoxPrizeRsp.prototype._clone = function () {
    return new HUYA.AwardBoxPrizeRsp();
  }),
  (HUYA.AwardBoxPrizeRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.AwardBoxPrizeRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.AwardBoxPrizeRsp.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iRspCode),
      t.writeInt32(1, this.iTaskId),
      t.writeInt32(2, this.iItemType),
      t.writeInt32(3, this.iCount);
  }),
  (HUYA.AwardBoxPrizeRsp.prototype.readFrom = function (t) {
    (this.iRspCode = t.readInt32(0, !1, this.iRspCode)),
      (this.iTaskId = t.readInt32(1, !1, this.iTaskId)),
      (this.iItemType = t.readInt32(2, !1, this.iItemType)),
      (this.iCount = t.readInt32(3, !1, this.iCount));
  }),
  (HUYA.BoxTaskInfo = function () {
    (this.iStat = 0), (this.iItemType = 0), (this.iItemCount = 0);
  }),
  (HUYA.BoxTaskInfo.prototype._clone = function () {
    return new HUYA.BoxTaskInfo();
  }),
  (HUYA.BoxTaskInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.BoxTaskInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.BoxTaskInfo.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iStat), t.writeInt32(1, this.iItemType), t.writeInt32(2, this.iItemCount);
  }),
  (HUYA.BoxTaskInfo.prototype.readFrom = function (t) {
    (this.iStat = t.readInt32(0, !1, this.iStat)),
      (this.iItemType = t.readInt32(1, !1, this.iItemType)),
      (this.iItemCount = t.readInt32(2, !1, this.iItemCount));
  }),
  (HUYA.InterveneCountRsp = function () {
    (this.lTimeStamp = 0),
      (this.iExpire = 0),
      (this.lChannelId = 0),
      (this.vCountInfos = new Taf.Vector(new HUYA.InterveneCountInfo()));
  }),
  (HUYA.InterveneCountRsp.prototype._clone = function () {
    return new HUYA.InterveneCountRsp();
  }),
  (HUYA.InterveneCountRsp.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.InterveneCountRsp.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.InterveneCountRsp.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lTimeStamp),
      t.writeInt32(1, this.iExpire),
      t.writeInt64(2, this.lChannelId),
      t.writeVector(3, this.vCountInfos);
  }),
  (HUYA.InterveneCountRsp.prototype.readFrom = function (t) {
    (this.lTimeStamp = t.readInt64(0, !1, this.lTimeStamp)),
      (this.iExpire = t.readInt32(1, !1, this.iExpire)),
      (this.lChannelId = t.readInt64(2, !1, this.lChannelId)),
      (this.vCountInfos = t.readVector(3, !1, this.vCountInfos));
  }),
  (HUYA.InterveneCountInfo = function () {
    (this.lSubChannelId = 0), (this.lAttendeeCount = 0);
  }),
  (HUYA.InterveneCountInfo.prototype._clone = function () {
    return new HUYA.InterveneCountInfo();
  }),
  (HUYA.InterveneCountInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.InterveneCountInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.InterveneCountInfo.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lSubChannelId), t.writeInt64(1, this.lAttendeeCount);
  }),
  (HUYA.InterveneCountInfo.prototype.readFrom = function (t) {
    (this.lSubChannelId = t.readInt64(0, !1, this.lSubChannelId)),
      (this.lAttendeeCount = t.readInt64(1, !1, this.lAttendeeCount));
  }),
  (HUYA.AuditorEnterLiveNotice = function () {
    (this.iUserType = 0),
      (this.lUid = 0),
      (this.sNick = ""),
      (this.bSendMessagePopUp = !1),
      (this.sSendMessageTips = ""),
      (this.lSubcid = 0),
      (this.iSendMessagePopUpAmtTime = 0);
  }),
  (HUYA.AuditorEnterLiveNotice.prototype._clone = function () {
    return new HUYA.AuditorEnterLiveNotice();
  }),
  (HUYA.AuditorEnterLiveNotice.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.AuditorEnterLiveNotice.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.AuditorEnterLiveNotice.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iUserType),
      t.writeInt64(1, this.lUid),
      t.writeString(2, this.sNick),
      t.writeBoolean(3, this.bSendMessagePopUp),
      t.writeString(4, this.sSendMessageTips),
      t.writeInt64(5, this.lSubcid),
      t.writeInt32(6, this.iSendMessagePopUpAmtTime);
  }),
  (HUYA.AuditorEnterLiveNotice.prototype.readFrom = function (t) {
    (this.iUserType = t.readInt32(0, !1, this.iUserType)),
      (this.lUid = t.readInt64(1, !1, this.lUid)),
      (this.sNick = t.readString(2, !1, this.sNick)),
      (this.bSendMessagePopUp = t.readBoolean(3, !1, this.bSendMessagePopUp)),
      (this.sSendMessageTips = t.readString(4, !1, this.sSendMessageTips)),
      (this.lSubcid = t.readInt64(5, !1, this.lSubcid)),
      (this.iSendMessagePopUpAmtTime = t.readInt32(6, !1, this.iSendMessagePopUpAmtTime));
  }),
  (HUYA.AuditorRoleChangeNotice = function () {
    (this.iOldUserType = 0),
      (this.iNewUserType = 0),
      (this.lUid = 0),
      (this.lSubcid = 0),
      (this.sNick = ""),
      (this.bPopUp = !1),
      (this.sSystemTips = ""),
      (this.bSendMessagePopUp = !1),
      (this.sSendMessageTips = ""),
      (this.iSendMessagePopUpAmtTime = 0);
  }),
  (HUYA.AuditorRoleChangeNotice.prototype._clone = function () {
    return new HUYA.AuditorRoleChangeNotice();
  }),
  (HUYA.AuditorRoleChangeNotice.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.AuditorRoleChangeNotice.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.AuditorRoleChangeNotice.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iOldUserType),
      t.writeInt32(1, this.iNewUserType),
      t.writeInt64(2, this.lUid),
      t.writeInt64(3, this.lSubcid),
      t.writeString(4, this.sNick),
      t.writeBoolean(5, this.bPopUp),
      t.writeString(6, this.sSystemTips),
      t.writeBoolean(7, this.bSendMessagePopUp),
      t.writeString(8, this.sSendMessageTips),
      t.writeInt32(9, this.iSendMessagePopUpAmtTime);
  }),
  (HUYA.AuditorRoleChangeNotice.prototype.readFrom = function (t) {
    (this.iOldUserType = t.readInt32(0, !1, this.iOldUserType)),
      (this.iNewUserType = t.readInt32(1, !1, this.iNewUserType)),
      (this.lUid = t.readInt64(2, !1, this.lUid)),
      (this.lSubcid = t.readInt64(3, !1, this.lSubcid)),
      (this.sNick = t.readString(4, !1, this.sNick)),
      (this.bPopUp = t.readBoolean(5, !1, this.bPopUp)),
      (this.sSystemTips = t.readString(6, !1, this.sSystemTips)),
      (this.bSendMessagePopUp = t.readBoolean(7, !1, this.bSendMessagePopUp)),
      (this.sSendMessageTips = t.readString(8, !1, this.sSendMessageTips)),
      (this.iSendMessagePopUpAmtTime = t.readInt32(9, !1, this.iSendMessagePopUpAmtTime));
  }),
  (HUYA.AttendeeCountNotice = function () {
    this.iAttendeeCount = 0;
  }),
  (HUYA.AttendeeCountNotice.prototype._clone = function () {
    return new HUYA.AttendeeCountNotice();
  }),
  (HUYA.AttendeeCountNotice.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.AttendeeCountNotice.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.AttendeeCountNotice.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iAttendeeCount);
  }),
  (HUYA.AttendeeCountNotice.prototype.readFrom = function (t) {
    this.iAttendeeCount = t.readInt32(0, !1, this.iAttendeeCount);
  }),
  (HUYA.ExternalUser = function () {
    (this.sId = ""), (this.sToken = ""), (this.sOther = "");
  }),
  (HUYA.ExternalUser.prototype._clone = function () {
    return new HUYA.ExternalUser();
  }),
  (HUYA.ExternalUser.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.ExternalUser.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.ExternalUser.prototype.writeTo = function (t) {
    t.writeString(0, this.sId), t.writeString(1, this.sToken), t.writeString(2, this.sOther);
  }),
  (HUYA.ExternalUser.prototype.readFrom = function (t) {
    (this.sId = t.readString(0, !1, this.sId)),
      (this.sToken = t.readString(1, !1, this.sToken)),
      (this.sOther = t.readString(2, !1, this.sOther));
  }),
  (HUYA.BulletFormat = function () {
    (this.iFontColor = -1),
      (this.iFontSize = 4),
      (this.iTextSpeed = 0),
      (this.iTransitionType = 1),
      (this.iPopupStyle = 0);
  }),
  (HUYA.BulletFormat.prototype._clone = function () {
    return new HUYA.BulletFormat();
  }),
  (HUYA.BulletFormat.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.BulletFormat.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.BulletFormat.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iFontColor),
      t.writeInt32(1, this.iFontSize),
      t.writeInt32(2, this.iTextSpeed),
      t.writeInt32(3, this.iTransitionType),
      t.writeInt32(4, this.iPopupStyle);
  }),
  (HUYA.BulletFormat.prototype.readFrom = function (t) {
    (this.iFontColor = t.readInt32(0, !1, this.iFontColor)),
      (this.iFontSize = t.readInt32(1, !1, this.iFontSize)),
      (this.iTextSpeed = t.readInt32(2, !1, this.iTextSpeed)),
      (this.iTransitionType = t.readInt32(3, !1, this.iTransitionType)),
      (this.iPopupStyle = t.readInt32(4, !1, this.iPopupStyle));
  }),
  (HUYA.ContentFormat = function () {
    (this.iFontColor = -1), (this.iFontSize = 4), (this.iPopupStyle = 0);
  }),
  (HUYA.ContentFormat.prototype._clone = function () {
    return new HUYA.ContentFormat();
  }),
  (HUYA.ContentFormat.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.ContentFormat.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.ContentFormat.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iFontColor),
      t.writeInt32(1, this.iFontSize),
      t.writeInt32(2, this.iPopupStyle);
  }),
  (HUYA.ContentFormat.prototype.readFrom = function (t) {
    (this.iFontColor = t.readInt32(0, !1, this.iFontColor)),
      (this.iFontSize = t.readInt32(1, !1, this.iFontSize)),
      (this.iPopupStyle = t.readInt32(2, !1, this.iPopupStyle));
  }),
  (HUYA.DecorationInfo = function () {
    (this.iAppId = 0), (this.iViewType = 0), (this.vData = new Taf.BinBuffer());
  }),
  (HUYA.DecorationInfo.prototype._clone = function () {
    return new HUYA.DecorationInfo();
  }),
  (HUYA.DecorationInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.DecorationInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.DecorationInfo.prototype.writeTo = function (t) {
    t.writeInt32(0, this.iAppId), t.writeInt32(1, this.iViewType), t.writeBytes(2, this.vData);
  }),
  (HUYA.DecorationInfo.prototype.readFrom = function (t) {
    (this.iAppId = t.readInt32(0, !1, this.iAppId)),
      (this.iViewType = t.readInt32(1, !1, this.iViewType)),
      (this.vData = t.readBytes(2, !1, this.vData));
  }),
  (HUYA.SenderInfo = function () {
    (this.lUid = 0), (this.lImid = 0), (this.sNickName = ""), (this.iGender = 0);
  }),
  (HUYA.SenderInfo.prototype._clone = function () {
    return new HUYA.SenderInfo();
  }),
  (HUYA.SenderInfo.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.SenderInfo.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.SenderInfo.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid),
      t.writeInt64(1, this.lImid),
      t.writeString(2, this.sNickName),
      t.writeInt32(3, this.iGender);
  }),
  (HUYA.SenderInfo.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.lImid = t.readInt64(1, !1, this.lImid)),
      (this.sNickName = t.readString(2, !1, this.sNickName)),
      (this.iGender = t.readInt32(3, !1, this.iGender));
  }),
  (HUYA.UidNickName = function () {
    (this.lUid = 0), (this.sNickName = "");
  }),
  (HUYA.UidNickName.prototype._clone = function () {
    return new HUYA.UidNickName();
  }),
  (HUYA.UidNickName.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.UidNickName.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.UidNickName.prototype.writeTo = function (t) {
    t.writeInt64(0, this.lUid), t.writeString(1, this.sNickName);
  }),
  (HUYA.UidNickName.prototype.readFrom = function (t) {
    (this.lUid = t.readInt64(0, !1, this.lUid)),
      (this.sNickName = t.readString(1, !1, this.sNickName));
  }),
  (HUYA.MessageNotice = function () {
    (this.tUserInfo = new HUYA.SenderInfo()),
      (this.lTid = 0),
      (this.lSid = 0),
      (this.sContent = ""),
      (this.iShowMode = 0),
      (this.tFormat = new HUYA.ContentFormat()),
      (this.tBulletFormat = new HUYA.BulletFormat()),
      (this.iTermType = 0),
      (this.vDecorationPrefix = new Taf.Vector(new HUYA.DecorationInfo())),
      (this.vDecorationSuffix = new Taf.Vector(new HUYA.DecorationInfo())),
      (this.vAtSomeone = new Taf.Vector(new HUYA.UidNickName())),
      (this.lPid = 0);
  }),
  (HUYA.MessageNotice.prototype._clone = function () {
    return new HUYA.MessageNotice();
  }),
  (HUYA.MessageNotice.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.MessageNotice.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.MessageNotice.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tUserInfo),
      t.writeInt64(1, this.lTid),
      t.writeInt64(2, this.lSid),
      t.writeString(3, this.sContent),
      t.writeInt32(4, this.iShowMode),
      t.writeStruct(5, this.tFormat),
      t.writeStruct(6, this.tBulletFormat),
      t.writeInt32(7, this.iTermType),
      t.writeVector(8, this.vDecorationPrefix),
      t.writeVector(9, this.vDecorationSuffix),
      t.writeVector(10, this.vAtSomeone),
      t.writeInt64(11, this.lPid);
  }),
  (HUYA.MessageNotice.prototype.readFrom = function (t) {
    (this.tUserInfo = t.readStruct(0, !1, this.tUserInfo)),
      (this.lTid = t.readInt64(1, !1, this.lTid)),
      (this.lSid = t.readInt64(2, !1, this.lSid)),
      (this.sContent = t.readString(3, !1, this.sContent)),
      (this.iShowMode = t.readInt32(4, !1, this.iShowMode)),
      (this.tFormat = t.readStruct(5, !1, this.tFormat)),
      (this.tBulletFormat = t.readStruct(6, !1, this.tBulletFormat)),
      (this.iTermType = t.readInt32(7, !1, this.iTermType)),
      (this.vDecorationPrefix = t.readVector(8, !1, this.vDecorationPrefix)),
      (this.vDecorationSuffix = t.readVector(9, !1, this.vDecorationSuffix)),
      (this.vAtSomeone = t.readVector(10, !1, this.vAtSomeone)),
      (this.lPid = t.readInt64(11, !1, this.lPid));
  }),
  (HUYA.JumpLiveEventReq = function () {
    (this.tId = new HUYA.UserId()),
      (this.lUid = 0),
      (this.lLiveId = 0),
      (this.lTopCid = 0),
      (this.lSubCid = 0),
      (this.sFrom = ""),
      (this.sFromUrl = ""),
      (this.sNick = "");
  }),
  (HUYA.JumpLiveEventReq.prototype._clone = function () {
    return new HUYA.JumpLiveEventReq();
  }),
  (HUYA.JumpLiveEventReq.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.JumpLiveEventReq.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.JumpLiveEventReq.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId),
      t.writeInt64(1, this.lUid),
      t.writeInt64(2, this.lLiveId),
      t.writeInt64(3, this.lTopCid),
      t.writeInt64(4, this.lSubCid),
      t.writeString(5, this.sFrom),
      t.writeString(6, this.sFromUrl),
      t.writeString(7, this.sNick);
  }),
  (HUYA.JumpLiveEventReq.prototype.readFrom = function (t) {
    (this.tId = t.readStruct(0, !1, this.tId)),
      (this.lUid = t.readInt64(1, !1, this.lUid)),
      (this.lLiveId = t.readInt64(2, !1, this.lLiveId)),
      (this.lTopCid = t.readInt64(3, !1, this.lTopCid)),
      (this.lSubCid = t.readInt64(4, !1, this.lSubCid)),
      (this.sFrom = t.readString(5, !1, this.sFrom)),
      (this.sFromUrl = t.readString(6, !1, this.sFromUrl)),
      (this.sNick = t.readString(7, !1, this.sNick));
  }),
  (HUYA.EUnit = {
    EUnit_None: 0,
    EUnit_Seconds: 1,
    EUnit_Microseconds: 2,
    EUnit_Milliseconds: 3,
    EUnit_Bytes: 4,
    EUnit_Kilobytes: 5,
    EUnit_Megabytes: 6,
    EUnit_Gigabytes: 7,
    EUnit_Terabytes: 8,
    EUnit_Bits: 9,
    EUnit_Kilobits: 10,
    EUnit_Megabits: 11,
    EUnit_Gigabits: 12,
    EUnit_Terabits: 13,
    EUnit_Percent: 14,
    EUnit_Count: 15,
    EUnit_BytesPerSecond: 16,
    EUnit_KilobytesPerSecond: 17,
    EUnit_MegabytesPerSecond: 18,
    EUnit_GigabytesPerSecond: 19,
    EUnit_TerabytesPerSecond: 20,
    EUnit_BitsPerSecond: 21,
    EUnit_KilobitsPerSecond: 22,
    EUnit_MegabitsPerSecond: 23,
    EUnit_GigabitsPerSecond: 24,
    EUnit_TerabitsPerSecond: 25,
    EUnit_CountPerSecond: 26,
  }),
  (HUYA.Dimension = function () {
    (this.sName = ""), (this.sValue = "");
  }),
  (HUYA.Dimension.prototype._clone = function () {
    return new HUYA.Dimension();
  }),
  (HUYA.Dimension.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.Dimension.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.Dimension.prototype.writeTo = function (t) {
    t.writeString(0, this.sName), t.writeString(1, this.sValue);
  }),
  (HUYA.Dimension.prototype.readFrom = function (t) {
    (this.sName = t.readString(0, !1, this.sName)),
      (this.sValue = t.readString(1, !1, this.sValue));
  }),
  (HUYA.StatsSet = function () {
    (this.fSum = 0), (this.fMaxValue = 0), (this.fMinValue = 0), (this.lSampleCnt = 0);
  }),
  (HUYA.StatsSet.prototype._clone = function () {
    return new HUYA.StatsSet();
  }),
  (HUYA.StatsSet.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.StatsSet.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.StatsSet.prototype.writeTo = function (t) {
    t.writeDouble(0, this.fSum),
      t.writeDouble(1, this.fMaxValue),
      t.writeDouble(2, this.fMinValue),
      t.writeInt64(3, this.lSampleCnt);
  }),
  (HUYA.StatsSet.prototype.readFrom = function (t) {
    (this.fSum = t.readDouble(0, !1, this.fSum)),
      (this.fMaxValue = t.readDouble(1, !1, this.fMaxValue)),
      (this.fMinValue = t.readDouble(2, !1, this.fMinValue)),
      (this.lSampleCnt = t.readInt64(3, !1, this.lSampleCnt));
  }),
  (HUYA.Metric = function () {
    (this.sMetricName = ""),
      (this.vDimension = new Taf.Vector(new HUYA.Dimension())),
      (this.iTS = 0),
      (this.iSuccess = 0),
      (this.iRetCode = 0),
      (this.fValue = 0),
      (this.eUnit = 0),
      (this.tStatsSet = new HUYA.StatsSet()),
      (this.sExtDesc = "");
  }),
  (HUYA.Metric.prototype._clone = function () {
    return new HUYA.Metric();
  }),
  (HUYA.Metric.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.Metric.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.Metric.prototype.writeTo = function (t) {
    t.writeString(0, this.sMetricName),
      t.writeVector(1, this.vDimension),
      t.writeInt64(2, this.iTS),
      t.writeInt32(3, this.iSuccess),
      t.writeInt32(4, this.iRetCode),
      t.writeDouble(5, this.fValue),
      t.writeInt32(6, this.eUnit),
      t.writeStruct(7, this.tStatsSet),
      t.writeString(8, this.sExtDesc);
  }),
  (HUYA.Metric.prototype.readFrom = function (t) {
    (this.sMetricName = t.readString(0, !0, this.sMetricName)),
      (this.vDimension = t.readVector(1, !1, this.vDimension)),
      (this.iTS = t.readInt64(2, !1, this.iTS)),
      (this.iSuccess = t.readInt32(3, !1, this.iSuccess)),
      (this.iRetCode = t.readInt32(4, !1, this.iRetCode)),
      (this.fValue = t.readDouble(5, !1, this.fValue)),
      (this.eUnit = t.readInt32(6, !1, this.eUnit)),
      (this.tStatsSet = t.readStruct(7, !1, this.tStatsSet)),
      (this.sExtDesc = t.readString(8, !1, this.sExtDesc));
  }),
  (HUYA.MetricSet = function () {
    (this.tId = new HUYA.UserId()), (this.vMetric = new Taf.Vector(new HUYA.Metric()));
  }),
  (HUYA.MetricSet.prototype._clone = function () {
    return new HUYA.MetricSet();
  }),
  (HUYA.MetricSet.prototype._write = function (t, e, i) {
    t.writeStruct(e, i);
  }),
  (HUYA.MetricSet.prototype._read = function (t, e, i) {
    return t.readStruct(e, !0, i);
  }),
  (HUYA.MetricSet.prototype.writeTo = function (t) {
    t.writeStruct(0, this.tId), t.writeVector(1, this.vMetric);
  }),
  (HUYA.MetricSet.prototype.readFrom = function (t) {
    (this.tId = t.readStruct(0, !0, this.tId)), (this.vMetric = t.readVector(1, !0, this.vMetric));
  });
var TafMx = TafMx || {};
(TafMx.UriMapping = {
  1002: HUYA.NobleEnterNotice,
  1003: HUYA.NobleSpeakBrst,
  1005: HUYA.NobleEnterNotice,
  6501: HUYA.SendItemSubBroadcastPacket,
  6052: HUYA.SendItemNoticeWordBroadcastPacket,
  6200: HUYA.EnterPushInfo,
  6210: HUYA.VipBarListRsp,
  6220: HUYA.WeekRankListRsp,
  6221: HUYA.WeekRankEnterBanner,
  6230: HUYA.FansRankListRsp,
  6231: HUYA.BadgeInfo,
  6232: HUYA.BadgeScoreChanged,
  6233: HUYA.FansInfoNotice,
  6234: HUYA.UserGiftNotice,
  6250: HUYA.GiftBarRsp,
  1400: HUYA.MessageNotice,
  8006: HUYA.AttendeeCountNotice,
}),
  (TafMx.WupMapping = {
    doLaunch: HUYA.LiveLaunchRsp,
    speak: HUYA.NobleSpeakResp,
    getPropsList: HUYA.GetPropsListRsp,
    OnUserHeartBeat: HUYA.UserHeartBeatRsp,
    getLivingInfo: HUYA.GetLivingInfoRsp,
  });

class List {
  constructor() {
    this._list = [];
    this._max_count = 100;
    this._max_time = 1000;
  }

  push(name, time) {
    for (let i = 0; i < this._list.length; i++) {
      let item = this._list[i];
      if (item.name == name && time - item.time < this._max_time) {
        return false;
      }
    }
    this._list.push({ name: name, time: time });
    if (this._list.length >= this._max_count) {
      this._list = this._list.splice(1);
    }
    return true;
  }
}

export { Taf, TafMx, HUYA, List };
