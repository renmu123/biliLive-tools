type SeekableMedia = Pick<
  HTMLVideoElement,
  "buffered" | "currentTime" | "readyState" | "addEventListener" | "removeEventListener"
>;

/** Recover small DTS/PTS gaps after FLV seeks without skipping real missing content. */
export function attachFlvSeekRecovery(video: SeekableMedia): () => void {
  const recover = () => {
    if (video.readyState >= 2) return;

    const currentTime = video.currentTime;
    const buffered = video.buffered;
    for (let index = 0; index < buffered.length; index += 1) {
      const start = buffered.start(index);
      const end = buffered.end(index);
      if (currentTime >= start && currentTime < end) return;
      if (start > currentTime) {
        // mpegts may seek to a keyframe's DTS before either track's first playable PTS.
        if (start - currentTime <= 0.25 && end > start) {
          video.currentTime = start + Math.min(0.001, (end - start) / 2);
        }
        return;
      }
    }
  };

  video.addEventListener("waiting", recover);
  video.addEventListener("progress", recover);
  return () => {
    video.removeEventListener("waiting", recover);
    video.removeEventListener("progress", recover);
  };
}
