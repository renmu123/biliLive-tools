<template>
  <div class="monitor-room">
    <header v-if="toolbarVisible" class="monitor-room__toolbar">
      <div class="monitor-room__title">
        <h1>监控室</h1>
        <span>3 × 3 · 已使用 {{ occupiedCells }} / 9 格</span>
      </div>
      <n-button
        type="primary"
        :disabled="!layoutLoaded"
        title="按 Ctrl+M 可隐藏顶部栏"
        @click="roomPickerVisible = true"
      >
        管理
      </n-button>
    </header>

    <div v-if="loadError || saveError" class="monitor-room__load-error">
      {{ loadError || saveError }}
      <n-button text type="primary" @click="retryError">重试</n-button>
    </div>

    <div class="monitor-room__board" aria-label="监控室九宫格">
      <div
        v-for="cell in 9"
        :key="`cell-${cell}`"
        class="monitor-room__cell"
        :style="cellStyle(cell)"
        aria-hidden="true"
      ></div>
      <article
        v-for="placement in placements"
        :key="placement.id"
        class="monitor-room__tile"
        :style="placementStyle(placement)"
        :aria-label="roomNameById(placement.id)"
        @pointerenter="hoveredRoomId = placement.id"
        @pointerleave="clearHoveredRoom(placement.id)"
      >
        <Artplayer
          v-if="roomStates[placement.id]?.status === 'playing' && roomStates[placement.id]?.url"
          :key="`${placement.id}:${roomStates[placement.id].requestId}`"
          :option="{
            url: roomStates[placement.id].url,
            fullscreen: true,
            muted: roomAudioFor(placement.id).muted,
            volume: roomAudioFor(placement.id).volume,
            mutex: false,
          }"
          :plugins="['danmuku', 'sc']"
          is-live
          @ready="registerPlayer(placement.id, $event)"
          @error="handlePlaybackError(placement.id)"
        />
        <div v-else class="monitor-room__placeholder">
          <n-spin v-if="roomStates[placement.id]?.status === 'loading'" size="small" />
          <span>{{ roomMessage(placement.id) }}</span>
        </div>
      </article>
    </div>

    <n-drawer v-model:show="roomPickerVisible" :width="460" placement="right">
      <n-drawer-content title="管理" closable>
        <div v-if="!isWeb" class="monitor-room__window-setting">
          <div class="monitor-room__window-setting-label">
            <strong>隐藏窗口标题栏</strong>
            <span>隐藏最小化等窗口按钮；重新打开监控室后生效。</span>
          </div>
          <n-switch
            :value="hideTitleBar"
            :disabled="!layoutLoaded"
            @update:value="setHideTitleBar"
          />
        </div>
        <div v-if="!isWeb" class="monitor-room__window-actions">
          <n-button
            size="small"
            type="error"
            tertiary
            :loading="closingRoom"
            title="快捷键：Ctrl+W"
            aria-keyshortcuts="Control+W"
            @click="closeMonitorRoom"
          >
            关闭监控室窗口
          </n-button>
        </div>
        <n-divider v-if="!isWeb" />
        <div class="monitor-room__section-heading">
          <h2>已添加</h2>
          <span>{{ occupiedCells }} / 9 格</span>
        </div>
        <p class="monitor-room__hint">
          每个房间默认占 1 × 1 格，上下箭头可调整九宫格顺序。鼠标悬浮在画面上时按 M 可开声或静音，按
          Ctrl+M 可显示或隐藏右上角顶部栏。弹幕可使用播放器内的开关控制。
        </p>
        <div
          v-for="(room, index) in selectedRooms"
          :key="room.id"
          class="monitor-room__managed-room"
        >
          <div class="monitor-room__managed-room-heading">
            <div class="monitor-room__room-label">
              <strong :title="roomName(room)">{{ roomName(room) }}</strong>
              <span>{{ platformName(room.providerId) }} · {{ room.channelId }}</span>
            </div>
            <div class="monitor-room__order-controls">
              <n-button
                quaternary
                circle
                size="small"
                title="上移"
                aria-label="上移房间"
                :disabled="index === 0"
                @click="moveRoom(room.id, -1)"
              >
                <template #icon
                  ><n-icon><ArrowUpOutline /></n-icon
                ></template>
              </n-button>
              <n-button
                quaternary
                circle
                size="small"
                title="下移"
                aria-label="下移房间"
                :disabled="index === selectedRooms.length - 1"
                @click="moveRoom(room.id, 1)"
              >
                <template #icon
                  ><n-icon><ArrowDownOutline /></n-icon
                ></template>
              </n-button>
            </div>
          </div>
          <div class="monitor-room__controls">
            <n-select
              :value="roomSize(room.id)"
              :options="sizeOptionsFor(room.id)"
              size="small"
              class="monitor-room__size-select"
              @update:value="setRoomSize(room.id, $event)"
            />
            <n-button
              size="small"
              :loading="roomStates[room.id]?.status === 'loading'"
              @click="refreshRoom(room.id)"
            >
              刷新
            </n-button>
            <n-button
              size="small"
              :disabled="roomStates[room.id]?.status !== 'playing'"
              @click="toggleSound(room.id)"
            >
              {{ roomAudioFor(room.id).muted ? "开声" : "静音" }}
            </n-button>
            <n-button size="small" type="error" tertiary @click="removeRoom(room.id)">
              移除
            </n-button>
          </div>
        </div>
        <n-empty v-if="!selectedRooms.length" description="尚未添加直播间" />

        <n-divider />
        <div class="monitor-room__section-heading">
          <h2>添加房间</h2>
          <n-button v-if="!loadingRooms" text type="primary" @click="loadRooms(false)">
            刷新列表
          </n-button>
        </div>
        <n-input v-model:value="searchText" placeholder="搜索备注、主播或房间号" clearable />
        <n-spin :show="loadingRooms">
          <div class="monitor-room__picker-list">
            <div v-for="room in availableRooms" :key="room.id" class="monitor-room__picker-item">
              <div class="monitor-room__room-label">
                <strong :title="roomName(room)">{{ roomName(room) }}</strong>
                <span>{{ platformName(room.providerId) }} · {{ room.channelId }}</span>
              </div>
              <n-button size="small" :disabled="!canAddRoom(room.id)" @click="addRoom(room.id)">
                添加
              </n-button>
            </div>
            <n-empty
              v-if="!loadingRooms && !availableRooms.length"
              description="没有可添加的直播间"
            />
          </div>
        </n-spin>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import Artplayer from "@renderer/components/Artplayer/Index.vue";
