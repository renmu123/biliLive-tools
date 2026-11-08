let cookieCache: {
  startTimestamp: number;
  cookies: string;
};

export const getCookie = async () => {
  const now = new Date().getTime();
  // 缓存1小时：重连时优先复用，避免每次连接都依赖实时网络抓取，
  // 瞬时网络抖动时不会导致 connect() 失败、重试链断裂
  if (cookieCache?.startTimestamp && now - cookieCache.startTimestamp < 60 * 60 * 1000) {
    return cookieCache.cookies;
  }
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

  if (!cookies.includes("ttwid")) {
    // 新cookie不含ttwid，且缓存中有含ttwid的旧cookie时，延长旧缓存继续复用
    if (cookieCache?.cookies) {
      cookieCache.startTimestamp += 60 * 60 * 1000;
      return cookieCache.cookies;
    }
  }

  cookieCache = {
    startTimestamp: now,
    cookies,
  };
  return cookies;
};
