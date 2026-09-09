export const STORE_STATUS_OPEN = 1
export const STORE_STATUS_CLOSED = 2
export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7]
export const WEEKDAYS = [1, 2, 3, 4, 5]

const WEEKDAY_LABELS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']

export function isManuallyClosed(store: any) {
  if (!store) return false
  if (store.manuallyClosed === true || store.openStatus === 'closed') return true
  if (store.manuallyClosed === false) return false
  return Number(store.storeStatus) === STORE_STATUS_CLOSED
}

export function getOpenStatus(store: any): 'open' | 'rest' | 'closed' {
  if (!store) return 'open'
  if (
    store.openStatus === 'open' ||
    store.openStatus === 'rest' ||
    store.openStatus === 'closed'
  ) {
    return store.openStatus
  }
  if (isManuallyClosed(store)) return 'closed'
  if (store.acceptingOrders === false) return 'rest'
  return 'open'
}

export function parseBusinessHours(raw: any): { rules: any[] } {
  if (!raw) {
    return { rules: [] }
  }
  if (typeof raw === 'object') {
    return { rules: Array.isArray(raw.rules) ? raw.rules : [] }
  }
  try {
    const parsed = JSON.parse(String(raw))
    return { rules: Array.isArray(parsed?.rules) ? parsed.rules : [] }
  } catch {
    return { rules: [] }
  }
}

export function formatBusinessHoursText(raw: any) {
  const hours = parseBusinessHours(raw)
  const rules = hours.rules || []
  if (!rules.length) return ''
  return rules
    .map((rule: any) => {
      const days = formatDays(rule.days || [])
      return `${days} ${rule.start || ''}-${rule.end || ''}`.trim()
    })
    .filter(Boolean)
    .join('；')
}

export function sameDays(a: number[], b: number[]) {
  const left = [...new Set(a || [])].sort((x, y) => x - y).join(',')
  const right = [...new Set(b || [])].sort((x, y) => x - y).join(',')
  return left === right
}

function formatDays(days: number[]) {
  const unique = [
    ...new Set((days || []).map(Number).filter((d) => d >= 1 && d <= 7)),
  ].sort((a, b) => a - b)
  if (unique.length === 7) return '每天'
  if (!unique.length) return ''
  const consecutive = unique.every((d, i) => i === 0 || d === unique[i - 1] + 1)
  if (consecutive) {
    if (unique.length === 1) return WEEKDAY_LABELS[unique[0]]
    return `${WEEKDAY_LABELS[unique[0]]}至${WEEKDAY_LABELS[unique[unique.length - 1]]}`
  }
  return unique.map((d) => WEEKDAY_LABELS[d]).join('、')
}

export function timeToMinutes(value: string) {
  const parts = String(value || '').split(':')
  return Number(parts[0]) * 60 + Number(parts[1])
}
