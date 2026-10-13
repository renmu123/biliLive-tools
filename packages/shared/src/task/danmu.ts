import { join, parse } from "node:path";
import fs from "fs-extra";
import readline from "node:readline";
import { isNumber, cloneDeep } from "lodash-es";

import {
  pathExists,
  trashItem,
  uuid,
  getTempPath,
  parseSavePath,
  getUnusedFileName,
} from "../utils/index.js";
import log from "../utils/log.js";
import { DanmakuFactory } from "../danmu/danmakuFactory.js";
import { generateDanmakuImage } from "../danmu/hotProgress.js";
import { DanmuTask, taskQueue } from "./task.js";
import { convertImage2Video, readVideoMeta, getBinPath, parseMeta } from "./video.js";
import { parseXmlFile } from "../danmu/index.js";
import { XMLBuilder } from "fast-xml-parser";

import type { DanmuConfig, DanmaOptions, HotProgressOptions } from "@biliLive-tools/types";
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type XmlDanmuItemType = "danmu" | "sc" | "guard" | "gift";
type XmlItem = Record<string, any>;
type XmlFilterFunction = (type: XmlDanmuItemType, danmu: XmlItem, logger: typeof log) => boolean;
type XmlTransformFunction = (type: XmlDanmuItemType, danmu: XmlItem, logger: typeof log) => unknown;

interface XmlEventItem {
  sourceType: XmlDanmuItemType;
  item: XmlItem;
}

interface ProcessedXmlBuckets {
  danmu: CommonItem[];
  sc: CommonItem[];
  guard: CommonItem[];
  gift: CommonItem[];
}

const createEmptyXmlBuckets = (): ProcessedXmlBuckets => ({
  danmu: [],
  sc: [],
  guard: [],
  gift: [],
});

const isXmlDanmuItemType = (value: unknown): value is XmlDanmuItemType => {
  return ["danmu", "sc", "guard", "gift"].includes(String(value));
};

const isValidXmlItemForType = (type: XmlDanmuItemType, item: XmlItem) => {
  if (type === "danmu") {
    return typeof item["@_p"] === "string" && item["@_p"].length > 0;
  }

  return (
    (typeof item["@_ts"] === "string" && item["@_ts"].length > 0) ||
    typeof item["@_ts"] === "number"
  );
};

const logInvalidTransformedItem = (
  reason: string,
  sourceType: XmlDanmuItemType,
  item: unknown,
  targetType?: unknown,
) => {
  log.error("filterFunction transform item dropped", {
    reason,
    sourceType,
    targetType,
    item,
  });
};

const createFilterFunction = (filterFunction: string): XmlFilterFunction | undefined => {
  if (!filterFunction.includes("filter")) {
    return;
  }

  return new Function(
    "type",
    "danmu",
    "logger",
    `
    ${filterFunction}
    return filter(type, danmu, logger);`,
  ) as XmlFilterFunction;
};

const createTransformFunction = (filterFunction: string): XmlTransformFunction | undefined => {
  if (!filterFunction.includes("transform")) {
    return;
  }

  return new Function(
    "type",
    "danmu",
    "logger",
    `
    ${filterFunction}
    return transform(type, danmu, logger);`,
  ) as XmlTransformFunction;
};

const transformXmlItem = (
  sourceType: XmlDanmuItemType,
  item: XmlItem,
  transformFunc: XmlTransformFunction,
) => {
  const transformed = transformFunc(sourceType, item, log);

  if (transformed == null || transformed === false) {
    return null;
  }

  const candidate = transformed === true || transformed === undefined ? item : transformed;
  if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
    logInvalidTransformedItem("transform must return an object", sourceType, candidate);
    return null;
  }

  const nextType = "type" in candidate ? candidate.type : sourceType;
  if (!isXmlDanmuItemType(nextType)) {
    logInvalidTransformedItem("unsupported target type", sourceType, candidate, nextType);
    return null;
  }

  const normalizedItem: XmlItem = { ...(candidate as XmlItem) };
  delete normalizedItem.type;

  if (!isValidXmlItemForType(nextType, normalizedItem)) {
    logInvalidTransformedItem(
      "missing required fields for target type",
      sourceType,
      candidate,
      nextType,
    );
    return null;
  }

  return {
    type: nextType,
    item: normalizedItem,
  };
};

