import { expect, describe, it } from "vitest";
// import { XMLParser, XMLBuilder } from "fast-xml-parser";

export const genFfmpegParams = (options) => {
  const result: any[] = [];
  Object.entries(options).forEach(([key, value]) => {
    if (key === "encoder") {
      result.push(`-c:v ${value}`);
    } else if (key === "bitrateControl") {
      if (value === "CRF" && options.crf) {
        result.push(`-crf ${options.crf}`);
      } else if (value === "VBR" && options.bitrate) {
        result.push(`-b:v ${options.bitrate}k`);
      } else if (value === "CQ" && options.crf) {
        result.push(`-rc vbr`);
        result.push(`-cq ${options.crf}`);
      }
    } else if (key === "crf") {
      // do nothing
    } else if (key === "preset") {
      result.push(`-preset ${value}`);
    } else if (key === "resetResolution") {
      if (value && options.resolutionWidth && options.resolutionHeight) {
        result.push(`-s ${options.resolutionWidth}x${options.resolutionHeight}`);
      }
    }
  });
  return result;
};

export const genFfmpegParams2 = (options) => {
  const result: any[] = [];
  if (options.encoder) {
    result.push(`-c:v ${options.encoder}`);
  }
  switch (options.bitrateControl) {
    case "CRF":
      if (options.crf) {
        result.push(`-crf ${options.crf}`);
      }
      break;
    case "VBR":
      if (options.bitrate) {
        result.push(`-b:v ${options.bitrate}k`);
      }
      break;
    case "CQ":
      if (options.crf) {
        result.push(`-rc vbr`);
        result.push(`-cq ${options.crf}`);
      }
      break;
  }
  if (options.preset) {
    result.push(`-preset ${options.preset}`);
  }
  if (options.resetResolution && options.resolutionWidth && options.resolutionHeight) {
    result.push(`-s ${options.resolutionWidth}x${options.resolutionHeight}`);
  }
  return result;
};

describe("Compare genFfmpegParams and genFfmpegParams2", () => {
  it("should return the same output", () => {
    const input = {
      encoder: "h264_nvenc",
      bitrateControl: "VBR",
      crf: 18,
      preset: "p4",
      bitrate: 8000,
      decode: true,
      resetResolution: true,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    // @ts-ignore
    const output1 = genFfmpegParams(input);
    // @ts-ignore
    const output2 = genFfmpegParams2(input);
    expect(output1).toEqual(output2);
  });
  it("should return the same output2", () => {
    const input = {
      encoder: "libsvtav1",
      bitrateControl: "CRF",
      crf: 31,
      preset: "6",
      bitrate: 8000,
      extraOptions: "-svtav1-params tune=0",
      bit10: false,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    // @ts-ignore
    const output1 = genFfmpegParams(input);
    // @ts-ignore
    const output2 = genFfmpegParams2(input);
    expect(output1).toEqual(output2);
  });
});

// const filterBlacklist = (XMLdata: string, blacklist: string[]) => {
//   const parser = new XMLParser({ ignoreAttributes: false });
//   const jObj = parser.parse(XMLdata);
//   console.log(jObj);
//   // const danmuku = jObj?.i?.d || [];

//   const builder = new XMLBuilder();
//   const xmlContent = builder.build(jObj);

//   return xmlContent;
// };

// describe("filter blacklist", () => {
//   it("should return the same output", () => {
//     const input = {
//       encoder: "h264_nvenc",
//       bitrateControl: "VBR",
//       crf: 18,
//       preset: "p4",
//       bitrate: 8000,
//       decode: true,
//       resetResolution: true,
//       resolutionWidth: 3840,
//       resolutionHeight: 2160,
//     };
//     // @ts-ignore
//     const output1 = genFfmpegParams(input);
//     // @ts-ignore
//     const output2 = genFfmpegParams2(input);
//     expect(output1).toEqual(output2);
//   });
// });
