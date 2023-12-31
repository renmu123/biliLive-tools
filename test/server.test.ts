import { expect, describe, it } from "vitest";
import { uuid } from "../src/utils/index";

import { type Options, type Part, type Live } from "../src/main/server/index";

export async function handleLiveData(liveData: Live[], options: Options) {
  // 计算live
  const timestamp = new Date(options.time).getTime();
  let currentIndex = -1;
  if (options.event === "FileOpening" || options.event === "VideoFileCreatedEvent") {
    currentIndex = liveData.findIndex((live) => {
      // 找到上一个文件结束时间与当前时间差小于10分钟的直播，认为是同一个直播
      const endTime = Math.max(...live.parts.map((item) => item.endTime || 0));

      console.log(endTime, (timestamp - endTime) / (1000 * 60));
      return (
        live.roomId === options.roomId &&
        live.platform === options.platform &&
        (timestamp - endTime) / (1000 * 60) < 10
      );
    });
    console.log("currentIndex", currentIndex);
    let currentLive = liveData[currentIndex];
    if (currentLive) {
      const part: Part = {
        partId: uuid(),
        startTime: timestamp,
        filePath: options.filePath,
        status: "recording",
      };
      if (currentLive.parts) {
        currentLive.parts.push(part);
      } else {
        currentLive.parts = [part];
      }
      liveData[currentIndex] = currentLive;
    } else {
      // 新建Live数据
      currentLive = {
        eventId: uuid(),
        platform: options.platform,
        startTime: timestamp,
        roomId: options.roomId,
        videoName: options.title,
        parts: [
          {
            partId: uuid(),
            startTime: timestamp,
            filePath: options.filePath,
            status: "recording",
          },
        ],
      };
      liveData.push(currentLive);
      currentIndex = liveData.length - 1;
    }
  } else {
    currentIndex = liveData.findIndex((live) => {
      return live.parts.findIndex((part) => part.filePath === options.filePath) !== -1;
    });
    let currentLive = liveData[currentIndex];
    if (currentLive) {
      const currentPartIndex = currentLive.parts.findIndex((item) => {
        return item.filePath === options.filePath;
      });
      console.log(
        "currentLive",
        currentIndex,
        currentPartIndex,
        currentLive.parts,
        options.filePath,
      );
      const currentPart = currentLive.parts[currentPartIndex];
      currentPart.endTime = timestamp;
      currentPart.status = "recorded";
      currentLive.parts[currentPartIndex] = currentPart;
      liveData[currentIndex] = currentLive;
    } else {
      currentLive = {
        eventId: uuid(),
        platform: options.platform,
        roomId: options.roomId,
        videoName: options.title,
        parts: [
          {
            partId: uuid(),
            filePath: options.filePath,
            endTime: timestamp,
            status: "recorded",
          },
        ],
      };
      liveData.push(currentLive);
      currentIndex = liveData.length - 1;
    }
  }
}