export const processXmlItems = (events: XmlEventItem[], filterFunction: string) => {
  const buckets = createEmptyXmlBuckets();
  const filterFunc = createFilterFunction(filterFunction);
  const transformFunc = createTransformFunction(filterFunction);

  for (const event of events) {
    if (filterFunc && !filterFunc(event.sourceType, event.item, log)) {
      continue;
    }

    if (!transformFunc) {
      buckets[event.sourceType].push(event.item as CommonItem);
      continue;
    }

    const transformedItem = transformXmlItem(event.sourceType, event.item, transformFunc);
    if (!transformedItem) {
      continue;
    }

    buckets[transformedItem.type].push(transformedItem.item as CommonItem);
  }

  return buckets;
};

const createXmlEvents = (items: XmlItem[], sourceType: XmlDanmuItemType): XmlEventItem[] => {
  const result: XmlEventItem[] = [];

  for (const item of items) {
    result.push({
      sourceType,
      item,
    });
  }

  return result;
};

const parseXmlMetadata = async (
  jObj: XmlItem,
  files: { videoFilePath?: string; danmaFilePath: string },
) => {
  const parsedMeta = await parseMeta(files);
  return {
    user_name: parsedMeta.username,
    room_id: parsedMeta.roomId,
    room_title: parsedMeta.title,
    video_start_time: parsedMeta.startTimestamp === null ? null : parsedMeta.startTimestamp * 1000,
    platform: parsedMeta.platform,
    BililiveRecorderVersion:
      jObj.i?.BililiveRecorder?.["@_version"] ??
      jObj.i?.BililiveRecorder?.version ??
      jObj.i?.BililiveRecorderVersion ??
      jObj.i?.metadata?.BililiveRecorderVersion,
  };
};

/**
 * 生成经过自定义处理后的xml文件
 * @param input
 * @param output
 * @param options
 * @returns
 */
const genProcessedXml = async (input: string, output: string, filterFunction: string) => {
  const { jObj, danmuku, sc, guard, gift } = await parseXmlFile(input, true);
  const metadata = await parseXmlMetadata(jObj, { danmaFilePath: input });
  const events = [
    ...createXmlEvents(danmuku, "danmu"),
    ...createXmlEvents(sc, "sc"),
    ...createXmlEvents(guard, "guard"),
    ...createXmlEvents(gift, "gift"),
  ];
  const processedBuckets = processXmlItems(events, filterFunction);
  const xmlData = generateMergedXmlContent(
    processedBuckets.danmu as unknown as DanmuItem[],
    processedBuckets.gift,
    processedBuckets.sc,
    processedBuckets.guard,
    metadata,
  );
  await fs.writeFile(output, xmlData);
  return output;
};

/**
 * 自定义函数函数
 */
const customChangeFunc = (input: string, opts: DanmuConfig) => {
  const customFunc = new Function(
    "file",
    "opts",
    "logger",
    `
    ${opts.filterFunction}
    return custom(file, opts, logger);`,
  );

  return customFunc(input, opts, log);
};

/**
 * 不要直接调用，调用convertXml2Ass
 */
