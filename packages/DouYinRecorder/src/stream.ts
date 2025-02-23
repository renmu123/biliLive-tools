import { Qualities, Recorder } from '@autorecord/manager'
import { getRoomInfo, SourceProfile, StreamProfile } from './douyin_api'
import * as R from 'ramda'
import { getValuesFromArrayLikeFlexSpaceBetween } from './utils'

export async function getInfo(channelId: string): Promise<{
  living: boolean
  owner: string
  title: string
  roomId: string
}> {
  const info = await getRoomInfo(channelId)

  return {
    living: info.living,
    owner: info.owner,
    title: info.title,
    roomId: info.roomId,
  }
}

export async function getStream(
  opts: Pick<Recorder, 'channelId' | 'quality' | 'streamPriorities' | 'sourcePriorities'> & { rejectCache?: boolean },
) {
  const info = await getRoomInfo(opts.channelId)
  if (!info.living) {
    throw new Error('It must be called getStream when living')
  }

  let expectStream: StreamProfile
  const streamsWithPriority = sortAndFilterStreamsByPriority(info.streams, opts.streamPriorities)
  if (streamsWithPriority.length > 0) {
    // 通过优先级来选择对应流
    expectStream = streamsWithPriority[0]
  } else {
    // 通过设置的画质选项来选择对应流
    const flexedStreams = getValuesFromArrayLikeFlexSpaceBetween(info.streams, Qualities.length)
    expectStream = flexedStreams[Qualities.indexOf(opts.quality)]
  }

  let expectSource: SourceProfile | null = null
  const sourcesWithPriority = sortAndFilterSourcesByPriority(info.sources, opts.sourcePriorities)
  if (sourcesWithPriority.length > 0) {
    expectSource = sourcesWithPriority[0]
  } else {
    expectSource = info.sources[0]
  }

  return {
    ...info,
    currentStream: {
      name: expectStream.desc,
      source: expectSource.name,
      url: expectSource.streamMap[expectStream.key].main.flv,
    },
  }
}

/**
 * 按提供的流优先级去给流列表排序，并过滤掉不在优先级配置中的流
 */
function sortAndFilterStreamsByPriority(
  streams: StreamProfile[],
  streamPriorities: Recorder['streamPriorities'],
): (StreamProfile & {
  priority: number
})[] {
  if (streamPriorities.length === 0) return []

  return R.sortBy(
    R.prop('priority'),
    // 分配优先级属性，数字越大优先级越高
    streams
      .map((stream) => ({
        ...stream,
        priority: R.reverse(streamPriorities).indexOf(stream.desc),
      }))
      .filter(({ priority }) => priority !== -1),
  )
}

/**
 * 按提供的源优先级去给源列表排序，并过滤掉不在优先级配置中的源
 */
function sortAndFilterSourcesByPriority(
  sources: SourceProfile[],
  sourcePriorities: Recorder['sourcePriorities'],
): (SourceProfile & {
  priority: number
})[] {
  if (sourcePriorities.length === 0) return []

  return R.sortBy(
    R.prop('priority'),
    // 分配优先级属性，数字越大优先级越高
    sources
      .map((source) => ({
        ...source,
        priority: R.reverse(sourcePriorities).indexOf(source.name),
      }))
      .filter(({ priority }) => priority !== -1),
  )
}
