export namespace STT {
  export function escape(v: string): string {
    return v.toString().replace(/@/g, "@A").replace(/\//g, "@S");
  }

  export function unescape(v: string): string {
    return v.toString().replace(/@S/g, "/").replace(/@A/g, "@");
  }

  export function serialize(obj: unknown): string {
    if (obj == null) throw new Error("Cant serialize null value");

    if (Array.isArray(obj)) {
      return obj.map((v) => STT.serialize(v)).join("");
    }

    if (typeof obj === "object") {
      return Object.entries(obj)
        .map(([k, v]) => `${k}@=${STT.serialize(v)}`)
        .join("");
    }

    return STT.escape(obj.toString()) + "/";
  }

  export function deserialize(raw: string): unknown {
    if (raw.includes("//")) {
      return raw
        .split("//")
        .filter((e) => e !== "")
        .map((item) => STT.deserialize(item));
    }

    if (raw.includes("@=")) {
      return raw
        .split("/")
        .filter((part) => part !== "")
        .reduce(
          (obj, part) => {
            const [key, val] = part.split("@=");
            obj[key] = val ? STT.deserialize(val) : "";
            return obj;
          },
          {} as Record<string, unknown>,
        );
    }

    return STT.unescape(raw);
  }
}