import { createMonitorDanmaSocket } from "./danmaSocket";
import { recoderApi } from "@renderer/apis";
import { getMonitorRoomLayout, saveMonitorRoomLayout } from "@renderer/apis/monitorRoom";
import { platformOptions } from "../Tools/pages/Recorder/data";
import { getGridSize, GRID_SIZES, packGrid } from "./grid";
import { normalizeRoomAudio } from "./audio";
import { ArrowUpOutline, ArrowDownOutline } from "@vicons/ionicons5";
import { useMessage } from "naive-ui";

import type ArtplayerType from "artplayer";
import type { Result as DanmukuResult } from "@renderer/components/Artplayer/artplayer-plugin-danmuku";
import type { RecorderAPI } from "@biliLive-tools/http/types/recorder.js";
import type { MonitorRoomLayout } from "@biliLive-tools/http/types/monitorRoom.js";
import type { GridPlacement, GridSize } from "./grid";
import type { RoomAudio } from "./audio";

defineOptions({ name: "MonitorRoom" });

const message = useMessage();
const isWeb = window.isWeb;

type Room = RecorderAPI["getRecorders"]["Resp"]["data"][number];
type RoomState = {
  status: "loading" | "offline" | "playing" | "error";
  requestId: number;
  url?: string;
  message?: string;
};
const selectedIds = ref<string[]>([]);
const roomSizes = ref<Record<string, GridSize>>({});
const roomAudio = ref<Record<string, RoomAudio>>({});
const toolbarVisible = ref(true);
const rooms = ref<Room[]>([]);
const roomStates = reactive<Record<string, RoomState>>({});
const danmakuVisible = reactive<Record<string, boolean>>({});
const danmakuFailed = reactive<Record<string, boolean>>({});
const danmakuFatal = ref(false);
const requestIds = new Map<string, number>();
const players = new Map<string, ArtplayerType>();
const danmakuCounts = new WeakMap<ArtplayerType, number>();
const lastDanmakuAt = new WeakMap<ArtplayerType, number>();
const hoveredRoomId = ref<string | null>(null);
const roomPickerVisible = ref(false);
const layoutLoaded = ref(false);
const initializing = ref(false);
const loadingRooms = ref(false);
const loadError = ref("");
const saveError = ref("");
const searchText = ref("");
const hideTitleBar = ref(false);
const closingRoom = ref(false);

