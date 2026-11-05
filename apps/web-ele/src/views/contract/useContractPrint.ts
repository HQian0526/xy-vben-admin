import { nextTick, ref } from 'vue';

import { ElMessage } from 'element-plus';

import { getContractDetailApi } from '#/api';
import { $t } from '#/locales';
import { resolveFileUrl } from '#/utils';

const PLATFORM_SEAL_PATH = 'xy-community/seal.png';

function sliceTime(value: any) {
  return value ? String(value).slice(0, 19) : '';
}

export function useContractPrint() {
  const printVisible = ref(false);
  const printLoading = ref(false);
  const printData = ref<Record<string, any> | null>(null);

  const openPrint = async (row: any) => {
    printData.value = null;
    printVisible.value = true;
    printLoading.value = true;
    try {
      const res = await getContractDetailApi(row.contractNo);
      if (res.code !== 200 || !res.data) {
        ElMessage.error(res.msg || $t('global.message.error'));
        printVisible.value = false;
        return;
      }
      const data = res.data;
      const signers = data.signers || [];
      const partyA = signers.find((item: any) => Number(item.partyRole) === 1);
      const partyB = signers.find((item: any) => Number(item.partyRole) === 2);
      printData.value = {
        contractName: data.contractName,
        contractNo: data.contractNo,
        storeName: data.storeName,
        partyTypeLabel: data.partyTypeLabel,
        statusLabel: data.statusLabel,
        totalAmount: data.totalAmount,
        contentSnapshot: data.contentSnapshot || '',
        contractStatus: Number(data.contractStatus) || 0,
        partyAName: partyA?.companyName || partyA?.signerName || '',
        partyBName: partyB?.companyName || partyB?.signerName || '',
        partyASealImage: partyA?.signTime ? resolveFileUrl(PLATFORM_SEAL_PATH) : '',
        partyBSignImage: resolveFileUrl(partyB?.signImageUrl),
        partyASignTime: sliceTime(partyA?.signTime),
        partyBSignTime: sliceTime(partyB?.signTime),
      };
    } catch (error: any) {
      if (error?.msg) ElMessage.error(error.msg);
      printVisible.value = false;
    } finally {
      printLoading.value = false;
    }
  };

  const doPrint = async () => {
    if (!printData.value) return;
    await nextTick();
    const imgs = document.querySelectorAll('.contract-print-root img');
    await Promise.all(
      [...imgs].map(
        (node) =>
          new Promise<void>((resolve) => {
            const img = node as HTMLImageElement;
            if (img.complete) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    );
    window.print();
  };

  return {
    printVisible,
    printLoading,
    printData,
    openPrint,
    doPrint,
  };
}
