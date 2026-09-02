import { requestClient } from '#/api/request';

/**
 * 获取其他业务列表
 */
export async function getOtherBusinessListApi(param: any) {
  return requestClient.get('/otherBusiness/findOtherBusiness', {
    params: param,
  });
}

/**
 * 新增其他业务
 */
export async function addOtherBusinessApi(data: any) {
  return requestClient.post('/otherBusiness/addOtherBusiness', data);
}

/**
 * 编辑其他业务
 */
export async function editOtherBusinessApi(data: any) {
  return requestClient.put('/otherBusiness/updateOtherBusiness', data);
}

/**
 * 删除其他业务
 */
export async function deleteOtherBusinessApi(data: any) {
  return requestClient.delete('/otherBusiness/deleteOtherBusiness', {
    data,
  });
}
