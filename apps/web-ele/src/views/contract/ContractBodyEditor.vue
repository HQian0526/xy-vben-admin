<script lang="ts" setup>
import { nextTick, ref } from 'vue';

import { CONTRACT_VARS } from './contractContent';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    readonly?: boolean;
    showInsert?: boolean;
    placeholder?: string;
    rows?: number;
    vars?: Array<{ key: string; label: string }>;
  }>(),
  {
    readonly: false,
    showInsert: false,
    placeholder: '',
    rows: 16,
    vars: () => [...CONTRACT_VARS],
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const inputRef = ref();

const insertToken = (token: string) => {
  if (props.readonly) return;
  const current = props.modelValue || '';
  const el = inputRef.value?.textarea as HTMLTextAreaElement | undefined;
  if (!el) {
    emit('update:modelValue', current + token);
    return;
  }
  const start = el.selectionStart ?? current.length;
  const end = el.selectionEnd ?? current.length;
  const next = current.slice(0, start) + token + current.slice(end);
  emit('update:modelValue', next);
  nextTick(() => {
    el.focus();
    const pos = start + token.length;
    el.setSelectionRange(pos, pos);
  });
};

const insertVar = (key: string) => {
  insertToken(`{{${key}}}`);
};

defineExpose({ insertToken, insertVar });
</script>

<template>
  <div class="body-editor">
    <div v-if="showInsert && !readonly" class="var-bar">
      <span class="var-label">插入变量</span>
      <el-button
        v-for="item in props.vars"
        :key="item.key"
        size="small"
        @click="insertVar(item.key)"
      >
        {{ item.label }}
      </el-button>
    </div>
    <el-input
      ref="inputRef"
      :model-value="modelValue"
      type="textarea"
      :rows="rows"
      :readonly="readonly"
      :placeholder="placeholder"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
.body-editor {
  width: 100%;
}

.var-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.var-label {
  color: #909399;
  font-size: 12px;
  margin-right: 4px;
}

:deep(.el-textarea__inner) {
  font-family: 'PingFang SC', 'Microsoft YaHei', serif;
  line-height: 1.7;
  letter-spacing: 0.02em;
}
</style>
