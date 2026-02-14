/**
 * 错误处理体系
 */

export class StreamGetError extends Error {
  constructor(
    message: string,
    public platform?: string,
    public code?: string,
  ) {
    super(message);
    this.name = "StreamGetError";
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class UnsupportedPlatformError extends StreamGetError {
  constructor(urlOrPlatform: string) {
    super(`不支持的平台: ${urlOrPlatform}`, undefined, "UNSUPPORTED_PLATFORM");
    this.name = "UnsupportedPlatformError";
  }
}

export class RoomNotFoundError extends StreamGetError {
  constructor(roomId: string, platform?: string) {
    super(`房间不存在: ${roomId}`, platform, "ROOM_NOT_FOUND");
    this.name = "RoomNotFoundError";
  }
}

export class NotLivingError extends StreamGetError {
  constructor(roomId: string, platform?: string) {
    super(`直播间未开播: ${roomId}`, platform, "NOT_LIVING");
    this.name = "NotLivingError";
  }
}

export class NetworkError extends StreamGetError {
  constructor(message: string, platform?: string) {
    super(`网络错误: ${message}`, platform, "NETWORK_ERROR");
    this.name = "NetworkError";
  }
}

export class ParseError extends StreamGetError {
  constructor(message: string, platform?: string) {
    super(`解析错误: ${message}`, platform, "PARSE_ERROR");
    this.name = "ParseError";
  }
}
