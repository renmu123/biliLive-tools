import dayjs from "dayjs";
import type Artplayer from "artplayer";

export interface TimestampPluginOptions {
  /** 时间戳(毫秒) */
  timestamp: number;
  /** 显示位置 */
  position?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  /** 自定义样式 */
  style?: Partial<CSSStyleDeclaration>;
  /** 自定义类名 */
  className?: string;
  /** 时间格式化函数 */
  formatter?: (seconds: number) => string;
  /** 是否显示 */
  visible?: boolean;
}

/**
 * 格式化秒数为yyyy-mm-dd hh:mm:ss格式
 */
function formatTime(seconds: number): string {
  return dayjs(seconds).format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Artplayer 时间戳显示插件
 * 根据播放进度显示对应的时间戳
 */
export default function artplayerTimestamp(options: TimestampPluginOptions) {
  return (art: Artplayer) => {
    const {
      timestamp,
      position = { top: "10px", left: "10px" },
      style = {},
      className = "",
      formatter = formatTime,
      visible = true,
    } = options;

    // 创建时间戳显示元素
    const timestampElement = document.createElement("div");
    timestampElement.className = `artplayer-timestamp ${className}`.trim();

    let displayState = visible ? "block" : "none";
    if (!timestamp) {
      displayState = "none";
    }
    // 设置默认样式
    Object.assign(timestampElement.style, {
      position: "absolute",
      color: "#fff",
      fontSize: "14px",
      padding: "4px 6px",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      borderRadius: "4px",
      pointerEvents: "none",
      zIndex: "20",
      fontFamily: "monospace",
      display: displayState,
      ...position,
      ...style,
    });

    // 更新时间戳显示
    const updateTimestamp = () => {
      const currentTime = art.currentTime;
      const displayTime = options.timestamp + currentTime * 1000;
      timestampElement.textContent = formatter(displayTime);
    };

    // 初始化显示
    updateTimestamp();

    // 添加到播放器
    art.template.$video.parentElement?.appendChild(timestampElement);

    // 监听时间更新
    art.on("video:timeupdate", updateTimestamp);

    // 监听播放状态
    art.on("video:play", updateTimestamp);
    art.on("video:seeked", updateTimestamp);

    // 清理函数
    return {
      name: "artplayerTimestamp",
      destroy() {
        art.off("video:timeupdate", updateTimestamp);
        art.off("video:play", updateTimestamp);
        art.off("video:seeked", updateTimestamp);
        timestampElement.remove();
      },
      update(newOptions: Partial<TimestampPluginOptions>) {
        if (newOptions.timestamp !== undefined) {
          options.timestamp = newOptions.timestamp;
        }
        if (newOptions.position) {
          Object.assign(timestampElement.style, newOptions.position);
        }
        if (newOptions.style) {
          Object.assign(timestampElement.style, newOptions.style);
        }
        if (newOptions.className) {
          timestampElement.className = `artplayer-timestamp ${newOptions.className}`.trim();
        }
        if (newOptions.visible !== undefined) {
          let displayState = newOptions.visible ? "block" : "none";
          if (!newOptions.timestamp) {
            displayState = "none";
          }
          timestampElement.style.display = displayState;
        }
        updateTimestamp();
      },
      show() {
        let displayState = "block";
        if (!options.timestamp) {
          displayState = "none";
        }

        timestampElement.style.display = displayState;
      },
      hide() {
        timestampElement.style.display = "none";
      },
      setTimestamp(newTimestamp: number) {
        options.timestamp = newTimestamp;
        updateTimestamp();
      },
    };
  };
}