const setHideTitleBar = async (value: boolean) => {
  if (isWeb || !layoutLoaded.value || hideTitleBar.value === value) return;
  hideTitleBar.value = value;
  await persistLayout();
  if (!saveError.value) message.info("已保存，重新打开监控室窗口后生效", { duration: 3000 });
};

const closeMonitorRoom = async () => {
  if (closingRoom.value) return;
  closingRoom.value = true;
  try {
    if (volumeSaveTimer) await persistLayout();
    else await saveQueue;
    window.close();
  } finally {
    closingRoom.value = false;
  }
};

const roomsById = computed(() => new Map(rooms.value.map((room) => [room.id, room])));
const selectedRooms = computed(() =>
  selectedIds.value.map((id) => roomsById.value.get(id)).filter((room): room is Room => !!room),
);
const placements = computed(
  () =>
    packGrid(
      selectedRooms.value.map((room) => room.id),
      roomSizes.value,
    ) || [],
);
const occupiedCells = computed(() =>
  placements.value.reduce((total, placement) => total + placement.width * placement.height, 0),
);
const availableRooms = computed(() => {
  const query = searchText.value.trim().toLowerCase();
  return rooms.value.filter(
    (room) =>
      !selectedIds.value.includes(room.id) &&
      (!query ||
        [room.remarks, room.liveInfo?.owner, room.channelId].some((value) =>
          value?.toLowerCase().includes(query),
        )),
  );
});
const activeDanmakuIds = computed(() =>
  selectedIds.value.filter(
    (id) =>
      !danmakuFatal.value &&
      !danmakuFailed[id] &&
      roomStates[id]?.status === "playing" &&
      danmakuVisible[id] === true,
  ),
);

const roomName = (room: Room) => room.remarks || room.liveInfo?.owner || room.channelId;
const roomNameById = (id: string) => {
  const room = roomsById.value.get(id);
  return room ? roomName(room) : id;
};
const platformName = (providerId: string) =>
  platformOptions.find((option) => option.value === providerId)?.label || providerId;

