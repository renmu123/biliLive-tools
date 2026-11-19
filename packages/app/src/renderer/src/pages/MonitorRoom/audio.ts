export type RoomAudio = { muted: boolean; volume: number };

const DEFAULT_VOLUME = 0.7;

export const normalizeRoomAudio = (value: unknown): RoomAudio => {
  const audio = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const volume = audio.volume;
  return {
    muted: typeof audio.muted === "boolean" ? audio.muted : true,
    volume:
      typeof volume === "number" && Number.isFinite(volume)
        ? Math.min(1, Math.max(0, volume))
        : DEFAULT_VOLUME,
  };
};