const addConvertDanmu2AssTask = async (
  originInput: string,
  output: string,
  danmuOptions: DanmuConfig,
  options: Pick<DanmaOptions, "removeOrigin"> = {},
) => {
  const { danmuFactoryPath } = getBinPath();
  const danmu = new DanmakuFactory(danmuFactoryPath);
  const tempDir = getTempPath();

  let opts = cloneDeep(danmuOptions);
  if (opts.filterFunction && (opts.filterFunction ?? "").includes("custom")) {
    opts = await customChangeFunc(originInput, opts);
  }

  let filteredOutput: string | undefined;
  const hasFilterFunction =
    Boolean((opts.filterFunction ?? "").trim()) && (opts.filterFunction ?? "").includes("filter");
  const hasTransformFunction =
    Boolean((opts.filterFunction ?? "").trim()) &&
    (opts.filterFunction ?? "").includes("transform");
  if (hasTransformFunction || hasFilterFunction) {
    // 如果存在自定义数据处理函数，则需要把处理后的xml保存到临时文件夹中
    filteredOutput = join(tempDir, `${uuid()}.xml`);
    await genProcessedXml(originInput, filteredOutput, opts.filterFunction);
  }

  if (opts.blacklist) {
    const fileTxtPath = join(tempDir, `${uuid()}.txt`);
    const fileTxtContent = opts.blacklist
      .split(",")
      .filter((value) => value)
      .join("\n");
    await fs.writeFile(fileTxtPath, fileTxtContent);
    opts.blacklist = fileTxtPath;
  }

  const input = filteredOutput || originInput;
  const task = new DanmuTask(
    danmu,
    {
      input: input,
      output,
      options: opts,
      name: `弹幕转换任务: ${parse(originInput).name}`,
    },
    {
      onEnd: async () => {
        if (options.removeOrigin) {
          await trashItem(originInput);
        }

        if (opts.blacklist) {
          fs.unlink(opts.blacklist);
        }

        if (filteredOutput) {
          fs.unlink(filteredOutput);
        }
      },
      onError: async (error) => {
        log.error("danmufactory", {
          status: "error",
          text: error,
          input: originInput,
          output: output,
        });
        if (opts.blacklist) {
          fs.unlink(opts.blacklist);
        }
        if (filteredOutput) {
          fs.unlink(filteredOutput);
        }
      },
    },
  );
  taskQueue.addTask(task, true);
  return task;
};

export const convertXml2Ass = async (
  file: {
    input: string;
    output: string;
  },
  danmuOptions: DanmuConfig,
  options: DanmaOptions,
) => {
  if (!(await pathExists(file.input))) {
    throw new Error(`输入文件不存在: ${file.input}`);
  }
  if (await isEmptyDanmu(file.input)) {
    throw new Error("弹幕为空，无须处理");
  }

  let output: string;
  if (!options.temp) {
    let savePath = await parseSavePath(file.input, {
      saveType: options.saveRadio,
      savePath: options.savePath,
    });
    output = join(savePath, `${file.output}.ass`);
  } else {
    const tempFile = join(getTempPath(), `${uuid()}.ass`);
    output = tempFile;
  }

  if (!options.override && (await pathExists(output))) {
    throw new Error(`${output} 文件已存在`);
  }

  const task = await addConvertDanmu2AssTask(file.input, output, danmuOptions, options);

  return task;
};

/**
 * 判断xml中弹幕是否为空
 * 如果文件中存在<d>, <gift>, <sc>, <guard>标签则认为不为空
 *
 */
export const isEmptyDanmu = async (filepath: string) => {
  const readStream = fs.createReadStream(filepath, { encoding: "utf8" });
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });
  // "d": 普通弹幕，"gift": 录播姬 - 普通礼物，"sc": 录播姬 - SuperChat，"guard": 录播姬 - 舰长
  for await (const line of rl) {
    if (
      line.includes("</d>") ||
      line.includes("</gift>") ||
      line.includes("</sc>") ||
      line.includes("</guard>")
    )
      return false;
  }
  return true;
};

/**
 * 生成高能进度条，输出文件在临时文件夹
 */
export const genHotProgress = async (input: string, options: HotProgressOptions) => {
  const output = join(getTempPath(), `${uuid()}.mp4`);
  return _genHotProgress(input, output, options);
};

/**
 * 生成高能进度条
 */
