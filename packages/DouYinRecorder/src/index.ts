import path from 'path'
import mitt from 'mitt'
import {
  Recorder,
  RecorderCreateOpts,
  RecorderProvider,
  createFFMPEGBuilder,
  RecordHandle,
  defaultFromJSON,
  defaultToJSON,
  genRecorderUUID,
  genRecordUUID,
  createRecordExtraDataController,
  Comment,
  GiveGift,
} from '@autorecord/manager'
import { getInfo, getStream } from './stream'
import { assertStringType, ensureFolderExist, replaceExtName, singleton } from './utils'

function createRecorder(opts: RecorderCreateOpts): Recorder {
  // 内部实现时，应该只有 proxy 包裹的那一层会使用这个 recorder 标识符，不应该有直接通过
  // 此标志来操作这个对象的地方，不然会跳过 proxy 的拦截。
  const recorder: Recorder = {
    id: opts.id ?? genRecorderUUID(),
    extra: opts.extra ?? {},
    ...mitt(),
    ...opts,

    availableStreams: [],
    availableSources: [],
    state: 'idle',

    getChannelURL() {
      return `https://live.douyin.com/${this.channelId}`
    },
    checkLiveStatusAndRecord: singleton(checkLiveStatusAndRecord),

    toJSON() {
      return defaultToJSON(provider, this)
    },
  }

  const recorderWithSupportUpdatedEvent = new Proxy(recorder, {
    set(obj, prop, value) {
      Reflect.set(obj, prop, value)

      if (typeof prop === 'string') {
        obj.emit('Updated', [prop])
      }

      return true
    },
  })

  return recorderWithSupportUpdatedEvent
}

const ffmpegOutputOptions: string[] = ['-c', 'copy', '-movflags', 'frag_keyframe', '-min_frag_duration', '60000000']
const checkLiveStatusAndRecord: Recorder['checkLiveStatusAndRecord'] = async function ({ getSavePath }) {
  if (this.recordHandle != null) return this.recordHandle

  const { living, owner, title, roomId } = await getInfo(this.channelId)
  if (!living) return null

  this.state = 'recording'
  let res
  // TODO: 先不做什么错误处理，就简单包一下预期上会有错误的地方
  try {
    res = await getStream({
      channelId: this.channelId,
      quality: this.quality,
      streamPriorities: this.streamPriorities,
      sourcePriorities: this.sourcePriorities,
    })
  } catch (err) {
    this.state = 'idle'
    throw err
  }
  const { currentStream: stream, sources: availableSources, streams: availableStreams } = res
  this.availableStreams = availableStreams.map((s) => s.desc)
  this.availableSources = availableSources.map((s) => s.name)
  this.usedStream = stream.name
  this.usedSource = stream.source
  // TODO: emit update event

  const savePath = getSavePath({ owner, title })
  const extraDataSavePath = replaceExtName(savePath, '.json')
  const recordSavePath = savePath
  try {
    // TODO: 这个 ensure 或许应该放在 createRecordExtraDataController 里实现？
    ensureFolderExist(extraDataSavePath)
    ensureFolderExist(recordSavePath)
  } catch (err) {
    this.state = 'idle'
    throw err
  }

  // TODO: 之后可能要结合 disableRecordMeta 之类的来确认是否要创建文件。
  const extraDataController = createRecordExtraDataController(extraDataSavePath)
  extraDataController.setMeta({ title })

  // TODO: 弹幕录制

  let isEnded = false
  const onEnd = (...args: unknown[]) => {
    if (isEnded) return
    isEnded = true
    this.emit('DebugLog', {
      type: 'common',
      text: `ffmpeg end, reason: ${JSON.stringify(args, (_, v) => (v instanceof Error ? v.stack : v))}`,
    })
    const reason = args[0] instanceof Error ? args[0].message : String(args[0])
    this.recordHandle?.stop(reason)
  }

  const isInvalidStream = createInvalidStreamChecker()
  const timeoutChecker = createTimeoutChecker(() => onEnd('ffmpeg timeout'), 10e3)
  const command = createFFMPEGBuilder(stream.url)
    .inputOptions(
      '-user_agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36',
      /**
       * ffmpeg 在处理抖音提供的某些直播间的流时，它会在 avformat_find_stream_info 阶段花费过多时间，这会让录制的过程推迟很久，从而触发超时。
       * 这里通过降低 avformat_find_stream_info 所需要的字节数量（默认为 5000000）来解决这个问题。
       *
       * Refs:
       * https://github.com/Sunoo/homebridge-camera-ffmpeg/issues/462#issuecomment-617723949
       * https://stackoverflow.com/a/49273163/21858805
       */
      '-probesize',
      (64 * 1024).toString(),
    )
    .outputOptions(ffmpegOutputOptions)
    .output(recordSavePath)
    .on('error', onEnd)
    .on('end', () => onEnd('finished'))
    .on('stderr', (stderrLine) => {
      assertStringType(stderrLine)
      this.emit('DebugLog', { type: 'ffmpeg', text: stderrLine })

      if (isInvalidStream(stderrLine)) {
        onEnd('invalid stream')
      }
    })
    .on('stderr', timeoutChecker.update)
  const ffmpegArgs = command._getArguments()
  extraDataController.setMeta({
    recordStartTimestamp: Date.now(),
    ffmpegArgs,
  })
  command.run()

  // TODO: 需要一个机制防止空录制，比如检查文件的大小变化、ffmpeg 的输出、直播状态等

  const stop = singleton<RecordHandle['stop']>(async (reason?: string) => {
    if (!this.recordHandle) return
    this.state = 'stopping-record'
    // TODO: emit update event

    timeoutChecker.stop()

    // 如果给 SIGKILL 信号会非正常退出，SIGINT 可以被 ffmpeg 正常处理。
    // TODO: fluent-ffmpeg 好像没处理好这个 SIGINT 导致的退出信息，会抛一个错。
    command.kill('SIGINT')
    // TODO: 这里可能会有内存泄露，因为事件还没清，之后再检查下看看。
    // client?.close()
    extraDataController.setMeta({ recordStopTimestamp: Date.now() })
    extraDataController.flush()

    this.usedStream = undefined
    this.usedSource = undefined
    // TODO: other codes
    // TODO: emit update event

    this.emit('RecordStop', { recordHandle: this.recordHandle, reason })
    this.recordHandle = undefined
    this.state = 'idle'
  })

  this.recordHandle = {
    id: genRecordUUID(),
    stream: stream.name,
    source: stream.source,
    url: stream.url,
    ffmpegArgs,
    savePath: recordSavePath,
    stop,
  }
  this.emit('RecordStart', this.recordHandle)

  return this.recordHandle
}

