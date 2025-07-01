import path from "node:path";
import mitt, { Emitter } from "mitt";
import ejs from "ejs";
import { omit, range } from "lodash-es";
import { parseArgsStringToArgv } from "string-argv";
import { ChannelId, Message } from "./common.js";
import { getBiliStatusInfoByRoomIds } from "./api.js";
import {
  RecorderCreateOpts,
  Recorder,
  SerializedRecorder,
  RecordHandle,
  DebugLog,
  Progress,
} from "./recorder.js";
import {
  AnyObject,
  UnknownObject,
  formatDate,
  removeSystemReservedChars,
  formatTemplate,
  replaceExtName,
  downloadImage,
} from "./utils.js";
import { StreamManager } from "./streamManager.js";

export interface RecorderProvider<E extends AnyObject> {
  // Provider 的唯一 id，最好只由英文 + 数字组成
  // TODO: 可以加个检查 id 合法性的逻辑
  id: string;
  name: string;
  siteURL: string;

  // 用基础的域名、路径等方式快速决定一个 URL 是否能匹配此 provider
  matchURL: (this: RecorderProvider<E>, channelURL: string) => boolean;
  // 从一个与当前 provider 匹配的 URL 中解析与获取对应频道的一些信息
  resolveChannelInfoFromURL: (
    this: RecorderProvider<E>,
    channelURL: string,
  ) => Promise<{
    id: ChannelId;
    title: string;
    owner: string;
    uid?: number;
  } | null>;
  createRecorder: (
    this: RecorderProvider<E>,
    opts: Omit<RecorderCreateOpts<E>, "providerId">,
  ) => Recorder<E>;

  fromJSON: <T extends SerializedRecorder<E>>(this: RecorderProvider<E>, json: T) => Recorder<E>;

  setFFMPEGOutputArgs: (this: RecorderProvider<E>, args: string[]) => void;
}

const configurableProps = [
  "savePathRule",
  "autoRemoveSystemReservedChars",
  "autoCheckInterval",
  "ffmpegOutputArgs",
  "biliBatchQuery",
] as const;
type ConfigurableProp = (typeof configurableProps)[number];
function isConfigurableProp(prop: unknown): prop is ConfigurableProp {
  return configurableProps.includes(prop as any);
}

export interface RecorderManager<
  ME extends UnknownObject,
  P extends RecorderProvider<AnyObject> = RecorderProvider<UnknownObject>,
  PE extends AnyObject = GetProviderExtra<P>,
  E extends AnyObject = ME & PE,
> extends Emitter<{
    error: { source: string; err: unknown };
    RecordStart: { recorder: Recorder<E>; recordHandle: RecordHandle };
    RecordSegment: { recorder: Recorder<E>; recordHandle?: RecordHandle };
    videoFileCreated: { recorder: Recorder<E>; filename: string; cover?: string };
    videoFileCompleted: { recorder: Recorder<E>; filename: string };
    RecorderProgress: { recorder: Recorder<E>; progress: Progress };
    RecoderLiveStart: { recorder: Recorder<E> };

    RecordStop: { recorder: Recorder<E>; recordHandle: RecordHandle; reason?: string };
    Message: { recorder: Recorder<E>; message: Message };
    RecorderUpdated: {
      recorder: Recorder<E>;
      keys: (string | keyof Recorder<E>)[];
    };
    RecorderAdded: Recorder<E>;
    RecorderRemoved: Recorder<E>;
    RecorderDebugLog: DebugLog & { recorder: Recorder<E> };
    Updated: ConfigurableProp[];
  }> {
  providers: P[];
  getChannelURLMatchedRecorderProviders: (
    this: RecorderManager<ME, P, PE, E>,
    channelURL: string,
  ) => P[];

  recorders: Recorder<E>[];
  addRecorder: (this: RecorderManager<ME, P, PE, E>, opts: RecorderCreateOpts<E>) => Recorder<E>;
  removeRecorder: (this: RecorderManager<ME, P, PE, E>, recorder: Recorder<E>) => void;
  startRecord: (
    this: RecorderManager<ME, P, PE, E>,
    id: string,
  ) => Promise<Recorder<E> | undefined>;
  stopRecord: (this: RecorderManager<ME, P, PE, E>, id: string) => Promise<Recorder<E> | undefined>;
  cutRecord: (this: RecorderManager<ME, P, PE, E>, id: string) => Promise<Recorder<E> | undefined>;

  autoCheckInterval: number;
  isCheckLoopRunning: boolean;
  startCheckLoop: (this: RecorderManager<ME, P, PE, E>) => void;
  stopCheckLoop: (this: RecorderManager<ME, P, PE, E>) => void;

  savePathRule: string;
  autoRemoveSystemReservedChars: boolean;
  ffmpegOutputArgs: string;
  /** b站使用批量查询接口 */
  biliBatchQuery: boolean;
}

