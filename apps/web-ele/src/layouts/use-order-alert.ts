import { computed, h, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@vben/stores';

import { ElMessage, ElNotification } from 'element-plus';

import { getMallOrderListApi } from '#/api';
import newOrderAudioUrl from '#/assets/audio/new-order.wav';
import { $t } from '#/locales';

const POLL_MS = 10_000;
const NOTICE_MS = 30_000;
const CHANNEL = 'xy-order-alert';
const PAGE_SIZE = 10;
const ORDER_LIST_PATH = '/order-list';

function createTabId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

let orderPageRefresh: (() => void) | null = null;

/** 订单页处于前台时注册，离开时注销。来单通知会触发刷新。 */
export function registerOrderPageRefresh(handler: () => void) {
  orderPageRefresh = handler;
}

export function unregisterOrderPageRefresh(handler?: () => void) {
  if (!handler || orderPageRefresh === handler) {
    orderPageRefresh = null;
  }
}

export function useOrderAlert() {
  const userStore = useUserStore();
  const router = useRouter();
  const isMerchant = computed(
    () => Number(userStore.userInfo?.identityType) === 2,
  );
  const enabled = ref(false);
  const knownOrderNos = new Set<string>();
  const tabId = createTabId();
  let timer: null | ReturnType<typeof setInterval> = null;
  let channel: BroadcastChannel | null = null;
  let audio: HTMLAudioElement | null = null;
  let snapshotReady = false;

  function ensureChannel() {
    if (channel || typeof BroadcastChannel === 'undefined') {
      return;
    }
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event: MessageEvent) => {
      if (event.data?.type === 'claim' && event.data.tabId !== tabId) {
        stop();
      }
    };
  }

  function ensureAudio() {
    if (!audio) {
      audio = new Audio(newOrderAudioUrl);
      audio.preload = 'auto';
    }
    return audio;
  }

  async function playAlertSound() {
    try {
      const player = ensureAudio();
      player.currentTime = 0;
      await player.play();
    } catch {
      // 浏览器可能仍拦截自动播放，不影响通知展示
    }
  }

  function goToOrderList() {
    const hit = router.getRoutes().find((item) => {
      const path = String(item.path || '');
      const component = String(item.meta?.component || '');
      return (
        path === ORDER_LIST_PATH ||
        path.endsWith(ORDER_LIST_PATH) ||
        component.includes('/order/index')
      );
    });
    void router.push(hit?.path || ORDER_LIST_PATH);
  }

  function notifyOrder(order: Record<string, any>) {
    const orderNo = String(order.orderNo || '');
    const amount = order.payAmount == null ? '--' : order.payAmount;
    const contact = order.contact ? String(order.contact) : '';
    const address = order.address ? String(order.address) : '';
    const payChannel =
      Number(order.payChannel) === 2
        ? $t('global.order.payBalance')
        : $t('global.order.payWechat');

    const nodes = [
      h('div', `${$t('global.order.orderNo')} ${orderNo || '--'}`),
      h('div', `${$t('global.order.payAmount')} ¥${amount}（${payChannel}）`),
    ];
    if (contact) {
      nodes.push(h('div', `${$t('global.order.contact')} ${contact}`));
    }
    if (address) {
      nodes.push(h('div', `${$t('global.order.address')} ${address}`));
    }
    nodes.push(
      h(
        'div',
        { class: 'mt-2 flex justify-end' },
        h(
          'span',
          {
            class: 'xy-order-alert-go-view',
          },
          $t('global.order.alertGoView'),
        ),
      ),
    );

    const notice = ElNotification({
      title: $t('global.order.alertTitle'),
      message: h('div', { class: 'leading-6' }, nodes),
      duration: NOTICE_MS,
      position: 'top-right',
      type: 'success',
      customClass: 'xy-order-alert-notice',
      onClick: () => {
        notice.close();
        goToOrderList();
      },
    });
    void playAlertSound();
    orderPageRefresh?.();
  }

  async function fetchPaidOrders() {
    const res = await getMallOrderListApi({
      payStatus: 1,
      pageNum: 1,
      pageSize: PAGE_SIZE,
    });
    if (res?.code !== 200) {
      return [];
    }
    return Array.isArray(res.data?.list) ? res.data.list : [];
  }

  async function poll() {
    if (!enabled.value || !isMerchant.value) {
      return;
    }
    try {
      const list = await fetchPaidOrders();
      const incoming: string[] = [];
      for (const order of list) {
        const orderNo = String(order?.orderNo || '').trim();
        if (!orderNo) {
          continue;
        }
        incoming.push(orderNo);
        if (snapshotReady && !knownOrderNos.has(orderNo)) {
          notifyOrder(order);
        }
        knownOrderNos.add(orderNo);
      }
      if (!snapshotReady) {
        snapshotReady = true;
      }
      if (knownOrderNos.size > 200) {
        const keep = new Set(incoming);
        knownOrderNos.forEach((no) => {
          if (!keep.has(no)) {
            knownOrderNos.delete(no);
          }
        });
      }
    } catch {
      // 轮询失败不打断后台，下次再试
    }
  }

  async function start() {
    if (!isMerchant.value || timer) {
      return;
    }
    ensureChannel();
    channel?.postMessage({ type: 'claim', tabId });
    snapshotReady = false;
    knownOrderNos.clear();
    await playAlertSound();
    await poll();
    timer = setInterval(() => {
      void poll();
    }, POLL_MS);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    snapshotReady = false;
    knownOrderNos.clear();
    enabled.value = false;
  }

  async function onToggle(value: string | number | boolean) {
    const on = Boolean(value);
    if (!isMerchant.value) {
      enabled.value = false;
      return;
    }
    if (on) {
      enabled.value = true;
      await start();
      ElMessage.success($t('global.order.alertEnabled'));
    } else {
      stop();
    }
  }

  onUnmounted(() => {
    stop();
    channel?.close();
    channel = null;
    if (audio) {
      audio.pause();
      audio = null;
    }
  });

  return {
    enabled,
    isMerchant,
    onToggle,
  };
}
