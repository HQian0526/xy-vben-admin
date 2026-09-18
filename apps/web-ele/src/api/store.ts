import { requestClient } from '#/api/request';

/**
 * 获取角色列表
 */
export async function getStoreListApi(param: any) {
  return requestClient.get('/store/findStore', {
    params: param,
  });
}

/**
 * 新增
 */
export async function addStoreApi(data: any) {
  return requestClient.post('/store/addStore', data);
}

/**
 * 编辑
 */
export async function editStoreApi(data: any) {
  return requestClient.put('/store/updateStore', data);
}

/**
 * 删除
 */
export async function deleteStoreApi(data: any) {
  return requestClient.delete('/store/deleteStore', {
    data,
  });
}

/**
 * 设置营业时间。rules 空数组 = 全天可下单；管理员需传 storeId
 */
export async function updateBusinessHoursApi(data: any) {
  return requestClient.put('/store/updateBusinessHours', data);
}

export async function getStoreWxConfigListApi() {
  return requestClient.get('/storeWxConfig/list');
}

export async function getStoreWxConfigApi(storeId: string | number) {
  return requestClient.get('/storeWxConfig', {
    params: { storeId },
  });
}

export async function saveStoreWxConfigApi(data: any) {
  return requestClient.put('/storeWxConfig', data);
}

export async function getStorePrinterListApi() {
  return requestClient.get('/storePrinter/list');
}

export async function getStorePrinterApi(storeId: string | number) {
  return requestClient.get('/storePrinter', {
    params: { storeId },
  });
}

export async function saveStorePrinterApi(data: any) {
  return requestClient.put('/storePrinter', data);
}

export async function queryStorePrinterStatusApi(storeId: string | number) {
  return requestClient.get('/storePrinter/status', {
    params: { storeId },
  });
}

export async function testStorePrinterApi(storeId: string | number) {
  return requestClient.post('/storePrinter/testPrint', {}, {
    params: { storeId },
  });
}

export async function reprintMallOrderApi(orderNo: string) {
  return requestClient.post('/storePrinter/reprint', {}, {
    params: { orderNo },
  });
}