export type RecorderManagerCreateOpts<
  ME extends AnyObject = UnknownObject,
  P extends RecorderProvider<AnyObject> = RecorderProvider<UnknownObject>,
  PE extends AnyObject = GetProviderExtra<P>,
  E extends AnyObject = ME & PE,
> = Partial<Pick<RecorderManager<ME, P, PE, E>, ConfigurableProp>> & {
  providers: P[];
};

export function createRecorderManager<
  ME extends AnyObject = UnknownObject,
  P extends RecorderProvider<AnyObject> = RecorderProvider<UnknownObject>,
  PE extends AnyObject = GetProviderExtra<P>,
  E extends AnyObject = ME & PE,
>(opts: RecorderManagerCreateOpts<ME, P, PE, E>): RecorderManager<ME, P, PE, E> {
  const recorders: Recorder<E>[] = [];

  let checkLoopTimer: NodeJS.Timeout | undefined;

  const multiThreadCheck = async (manager: RecorderManager<ME, P, PE, E>) => {
    const handleBatchQuery = async (obj: Record<string, boolean>) => {
      for (const recorder of recorders
        .filter((r) => !r.disableAutoCheck)
        .filter((r) => r.providerId === "Bilibili")) {
        const isLive = obj[recorder.channelId];
        // 如果是undefined，说明这个接口查不到相关信息，使用录制器内的再查一次
        if (isLive === true || isLive === undefined) {
          await recorder.checkLiveStatusAndRecord({
            getSavePath(data) {
              return genSavePathFromRule(manager, recorder, data);
            },
            banLiveId: tempBanObj[recorder.channelId],
          });
        }
      }
    };

    const maxThreadCount = 3;
    // 这里暂时不打算用 state == recording 来过滤，provider 必须内部自己处理录制过程中的 check，
    // 这样可以防止一些意外调用 checkLiveStatusAndRecord 时出现重复录制。
    let needCheckRecorders = recorders.filter((r) => !r.disableAutoCheck);
    let threads: Promise<void>[] = [];

    if (manager.biliBatchQuery) {
      const biliNeedCheckRecorders = needCheckRecorders
        .filter((r) => r.providerId === "Bilibili")
        .filter((r) => r.recordHandle == null);
      needCheckRecorders = needCheckRecorders.filter((r) => r.providerId !== "Bilibili");

      const roomIds = biliNeedCheckRecorders.map((r) => r.channelId).map(Number);
      try {
        if (roomIds.length !== 0) {
          const biliStatus = await getBiliStatusInfoByRoomIds(roomIds);
          threads.push(handleBatchQuery(biliStatus));
        }
      } catch (err) {
        manager.emit("error", { source: "getBiliStatusInfoByRoomIds", err });
        // 如果批量查询失败，则使用单个查询
        needCheckRecorders = needCheckRecorders.concat(biliNeedCheckRecorders);
      }
    }

    const checkOnce = async () => {
      const recorder = needCheckRecorders.shift();
      if (recorder == null) return;

      const banLiveId = tempBanObj[recorder.channelId];
      await recorder.checkLiveStatusAndRecord({
        getSavePath(data) {
          return genSavePathFromRule(manager, recorder, data);
        },
        banLiveId,
      });
    };

    threads = threads.concat(
      range(0, maxThreadCount).map(async () => {
        while (needCheckRecorders.length > 0) {
          try {
            await checkOnce();
          } catch (err) {
            manager.emit("error", { source: "checkOnceInThread", err });
          }
        }
      }),
    );

    await Promise.all(threads);
  };

  // 用于记录暂时被 ban 掉的直播间
  const tempBanObj: Record<string, string> = {};

  // 用于是否触发LiveStart事件，不要重复触发
  const liveStartObj: Record<string, boolean> = {};

  const manager: RecorderManager<ME, P, PE, E> = {
    // @ts-ignore
    ...mitt(),

    providers: opts.providers,
    getChannelURLMatchedRecorderProviders(channelURL) {
      return this.providers.filter((p) => p.matchURL(channelURL));
    },

    recorders,
    addRecorder(opts) {
      const provider = this.providers.find((p) => p.id === opts.providerId);
      if (provider == null) throw new Error("Cant find provider " + opts.providerId);

      // TODO: 因为泛型函数内部是不持有具体泛型的，这里被迫用了 as，没什么好的思路处理，除非
      // provider.createRecorder 能返回 Recorder<PE> 才能进一步优化。
      const recorder = provider.createRecorder(omit(opts, ["providerId"])) as Recorder<E>;
      this.recorders.push(recorder);

      recorder.on("RecordStart", (recordHandle) =>
        this.emit("RecordStart", { recorder, recordHandle }),
      );
      recorder.on("RecordSegment", (recordHandle) =>
        this.emit("RecordSegment", { recorder, recordHandle }),
      );
      recorder.on("videoFileCreated", ({ filename, cover }) => {
        if (recorder.saveCover && recorder?.liveInfo?.cover) {
          const coverPath = replaceExtName(filename, ".jpg");
          downloadImage(cover ?? recorder?.liveInfo?.cover, coverPath);
        }
        this.emit("videoFileCreated", { recorder, filename });
      });
      recorder.on("videoFileCompleted", ({ filename }) =>
        this.emit("videoFileCompleted", { recorder, filename }),
      );
      recorder.on("RecordStop", ({ recordHandle, reason }) =>
        this.emit("RecordStop", { recorder, recordHandle, reason }),
      );
      recorder.on("Message", (message) => this.emit("Message", { recorder, message }));
      recorder.on("Updated", (keys) => this.emit("RecorderUpdated", { recorder, keys }));
      recorder.on("DebugLog", (log) => this.emit("RecorderDebugLog", { recorder, ...log }));
      recorder.on("progress", (progress) => {
        this.emit("RecorderProgress", { recorder, progress });
      });
      recorder.on("videoFileCreated", () => {
        if (!recorder.liveInfo?.liveId) return;

        const key = `${recorder.channelId}-${recorder.liveInfo?.liveId}`;
        if (liveStartObj[key]) return;
        liveStartObj[key] = true;

        this.emit("RecoderLiveStart", { recorder });
      });

      this.emit("RecorderAdded", recorder);

      return recorder;
    },
    removeRecorder(recorder) {
      const idx = this.recorders.findIndex((item) => item === recorder);
      if (idx === -1) return;
      recorder.recordHandle?.stop("remove recorder");
      this.recorders.splice(idx, 1);

      delete tempBanObj[recorder.channelId];
      this.emit("RecorderRemoved", recorder);
    },
    async startRecord(id: string) {
      const recorder = this.recorders.find((item) => item.id === id);
      if (recorder == null) return;
      if (recorder.recordHandle != null) return;

      await recorder.checkLiveStatusAndRecord({
        getSavePath(data) {
          return genSavePathFromRule(manager, recorder, data);
        },
        isManualStart: true,
      });
      delete tempBanObj[recorder.channelId];
      recorder.tempStopIntervalCheck = false;
      return recorder;
    },
    async stopRecord(id: string) {
      const recorder = this.recorders.find((item) => item.id === id);
      if (recorder == null) return;
      if (recorder.recordHandle == null) return;
      const liveId = recorder.liveInfo?.liveId;

      await recorder.recordHandle.stop("manual stop", true);
      if (liveId) {
        tempBanObj[recorder.channelId] = liveId;
        recorder.tempStopIntervalCheck = true;
      }
      return recorder;
    },
    async cutRecord(id: string) {
      const recorder = this.recorders.find((item) => item.id === id);
      if (recorder == null) return;
      if (recorder.recordHandle == null) return;
      await recorder.recordHandle.cut();
      return recorder;
    },

    autoCheckInterval: opts.autoCheckInterval ?? 1000,
    isCheckLoopRunning: false,
    startCheckLoop() {
      if (this.isCheckLoopRunning) return;
      this.isCheckLoopRunning = true;
      // TODO: emit updated event

      const checkLoop = async () => {
        try {
          await multiThreadCheck(this);
        } catch (err) {
          this.emit("error", { source: "multiThreadCheck", err });
        } finally {
          if (!this.isCheckLoopRunning) {
            // do nothing
          } else {
            checkLoopTimer = setTimeout(checkLoop, this.autoCheckInterval);
          }
        }
      };

      void checkLoop();
    },
    stopCheckLoop() {
      if (!this.isCheckLoopRunning) return;
      this.isCheckLoopRunning = false;
      // TODO: emit updated event
      clearTimeout(checkLoopTimer);
    },

    savePathRule:
      opts.savePathRule ??
      path.join(
        process.cwd(),
        "{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}",
      ),

    autoRemoveSystemReservedChars: opts.autoRemoveSystemReservedChars ?? true,
    biliBatchQuery: opts.biliBatchQuery ?? false,

    ffmpegOutputArgs:
      opts.ffmpegOutputArgs ??
      "-c copy" +
        /**
         * FragmentMP4 可以边录边播（浏览器原生支持），具有一定的抗损坏能力，录制中 KILL 只会丢失
         * 最后一个片段，而 FLV 格式如果录制中 KILL 了需要手动修复下 keyframes。所以默认使用 fmp4 格式。
         */
        " -movflags faststart+frag_keyframe+empty_moov" +
        /**
         * 浏览器加载 FragmentMP4 会需要先把它所有的 moof boxes 都加载完成后才能播放，
         * 默认的分段时长很小，会产生大量的 moof，导致加载很慢，所以这里设置一个分段的最小时长。
         *
         * TODO: 这个浏览器行为或许是可以优化的，比如试试给 fmp4 在录制完成后设置或者录制过程中实时更新 mvhd.duration。
         * https://stackoverflow.com/questions/55887980/how-to-use-media-source-extension-mse-low-latency-mode
         * https://stackoverflow.com/questions/61803136/ffmpeg-fragmented-mp4-takes-long-time-to-start-playing-on-chrome
         *
         * TODO: 如果浏览器行为无法优化，并且想进一步优化加载速度，可以考虑录制时使用 fmp4，录制完成后再转一次普通 mp4。
         */
        " -min_frag_duration 10000000",
  };

  const setProvidersFFMPEGOutputArgs = (ffmpegOutputArgs: string) => {
    const args = parseArgsStringToArgv(ffmpegOutputArgs);
    manager.providers.forEach((p) => p.setFFMPEGOutputArgs(args));
  };
  // setProvidersFFMPEGOutputArgs(manager.ffmpegOutputArgs);

  const proxyManager = new Proxy(manager, {
    set(obj, prop, value) {
      Reflect.set(obj, prop, value);

      if (prop === "ffmpegOutputArgs") {
        setProvidersFFMPEGOutputArgs(value);
      }

      if (isConfigurableProp(prop)) {
        obj.emit("Updated", [prop]);
      }

      return true;
    },
  });

  return proxyManager;
}

