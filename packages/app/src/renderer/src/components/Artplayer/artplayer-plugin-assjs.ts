import ASS from "assjs";

export default function artplayerPluginAss(option: { content: string }) {
  return (art) => {
    // art.layers.add({
    //   name: "assjs-subtitle",
    //   html: `<div class="assjs-subtitle"></div>`,
    //   style: {
    //     display: "none",
    //     position: "absolute",
    //     top: "20px",
    //     right: "20px",
    //   },
    // });

    const ass = new ASS(option.content, art.video, {
      // Subtitles will display in the container.
      container: art.video.parentNode,

      // see resampling API below
      // resampling: "video_width",
    });
    return {
      name: "artplayerPluginAss",
      ass: ass,
      // visible: adapter.visible,
      // init: adapter.init.bind(adapter),
      // switch: adapter.switch.bind(adapter),
      show: ass.show(),
      hide: ass.hide(),
      destroy: () => {
        ass.destroy();
        // ass = null;
      },
    };
  };
}
