declare module 'huya-danmu-fix' {
  import EventEmitter from 'events'

  export default class HuYaDanMu extends EventEmitter {
    constructor(roomId: string)

    set_proxy(proxy: unknown): void

    start(): Promise<void>

    stop(): void
  }

  export type HuYaMessage = HuYaMessage$Chat | HuYaMessage$Gift

  export interface HuYaMessage$Common {
    type: string
    time: number
    from: { name: string; rid: string }
    id: string
  }

  export interface HuYaMessage$Chat extends HuYaMessage$Common {
    type: 'chat'
    content: string
  }

  export interface HuYaMessage$Gift extends HuYaMessage$Common {
    type: 'gift'
    name: string
    count: number
    price: number
    earn: number
  }
}