const cellStyle = (cell: number) => ({
  gridColumn: String(((cell - 1) % 3) + 1),
  gridRow: String(Math.floor((cell - 1) / 3) + 1),
});
const placementStyle = (placement: GridPlacement) => ({
  gridColumn: `${placement.column} / span ${placement.width}`,
  gridRow: `${placement.row} / span ${placement.height}`,
});
const roomSize = (id: string) => getGridSize(roomSizes.value[id]);
const roomAudioFor = (id: string) => normalizeRoomAudio(roomAudio.value[id]);
const currentLayout = (): MonitorRoomLayout => ({
  manageButtonVisible: toolbarVisible.value,
  hideTitleBar: hideTitleBar.value,
  rooms: selectedIds.value.map((id) => ({ id, size: roomSize(id), ...roomAudioFor(id) })),
});
let saveQueue: Promise<void> = Promise.resolve();
let volumeSaveTimer: ReturnType<typeof setTimeout> | undefined;
const persistLayout = (): Promise<void> => {
  if (!layoutLoaded.value) return Promise.resolve();
  if (volumeSaveTimer) {
    clearTimeout(volumeSaveTimer);
    volumeSaveTimer = undefined;
  }
  const layout = currentLayout();
  saveQueue = saveQueue.then(async () => {
    try {
      await saveMonitorRoomLayout(layout);
      saveError.value = "";
    } catch (error) {
      saveError.value = `保存监控室配置失败：${String(error)}`;
    }
  });
  return saveQueue;
};
const scheduleVolumeSave = () => {
  if (volumeSaveTimer) clearTimeout(volumeSaveTimer);
  volumeSaveTimer = setTimeout(() => {
    volumeSaveTimer = undefined;
    void persistLayout();
  }, 250);
};
const sizeOptionsFor = (id: string) =>
  GRID_SIZES.map((size) => ({
    label: size.replace("x", " × "),
    value: size,
    disabled: !packGrid(selectedIds.value, { ...roomSizes.value, [id]: size }),
  }));
const setRoomSize = (id: string, value: string) => {
  if (!selectedIds.value.includes(id)) return;
  const size = getGridSize(value);
  const nextSizes = { ...roomSizes.value, [id]: size };
  if (!packGrid(selectedIds.value, nextSizes)) return;
  roomSizes.value = nextSizes;
  void persistLayout();
};
const canAddRoom = (id: string) =>
  packGrid([...selectedIds.value, id], { ...roomSizes.value, [id]: "1x1" }) !== null;

const roomMessage = (id: string) => {
  const state = roomStates[id];
  if (state?.status === "loading") return "正在检查直播状态…";
  if (state?.status === "offline") return "直播间未开播，请在房间管理中刷新";
  if (state?.status === "error") return state.message || "播放失败，请在房间管理中刷新";
  return "请在房间管理中刷新";
};

const registerPlayer = (id: string, player: ArtplayerType) => {
  players.set(id, player);
  delete danmakuFailed[id];
  const danmakuPlugin = (player as DanmakuPlayer).artplayerPluginDanmuku;
  danmakuVisible[id] = danmakuPlugin?.option.visible === true;
  const updateDanmakuVisibility = () => {
    if (players.get(id) !== player) return;
    const wasVisible = danmakuVisible[id] === true;
    danmakuVisible[id] = danmakuPlugin?.option.visible === true;
    if (!wasVisible && danmakuVisible[id]) delete danmakuFailed[id];
  };
  player.on("artplayerPluginDanmuku:show", updateDanmakuVisibility);
  player.on("artplayerPluginDanmuku:hide", updateDanmakuVisibility);
  player.on("artplayerPluginDanmuku:config", updateDanmakuVisibility);
  const savedAudio = roomAudioFor(id);
  player.volume = savedAudio.volume;
  player.muted = savedAudio.muted;
  player.on("video:volumechange", () => {
    if (players.get(id) !== player || !selectedIds.value.includes(id)) return;
    const previous = roomAudioFor(id);
    const next = normalizeRoomAudio({ muted: player.muted, volume: player.volume });
    if (previous.muted === next.muted && previous.volume === next.volume) return;
    roomAudio.value = { ...roomAudio.value, [id]: next };
    if (previous.muted !== next.muted) void persistLayout();
    else scheduleVolumeSave();
  });
};

const toggleSound = (id: string) => {
  const player = players.get(id);
  if (!player) return;
  const audio = roomAudioFor(id);
  roomAudio.value = { ...roomAudio.value, [id]: { ...audio, muted: !audio.muted } };
  player.muted = !audio.muted;
  void persistLayout();
};

type DanmakuPlayer = ArtplayerType & {
  artplayerPluginDanmuku?: DanmukuResult;
  artplayerPluginSC?: {
    emit: (value: { text: string; user?: string; price?: number; avatar?: string }) => void;
  };
};

