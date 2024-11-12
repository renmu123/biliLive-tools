<template>
  <div class="dynamic-tags">
    <div v-for="(tag, index) in tags" :key="index" class="tag">
      {{ tag }}
      <n-icon size="14" class="remove-icon" @click="removeTag(index)">
        <svg
          viewBox="0 0 12 12"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g fill="currentColor" fill-rule="nonzero">
              <path
                d="M2.08859116,2.2156945 L2.14644661,2.14644661 C2.32001296,1.97288026 2.58943736,1.95359511 2.7843055,2.08859116 L2.85355339,2.14644661 L6,5.293 L9.14644661,2.14644661 C9.34170876,1.95118446 9.65829124,1.95118446 9.85355339,2.14644661 C10.0488155,2.34170876 10.0488155,2.65829124 9.85355339,2.85355339 L6.707,6 L9.85355339,9.14644661 C10.0271197,9.32001296 10.0464049,9.58943736 9.91140884,9.7843055 L9.85355339,9.85355339 C9.67998704,10.0271197 9.41056264,10.0464049 9.2156945,9.91140884 L9.14644661,9.85355339 L6,6.707 L2.85355339,9.85355339 C2.65829124,10.0488155 2.34170876,10.0488155 2.14644661,9.85355339 C1.95118446,9.65829124 1.95118446,9.34170876 2.14644661,9.14644661 L5.293,6 L2.14644661,2.85355339 C1.97288026,2.67998704 1.95359511,2.41056264 2.08859116,2.2156945 L2.14644661,2.14644661 L2.08859116,2.2156945 Z"
              ></path>
            </g>
          </g>
        </svg>
      </n-icon>
    </div>
    <n-input
      v-if="canAddTag"
      v-model:value="newTag"
      :placeholder="placeholder"
      class="tag-input"
      :loading="loading"
      @keyup.enter="addTag"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Props {
  max: number;
  beforeCreate?: (tag: string) => Promise<boolean>;
  placeholder?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  max: -1,
  placeholder: "回车输入内容",
});

const tags = defineModel<string[]>({ required: true, default: [] });

const newTag = ref<string>("");

const canAddTag = computed(() => props.max === -1 || tags.value.length < props.max);

const addTag = async (): Promise<void> => {
  if (!newTag.value) return;

  try {
    const canCreate = props.beforeCreate ? await props.beforeCreate(newTag.value) : true;
    if (canCreate && canAddTag.value) {
      tags.value.push(newTag.value);
      newTag.value = "";
    }
  } catch (e) {
    console.error(e);
  }
};

const removeTag = (index: number): void => {
  tags.value.splice(index, 1);
};
</script>

<style scoped>
.dynamic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.tag {
  background-color: var(--tag-bg, #f0f0f0);
  border-radius: 3px;
  padding: 6px 9px;
  display: flex;
  align-items: center;
  color: var(--tag-text, #000);
  font-size: 14px;
}

.remove-icon {
  border-radius: 3px;
  padding: 2px;
  cursor: pointer;
  margin-left: 4px;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.remove-icon:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.tag-input {
  flex: 1;
  width: 100%;
  flex-basis: 100px;
}

.tag-input:hover {
  border-color: #36ad6a;
}

.tag-input:focus {
  border-color: #36ad6a;
  outline: none;
}

@media (prefers-color-scheme: dark) {
  .tag {
    --tag-bg: #333;
    --tag-text: #fff;
  }

  .tag-input {
    --input-border: #444;
    --input-text: #fff;
    --input-bg: #333;
  }
}
</style>
