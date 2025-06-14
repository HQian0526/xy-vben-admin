<template>
  <div class="table-container">
    <el-table :data="props.list" style="width: 100%; height: 100%">
      <template v-for="(item, index) in tableConfig.list" :key="item.prop">
        <!-- 索引列 -->
        <el-table-column v-if="item.prop === 'index'" type="index" width="50" />
        <!-- 字典赋值列 如1男 2女 -->
        <el-table-column
          v-else-if="item.dict"
          :prop="item.prop"
          :label="item.label"
          :width="item.width ? item.width : 'auto'"
        >
          <template #default="scope">
            <div style="display: flex; align-items: center">
              {{ getDictValue(scope.row[item.prop], item.dict) }}
            </div>
          </template>
        </el-table-column>
        <!-- 操作列 -->
        <el-table-column
          v-else-if="item.prop === 'operation'"
          :fixed="item.fixed ? item.fixed : false"
          :label="item.label"
          :width="item.width ? item.width : 'auto'"
        >
          <template #default="scope">
            <template v-for="(op, ind) in item.operations" :key="ind">
              <el-button
                v-if="op.show"
                :type="op.type !== 'text' ? op.type : 'primary'"
                :link="op.type === 'text' ? true : false"
                @click="handleClick(scope.row, op.label)"
                >{{ op.label }}</el-button
              >
            </template>
          </template>
        </el-table-column>
        <!-- 正常列 -->
        <el-table-column
          v-else
          :prop="item.prop"
          :label="item.label"
          :width="item.width ? item.width : 'auto'"
        />
      </template>
    </el-table>
    <!-- 分页 -->
    <div
      v-if="tableConfig.pagination ? tableConfig.pagination : true"
      class="table-pagination"
    >
      <el-pagination
        v-model:current-page="page.currentPage"
        v-model:page-size="page.pageSize"
        :page-sizes="[10, 20, 30, 40, 50]"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="props.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElButton, ElPagination, ElTable, ElTableColumn } from 'element-plus';
import { defineEmits, defineProps, reactive } from 'vue';

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
});

let page = reactive({
  currentPage: 1,
  pageSize: 10,
});

const emit = defineEmits<{
  // 点击操作按钮
  (e: 'handleClick', obj: Record<string, any>, label: string): void;
  // 页码改变
  (e: 'handleCurrentChange', currentPage: number): void;
  // 页码大小改变
  (e: 'handleSizeChange', pageSize: number): void;
}>();

// 获取字典值
const getDictValue = (value: any, dict: any) => {
  let dictValue = '';
  dict.forEach((item) => {
    if (Number(item.key) === Number(value)) {
      dictValue = item.value;
    }
  });
  return dictValue;
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

<style lang="scss" scoped>
/* 关键样式 */
.table-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.table-pagination {
  display: flex;
  justify-content: flex-end; /* 居右 */
  margin-top: 10px; /* 可选：与表格的间距 */
}
</style>