const danmaSocket = createMonitorDanmaSocket({
  onMessage(id, data) {
    if (danmakuFatal.value || danmakuFailed[id] || roomStates[id]?.status !== "playing") return;
    const player = players.get(id) as DanmakuPlayer | undefined;
    if (!player || player.isDestroy) return;

    if (data.type === "super_chat") {
      if (typeof data.text !== "string") return;
      const sender = data.sender as { name?: string; avatar?: string } | undefined;
      player.artplayerPluginSC?.emit({
        text: data.text,
        user: sender?.name,
        price: typeof data.price === "number" ? data.price : undefined,
        avatar: sender?.avatar,
      });
      return;
    }
    if (data.type !== "comment" || typeof data.text !== "string") return;
    const text = data.text.trim();
    if (!text) return;
    const plugin = player.artplayerPluginDanmuku;
    if (!plugin?.option.visible) return;

    const now = Date.now();
    if (now - (lastDanmakuAt.get(player) || 0) < 250) return;
    lastDanmakuAt.set(player, now);

    const count = danmakuCounts.get(player) || 0;
    if (count >= 200) {
      danmakuCounts.set(player, 0);
      void plugin.load().catch(() => {});
    }
    danmakuCounts.set(player, (danmakuCounts.get(player) || 0) + 1);
    plugin.emit({
      text: text.slice(0, 200),
      mode: data.mode === 4 ? 2 : data.mode === 5 ? 1 : 0,
      color: typeof data.color === "string" ? data.color : "#fff",
      border: false,
    });
  },
  onRoomError(id, error) {
    message.error(`${roomNameById(id)}：${error}。可关闭并重新开启播放器弹幕重试`);
    danmakuFailed[id] = true;
  },
  onFatal(error) {
    message.error(error);
    danmakuFatal.value = true;
  },
});

watch(activeDanmakuIds, (ids) => danmaSocket.setRooms(ids), { flush: "post" });

const clearHoveredRoom = (id: string) => {
  if (hoveredRoomId.value === id) hoveredRoomId.value = null;
};

const toggleToolbar = () => {
  if (!layoutLoaded.value) return;
  toolbarVisible.value = !toolbarVisible.value;
  void persistLayout();
};

