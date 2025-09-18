import { AnyObject, UnknownObject } from "./utils.js";

export type ChannelId = string;

export const Qualities = ["lowest", "low", "medium", "high", "highest"] as const;
export const BiliQualities = [30000, 20000, 10000, 400, 250, 150, 80] as const;
export const DouyuQualities = [0, 2, 3, 4, 8] as const;
// 14100: 2K HDR；14000：2K；4200：HDR(10M)；0：原画；8000：蓝光8M；4000：蓝光4M；2000：超清；500：流畅
export const HuYaQualities = [
  0, 20000, 14100, 14000, 10000, 8000, 4200, 4000, 2000, 500, -1,
] as const;
export const DouYinQualities = ["origin", "uhd", "hd", "sd", "ld", "ao", "real_origin"] as const;
export type Quality =
  | (typeof Qualities)[number]
  | (typeof BiliQualities)[number]
  | (typeof DouyuQualities)[number]
  | (typeof HuYaQualities)[number]
  | (typeof DouYinQualities)[number];

export interface MessageSender<E extends AnyObject = UnknownObject> {
  uid?: string;
  name: string;
  avatar?: string;
  extra?: E;
}

export interface Comment<E extends AnyObject = UnknownObject> {
  type: "comment";
  timestamp: number;
  text: string;
  mode?: number;
  color?: string;
  sender?: MessageSender;
  extra?: E;
}

export interface GiveGift<E extends AnyObject = UnknownObject> {
  type: "give_gift";
  timestamp: number;
  name: string;
  count: number;
  price: number;
  text?: string;
  cost?: number;
  color?: string;
  sender?: MessageSender;
  extra?: E;
}

export interface Guard<E extends AnyObject = UnknownObject> {
  type: "guard";
  timestamp: number;
  name: string;
  count: number;
  price: number;
  level: number;
  text?: string;
  cost?: number;
  color?: string;
  sender?: MessageSender;
  extra?: E;
}

export interface SuperChat<E extends AnyObject = UnknownObject> {
  type: "super_chat";
  timestamp: number;
  text: string;
  price: number;
  sender?: MessageSender;
  extra?: E;
}

export type Message = Comment | GiveGift | SuperChat | Guard;
