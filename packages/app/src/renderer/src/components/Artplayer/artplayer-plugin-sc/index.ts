import type Artplayer from "artplayer";
import "./style.less";

export interface SuperChatItem {
  time: number;
  text: string;
  user?: string;
  price?: number;
  avatar?: string;
}

interface SuperChatOptions {
  duration?: number;
  data?: SuperChatItem[];
  visible?: boolean;
}

export function getVisibleSuperChats(
  data: SuperChatItem[],
  live: SuperChatItem[],
  time: number,
  duration: number,
): SuperChatItem[] {
  return [...data.filter((item) => item.time <= time && time < item.time + duration), ...live]
    .slice(-3)
    .reverse();
}

/** 在视频时间轴上显示醒目留言，也支持直播时直接推送。 */
export default function artplayerPluginSC(options: SuperChatOptions = {}) {
  return (art: Artplayer) => {
    const duration = options.duration && options.duration > 0 ? options.duration : 20;
    const container = document.createElement("div");
    container.className = "artplayer-sc";
    container.setAttribute("aria-live", "off");
    art.template.$video.parentElement?.appendChild(container);

    let data: SuperChatItem[] = [];
    let live: { item: SuperChatItem; expires: number }[] = [];
    let displayed: SuperChatItem[] = [];
    let timer: ReturnType<typeof setInterval> | undefined;
    let isVisible = options.visible ?? true;

    const render = () => {
      const time = art.currentTime;
      const now = Date.now();
      live = live.filter((entry) => entry.expires > now);
      if (live.length === 0 && timer) {
        clearInterval(timer);
        timer = undefined;
      }
      // 最新的 SC 在上方，限制数量以免遮住视频。
      const visible = isVisible
        ? getVisibleSuperChats(
            data,
            live.map((entry) => entry.item),
            time,
            duration,
          )
        : [];
      if (
        visible.length === displayed.length &&
        visible.every((item, i) => item === displayed[i])
      ) {
        return;
      }
      displayed = visible;
      container.replaceChildren(
        ...visible.map((item) => {
          const card = document.createElement("div");
          card.className = "artplayer-sc-card";
          const price = Number(item.price) || 0;
          card.dataset.tier =
            price >= 1000 ? "red" : price >= 500 ? "orange" : price >= 100 ? "yellow" : "blue";

          const header = document.createElement("div");
          header.className = "artplayer-sc-header";
          if (item.avatar) {
            const avatar = document.createElement("img");
            avatar.className = "artplayer-sc-avatar";
            avatar.src = item.avatar;
            avatar.alt = "";
            header.appendChild(avatar);
          }
          const user = document.createElement("span");
          user.className = "artplayer-sc-user";
          user.textContent = item.user || "匿名用户";
          const amount = document.createElement("span");
          amount.className = "artplayer-sc-price";
          amount.textContent = `¥${price}`;
          header.append(user, amount);

          const message = document.createElement("div");
          message.className = "artplayer-sc-message";
          message.textContent = item.text;
          card.append(header, message);
          return card;
        }),
      );
    };

    const setData = (items: SuperChatItem[]) => {
      data = items
        .filter((item) => Number.isFinite(item.time) && item.text)
        .sort((a, b) => a.time - b.time);
      displayed = [];
      render();
    };

    const emit = (item: Omit<SuperChatItem, "time">) => {
      live.push({
        item: { ...item, time: art.currentTime },
        expires: Date.now() + duration * 1000,
      });
      if (!timer) timer = setInterval(render, 500);
      render();
    };

    art.on("video:timeupdate", render);
    art.on("video:seeked", render);
    setData(options.data ?? []);

    return {
      name: "artplayerPluginSC",
      setData,
      emit,
      setVisible(visible: boolean) {
        isVisible = visible;
        render();
      },
      destroy() {
        art.off("video:timeupdate", render);
        art.off("video:seeked", render);
        if (timer) clearInterval(timer);
        container.remove();
      },
    };
  };
}
