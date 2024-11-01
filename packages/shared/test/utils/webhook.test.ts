import { describe, it, expect } from "vitest";

import { formatTime, formatTitle } from "../../src/utils/webhook";

describe("formatTime", () => {
  it("should format the time correctly", () => {
    const time = "2022-01-01T12:34:56.789Z";
    const result = formatTime(time);
    expect(result).toEqual({
      year: "2022",
      month: "01",
      day: "01",
      hours: "20",
      minutes: "34",
      now: "2022.01.01",
      seconds: "56",
    });
  });
});

describe("formatTitle", () => {
  it("should format the title correctly", () => {
    const options = {
      title: "My Title",
      username: "Jo",
      time: "2022-01-01T12:34:56.789Z",
      roomId: 123456,
    };
    const template =
      "Title:{{title}},User:{{user}},Date:{{now}},yyyy:{{yyyy}},MM:{{MM}},dd:{{dd}},hours:{{HH}},m:{{mm}},s:{{ss}}";
    const result = formatTitle(options, template);
    expect(result).toBe(
      "Title:My Title,User:Jo,Date:2022.01.01,yyyy:2022,MM:01,dd:01,hours:20,m:34,s:56",
    );
  });
  it("should format the roomId correctly", () => {
    const options = {
      title: "My Title",
      username: "Jo",
      time: "2022-01-01T12:34:56.789Z",
      roomId: 123456,
    };
    const template = "{{roomId}}";
    const result = formatTitle(options, template);
    expect(result).toBe("123456");
  });
  it("should format the title correctly with ejs", () => {
    const options = {
      title: "My Title",
      username: "Jo",
      time: "2022-01-01T12:34:56.789Z",
      roomId: 123456,
    };
    const template = `Title:{{title}}<%= user %>-<%= time.getFullYear() %><%= String(time.getMonth() + 1).padStart(2, "0") %>直播录像`;
    const result = formatTitle(options, template);
    expect(result).toBe("Title:My TitleJo-202201直播录像");
  });

  // it("should format the title correctly with ejs parse error", () => {
  //   const options = {
  //     title: "My Title",
  //     username: "Jo",
  //     time: "2022-01-01T12:34:56.789Z",
  //     roomId: 123456,
  //   };
  //   const template = `Title:{{title}}<%= username %>-<%= time.getFullYear() %><%= String(time.getMonth() + 1).padStart(2, "0") %>直播录像`;
  //   const result = formatTitle(options, template);
  //   expect(result).toBe(
  //     `Title:My Title<%= user %>-<%= time.getFullYear() %><%= String(time.getMonth(`,
  //   );
  // });

  it("should trim the title to 80 characters", () => {
    process.env.TZ = "Europe/London";
    const options = {
      title: "This is a very long title that exceeds 80 characters",
      username: "John Doe",
      time: "2022-01-01T12:34:56.789Z",
      roomId: 123456,
    };
    const template = "Title: {{title}}, User: {{user}}, Date: {{now}}";
    const result = formatTitle(options, template);
    expect(result.length).toBe(80);
  });
});