const handleToolbarHotkey = (event: KeyboardEvent) => {
  if (
    event.key.toLowerCase() !== "m" ||
    !event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.shiftKey ||
    event.repeat ||
    event.isComposing ||
    !layoutLoaded.value
  ) {
    return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  toggleToolbar();
};

const handleMuteHotkey = (event: KeyboardEvent) => {
  if (
    event.key.toLowerCase() !== "m" ||
    event.repeat ||
    event.isComposing ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    roomPickerVisible.value
  ) {
    return;
  }
  if (
    event.target instanceof HTMLElement &&
    event.target.closest("input, textarea, [contenteditable], [role='textbox']")
  ) {
    return;
  }
  const id = hoveredRoomId.value;
  if (!id || roomStates[id]?.status !== "playing" || !players.has(id)) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  toggleSound(id);
};

const refreshRoom = async (id: string) => {
  if (!selectedIds.value.includes(id)) return;
  const requestId = (requestIds.get(id) || 0) + 1;
  requestIds.set(id, requestId);
  players.delete(id);
  delete danmakuVisible[id];
  roomStates[id] = { status: "loading", requestId };

  const isCurrent = () => requestIds.get(id) === requestId && selectedIds.value.includes(id);
  try {
    const liveInfos = await recoderApi.getLiveInfo([id], true);
    if (!isCurrent()) return;
    const liveInfo = liveInfos[0];
    if (liveInfo?.living === false) {
      roomStates[id] = { status: "offline", requestId };
      return;
    }

    const stream = await recoderApi.getStreamUrl(id);
    if (!isCurrent()) return;
    if (!stream.url) throw new Error("无法获取直播流，请点击刷新重试");
    roomStates[id] = { status: "playing", requestId, url: stream.url };
  } catch (error) {
    if (!isCurrent()) return;
    roomStates[id] = {
      status: "error",
      requestId,
      message: error instanceof Error ? error.message : "播放失败，请点击刷新重试",
    };
  }
};

const handlePlaybackError = (id: string) => {
  const state = roomStates[id];
  if (state?.status !== "playing") return;
  players.delete(id);
  delete danmakuVisible[id];
  roomStates[id] = {
    status: "error",
    requestId: state.requestId,
    message: "播放失败，请点击刷新重试",
  };
};

const addRoom = (id: string) => {
  if (!roomsById.value.has(id) || selectedIds.value.includes(id) || !canAddRoom(id)) return;
  roomSizes.value = { ...roomSizes.value, [id]: "1x1" };
  roomAudio.value = { ...roomAudio.value, [id]: normalizeRoomAudio(undefined) };
  selectedIds.value = [...selectedIds.value, id];
  void persistLayout();
  void refreshRoom(id);
};

const disposeRoom = (id: string) => {
  requestIds.set(id, (requestIds.get(id) || 0) + 1);
  clearHoveredRoom(id);
  players.delete(id);
  delete danmakuVisible[id];
  delete danmakuFailed[id];
  delete roomStates[id];
};
const removeRoom = (id: string) => {
  disposeRoom(id);
  selectedIds.value = selectedIds.value.filter((item) => item !== id);
  const nextSizes = { ...roomSizes.value };
  delete nextSizes[id];
  roomSizes.value = nextSizes;
  const nextAudio = { ...roomAudio.value };
  delete nextAudio[id];
  roomAudio.value = nextAudio;
  void persistLayout();
};

const moveRoom = (id: string, direction: -1 | 1) => {
  const index = selectedIds.value.indexOf(id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= selectedIds.value.length) return;

  const nextIds = [...selectedIds.value];
  [nextIds[index], nextIds[nextIndex]] = [nextIds[nextIndex], nextIds[index]];
  if (!packGrid(nextIds, roomSizes.value)) return;
  selectedIds.value = nextIds;
  void persistLayout();
};

const loadRooms = async (refreshSelected: boolean) => {
  if (loadingRooms.value) return;
  loadingRooms.value = true;
  loadError.value = "";
  try {
    const allRooms: Room[] = [];
    const pageSize = 100;
    let page = 1;
    while (true) {
      const result = await recoderApi.infoList({ page, pageSize });
      allRooms.push(...result.data);
      if (result.data.length === 0 || page * pageSize >= result.pagination.total) break;
      page += 1;
    }

    const previousLayout = JSON.stringify(currentLayout());
    rooms.value = allRooms;
    const existingIds = new Set(allRooms.map((room) => room.id));
    const nextIds: string[] = [];
    const nextSizes: Record<string, GridSize> = {};
    const nextAudio: Record<string, RoomAudio> = {};
    for (const id of selectedIds.value) {
      if (!existingIds.has(id) || nextIds.includes(id)) continue;
      const preferredSize = getGridSize(roomSizes.value[id]);
      const size = packGrid([...nextIds, id], { ...nextSizes, [id]: preferredSize })
        ? preferredSize
        : "1x1";
      if (!packGrid([...nextIds, id], { ...nextSizes, [id]: size })) continue;
      nextIds.push(id);
      nextSizes[id] = size;
      nextAudio[id] = roomAudioFor(id);
    }
    selectedIds.value.filter((id) => !nextIds.includes(id)).forEach(disposeRoom);
    roomSizes.value = nextSizes;
    roomAudio.value = nextAudio;
    selectedIds.value = nextIds;
    if (previousLayout !== JSON.stringify(currentLayout())) void persistLayout();
    if (refreshSelected) {
      await Promise.allSettled(selectedIds.value.map((id) => refreshRoom(id)));
    }
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : "加载房间列表失败";
  } finally {
    loadingRooms.value = false;
  }
};

const initialize = async () => {
  if (initializing.value) return;
  initializing.value = true;
  loadError.value = "";
  try {
    const layout = await getMonitorRoomLayout();

    toolbarVisible.value = layout?.manageButtonVisible ?? true;
    hideTitleBar.value = layout?.hideTitleBar ?? false;
    selectedIds.value = layout?.rooms.map((room) => room.id) || [];
    roomSizes.value = Object.fromEntries(layout?.rooms.map((room) => [room.id, room.size]) || []);
    roomAudio.value = Object.fromEntries(
      layout?.rooms.map((room) => [room.id, normalizeRoomAudio(room)]) || [],
    );
    layoutLoaded.value = true;
    if (!toolbarVisible.value) {
      message.info("顶部栏已隐藏，按 Ctrl+M 可重新显示", { duration: 4000 });
    }
    await loadRooms(true);
    if (!loadError.value && selectedIds.value.length === 0) roomPickerVisible.value = true;
  } catch (error) {
    loadError.value = `加载监控室配置失败：${String(error)}`;
  } finally {
    initializing.value = false;
  }
};

const retryError = () => {
  if (!layoutLoaded.value) void initialize();
  else if (loadError.value) void loadRooms(true);
  else void persistLayout();
};

onMounted(() => {
  window.addEventListener("keydown", handleToolbarHotkey, true);
  window.addEventListener("keydown", handleMuteHotkey, true);
  void initialize();
});

onBeforeUnmount(() => {
  danmaSocket.close();
  window.removeEventListener("keydown", handleToolbarHotkey, true);
  window.removeEventListener("keydown", handleMuteHotkey, true);
  if (volumeSaveTimer) {
    clearTimeout(volumeSaveTimer);
    void persistLayout();
  }
  for (const id of selectedIds.value) {
    requestIds.set(id, (requestIds.get(id) || 0) + 1);
  }
  players.clear();
});
</script>

<style scoped lang="less">
.monitor-room {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: #101114;
  color: #fff;
}

.monitor-room__toolbar,
.monitor-room__title,
.monitor-room__section-heading,
.monitor-room__controls,
.monitor-room__picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.monitor-room__toolbar {
  position: absolute;
  z-index: 3;
  top: 12px;
  right: 12px;
  padding: 6px 8px;
  border: 1px solid #343942;
  border-radius: 8px;
  background: rgb(16 17 20 / 88%);

  h1 {
    margin: 0;
    font-size: 18px;
  }

  span {
    color: #a9adb7;
    font-size: 12px;
  }
}

.monitor-room__load-error {
  position: absolute;
  z-index: 3;
  top: 64px;
  left: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--color-error-bg);
  color: var(--color-error);
}