export const _genHotProgress = async (
  input: string,
  output: string,
  options: HotProgressOptions,
) => {
  log.debug("generateDanmakuImage config", options);
  if (options.videoPath) {
    const videoMeta = await readVideoMeta(options.videoPath);
    const videoStream = videoMeta.streams.find((stream) => stream.codec_type === "video");
    const { width } = videoStream || {};
    options.width = width;
    options.duration = videoMeta.format.duration;
  }
  if (!options.duration || !isNumber(options.duration)) {
    throw new Error(`can not read duration in genHotProgress`);
  }
  if (!options.width) {
    throw new Error("can not read width in genHotProgress");
  }

  const imageDir = join(getTempPath(), uuid());
  const data = await generateDanmakuImage(
    input,
    imageDir,
    options as WithRequired<HotProgressOptions, "duration">,
  );
  log.debug("generateDanmakuImage done", `${data.length} images generated`);

  return convertImage2Video(imageDir, output, {
    removeOrigin: true,
    interval: options.interval,
  });
};

// 定义XML弹幕数据的接口
interface DanmuItem {
  "@_p": string;
}

interface CommonItem {
  "@_ts": string;
}

interface VideoDataItem {
  path: string;
  videoDuration: number;
  startOffset: number;
  meta: any;
  danmuku: {
    "@_p": string;
  }[];
  sc: CommonItem[];
  guard: CommonItem[];
  gift: CommonItem[];
}

/**
 * 处理弹幕时间偏移（纯函数）
 * @param items 弹幕数据
 * @param videoDuration 视频时长
 * @param startOffset 起始偏移时间
 * @param isP 是否是p属性（普通弹幕）
 * @returns 处理后的弹幕数据
 */
export function processDanmuOffset<T extends DanmuItem | CommonItem>(
  items: T[],
  videoDuration: number,
  startOffset: number,
  isP: boolean = false,
): T[] {
  return items
    .filter((item) => {
      // 判断弹幕时间是否超出视频时长
      const timeValue = isP
        ? parseFloat((item as DanmuItem)["@_p"].split(",")[0])
        : parseFloat((item as CommonItem)["@_ts"]);

      return timeValue <= videoDuration;
    })
    .map((item) => {
      const newItem = { ...item };

      if (isP) {
        // 处理普通弹幕
        const pValues = (newItem as DanmuItem)["@_p"].split(",");
        const timestamp = parseFloat(pValues[0]);
        const newTimestamp = timestamp + startOffset;
        pValues[0] = newTimestamp.toFixed(3).toString();
        (newItem as DanmuItem)["@_p"] = pValues.join(",");
      } else {
        // 处理其他类型
        const ts = parseFloat((newItem as CommonItem)["@_ts"]);
        (newItem as CommonItem)["@_ts"] = (ts + startOffset).toFixed(3);
      }

      return newItem;
    });
}

