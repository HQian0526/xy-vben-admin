<script lang="ts" setup>
import { computed } from 'vue';

import { $t } from '#/locales';

import ContractPrintSheet from './ContractPrintSheet.vue';

const props = defineProps<{
  visible: boolean;
  loading: boolean;
  data: null | Record<string, any>;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  print: [];
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
});
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$t('global.contract.printPreview')"
    width="860px"
    append-to-body
    :close-on-click-modal="false"
  >
    <div v-loading="loading" class="print-preview">
      <ContractPrintSheet v-if="data" :data="data" />
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ $t('global.btn.cancel') }}</el-button>
      <el-button type="primary" :disabled="!data" @click="emit('print')">
        {{ $t('global.btn.print') }}
      </el-button>
    </template>
  </el-dialog>

  <Teleport to="body">
    <div v-if="visible && data" class="contract-print-root">
      <ContractPrintSheet :data="data" />
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.print-preview {
  min-height: 240px;
  max-height: 70vh;
  overflow: auto;
  background: #f2f3f5;
  padding: 16px;
  border-radius: 6px;
}

.print-preview :deep(.print-sheet) {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
</style>

<style lang="scss">
.contract-print-root {
  position: absolute;
  left: -9999px;
  top: 0;
  width: 210mm;
  background: #fff;
  pointer-events: none;
}

@media print {
  @page {
    size: A4;
    margin: 12mm;
  }

  html,
  body {
    height: auto !important;
    overflow: visible !important;
    background: #fff !important;
  }

  body > *:not(.contract-print-root) {
    display: none !important;
  }

  .contract-print-root {
    position: static !important;
    left: auto !important;
    top: auto !important;
    width: auto !important;
    background: #fff !important;
    pointer-events: auto !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