export function genSavePathFromRule<
  ME extends AnyObject,
  P extends RecorderProvider<AnyObject>,
  PE extends AnyObject,
  E extends AnyObject,
>(
  manager: RecorderManager<ME, P, PE, E>,
  recorder: Recorder<E>,
  extData: {
    owner: string;
    title: string;
    startTime?: number;
  },
): string {
  // TODO: 这里随便写的，后面再优化
  const provider = manager.providers.find((p) => p.id === recorder.toJSON().providerId);

  const now = extData?.startTime ? new Date(extData.startTime) : new Date();
  const params = {
    platform: provider?.name ?? "unknown",
    channelId: recorder.channelId,
    remarks: recorder.remarks ?? "",
    year: formatDate(now, "yyyy"),
    month: formatDate(now, "MM"),
    date: formatDate(now, "dd"),
    hour: formatDate(now, "HH"),
    min: formatDate(now, "mm"),
    sec: formatDate(now, "ss"),
    ...extData,
  };
  if (manager.autoRemoveSystemReservedChars) {
    for (const key in params) {
      params[key] = removeSystemReservedChars(String(params[key]));
    }
  }

  let savePathRule = manager.savePathRule;
  try {
    savePathRule = ejs.render(savePathRule, params);
  } catch (error) {
    console.error("模板解析错误", error);
  }
  return formatTemplate(savePathRule, params);
}

export type GetProviderExtra<P> = P extends RecorderProvider<infer E> ? E : never;
export { StreamManager };