// 与录制文件一致的内嵌 XSL 样式，按原始 XML 写入，避免被转义。
const RECORDER_XML_STYLE = `<z:stylesheet version="1.0" id="s" xml:id="s" xmlns:z="http://www.w3.org/1999/XSL/Transform"><z:output method="html"/><z:template match="/"><html><meta name="viewport" content="width=device-width"/><title>弹幕文件 <z:value-of select="/i/metadata/user_name/text()"/></title><style>body{margin:0}h1,h2,p,table{margin-left:5px}table{border-spacing:0}td,th{border:1px solid grey;padding:1px 5px}th{position:sticky;top:0;background:#4098de}tr:hover{background:#d9f4ff}div{overflow:auto;max-height:80vh;max-width:100vw;width:fit-content}</style><h1>弹幕XML文件</h1><p>本文件不支持在 IE 浏览器里预览，请使用 Chrome Firefox Edge 等浏览器。</p><p>文件用法参考文档 <a href="https://rec.danmuji.org/user/danmaku/">https://rec.danmuji.org/user/danmaku/</a></p><table><tr><td>房间号</td><td><z:value-of select="/i/metadata/room_id/text()"/></td></tr><tr><td>主播名</td><td><z:value-of select="/i/metadata/user_name/text()"/></td></tr><tr><td><a href="#d">弹幕</a></td><td>共<z:value-of select="count(/i/d)"/>条记录</td></tr><tr><td><a href="#guard">上船</a></td><td>共<z:value-of select="count(/i/guard)"/>条记录</td></tr><tr><td><a href="#sc">SC</a></td><td>共<z:value-of select="count(/i/sc)"/>条记录</td></tr><tr><td><a href="#gift">礼物</a></td><td>共<z:value-of select="count(/i/gift)"/>条记录</td></tr></table><h2 id="d">弹幕</h2><div id="dm"><table><tr><th>用户名</th><th>出现时间</th><th>用户ID</th><th>弹幕</th><th>参数</th></tr><z:for-each select="/i/d"><tr><td><z:value-of select="@user"/></td><td></td><td></td><td><z:value-of select="."/></td><td><z:value-of select="@p"/></td></tr></z:for-each></table></div><script>Array.from(document.querySelectorAll('#dm tr')).slice(1).map(t=>t.querySelectorAll('td')).forEach(t=>{let p=t[4].textContent.split(','),a=p[0];t[1].textContent=\`\u0024{(Math.floor(a/60/60)+'').padStart(2,0)}:\u0024{(Math.floor(a/60%60)+'').padStart(2,0)}:\u0024{(a%60).toFixed(3).padStart(6,0)}\`;t[2].innerHTML=\`&lt;a target=_blank rel="nofollow noreferrer" "&gt;\u0024{p[6]}&lt;/a&gt;\`})</script><h2 id="guard">舰长购买</h2><div><table><tr><th>用户名</th><th>用户ID</th><th>舰长等级</th><th>购买数量</th><th>出现时间</th></tr><z:for-each select="/i/guard"><tr><td><z:value-of select="@user"/></td><td><a rel="nofollow noreferrer"><z:attribute name="href"><z:text></z:text><z:value-of select="@uid" /></z:attribute><z:value-of select="@uid"/></a></td><td><z:value-of select="@level"/></td><td><z:value-of select="@count"/></td><td><z:value-of select="@ts"/></td></tr></z:for-each></table></div><h2 id="sc">SuperChat 醒目留言</h2><div><table><tr><th>用户名</th><th>用户ID</th><th>内容</th><th>显示时长</th><th>价格</th><th>出现时间</th></tr><z:for-each select="/i/sc"><tr><td><z:value-of select="@user"/></td><td><a rel="nofollow noreferrer"><z:attribute name="href"><z:text></z:text><z:value-of select="@uid" /></z:attribute><z:value-of select="@uid"/></a></td><td><z:value-of select="."/></td><td><z:value-of select="@time"/></td><td><z:value-of select="@price"/></td><td><z:value-of select="@ts"/></td></tr></z:for-each></table></div><h2 id="gift">礼物</h2><div><table><tr><th>用户名</th><th>用户ID</th><th>礼物名</th><th>礼物数量</th><th>出现时间</th></tr><z:for-each select="/i/gift"><tr><td><z:value-of select="@user"/></td><td><span rel="nofollow noreferrer"><z:attribute name="href"></z:attribute><z:value-of select="@uid"/></span></td><td><z:value-of select="@giftname"/></td><td><z:value-of select="@giftcount"/></td><td><z:value-of select="@ts"/></td></tr></z:for-each></table></div></html></z:template></z:stylesheet>`;

/**
 * 生成合并后的XML内容（纯函数）
 */
