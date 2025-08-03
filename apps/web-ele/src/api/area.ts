import { requestClient } from '#/api/request';

/**
 * 获取区域列表
 */
export async function getAreaListApi(param: any) {
  return requestClient.get('/area/findArea', {
    params: param,
  });
}

/**
 * 新增
 */
export async function addAreaApi(data: any) {
  return requestClient.post('/area/addArea', data);
}

/**
 * 编辑
 */
export async function editAreaApi(data: any) {
  return requestClient.put('/area/updateArea', data);
}

/**
 * 删除
 */
export async function deleteAreaApi(data: any) {
  return requestClient.delete('/area/deleteArea', {
    data,
  });
}
