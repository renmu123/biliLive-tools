export type APIType = "web" | "webHTML" | "mobile" | "userHTML";

export interface RoomInfo {
  living: boolean;
  nickname: string;
  sec_uid: string;
  avatar: string;
  room: {
    title: string;
    cover: string;
    id_str: string;
    stream_url: any | null;
  } | null;
}
