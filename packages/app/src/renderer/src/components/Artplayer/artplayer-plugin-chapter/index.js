import style from "./style.less?inline";

export default function artplayerPluginChapter(option = {}) {
  return (art) => {
    const { $player } = art.template;
    const { setStyle, append, clamp, query, addClass, removeClass } = art.constructor.utils;

    const html = `
                <div class="art-chapter">
                    <div class="art-chapter-inner">
                        <div class="art-progress-hover"></div>
                        <div class="art-progress-loaded"></div>
                        <div class="art-progress-played"></div>
                    </div>
                </div>
        `;

    let $chapters = [];

    const $inner = art.query(".art-control-progress-inner");
    const $control = append($inner, '<div class="art-chapters"></div>');
    const $title = append($inner, '<div class="art-chapter-title"></div>');

    function showTitle({ $chapter, width }) {
      const title = $chapter.dataset.title.trim();
      if (title) {
        $title.textContent = title;
        const titleWidth = $title.clientWidth;
        if (width <= titleWidth / 2) {
          setStyle($title, "left", 0);
        } else if (width > $inner.clientWidth - titleWidth / 2) {
          setStyle($title, "left", `${$inner.clientWidth - titleWidth}px`);
        } else {
          setStyle($title, "left", `${width - titleWidth / 2}px`);
        }
      }
    }

    function update(chapters = []) {
      $chapters = [];
      $control.textContent = "";
      removeClass($player, "artplayer-plugin-chapter");

      if (!Array.isArray(chapters)) return;
      if (!chapters.length) return;
      if (!art.duration) return;

      chapters = chapters.sort((a, b) => a.start - b.start);

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const nextChapter = chapters[i + 1];

        if (chapter.end === Infinity) {
          chapter.end = art.duration;
        }

        if (
          typeof chapter.start !== "number" ||
          typeof chapter.end !== "number" ||
          typeof chapter.title !== "string"
        ) {
          throw new TypeError("Illegal chapter data type");
        }

        if (chapter.start < 0 || chapter.start >= chapter.end) {
          throw new Error("Illegal chapter time point");
        }
        if (chapter.end > art.duration) {
          chapter.end = art.duration;
        }
      }

      $chapters = chapters.map((chapter) => {
        const $chapter = append($control, html);
        const start = clamp(chapter.start, 0, art.duration);
        const end = clamp(chapter.end, 0, art.duration);
        const duration = end - start;
        const percentage = duration / art.duration;
        $chapter.dataset.start = start;
        $chapter.dataset.end = end;
        $chapter.dataset.duration = duration;
        $chapter.dataset.title = chapter.title.trim();
        $chapter.style.left = `${(start / art.duration) * 100}%`;
        $chapter.style.width = `${percentage * 100}%`;
        if (chapter.color) {
          $chapter.style.setProperty("--color", chapter.color);
        }

        return {
          $chapter,
          $hover: query(".art-progress-hover", $chapter),
          $loaded: query(".art-progress-loaded", $chapter),
          $played: query(".art-progress-played", $chapter),
        };
      });

      addClass($player, "artplayer-plugin-chapter");
      art.emit("setBar", "loaded", art.loaded || 0);
    }

    art.on("setBar", (type, percentage) => {
      if (!$chapters.length) return;

      let hoverInChapter = false;

      for (let i = 0; i < $chapters.length; i++) {
        const { $chapter, $loaded, $played, $hover } = $chapters[i];

        const $target = {
          hover: $hover,
          loaded: $loaded,
          played: $played,
        }[type];

        if (!$target) return;

        const width = $control.clientWidth * percentage;
        const currentTime = art.duration * percentage;
        const duration = Number.parseFloat($chapter.dataset.duration);
        const start = Number.parseFloat($chapter.dataset.start);
        const end = Number.parseFloat($chapter.dataset.end);

        if (currentTime < start) {
          setStyle($target, "width", 0);
        }

        if (currentTime > end) {
          setStyle($target, "width", "100%");
        }

        if (currentTime >= start && currentTime <= end) {
          const percentage = (currentTime - start) / duration;
          setStyle($target, "width", `${percentage * 100}%`);

          if (type === "hover" && width > 0) {
            hoverInChapter = true;
            showTitle({ $chapter, width });
          }
        }
      }

      if (type === "hover" && !hoverInChapter) {
        $title.textContent = "";
      }
    });

    art.once("video:loadedmetadata", () => update(option.chapters));

    return {
      name: "artplayerPluginChapter",
      update: ({ chapters }) => update(chapters),
    };
  };
}

if (typeof document !== "undefined") {
  const id = "artplayer-plugin-chapter";
  let $style = document.getElementById(id);
  if (!$style) {
    $style = document.createElement("style");
    $style.id = id;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        document.head.appendChild($style);
      });
    } else {
      (document.head || document.documentElement).appendChild($style);
    }
  }
  $style.textContent = style;
}
