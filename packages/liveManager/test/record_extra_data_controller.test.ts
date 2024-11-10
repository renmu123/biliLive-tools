import { describe, it, expect } from "vitest";
import { convert2Xml, RecordExtraData } from "../src/record_extra_data_controller.js";

describe("convert2Xml", () => {
  it("should convert record extra data to XML format", () => {
    const data: RecordExtraData = {
      meta: {
        recordStartTimestamp: 1633072800000,
      },
      messages: [
        {
          type: "comment",
          timestamp: 1633072801000,
          text: "Hello World",
          sender: { uid: "123", name: "user1" },
          color: "#ffffff",
          mode: 1,
        },
        {
          type: "give_gift",
          timestamp: 1633072802000,
          name: "Gift",
          count: 1,
          price: 100,
          sender: { uid: "124", name: "user2" },
        },
        {
          type: "super_chat",
          timestamp: 1633072803000,
          text: "Super Chat",
          price: 200,
          sender: { uid: "125", name: "user3" },
        },
        {
          type: "guard",
          timestamp: 1633072804000,
          name: "Guard",
          count: 1,
          price: 300,
          level: 1,
          sender: { uid: "126", name: "user4" },
        },
      ],
    };

    const xml = convert2Xml(data);

    const expectedXml = `<?xml version="1.0" encoding="utf-8"?>
<i>
  <metadata>
    <platform>douyu</platform>
    <video_start_time>1633072800000</video_start_time>
  </metadata>
  <d p="1,1,25,16777215,1633072801000,0,123,123,0" user="user1" uid="123">Hello World</d>
  <gift ts="2" giftname="Gift" giftcount="1" price="100000" user="user2" uid="124"></gift>
  <sc ts="3" price="200000" user="user3" uid="125">Super Chat</sc>
  <guard ts="4" price="300000" giftname="Guard" giftcount="1" level="1" user="user4" uid="126"></guard>
</i>
`;

    expect(xml).toBe(expectedXml);
  });
});
