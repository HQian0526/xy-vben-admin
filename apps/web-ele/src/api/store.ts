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
