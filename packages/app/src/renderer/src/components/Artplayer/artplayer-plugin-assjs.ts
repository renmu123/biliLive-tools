import ASS from "assjs";

export default function artplayerPluginAss(option: { content?: string }) {
  return (art) => {
    let ass = new ASS(option.content || "", art.video, {
      // Subtitles will display in the container.
      container: art.video.parentNode,

      // see resampling API below
      // resampling: "video_width",
    });
    const switchContent = (content: string) => {
      ass.destroy();

      ass = new ASS(content, art.video, {
        container: art.video.parentNode,
      });
    };
    return {
      name: "artplayerPluginAss",
      ass: ass,
      // visible: adapter.visible,
      // init: adapter.init.bind(adapter),
      // switch: adapter.switch.bind(adapter),
      show: ass.show(),
      hide: ass.hide(),
      switch: switchContent,
      destroy: () => {
        ass.destroy();
        // ass = null;
      },
    };
  };
}
