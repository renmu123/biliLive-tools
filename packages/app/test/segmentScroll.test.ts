import { expect, it } from "vitest";
import { scrollSegmentIntoView } from "../src/renderer/src/pages/Tools/pages/VideoCut/composables/segmentScroll";

it.each([
  { name: "完全可见", top: 150, bottom: 210, expected: 300 },
  { name: "恰好贴合视口边界", top: 102, bottom: 302, expected: 300 },
  { name: "部分越过顶部", top: 80, bottom: 140, expected: 208 },
  { name: "完全位于上方", top: -100, bottom: -40, expected: 28 },
  { name: "部分越过底部", top: 270, bottom: 330, expected: 398 },
  { name: "完全位于下方", top: 500, bottom: 560, expected: 628 },
  { name: "超高片段未居中", top: 80, bottom: 340, expected: 308 },
  { name: "超高片段已经居中", top: 72, bottom: 332, expected: 300 },
])("$name 时按需居中片段", ({ top, bottom, expected }) => {
  const container = {
    clientHeight: 200,
    clientTop: 2,
    scrollTop: 300,
    getBoundingClientRect: () => ({ top: 100 }),
  } as HTMLElement;
  const segment = { getBoundingClientRect: () => ({ top, bottom }) } as HTMLElement;
  scrollSegmentIntoView(container, segment);
  expect(container.scrollTop).toBe(expected);
});

it("片段栏隐藏时不滚动", () => {
  const container = { clientHeight: 0, scrollTop: 300 } as HTMLElement;
  scrollSegmentIntoView(container, {} as HTMLElement);
  expect(container.scrollTop).toBe(300);
});
