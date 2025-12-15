import { computed } from "vue";
import { darkTheme, lightTheme, useOsTheme } from "naive-ui";

export function useTheme() {
  const osThemeRef = useOsTheme();
  const theme = computed(() => {
    if (osThemeRef.value === "dark") {
      return darkTheme;
    } else {
      return lightTheme;
    }
  });

  const themeString = computed(() => osThemeRef.value);

  return { themeUI: theme, theme: themeString };
}
