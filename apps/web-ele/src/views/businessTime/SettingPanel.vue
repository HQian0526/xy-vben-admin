<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { ElMessage, ElMessageBox } from 'element-plus';

import { editStoreApi, updateBusinessHoursApi } from '#/api';
import { $t } from '#/locales';

import {
  ALL_DAYS,
  formatBusinessHoursText,
  getOpenStatus,
  parseBusinessHours,
  sameDays,
  STORE_STATUS_CLOSED,
  STORE_STATUS_OPEN,
  timeToMinutes,
  WEEKDAYS,
} from './hours';

const props = defineProps<{
  store: Record<string, any>;
}>();

const emit = defineEmits<{
  updated: [store?: Record<string, any>];
}>();

const hoursMode = ref<'all' | 'custom'>('all')
const selectedDays = ref<number[]>([...ALL_DAYS])
const startTime = ref('08:00')
const endTime = ref('23:00')
const statusSubmitting = ref(false)
const hoursSubmitting = ref(false)
const feeSubmitting = ref(false)
const deliveryFee = ref(0)
const localStore = reactive<Record<string, any>>({})

const weekdayOptions = computed(() => [
  { label: $t('global.businessTime.monday'), value: 1 },
  { label: $t('global.businessTime.tuesday'), value: 2 },
  { label: $t('global.businessTime.wednesday'), value: 3 },
  { label: $t('global.businessTime.thursday'), value: 4 },
  { label: $t('global.businessTime.friday'), value: 5 },
  { label: $t('global.businessTime.saturday'), value: 6 },
  { label: $t('global.businessTime.sunday'), value: 7 },
])

const openStatus = computed(() => getOpenStatus(localStore))
const isOpenNow = computed(() => openStatus.value === 'open')
const statusLabel = computed(() => {
  if (openStatus.value === 'closed') return $t('global.businessTime.closed')
  if (openStatus.value === 'rest') return $t('global.businessTime.rest')
  return $t('global.businessTime.open')
})
const statusTip = computed(() => {
  if (localStore.statusHint) return String(localStore.statusHint)
  if (openStatus.value === 'closed') return $t('global.businessTime.closedTip')
  if (openStatus.value === 'rest') return $t('global.businessTime.restTip')
  return $t('global.businessTime.openTip')
})
const hoursPreview = computed(() => {
  if (hoursMode.value === 'all') {
    return $t('global.businessTime.hoursPreviewAll')
  }
  if (!selectedDays.value.length) {
    return $t('global.businessTime.selectWeekday')
  }
  return formatBusinessHoursText({
    rules: [
      {
        days: selectedDays.value,
        start: startTime.value,
        end: endTime.value,
      },
    ],
  })
})

function applyStore(store: Record<string, any>) {
  Object.assign(localStore, store || {})
  const fee = Number(store?.deliveryFee)
  deliveryFee.value = Number.isFinite(fee) && fee >= 0 ? fee : 0
  const hours = parseBusinessHours(store?.businessHours)
  const rule = (hours.rules || [])[0]
  if (!rule || !(rule.days || []).length) {
    hoursMode.value = 'all'
    selectedDays.value = [...ALL_DAYS]
    startTime.value = '08:00'
    endTime.value = '23:00'
    return
  }
  hoursMode.value = 'custom'
  selectedDays.value = [
    ...new Set((rule.days || []).map(Number).filter((d: number) => d >= 1 && d <= 7)),
  ]
  startTime.value = rule.start || '08:00'
  endTime.value = rule.end || '23:00'
}

watch(
  () => props.store,
  (store) => {
    if (store) applyStore(store)
  },
  { immediate: true, deep: true },
)

function applyPreset(type: 'all' | 'everyday' | 'weekdays') {
  if (type === 'all') {
    hoursMode.value = 'all'
    return
  }
  hoursMode.value = 'custom'
  selectedDays.value = type === 'weekdays' ? [...WEEKDAYS] : [...ALL_DAYS]
}

