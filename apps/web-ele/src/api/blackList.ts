import { requestClient } from '#/api/request';

/**
 * 获取店铺黑名单列表
 */
export async function getStoreBlacklistApi(param: any) {
  return requestClient.get('/storeBlacklist/findStoreBlacklist', {
    params: param,
  });
}

/**
 * 新增店铺黑名单
 */
export async function addStoreBlacklistApi(data: any) {
  return requestClient.post('/storeBlacklist/addStoreBlacklist', data);
}

/**
 * 编辑店铺黑名单
 */
export async function editStoreBlacklistApi(data: any) {
  return requestClient.put('/storeBlacklist/updateStoreBlacklist', data);
}

/**
 * 解除拉黑
 */
export async function deleteStoreBlacklistApi(data: any) {
  return requestClient.delete('/storeBlacklist/deleteStoreBlacklist', {
    data,
  });
}
