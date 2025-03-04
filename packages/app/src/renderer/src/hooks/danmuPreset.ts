import { danmuPresetApi } from "@renderer/apis";
import { useFileDialog } from "@vueuse/core";
import { uuid } from "@renderer/utils";
import { useDanmuPreset as useDanmuPresetStore } from "@renderer/stores";

import type { DanmuConfig } from "@biliLive-tools/types";

export const usePresetFile = () => {
  const notice = useNotice();
  const { getDanmuPresets } = useDanmuPresetStore();

  const exportPreset = async (config: DanmuConfig, name: string) => {
    const preset = config;
    const blob = new Blob([JSON.stringify(preset)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { open, onChange } = useFileDialog({
    accept: ".json", // Set to accept only image files
    directory: false, // Select directories instead of files if set true
    multiple: false,
  });

  onChange((files) => {
    if (!files) return;
    if (files.length === 0) return;
    importPreset(files[0]);
  });

  const importPreset = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const config = JSON.parse(e.target?.result as string) as DanmuConfig;
      await danmuPresetApi.save({
        id: uuid(),
        name: file.name.replace(".json", ""),
        config,
      });
      notice.success({
        title: "导入成功",
        duration: 1000,
      });
      getDanmuPresets();
    };
    reader.readAsText(file);
  };
  return {
    exportPreset,
    importPreset: open,
  };
};