async function handleToggle() {
  if (statusSubmitting.value || !localStore.id) return
  const nextCode = isOpenNow.value ? STORE_STATUS_CLOSED : STORE_STATUS_OPEN
  try {
    await ElMessageBox.confirm(
      isOpenNow.value
        ? localStore.nextOpenText
          ? $t('global.businessTime.confirmCloseUntil', {
              time: localStore.nextOpenText,
            })
          : $t('global.businessTime.confirmCloseForever')
        : localStore.nextCloseText
          ? $t('global.businessTime.confirmOpenUntil', {
              time: localStore.nextCloseText,
            })
          : $t('global.businessTime.confirmOpenForever'),
      $t('global.tip'),
      { type: 'warning' },
    )
  } catch {
    return
  }
  statusSubmitting.value = true
  try {
    const res = await editStoreApi({
      id: localStore.id,
      storeStatus: nextCode,
    })
    if (res.code === 200) {
      applyStore({ ...localStore, ...(res.data || {}), storeStatus: nextCode })
      ElMessage.success($t('global.message.success'))
      emit('updated')
    } else {
      ElMessage.error(res.msg || $t('global.message.error'))
    }
  } catch (error) {
    console.log(error)
  } finally {
    statusSubmitting.value = false
  }
}

async function handleSaveHours() {
  if (hoursSubmitting.value) return
  let payload: { storeId?: string; rules: any[] } = { rules: [] }
  if (hoursMode.value === 'custom') {
    if (!selectedDays.value.length) {
      ElMessage.warning($t('global.businessTime.selectWeekday'))
      return
    }
    if (timeToMinutes(startTime.value) >= timeToMinutes(endTime.value)) {
      ElMessage.warning($t('global.businessTime.endAfterStart'))
      return
    }
    payload = {
      rules: [
        {
          days: selectedDays.value,
          start: startTime.value,
          end: endTime.value,
        },
      ],
    }
  }
  if (localStore.storeId) {
    payload.storeId = String(localStore.storeId)
  }
  hoursSubmitting.value = true
  try {
    const res = await updateBusinessHoursApi(payload)
    if (res.code === 200) {
      const saved = res.data || {}
      applyStore({ ...localStore, ...saved })
      ElMessage.success($t('global.businessTime.hoursSaved'))
      emit('updated', saved)
    } else {
      ElMessage.error(res.msg || $t('global.message.error'))
    }
  } catch (error) {
    console.log(error)
  } finally {
    hoursSubmitting.value = false
  }
}

async function handleSaveDeliveryFee() {
  if (feeSubmitting.value || !localStore.id) return
  const fee = Number(deliveryFee.value)
  if (!Number.isFinite(fee) || fee < 0) {
    ElMessage.warning($t('global.businessTime.deliveryFeeInvalid'))
    return
  }
  feeSubmitting.value = true
  try {
    const res = await editStoreApi({
      id: localStore.id,
      deliveryFee: Number(fee.toFixed(2)),
    })
    if (res.code === 200) {
      applyStore({ ...localStore, ...(res.data || {}), deliveryFee: Number(fee.toFixed(2)) })
      ElMessage.success($t('global.businessTime.deliveryFeeSaved'))
      emit('updated', res.data)
    } else {
      ElMessage.error(res.msg || $t('global.message.error'))
    }
  } catch (error) {
    console.log(error)
  } finally {
    feeSubmitting.value = false
  }
}
</script>

