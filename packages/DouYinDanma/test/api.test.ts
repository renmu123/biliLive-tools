import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let getCookie: typeof import("../src/api.js").getCookie;

describe("getCookie", () => {
  beforeEach(async () => {
    vi.resetModules();
    ({ getCookie } = await import("../src/api.js"));
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("forwards the connection AbortSignal to fetch", async () => {
    const controller = new AbortController();
    const fetch = vi.fn().mockResolvedValue({
      headers: new Headers({ "set-cookie": "ttwid=test; Path=/" }),
    });
    vi.stubGlobal("fetch", fetch);
    await expect(getCookie(controller.signal)).resolves.toBe("ttwid=test");
    expect(fetch).toHaveBeenCalledExactlyOnceWith("https://live.douyin.com/", {
      method: "GET",
      signal: controller.signal,
    });
  });

  it("preserves calls without an AbortSignal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        headers: new Headers({ "set-cookie": "ttwid=test; Path=/" }),
      }),
    );
    await expect(getCookie()).resolves.toBe("ttwid=test");
  });

  it("reports a response without Cookie", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ headers: new Headers() }));
    await expect(getCookie()).rejects.toThrow("No cookie in response");
  });

  it("reuses cached Cookie without another fetch during the first hour", async () => {
    const fetch = vi.fn().mockResolvedValue({
      headers: new Headers({ "set-cookie": "ttwid=cached; Path=/" }),
    });
    vi.stubGlobal("fetch", fetch);
    await expect(getCookie()).resolves.toBe("ttwid=cached");
    vi.advanceTimersByTime(60 * 60 * 1000 - 1);
    await expect(getCookie(new AbortController().signal)).resolves.toBe("ttwid=cached");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("refreshes expired Cookie with the current connection AbortSignal", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ headers: new Headers({ "set-cookie": "ttwid=old; Path=/" }) })
      .mockResolvedValueOnce({ headers: new Headers({ "set-cookie": "ttwid=new; Path=/" }) });
    vi.stubGlobal("fetch", fetch);
    await getCookie();
    vi.advanceTimersByTime(60 * 60 * 1000);
    const controller = new AbortController();
    await expect(getCookie(controller.signal)).resolves.toBe("ttwid=new");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith("https://live.douyin.com/", {
      method: "GET",
      signal: controller.signal,
    });
  });

  it("extends cached Cookie when the refresh response lacks ttwid", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ headers: new Headers({ "set-cookie": "ttwid=cached; Path=/" }) })
      .mockResolvedValueOnce({ headers: new Headers({ "set-cookie": "other=value; Path=/" }) });
    vi.stubGlobal("fetch", fetch);
    await getCookie();
    vi.advanceTimersByTime(60 * 60 * 1000);
    await expect(getCookie()).resolves.toBe("ttwid=cached");
    await expect(getCookie()).resolves.toBe("ttwid=cached");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("aborts an expired Cookie refresh and allows the next connection to retry", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ headers: new Headers({ "set-cookie": "ttwid=old; Path=/" }) })
      .mockImplementationOnce((_url, { signal }: RequestInit) => {
        return new Promise((_resolve, reject) => {
          signal!.addEventListener("abort", () => reject(signal!.reason), { once: true });
        });
      })
      .mockResolvedValueOnce({ headers: new Headers({ "set-cookie": "ttwid=new; Path=/" }) });
    vi.stubGlobal("fetch", fetch);
    await getCookie();
    vi.advanceTimersByTime(60 * 60 * 1000);
    const controller = new AbortController();
    const refreshing = getCookie(controller.signal);
    const rejected = expect(refreshing).rejects.toThrow("cancel refresh");
    controller.abort(new Error("cancel refresh"));
    await rejected;
    await expect(getCookie()).resolves.toBe("ttwid=new");
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
