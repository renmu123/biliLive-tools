export const getCookie = async () => {
  const res = await fetch("https://live.douyin.com/", {
    method: "GET",
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
