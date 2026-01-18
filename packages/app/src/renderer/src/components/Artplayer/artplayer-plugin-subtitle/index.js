import { WebVTTParser, WebVTTSerializer } from "./parser";

async function loadVtt(option, { getExt, srtToVtt, assToVtt }) {
  let text = "";

  // 如果直接提供了 content，使用 content
  if (option.content) {
    text = option.content;
  } else {
    // 否则从 URL 加载
    const response = await fetch(option.url);
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder(option.encoding || "utf-8");
    text = decoder.decode(buffer);
  }

  const type = option.type || (option.url ? getExt(option.url) : "vtt");
  switch (type) {
    case "srt": {
      return srtToVtt(text);
    }
    case "ass": {
      return assToVtt(text);
    }
    case "vtt": {
      return text;
    }
    default:
      return "";
  }
}

function mergeTrees(trees) {
  const parser = new WebVTTParser();
  const result = parser.parse("", "metadata");

  for (let i = 0; i < trees.length; i++) {
    const tree = trees[i];

    if (!tree.updated) {
      tree.updated = true;
      for (let j = 0; j < tree.cues.length; j++) {
        const cue = tree.cues[j];
        for (let k = 0; k < cue.tree.children.length; k++) {
          const children = cue.tree.children[k];
          children.value = `<div class="art-subtitle-${tree.name}">${children.value}</div>`;
        }
      }
    }

    result.cues.push(...tree.cues);
  }

  return result;
}

export default function artplayerPluginSubtitle({ subtitles = [] }) {
  return async (art) => {
    const { unescape, getExt, srtToVtt, assToVtt } = art.constructor.utils;

    const parser = new WebVTTParser();
    const seri = new WebVTTSerializer();

    const vtts = await Promise.all(
      subtitles.map((option) => {
        return loadVtt(option, { getExt, srtToVtt, assToVtt });
      }),
    );

    const trees = vtts.map((vtt, index) => {
      const tree = parser.parse(vtt, "metadata");
      tree.url = subtitles[index].url;
      tree.name = subtitles[index].name;
      return tree;
    });

    let lastUrl = "";
    function setTracks(trees = []) {
      const tree = mergeTrees(trees);
      const vtt = seri.serialize(tree.cues);
      URL.revokeObjectURL(lastUrl);
      const url = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
      lastUrl = url;
      art.option.subtitle.escape = false;
      art.subtitle.init({
        ...art.option.subtitle,
        url,
        type: "vtt",
        onVttLoad: unescape,
      });
    }

    setTracks(trees);

    // console.log(
    //   "Multiple subtitles plugin initialized with tracks:",
    //   trees.map((t) => t.name),
    // );
    return {
      name: "artplayerPluginSubtitle",
      tracks(names = []) {
        return setTracks(names.map((name) => trees.find((tree) => tree.name === name)));
      },
      reset() {
        return setTracks(trees);
      },
      async setContent(content = "", type = "vtt") {
        const vttContent = await loadVtt({ content, type }, { getExt, srtToVtt, assToVtt });
        const tree = parser.parse(vttContent, "metadata");
        const vtt = seri.serialize(tree.cues);
        URL.revokeObjectURL(lastUrl);
        const url = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
        lastUrl = url;
        art.option.subtitle.escape = false;
        art.subtitle.init({
          ...art.option.subtitle,
          url,
          type: "vtt",
          onVttLoad: unescape,
        });
      },
    };
  };
}

// if (typeof window !== "undefined") {
//   window.artplayerPluginMultipleSubtitles = artplayerPluginMultipleSubtitles;
// }
