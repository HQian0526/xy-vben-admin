<script lang="ts" setup>
import { computed, defineEmits, defineProps, reactive } from 'vue';

import {
  ElButton,
  ElImage,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { resolveFileUrl } from '#/utils';

const props = defineProps({
  tableConfig: {
    type: Object,
    default: () => ({
      list: [],
    }),
  },
  list: {
    type: Array,
    default: () => [],
  },
  total: {
    type: Number,
    default: 20,
  },
  isTree: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits<{
  // 点击操作按钮
  (e: 'handleClick', obj: Record<string, any>, label: string): void;
  // 页码改变
  (e: 'handleCurrentChange', currentPage: number): void;
  // 页码大小改变
  (e: 'handleSizeChange', pageSize: number): void;
}>();

const page = reactive({
  currentPage: 1,
  pageSize: 10,
});

// ElPagination 要求 total 必须是 number，否则会直接不渲染
const paginationTotal = computed(() => {
  const n = Number(props.total);
  return Number.isFinite(n) ? n : 0;
});

// 拼接图片完整地址（相对路径拼全局文件前缀）
const getImageUrl = (url: string) => {
  return resolveFileUrl(url);
};

// 点击操作按钮
const handleClick = (row: any, label: string) => {
  emit('handleClick', row, label);
};

// 页码改变
const handleCurrentChange = (currentPage: number) => {
  page.currentPage = currentPage;
  emit('handleCurrentChange', currentPage);
};

// 页码大小改变
const handleSizeChange = (pageSize: number) => {
  page.pageSize = pageSize;
  emit('handleSizeChange', pageSize);
};
</script>

<template>
  <div class="table-container" :class="{ 'is-fill': props.pagination !== false }">
    <div class="table-body">
      <ElTable
        :data="props.list"
        :stripe="props.stripe ? props.stripe : false"
        :row-key="props.isTree ? 'id' : undefined"
        :height="props.pagination !== false ? '100%' : undefined"
        style="width: 100%"
      >
      <template
        v-for="(item, index) in props.tableConfig.list"
        :key="item.prop"
      >
        <!-- 索引列 -->
        <ElTableColumn
          v-if="item.prop === 'index'"
          :label="item.label ? item.label : ''"
          type="index"
          width="50"
        />
        <!-- 字典/过滤器赋值列 如1男 2女 -->
        <ElTableColumn
          v-else-if="item.filter"
          :prop="item.prop"
          :label="item.label"
          :width="item.width ? item.width : 'auto'"
          :sortable="item.sortable ? item.sortable : false"
        >
          <template #default="scope">
            <div style="display: flex; align-items: center">
              {{ item.filter(scope.row[item.prop]) }}
            </div>
          </template>
        </ElTableColumn>
        <!-- 表格内input框编辑列 -->
        <ElTableColumn
          v-else-if="item.type && item.type === 'input'"
          :prop="item.prop"
          :label="item.label"
          :width="item.width ? item.width : 'auto'"
          :sortable="item.sortable ? item.sortable : false"
        >
          <template #default="scope">
            <ElInput
              v-model="scope.row[item.prop]"
              :placeholder="$t('global.pleaseEnter')"
            />
          </template>
        </ElTableColumn>
        <!-- 表格内select下拉框编辑列 -->
        <ElTableColumn
          v-else-if="item.type && item.type === 'select'"
          :prop="item.prop"
          :label="item.label"
          :width="item.width ? item.width : 'auto'"
          :sortable="item.sortable ? item.sortable : false"
        >
          <template #default="scope">
            <ElSelect
              v-model="scope.row[item.prop]"
              :placeholder="$t('global.pleaseSelect')"
              style="width: 100%"
            >
              <ElOption
                v-for="(itemSelect, indexSelect) in item.options"
                :label="itemSelect.label"
                :value="Number(itemSelect.value)"
                :key="indexSelect"
              />
            </ElSelect>
          </template>
        </ElTableColumn>
        <!-- 表格内数字输入框编辑列 -->
        <ElTableColumn
          v-else-if="item.type && item.type === 'number'"
          :prop="item.prop"
          :label="item.label"
          :width="item.width ? item.width : 'auto'"
          :sortable="item.sortable ? item.sortable : false"
        >
          <template #default="scope">
            <el-input-number
              v-model="scope.row[item.prop]"
              :min="item.min ? item.min : 0"
              :max="item.max ? item.max : 999999"
            />
          </template>
        </ElTableColumn>
        <!-- 图片列：单元格内居中展示 -->
        <ElTableColumn
          v-else-if="item.type && item.type === 'image'"
          :prop="item.prop"
          :label="item.label"
          :width="item.width ? item.width : '100px'"
          :sortable="item.sortable ? item.sortable : false"
          align="center"
        >
          <template #default="scope">
            <div class="table-img-cell">
              <ElImage
                v-if="scope.row[item.prop]"
                :src="getImageUrl(scope.row[item.prop])"
                :preview-src-list="[getImageUrl(scope.row[item.prop])]"
                fit="cover"
                style="width: 50px; height: 50px"
              />
            </div>
          </template>
        </ElTableColumn>
        <!-- 操作列 -->
        <ElTableColumn
          v-else-if="item.prop === 'operation'"
          :fixed="item.fixed ? item.fixed : false"
          :label="item.label"
          :width="item.width ? item.width : 'auto'"
          :sortable="item.sortable ? item.sortable : false"
        >
          <template #default="scope">
            <template v-for="(op, ind) in item.operations" :key="ind">
              <ElButton
                :style="{
                  display: op.isShow && !op.isShow(scope.row) ? 'none' : '',
                }"
                :type="op.type !== 'text' ? op.type : 'primary'"
                :link="op.type === 'text' ? true : false"
                @click="handleClick(scope.row, op.label)"
              >
                {{ op.label }}
              </ElButton>
            </template>
          </template>
        </ElTableColumn>
        <!-- 正常列 -->
        <ElTableColumn
          v-else
          :prop="item.prop"
          :label="item.label"
          :width="item.width ? item.width : 'auto'"
          :sortable="item.sortable ? item.sortable : false"
        />
      </template>
      </ElTable>
    </div>
    <!-- 分页：单独占位，避免被表格 height:100% 挤出卡片 -->
    <div
      v-if="props.pagination !== false"
      class="table-pagination"
    >
      <ElPagination
        v-model:current-page="page.currentPage"
        v-model:page-size="page.pageSize"
        :page-sizes="[10, 20, 30, 40, 50]"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="paginationTotal"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.table-container.is-fill {
  height: 100%;
  overflow: hidden;
}

.table-body {
  min-height: 0;
}

.table-container.is-fill .table-body {
  flex: 1;
  overflow: hidden;
}

.table-pagination {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  margin-top: 10px;
}

.table-img-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
