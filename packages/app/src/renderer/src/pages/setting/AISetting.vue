<template>
  <div class="">
    <div style="display: flex; gap: 10px; align-items: center">
      <h2 style="display: inline-flex; align-items: center">
        AI配置<Tip :size="22">配置AI服务供应商，用于AI相关功能</Tip>
      </h2>
    </div>

    <n-form label-placement="left" :label-width="145">
      <n-tabs type="segment" style="margin-top: 10px" class="tabs">
        <!-- AI供应商配置列表 -->
        <n-tab-pane class="tab-pane" name="vendors" tab="AI供应商" display-directive="show:lazy">
          <div class="vendor-list">
            <n-card
              v-for="(vendor, index) in config.ai.vendors"
              :key="index"
              class="vendor-card"
              hoverable
            >
              <div class="vendor-content">
                <div class="vendor-header">
                  <n-tag :type="getProviderType(vendor.provider)">
                    {{ getProviderLabel(vendor.provider) }}
                  </n-tag>
                  <n-text strong>{{ vendor.name }}</n-text>
                </div>
                <div class="vendor-info">
                  <!-- <n-text v-if="vendor.baseURL" depth="3" style="font-size: 12px">
                    Base URL: {{ vendor.baseURL }}
                  </n-text> -->
                </div>
                <div class="vendor-actions">
                  <n-button size="small" @click="editVendor(index)">编辑</n-button>
                  <n-button size="small" type="error" @click="deleteVendor(index)">删除</n-button>
                </div>
              </div>
            </n-card>

            <!-- 添加新供应商卡片 -->
            <n-card class="vendor-card add-vendor-card" hoverable @click="addVendor">
              <div class="add-card">
                <n-icon :size="48" :component="Add" />
                <n-text>添加AI供应商</n-text>
              </div>
            </n-card>
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-form>

    <!-- 编辑供应商弹窗 -->
    <n-modal v-model:show="vendorModalVisible" :mask-closable="false" auto-focus>
      <n-card
        style="width: 600px; max-height: 80%"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
        class="card"
        :title="editingVendorIndex === null ? '添加AI供应商' : '编辑AI供应商'"
      >
        <n-form label-placement="left" :label-width="100">
          <n-form-item label="供应商类型">
            <n-select
              v-model:value="editingVendor.provider"
              :options="providerOptions"
              placeholder="请选择供应商"
            />
          </n-form-item>

          <n-form-item label="配置名称">
            <n-input
              v-model:value="editingVendor.name"
              placeholder="请输入配置名称（用于区分多个配置）"
            />
          </n-form-item>

          <n-form-item label="API Key">
            <n-input
              v-model:value="editingVendor.apiKey"
              type="password"
              show-password-on="click"
              placeholder="请输入API Key"
            />
          </n-form-item>

          <!-- <n-form-item>
            <template #label>
              <Tip text="Base URL" tip="可选，自定义API地址。如果使用官方接口可以留空"></Tip>
            </template>
            <n-input
              v-model:value="editingVendor.baseURL"
              placeholder="可选，留空使用默认地址"
            />
          </n-form-item> -->
        </n-form>

        <template #footer>
          <div class="footer">
            <n-button class="btn" @click="vendorModalVisible = false">取消</n-button>
            <n-button class="btn" type="primary" @click="saveVendor">保存</n-button>
          </div>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { Add } from "@vicons/ionicons5";
import { useConfirm } from "@renderer/hooks";
import type { AppConfig } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => ({
    ai: {
      vendors: [],
    },
  }),
});

const notice = useNotice();
const confirm = useConfirm();

// 供应商选项
const providerOptions = [
  { label: "阿里云", value: "aliyun" },
  // 未来可扩展更多供应商
  // { label: "OpenAI", value: "openai" },
  // { label: "百度", value: "baidu" },
];

const getProviderLabel = (provider: string) => {
  const option = providerOptions.find((opt) => opt.value === provider);
  return option ? option.label : provider;
};

const getProviderType = (provider: string) => {
  const typeMap: Record<string, any> = {
    aliyun: "success",
    openai: "info",
    baidu: "warning",
  };
  return typeMap[provider] || "default";
};

// 编辑状态
const vendorModalVisible = ref(false);
const editingVendorIndex = ref<number | null>(null);
const editingVendor = ref<{
  provider: string;
  name: string;
  apiKey: string;
  baseURL?: string;
}>({
  provider: "aliyun",
  name: "",
  apiKey: "",
  baseURL: "",
});

const addVendor = () => {
  editingVendorIndex.value = null;
  editingVendor.value = {
    provider: "aliyun",
    name: "",
    apiKey: "",
    baseURL: "",
  };
  vendorModalVisible.value = true;
};

const editVendor = (index: number) => {
  editingVendorIndex.value = index;
  const vendor = config.value.ai.vendors[index];
  editingVendor.value = {
    provider: vendor.provider,
    name: vendor.name,
    apiKey: vendor.apiKey,
    baseURL: vendor.baseURL || "",
  };
  vendorModalVisible.value = true;
};

const deleteVendor = async (index: number) => {
  const vendor = config.value.ai.vendors[index];
  const status = await confirm.warning({
    content: `确定要删除供应商配置"${vendor.name}"吗？`,
  });
  if (!status) return;

  config.value.ai.vendors.splice(index, 1);
  notice.success("供应商配置已删除");
};

const saveVendor = () => {
  if (!editingVendor.value.name) {
    notice.error("配置名称不能为空");
    return;
  }
  if (!editingVendor.value.apiKey) {
    notice.error("API Key不能为空");
    return;
  }

  // 检查名称是否重复（编辑时排除自己）
  const nameExists = config.value.ai.vendors.some((vendor, index) => {
    if (editingVendorIndex.value !== null && index === editingVendorIndex.value) {
      return false;
    }
    return vendor.name === editingVendor.value.name;
  });

  if (nameExists) {
    notice.error("配置名称已存在，请使用其他名称");
    return;
  }

  const vendorData = {
    provider: editingVendor.value.provider as "aliyun",
    name: editingVendor.value.name,
    apiKey: editingVendor.value.apiKey,
    baseURL: editingVendor.value.baseURL || undefined,
  };

  if (editingVendorIndex.value === null) {
    config.value.ai.vendors.push(vendorData);
    notice.success("供应商配置已添加");
  } else {
    config.value.ai.vendors[editingVendorIndex.value] = vendorData;
    notice.success("供应商配置已更新");
  }

  vendorModalVisible.value = false;
};
</script>

<style scoped lang="less">
.item {
  display: flex;
}

.tab-pane {
  padding: 12px 0 !important;
}

.tabs {
  :deep(.n-tabs-tab) {
    padding: 6px 0;
  }
}

.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 8px;
  }
}

.vendor-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
}

.vendor-card {
  height: 100%;
  min-height: 140px;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .vendor-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
  }

  .vendor-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .vendor-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  .vendor-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
}

.add-vendor-card {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  .add-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--n-text-color-disabled);
    transition: all 0.3s;
  }

  &:hover {
    .add-card {
      color: var(--n-text-color);
    }
  }
}
</style>
