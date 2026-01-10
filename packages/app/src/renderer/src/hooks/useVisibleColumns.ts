import { ref, watch } from "vue";

export interface ColumnConfig {
  value: string;
  label: string;
}

export interface UseVisibleColumnsOptions {
  columns: ColumnConfig[];
  storageKey: string;
}

export function useVisibleColumns(options: UseVisibleColumnsOptions) {
  const { columns, storageKey } = options;

  // 获取默认显示的列
  const getDefaultColumns = (): string[] => {
    // 如果没有提供默认列，则全部显示
    return columns.map((col) => col.value);
  };

  // 初始化可见列
  const initVisibleColumns = (): string[] => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error("解析保存的列配置失败:", error);
        return getDefaultColumns();
      }
    }
    return getDefaultColumns();
  };

  // 保存列配置到本地存储
  const saveColumnConfig = (value: string[]) => {
    localStorage.setItem(storageKey, JSON.stringify(value));
  };

  // 可见列配置
  const visibleColumns = ref<string[]>(initVisibleColumns());

  // 监听变化并保存
  watch(
    () => visibleColumns.value,
    (newVal) => {
      saveColumnConfig(newVal);
    },
  );

  return {
    visibleColumns,
  };
}
