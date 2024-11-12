export class BufferCoder {
  buffer = new ArrayBuffer(0);
  decoder = new TextDecoder();
  encoder = new TextEncoder();
  littleEndian = true;
  readLength = 0;

  concat(...buffers: ArrayBuffer[]): Uint8Array {
    // @ts-ignore
    return buffers.reduce(function (result: Uint8Array, buffer) {
      const bufferView = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

      const newResult = new Uint8Array(result.length + bufferView.length);
      newResult.set(result, 0);
      newResult.set(bufferView, result.length);
      return newResult;
    }, new Uint8Array(0));
  }

  decode(newBuffer: ArrayBuffer, callback: (message: string) => void, littleEndian?: boolean) {
    if (littleEndian == null) {
      littleEndian = this.littleEndian;
    }
    this.buffer = this.concat(this.buffer, newBuffer).buffer;

    while (this.buffer && this.buffer.byteLength > 0) {
      if (this.readLength === 0) {
        if (this.buffer.byteLength < 4) return;

        this.readLength = new DataView(this.buffer).getUint32(0, littleEndian);
        this.buffer = this.buffer.slice(4);
      }

      if (this.buffer.byteLength < this.readLength) return;

      const message = this.decoder.decode(this.buffer.slice(8, this.readLength - 1));
      this.buffer = this.buffer.slice(this.readLength);
      this.readLength = 0;
      callback(message);
    }
  }

  encode(msg: string, littleEndian?: boolean) {
    if (littleEndian == null) {
      littleEndian = this.littleEndian;
    }

    const out = this.concat(this.encoder.encode(msg), Uint8Array.of(0));
    const formatBodySize = 8 + out.length;
    const dv = new DataView(new ArrayBuffer(formatBodySize + 4));
    let offset = 0;
    dv.setUint32(offset, formatBodySize, littleEndian);
    offset = offset + 4;
    dv.setUint32(offset, formatBodySize, littleEndian);
    offset = offset + 4;
    dv.setInt16(offset, 689, littleEndian);
    offset = offset + 2;
    dv.setInt8(offset, 0);
    offset = offset + 1;
    dv.setInt8(offset, 0);
    offset = offset + 1;
    new Uint8Array(dv.buffer).set(out, offset);

    return dv.buffer;
  }
}