describe("handleLiveData", () => {
  let liveData: Live[];

  it("event: FileOpening, liveData的情况", async () => {
    liveData = [];
    const options: Options = {
      event: "FileOpening",
      roomId: 123,
      platform: "bili-recorder",
      time: "2022-01-01T00:00:00Z",
      title: "Test Video",
      filePath: "/path/to/video.mp4",
      username: "test",
    };

    await handleLiveData(liveData, options);

    expect(liveData.length).toBe(1);
    expect(liveData[0].eventId).toBeDefined();
    expect(liveData[0].platform).toBe(options.platform);
    expect(liveData[0].startTime).toBe(new Date(options.time).getTime());
    expect(liveData[0].roomId).toBe(options.roomId);
    expect(liveData[0].videoName).toBe(options.title);
    expect(liveData[0].parts.length).toBe(1);
    expect(liveData[0].parts[0].partId).toBeDefined();
    expect(liveData[0].parts[0].startTime).toBe(new Date(options.time).getTime());
    expect(liveData[0].parts[0].filePath).toBe(options.filePath);
    expect(liveData[0].parts[0].status).toBe("recording");
  });

  it("event: FileClosed, liveData的情况", async () => {
    liveData = [];
    const options: Options = {
      event: "FileClosed",
      roomId: 123,
      platform: "bili-recorder",
      time: "2022-01-01T00:00:00Z",
      title: "Test Video",
      filePath: "/path/to/video.mp4",
      username: "test",
    };

    await handleLiveData(liveData, options);

    expect(liveData.length).toBe(1);
    expect(liveData[0].eventId).toBeDefined();
    expect(liveData[0].platform).toBe(options.platform);
    expect(liveData[0].roomId).toBe(options.roomId);
    expect(liveData[0].videoName).toBe(options.title);
    expect(liveData[0].parts.length).toBe(1);
    expect(liveData[0].parts[0].partId).toBeDefined();
    expect(liveData[0].parts[0].filePath).toBe(options.filePath);
    expect(liveData[0].parts[0].status).toBe("recorded");
  });

  it("存在live的情况下，且roomId相同，在限制时间内又进来一条数据", async () => {
    liveData = [];
    const existingLive: Live = {
      eventId: "existing-event-id",
      platform: "bili-recorder",
      startTime: new Date("2022-01-01T00:00:00Z").getTime(),
      roomId: 123,
      videoName: "Existing Video",
      parts: [
        {
          partId: "existing-part-id",
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          filePath: "/path/to/existing-video.mp4",
          status: "recording",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        },
      ],
    };
    liveData.push(existingLive);

    const options: Options = {
      event: "VideoFileCreatedEvent",
      roomId: 123,
      platform: "bili-recorder",
      time: "2022-01-01T00:09:00Z",
      title: "New Video",
      filePath: "/path/to/new-video.mp4",
      username: "test",
    };
    await handleLiveData(liveData, options);
    console.log("liveData", liveData, liveData.length);

    expect(liveData.length).toBe(1);
    expect(liveData[0].eventId).toBe(existingLive.eventId);
    expect(liveData[0].platform).toBe(existingLive.platform);
    expect(liveData[0].startTime).toBe(existingLive.startTime);
    expect(liveData[0].roomId).toBe(existingLive.roomId);
    expect(liveData[0].videoName).toBe(existingLive.videoName);
    expect(liveData[0].parts.length).toBe(2);
    expect(liveData[0].parts[0]).toBe(existingLive.parts[0]);
    expect(liveData[0].parts[1].partId).toBeDefined();
    expect(liveData[0].parts[1].startTime).toBe(new Date(options.time).getTime());
    expect(liveData[0].parts[1].filePath).toBe(options.filePath);
    expect(liveData[0].parts[1].status).toBe("recording");
  });
  it("存在live的情况下，且roomId相同，在限制时间外又进来一条数据", async () => {
    liveData = [];
    const existingLive: Live = {
      eventId: "existing-event-id",
      platform: "bili-recorder",
      startTime: new Date("2022-01-01T00:00:00Z").getTime(),
      roomId: 123,
      videoName: "Existing Video",
      parts: [
        {
          partId: "existing-part-id",
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          filePath: "/path/to/existing-video.mp4",
          status: "recording",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        },
      ],
    };
    liveData.push(existingLive);

    const options: Options = {
      event: "VideoFileCreatedEvent",
      roomId: 123,
      platform: "bili-recorder",
      time: "2022-01-01T00:16:00Z",
      title: "New Video",
      filePath: "/path/to/new-video.mp4",
      username: "test",
    };
    await handleLiveData(liveData, options);
    console.log("liveData", liveData, liveData.length);

    expect(liveData.length).toBe(2);
    expect(liveData[0].eventId).toBe(existingLive.eventId);
    expect(liveData[0].platform).toBe(existingLive.platform);
    expect(liveData[0].startTime).toBe(existingLive.startTime);
    expect(liveData[0].roomId).toBe(existingLive.roomId);
    expect(liveData[0].videoName).toBe(existingLive.videoName);
    expect(liveData[0].parts.length).toBe(1);
    expect(liveData[0].parts[0]).toBe(existingLive.parts[0]);
    expect(liveData[1].parts[0].partId).toBeDefined();
    // expect(liveData[0].parts[1].startTime).toBe(new Date(options.time).getTime());
    // expect(liveData[0].parts[1].filePath).toBe(options.filePath);
    // expect(liveData[0].parts[1].status).toBe("recording");
  });
  it("存在live的情况下，且roomId相同，在限制时间外又进来一条event: FileClosed数据", async () => {
    liveData = [];
    const existingLive: Live = {
      eventId: "existing-event-id",
      platform: "bili-recorder",
      startTime: new Date("2022-01-01T00:00:00Z").getTime(),
      roomId: 123,
      videoName: "Existing Video",
      parts: [
        {
          partId: "existing-part-id",
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          filePath: "/path/to/existing-video.mp4",
          status: "recording",
        },
      ],
    };
    liveData.push(existingLive);

    const options: Options = {
      event: "FileClosed",
      roomId: 123,
      platform: "bili-recorder",
      time: "2022-01-01T00:05:00Z",
      title: "Existing Video",
      filePath: "/path/to/existing-video.mp4",
      username: "test",
    };

    await handleLiveData(liveData, options);

    expect(liveData.length).toBe(1);
    expect(liveData[0].eventId).toBe(existingLive.eventId);
    expect(liveData[0].platform).toBe(existingLive.platform);
    expect(liveData[0].startTime).toBe(existingLive.startTime);
    expect(liveData[0].roomId).toBe(existingLive.roomId);
    expect(liveData[0].videoName).toBe(existingLive.videoName);
    expect(liveData[0].parts.length).toBe(1);
    expect(liveData[0].parts[0].partId).toBe(existingLive.parts[0].partId);
    expect(liveData[0].parts[0].startTime).toBe(existingLive.parts[0].startTime);
    expect(liveData[0].parts[0].filePath).toBe(existingLive.parts[0].filePath);
    expect(liveData[0].parts[0].endTime).toBe(new Date(options.time).getTime());
    expect(liveData[0].parts[0].status).toBe("recorded");
  });
  it("存在live的情况下，且最后一个part的结束时间并非最新，又进来一条event: FileClosed数据", async () => {
    liveData = [];
    const existingLive: Live = {
      eventId: "existing-event-id",
      platform: "bili-recorder",
      startTime: new Date("2022-01-01T00:00:00Z").getTime(),
      roomId: 123,
      videoName: "Existing Video",
      parts: [
        {
          partId: "existing-part-id2",
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          filePath: "/path/to/existing-video.mp4",
          status: "recorded",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        },
        {
          partId: "existing-part-id",
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          filePath: "/path/to/existing-video.mp4",
          status: "recording",
        },
      ],
    };
    liveData.push(existingLive);

    const options: Options = {
      event: "FileOpening",
      roomId: 123,
      platform: "bili-recorder",
      time: "2022-01-01T00:09:00Z",
      title: "Existing Video",
      filePath: "/path/to/existing-video.mp4",
      username: "test",
    };

    await handleLiveData(liveData, options);

    expect(liveData.length).toBe(1);
    expect(liveData[0].eventId).toBe(existingLive.eventId);
    expect(liveData[0].platform).toBe(existingLive.platform);
    expect(liveData[0].startTime).toBe(existingLive.startTime);
    expect(liveData[0].roomId).toBe(existingLive.roomId);
    expect(liveData[0].videoName).toBe(existingLive.videoName);
    expect(liveData[0].parts.length).toBe(3);
    // expect(liveData[0].parts[0].partId).toBe(existingLive.parts[0].partId);
    // expect(liveData[0].parts[0].startTime).toBe(existingLive.parts[0].startTime);
    // expect(liveData[0].parts[0].filePath).toBe(existingLive.parts[0].filePath);
    // expect(liveData[0].parts[0].endTime).toBe(new Date(options.time).getTime());
    // expect(liveData[0].parts[0].status).toBe("recorded");
  });
});
