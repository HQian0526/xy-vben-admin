<script lang="ts" setup>
import { defineEmits, defineProps, reactive } from 'vue';

import {
  ElButton,
  ElInput,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElSelect,
  ElOption
} from 'element-plus';

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
  <div class="table-container">
    <ElTable :data="props.list" :stripe="props.stripe ? props.stripe : false" :row-key="props.isTree ? 'id' : undefined"
      style="width: 100%; height: 100%">
      <template v-for="(item, index) in props.tableConfig.list" :key="item.prop">
        <!-- 索引列 -->
        <ElTableColumn v-if="item.prop === 'index'" :label="item.label ? item.label : ''" type="index" width="50" />
        <!-- 字典/过滤器赋值列 如1男 2女 -->
        <ElTableColumn v-else-if="item.filter" :prop="item.prop" :label="item.label"
          :width="item.width ? item.width : 'auto'" :sortable="item.sortable ? item.sortable : false">
          <template #default="scope">
            <div style="display: flex; align-items: center">
              {{ item.filter(scope.row[item.prop]) }}
            </div>
          </template>
        </ElTableColumn>
        <!-- 表格内input框编辑列 -->
        <ElTableColumn v-else-if="item.type && item.type === 'input'" :prop="item.prop" :label="item.label"
          :width="item.width ? item.width : 'auto'" :sortable="item.sortable ? item.sortable : false">
          <template #default="scope">
            <ElInput v-model="scope.row[item.prop]" :placeholder="$t('global.pleaseEnter')" />
          </template>
        </ElTableColumn>
        <!-- 表格内select下拉框编辑列 -->
        <ElTableColumn v-else-if="item.type && item.type === 'select'" :prop="item.prop" :label="item.label"
          :width="item.width ? item.width : 'auto'" :sortable="item.sortable ? item.sortable : false">
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
        <ElTableColumn v-else-if="item.type && item.type === 'number'" :prop="item.prop" :label="item.label"
          :width="item.width ? item.width : 'auto'" :sortable="item.sortable ? item.sortable : false">
          <template #default="scope">
            <el-input-number v-model="scope.row[item.prop]" :min="item.min ? item.min : 0"
              :max="item.max ? item.max : 999999" />
          </template>
        </ElTableColumn>
        <!-- 操作列 -->
        <ElTableColumn v-else-if="item.prop === 'operation'" :fixed="item.fixed ? item.fixed : false" :label="item.label"
          :width="item.width ? item.width : 'auto'" :sortable="item.sortable ? item.sortable : false">
          <template #default="scope">
            <template v-for="(op, ind) in item.operations" :key="ind">
              <ElButton :style="{
                display: op.isShow && !op.isShow(scope.row) ? 'none' : '',
              }" :type="op.type !== 'text' ? op.type : 'primary'" :link="op.type === 'text' ? true : false"
                @click="handleClick(scope.row, op.label)">
                {{ op.label }}
              </ElButton>
            </template>
          </template>
        </ElTableColumn>
        <!-- 正常列 -->
        <ElTableColumn v-else :prop="item.prop" :label="item.label" :width="item.width ? item.width : 'auto'"
          :sortable="item.sortable ? item.sortable : false" />
      </template>
    </ElTable>
    <!-- 分页 -->
    <div v-if="props.pagination === false ? false : true" class="table-pagination">
      <ElPagination v-model:current-page="page.currentPage" v-model:page-size="page.pageSize"
        :page-sizes="[10, 20, 30, 40, 50]" background layout="total, sizes, prev, pager, next, jumper"
        :total="props.total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 关键样式 */
.table-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  /* 居右 */
  margin-top: 10px;
  /* 可选：与表格的间距 */
}
</style>
