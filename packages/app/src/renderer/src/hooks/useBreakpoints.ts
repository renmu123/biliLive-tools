import { useWindowSize } from "@vueuse/core";

export type Breakpoint = "mobile" | "desktop";

export function useBreakpoints() {
  const { width } = useWindowSize();
  const breakpoint = computed<Breakpoint>(() => (width.value <= 628 ? "mobile" : "desktop"));

  return {
    breakpoint,
    isMobile: computed(() => breakpoint.value === "mobile"),
    isDesktop: computed(() => breakpoint.value === "desktop"),
  };
}