function createTimeoutChecker(
  onTimeout: () => void,
  time: number,
): {
  update: () => void
  stop: () => void
} {
  let timer: NodeJS.Timeout | null = null
  let stopped: boolean = false

  const update = () => {
    if (stopped) return
    if (timer != null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      onTimeout()
    }, time)
  }

  update()

  return {
    update,
    stop() {
      stopped = true
      if (timer != null) clearTimeout(timer)
      timer = null
    },
  }
}

function createInvalidStreamChecker(): (ffmpegLogLine: string) => boolean {
  let prevFrame = 0
  let frameUnchangedCount = 0

  return (ffmpegLogLine) => {
    const streamInfo = ffmpegLogLine.match(
      /frame=\s*(\d+) fps=.*? q=.*? size=\s*(\d+)kB time=.*? bitrate=.*? speed=.*?/,
    )
    if (streamInfo != null) {
      const [, frameText] = streamInfo
      const frame = Number(frameText)

      if (frame === prevFrame) {
        if (++frameUnchangedCount >= 10) {
          return true
        }
      } else {
        prevFrame = frame
        frameUnchangedCount = 0
      }

      return false
    }

    if (ffmpegLogLine.includes('HTTP error 404 Not Found')) {
      return true
    }

    return false
  }
}

export const provider: RecorderProvider<{}> = {
  id: 'DouYin',
  name: '抖音',
  siteURL: 'https://live.douyin.com/',

  matchURL(channelURL) {
    // TODO: 暂时不支持 v.douyin.com
    return /https?:\/\/live\.douyin\.com\//.test(channelURL)
  },

  async resolveChannelInfoFromURL(channelURL) {
    if (!this.matchURL(channelURL)) return null

    const id = path.basename(new URL(channelURL).pathname)
    const info = await getInfo(id)

    return {
      id: info.roomId,
      title: info.title,
      owner: info.owner,
    }
  },

  createRecorder(opts) {
    return createRecorder({ providerId: provider.id, ...opts })
  },

  fromJSON(recorder) {
    return defaultFromJSON(this, recorder)
  },

  setFFMPEGOutputArgs(args) {
    ffmpegOutputOptions.splice(0, ffmpegOutputOptions.length, ...args)
  },
}
