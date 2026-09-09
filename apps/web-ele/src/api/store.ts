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