.monitor-room__board {
  box-sizing: border-box;
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  width: 100%;
  height: 100%;
  gap: 4px;
  padding: 4px;
  overflow: hidden;
  background: #0b0d10;
}

.monitor-room__cell {
  min-width: 0;
  min-height: 0;
  border: 1px solid #242830;
  background: #181b20;
}

.monitor-room__tile {
  z-index: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #343942;
  background: #000;
}

.monitor-room__room-label {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: var(--text-muted);
    font-size: 12px;
  }
}

.monitor-room__placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: #b4b8c2;
  text-align: center;
}

.monitor-room__section-heading {
  justify-content: space-between;
  margin-bottom: 12px;

  h2 {
    margin: 0;
    font-size: 16px;
  }

  span {
    color: var(--text-muted);
  }
}

.monitor-room__window-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.monitor-room__window-setting-label {
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    color: var(--text-muted);
    font-size: 12px;
  }
}

.monitor-room__window-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.monitor-room__managed-room {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-secondary);
}

.monitor-room__managed-room-heading,
.monitor-room__order-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.monitor-room__hint {
  margin: 0 0 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.monitor-room__controls {
  flex-wrap: wrap;
  margin-top: 10px;
}

.monitor-room__size-select {
  width: 92px;
}

.monitor-room__picker-list {
  margin-top: 12px;
}

.monitor-room__picker-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-secondary);
}

@media (max-width: 600px) {
  .monitor-room__toolbar span {
    display: none;
  }
}
</style>
