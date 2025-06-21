import log from "./log";

/**
 * 记录系统信息
 */
export const logSystemInfo = () => {
  log.info("=== 系统信息 ===");
  log.info("应用版本:", process.env.npm_package_version || "unknown");
  log.info("Node版本:", process.version);
  log.info("平台:", process.platform);
  log.info("架构:", process.arch);
  log.info("内存使用:", {
    rss: process.memoryUsage().rss,
    heapTotal: process.memoryUsage().heapTotal,
    heapUsed: process.memoryUsage().heapUsed,
    external: process.memoryUsage().external,
  });
  log.info("CPU使用:", process.cpuUsage());
  log.info("启动时间:", new Date().toISOString());
  log.info("=== 系统信息结束 ===");
};

/**
 * 记录未捕获异常
 */
export const logUncaughtException = (error: Error) => {
  log.error("=== 未捕获异常 (Uncaught Exception) ===");
  log.error("错误信息:", error.message);
  log.error("错误堆栈:", error.stack);
  log.error("错误名称:", error.name);
  log.error("错误代码:", (error as any).code);
  log.error("错误信号:", (error as any).signal);
  log.error("进程ID:", process.pid);
  log.error("时间戳:", new Date().toISOString());
  log.error("=== 未捕获异常结束 ===");
};

/**
 * 记录未处理的Promise拒绝
 */
export const logUnhandledRejection = (reason: any, promise: Promise<any>) => {
  log.error("=== 未处理的Promise拒绝 (Unhandled Rejection) ===");
  log.error("拒绝原因:", reason);
  log.error("Promise对象:", promise);
  log.error("进程ID:", process.pid);
  log.error("时间戳:", new Date().toISOString());

  if (reason instanceof Error) {
    log.error("错误名称:", reason.name);
    log.error("错误消息:", reason.message);
    log.error("错误堆栈:", reason.stack);
  }
  log.error("=== 未处理的Promise拒绝结束 ===");
};

/**
 * 记录进程警告
 */
export const logProcessWarning = (warning: Error) => {
  log.warn("=== 进程警告 (Process Warning) ===");
  log.warn("警告名称:", warning.name);
  log.warn("警告消息:", warning.message);
  log.warn("警告堆栈:", warning.stack);
  log.warn("警告代码:", (warning as any).code);
  log.warn("时间戳:", new Date().toISOString());
  log.warn("=== 进程警告结束 ===");
};

/**
 * 记录进程退出
 */
export const logProcessExit = (code: number) => {
  log.info("=== 进程退出 (Process Exit) ===");
  log.info("退出代码:", code);
  log.info("退出时间:", new Date().toISOString());
  log.info("=== 进程退出结束 ===");
};

/**
 * 记录信号处理
 */
export const logSignal = (signal: string) => {
  log.info(`=== 收到${signal}信号 ===`);
  log.info("时间:", new Date().toISOString());
  log.info("进程ID:", process.pid);
  log.info(`=== ${signal}信号处理结束 ===`);
};

/**
 * 记录渲染进程崩溃
 */
export const logRendererCrashed = (killed: boolean, processId: number) => {
  log.error("=== 渲染进程崩溃 (Renderer Process Crashed) ===");
  log.error("是否被杀死:", killed);
  log.error("崩溃时间:", new Date().toISOString());
  log.error("进程ID:", processId);
  log.error("=== 渲染进程崩溃结束 ===");
};

/**
 * 记录渲染进程无响应
 */
export const logRendererUnresponsive = (processId: number) => {
  log.error("=== 渲染进程无响应 (Renderer Process Unresponsive) ===");
  log.error("无响应时间:", new Date().toISOString());
  log.error("进程ID:", processId);
  log.error("=== 渲染进程无响应结束 ===");
};

/**
 * 记录渲染进程恢复响应
 */
export const logRendererResponsive = (processId: number) => {
  log.info("=== 渲染进程恢复响应 (Renderer Process Responsive) ===");
  log.info("恢复时间:", new Date().toISOString());
  log.info("进程ID:", processId);
  log.info("=== 渲染进程恢复响应结束 ===");
};

/**
 * 记录页面加载失败
 */
export const logPageLoadFailed = (
  errorCode: number,
  errorDescription: string,
  validatedURL: string,
  isMainFrame: boolean,
) => {
  log.error("=== 页面加载失败 (Page Load Failed) ===");
  log.error("错误代码:", errorCode);
  log.error("错误描述:", errorDescription);
  log.error("验证URL:", validatedURL);
  log.error("是否主框架:", isMainFrame);
  log.error("失败时间:", new Date().toISOString());
  log.error("=== 页面加载失败结束 ===");
};

/**
 * 记录临时页面加载失败
 */
export const logProvisionalLoadFailed = (
  errorCode: number,
  errorDescription: string,
  validatedURL: string,
  isMainFrame: boolean,
) => {
  log.error("=== 临时页面加载失败 (Provisional Load Failed) ===");
  log.error("错误代码:", errorCode);
  log.error("错误描述:", errorDescription);
  log.error("验证URL:", validatedURL);
  log.error("是否主框架:", isMainFrame);
  log.error("失败时间:", new Date().toISOString());
  log.error("=== 临时页面加载失败结束 ===");
};

/**
 * 记录渲染进程控制台消息
 */
export const logConsoleMessage = (
  level: number,
  message: string,
  line: number,
  sourceId: string,
) => {
  if (level >= 2) {
    // 只记录警告和错误级别的控制台消息
    log.warn("=== 渲染进程控制台消息 ===");
    log.warn("级别:", level);
    log.warn("消息:", message);
    log.warn("行号:", line);
    log.warn("源ID:", sourceId);
    log.warn("时间:", new Date().toISOString());
    log.warn("=== 渲染进程控制台消息结束 ===");
  }
};

/**
 * 记录应用启动信息
 */
export const logAppStartup = (app: any) => {
  log.info("=== 应用启动信息 ===");
  log.info("应用版本:", app.getVersion());
  log.info("Electron版本:", process.versions.electron);
  log.info("Node版本:", process.versions.node);
  log.info("Chrome版本:", process.versions.chrome);
  log.info("V8版本:", process.versions.v8);
  log.info("操作系统:", process.platform);
  log.info("架构:", process.arch);
  log.info("启动时间:", new Date().toISOString());
  log.info("用户数据路径:", app.getPath("userData"));
  log.info("临时文件路径:", app.getPath("temp"));
  log.info("日志路径:", app.getPath("logs"));
  log.info("=== 应用启动信息结束 ===");
};