export function generateMergedXmlContent(
  mergedDanmuku: DanmuItem[],
  mergedGift: CommonItem[],
  mergedSc: CommonItem[],
  mergedGuard: CommonItem[],
  metadata: Record<string, any> | null = null,
): string {
  const styleTag = metadata?.BililiveRecorderVersion
    ? "BililiveRecorderXmlStyle"
    : "RecorderXmlStyle";
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    stopNodes: [`i.${styleTag}`],
  });
  const BililiveRecorderVersion = metadata?.BililiveRecorderVersion || undefined;
  delete metadata?.BililiveRecorderVersion;

  const xmlContent = builder.build({
    i: {
      metadata,
      BililiveRecorderVersion: BililiveRecorderVersion,
      [styleTag]: RECORDER_XML_STYLE,
      d: mergedDanmuku,
      gift: mergedGift,
      sc: mergedSc,
      guard: mergedGuard,
    },
  });

  return `<?xml version="1.0" encoding="utf-8"?>\n<?xml-stylesheet type="text/xsl" href="#s"?>\n${xmlContent}`;
}

/**
 * 根据视频合并xml弹幕
 */
export const mergeXml = async (
  inputFiles: { videoPath: string; danmakuPath: string }[],
  options: {
    output?: string;
    saveMeta?: boolean;
  } = {},
) => {
  if (inputFiles.length === 0) {
    throw new Error("输入文件不能为空");
  }

  // 确定输出路径
  let outputPath: string;
  if (options.output) {
    outputPath = options.output;
  } else {
    const { dir, name } = parse(inputFiles[0].danmakuPath);
    const filePath = join(dir, `${name}-合并.xml`);
    outputPath = await getUnusedFileName(filePath);
  }

  // 如果输出文件已存在，删除它
  if (await pathExists(outputPath)) {
    await trashItem(outputPath);
  }

  // 读取视频时长和累计时长
  let cumulativeDuration = 0;
  const videoData: VideoDataItem[] = [];

  for (const file of inputFiles) {
    // 读取视频元数据获取时长
    const meta = await readVideoMeta(file.videoPath);
    const duration = Number(meta.format.duration || 0);
    if (duration === 0 || isNaN(duration)) {
      throw new Error("视频无法读取到时间，无法进行处理");
    }

    // 解析XML文件
    const { jObj, danmuku, sc, guard, gift } = await parseXmlFile(file.danmakuPath, true);

    const metadata = await parseXmlMetadata(jObj, {
      videoFilePath: file.videoPath,
      danmaFilePath: file.danmakuPath,
    });

    videoData.push({
      path: file.danmakuPath,
      videoDuration: duration,
      startOffset: cumulativeDuration,
      meta: metadata,
      danmuku: danmuku || [],
      sc: sc || [],
      guard: guard || [],
      gift: gift || [],
    });

    cumulativeDuration += duration;
  }

  // 处理所有弹幕并合并
  const mergedDanmuku: DanmuItem[] = [];
  const mergedSc: CommonItem[] = [];
  const mergedGuard: CommonItem[] = [];
  const mergedGift: CommonItem[] = [];

  const metadata = options.saveMeta ? videoData[0]?.meta : null;

  for (const data of videoData) {
    // 处理各类型弹幕并添加到对应数组
    mergedDanmuku.push(
      ...processDanmuOffset(data.danmuku, data.videoDuration, data.startOffset, true),
    );
    mergedSc.push(...processDanmuOffset(data.sc, data.videoDuration, data.startOffset));
    mergedGuard.push(...processDanmuOffset(data.guard, data.videoDuration, data.startOffset));
    mergedGift.push(...processDanmuOffset(data.gift, data.videoDuration, data.startOffset));
  }

  // 生成XML内容
  const xmlContent = generateMergedXmlContent(
    mergedDanmuku,
    mergedGift,
    mergedSc,
    mergedGuard,
    metadata,
  );

  // 写入合并后的XML文件
  await fs.writeFile(outputPath, xmlContent);

  log.info("mergeXml", {
    status: "success",
    text: `合并完成，共处理了${inputFiles.length}个文件`,
    output: outputPath,
  });

  return outputPath;
};
