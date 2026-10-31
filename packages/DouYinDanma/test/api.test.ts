import { afterEach, describe, expect, it, vi } from "vitest";
import { getCookie } from "../src/api.js";

describe("getCookie", () => {
  afterEach(() => vi.unstubAllGlobals());

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
});
