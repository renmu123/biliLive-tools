/** 只滚动片段栏，将未完全可见的片段居中，已可见时保持原位置。 */
export function scrollSegmentIntoView(container: HTMLElement, segment: HTMLElement) {
  if (!container.clientHeight) return;
  const viewportTop = container.getBoundingClientRect().top + container.clientTop;
  const viewportBottom = viewportTop + container.clientHeight;
  const { top, bottom } = segment.getBoundingClientRect();

  if (top >= viewportTop && bottom <= viewportBottom) return;
  container.scrollTop += (top + bottom) / 2 - (viewportTop + viewportBottom) / 2;
}
