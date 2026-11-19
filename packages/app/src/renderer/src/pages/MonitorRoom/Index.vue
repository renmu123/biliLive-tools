<template>
  <div class="monitor-room">
    <header class="monitor-room__toolbar">
      <div class="monitor-room__title">
        <h1>监控室</h1>
        <span>3 × 3 · 已使用 {{ occupiedCells }} / 9 格</span>
      </div>
      <n-button type="primary" @click="roomPickerVisible = true">房间管理</n-button>
    </header>

    <div v-if="loadError" class="monitor-room__load-error">
      {{ loadError }}
      <n-button text type="primary" @click="loadRooms(false)">重试</n-button>
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
      >
        <Artplayer
          v-if="roomStates[placement.id]?.status === 'playing' && roomStates[placement.id]?.url"
          :key="`${placement.id}:${roomStates[placement.id].requestId}`"
          :option="{ url: roomStates[placement.id].url, fullscreen: true, muted: true, mutex: false }"
          :plugins="[]"
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
      <n-drawer-content title="房间管理" closable>
        <div class="monitor-room__section-heading">
          <h2>已添加</h2>
          <span>{{ occupiedCells }} / 9 格</span>
        </div>
        <p class="monitor-room__hint">每个房间默认占 1 × 1 格，尺寸选项受剩余空间限制。</p>
        <div v-for="room in selectedRooms" :key="room.id" class="monitor-room__managed-room">
          <div class="monitor-room__room-label">
            <strong :title="roomName(room)">{{ roomName(room) }}</strong>
            <span>{{ platformName(room.providerId) }} · {{ room.channelId }}</span>
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
              {{ audioEnabled[room.id] ? "静音" : "开声" }}
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
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useStorage } from "@vueuse/core";
import Artplayer from "@renderer/components/Artplayer/Index.vue";
import { recoderApi } from "@renderer/apis";
import { platformOptions } from "../Tools/pages/Recorder/data";
import { getGridSize, GRID_SIZES, packGrid } from "./grid";

import type ArtplayerType from "artplayer";
import type { RecorderAPI } from "@biliLive-tools/http/types/recorder.js";
import type { GridPlacement, GridSize } from "./grid";

defineOptions({ name: "MonitorRoom" });

type Room = RecorderAPI["getRecorders"]["Resp"]["data"][number];
type RoomState = {
  status: "loading" | "offline" | "playing" | "error";
  requestId: number;
  url?: string;
  message?: string;
};

const selectedIds = useStorage<string[]>("monitor-room-selected-ids", [], localStorage, {
  listenToStorageChanges: false,
});
const roomSizes = useStorage<Record<string, GridSize>>("monitor-room-sizes", {}, localStorage, {
  listenToStorageChanges: false,
});
const rooms = ref<Room[]>([]);
const roomStates = reactive<Record<string, RoomState>>({});
const requestIds = new Map<string, number>();
const players = new Map<string, ArtplayerType>();
const audioEnabled = reactive<Record<string, boolean>>({});
const roomPickerVisible = ref(selectedIds.value.length === 0);
const loadingRooms = ref(false);
const loadError = ref("");
const searchText = ref("");

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
  player.muted = true;
  audioEnabled[id] = false;
  player.on("video:volumechange", () => {
    if (players.get(id) === player) audioEnabled[id] = !player.muted;
  });
};

const toggleSound = (id: string) => {
  const player = players.get(id);
  if (!player) return;
  player.muted = !player.muted;
  audioEnabled[id] = !player.muted;
};

const refreshRoom = async (id: string) => {
  if (!selectedIds.value.includes(id)) return;
  const requestId = (requestIds.get(id) || 0) + 1;
  requestIds.set(id, requestId);
  players.delete(id);
  delete audioEnabled[id];
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
  delete audioEnabled[id];
  roomStates[id] = {
    status: "error",
    requestId: state.requestId,
    message: "播放失败，请点击刷新重试",
  };
};

const addRoom = (id: string) => {
  if (!roomsById.value.has(id) || selectedIds.value.includes(id) || !canAddRoom(id)) return;
  roomSizes.value = { ...roomSizes.value, [id]: "1x1" };
  selectedIds.value = [...selectedIds.value, id];
  void refreshRoom(id);
};

const disposeRoom = (id: string) => {
  requestIds.set(id, (requestIds.get(id) || 0) + 1);
  players.delete(id);
  delete audioEnabled[id];
  delete roomStates[id];
};
const removeRoom = (id: string) => {
  disposeRoom(id);
  selectedIds.value = selectedIds.value.filter((item) => item !== id);
  const nextSizes = { ...roomSizes.value };
  delete nextSizes[id];
  roomSizes.value = nextSizes;
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

    rooms.value = allRooms;
    const existingIds = new Set(allRooms.map((room) => room.id));
    const nextIds: string[] = [];
    const nextSizes: Record<string, GridSize> = {};
    for (const id of selectedIds.value) {
      if (!existingIds.has(id) || nextIds.includes(id)) continue;
      const preferredSize = getGridSize(roomSizes.value[id]);
      const size = packGrid([...nextIds, id], { ...nextSizes, [id]: preferredSize })
        ? preferredSize
        : "1x1";
      if (!packGrid([...nextIds, id], { ...nextSizes, [id]: size })) continue;
      nextIds.push(id);
      nextSizes[id] = size;
    }
    selectedIds.value.filter((id) => !nextIds.includes(id)).forEach(disposeRoom);
    roomSizes.value = nextSizes;
    selectedIds.value = nextIds;
    if (refreshSelected) {
      await Promise.allSettled(selectedIds.value.map((id) => refreshRoom(id)));
    }
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : "加载房间列表失败";
  } finally {
    loadingRooms.value = false;
  }
};

onMounted(() => {
  void loadRooms(true);
});

onBeforeUnmount(() => {
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

.monitor-room__managed-room {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-secondary);
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