<template>
  <div class="bt-panel">
    <div class="status-card">
      <div class="status-label">{{ $t('global.businessTime.currentStatus') }}</div>
      <div class="status-row">
        <span class="status-dot" :class="`is-${openStatus}`"></span>
        <span class="status-text" :class="`is-${openStatus}`">{{ statusLabel }}</span>
      </div>
      <div class="status-tip">{{ statusTip }}</div>
      <el-button
        class="status-btn"
        :type="isOpenNow ? 'info' : 'success'"
        :loading="statusSubmitting"
        @click="handleToggle"
      >
        {{
          isOpenNow
            ? $t('global.businessTime.closeBusiness')
            : $t('global.businessTime.startBusiness')
        }}
      </el-button>
    </div>

    <div class="hours-card">
      <div class="hours-title">{{ $t('global.businessTime.title') }}</div>
      <div class="hours-preview">{{ hoursPreview }}</div>

      <div class="preset-row">
        <el-button
          round
          :type="hoursMode === 'all' ? 'primary' : 'default'"
          @click="applyPreset('all')"
        >
          {{ $t('global.businessTime.allDay') }}
        </el-button>
        <el-button
          round
          :type="hoursMode === 'custom' && sameDays(selectedDays, ALL_DAYS) ? 'primary' : 'default'"
          @click="applyPreset('everyday')"
        >
          {{ $t('global.businessTime.everyDay') }}
        </el-button>
        <el-button
          round
          :type="hoursMode === 'custom' && sameDays(selectedDays, WEEKDAYS) ? 'primary' : 'default'"
          @click="applyPreset('weekdays')"
        >
          {{ $t('global.businessTime.weekdays') }}
        </el-button>
      </div>

      <template v-if="hoursMode === 'custom'">
        <el-checkbox-group v-model="selectedDays" class="week-row">
          <el-checkbox-button
            v-for="item in weekdayOptions"
            :key="item.value"
            :label="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-checkbox-button>
        </el-checkbox-group>

        <div class="time-row">
          <div class="time-item">
            <span class="time-label">{{ $t('global.businessTime.startTime') }}</span>
            <el-time-picker
              v-model="startTime"
              format="HH:mm"
              value-format="HH:mm"
              :clearable="false"
            />
          </div>
          <div class="time-item">
            <span class="time-label">{{ $t('global.businessTime.endTime') }}</span>
            <el-time-picker
              v-model="endTime"
              format="HH:mm"
              value-format="HH:mm"
              :clearable="false"
            />
          </div>
        </div>
      </template>

      <div class="hours-save-wrap">
        <el-button
          class="hours-save"
          type="primary"
          :loading="hoursSubmitting"
          @click="handleSaveHours"
        >
          {{ $t('global.businessTime.saveHours') }}
        </el-button>
      </div>
    </div>

    <div class="hours-card">
      <div class="hours-title">{{ $t('global.businessTime.deliveryFee') }}</div>
      <div class="hours-preview">{{ $t('global.businessTime.deliveryFeeTip') }}</div>
      <div class="fee-row">
        <el-input-number
          v-model="deliveryFee"
          :min="0"
          :max="9999.99"
          :precision="2"
          :step="0.5"
          controls-position="right"
        />
        <span class="fee-unit">元</span>
      </div>
      <div class="hours-save-wrap">
        <el-button
          class="hours-save"
          type="primary"
          :loading="feeSubmitting"
          @click="handleSaveDeliveryFee"
        >
          {{ $t('global.businessTime.saveDeliveryFee') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bt-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-card,
.hours-card {
  padding: 24px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-label {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #909399;
}

.status-dot.is-open {
  background: #00a896;
}

.status-dot.is-rest {
  background: #e6a23c;
}

.status-text {
  font-size: 28px;
  font-weight: 700;
  color: #666;
}

.status-text.is-open {
  color: #00a896;
}

.status-text.is-rest {
  color: #e6a23c;
}

.status-tip {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  margin-bottom: 16px;
}

.status-btn {
  min-width: 160px;
}

.hours-title {
  font-size: 16px;
  font-weight: 600;
}

.hours-preview {
  margin-top: 8px;
  color: #00a896;
  font-size: 14px;
  line-height: 1.5;
}

.preset-row,
.week-row {
  margin-top: 16px;
}

.time-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 16px;
  margin-top: 16px;
}

.time-item {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.time-label {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  white-space: nowrap;
}

.time-item :deep(.el-date-editor) {
  flex: 1;
  width: 130px;
  min-width: 0;
}

.hours-save-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.hours-save {
  min-width: 160px;
}

.fee-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.fee-unit {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
