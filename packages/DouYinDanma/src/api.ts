export const getCookie = async (signal?: AbortSignal) => {
  const res = await fetch("https://live.douyin.com/", {
    method: "GET",
    signal,
  });

  if (!res.headers.get("set-cookie")) {
    throw new Error("No cookie in response");
  }

  const cookies = (res.headers.get("set-cookie") ?? "")
    .split(", ")
    .map((cookie) => {
      return cookie.split(";")[0];
    })
    .join("; ");

  return cookies;
};
