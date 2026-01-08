import { defineStore } from "pinia";
import { darkTheme, lightTheme, useOsTheme, type GlobalTheme } from "naive-ui";

export const useThemeStore = defineStore("theme", () => {
  const THEME_KEY = "theme";

  const manualTheme = ref<null | string | "system" | "dark" | "light">(
    localStorage.getItem(THEME_KEY) || "system",
  );

  const osThemeRef = useOsTheme();

  const themeUI = computed<GlobalTheme | null>(() => {
    if (manualTheme.value === "dark") {
      return darkTheme;
    } else if (manualTheme.value === "light") {
      return lightTheme;
    }

    if (osThemeRef.value === "dark") {
      return darkTheme;
    } else {
      return lightTheme;
    }
  });

  const theme = computed(() => {
    if (manualTheme.value === "dark") {
      return "dark";
    } else if (manualTheme.value === "light") {
      return "light";
    }
    return osThemeRef.value || "light";
  });

  const setTheme = (newTheme: "system" | "dark" | "light") => {
    window?.api?.common?.setTheme(newTheme);

    if (newTheme === "system") {
      localStorage.removeItem(THEME_KEY);
      document.documentElement.removeAttribute("data-theme");
      manualTheme.value = "system";
    } else {
      localStorage.setItem(THEME_KEY, newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      manualTheme.value = newTheme;
    }
  };
  const initDataTheme = (theme: string | null) => {
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  };
  initDataTheme(manualTheme.value);

  return { themeUI, theme, setTheme };
});
