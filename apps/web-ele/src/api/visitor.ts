import { requestClient } from '#/api/request';

/**
 * 查询留资客户（来客信息）
 */
export async function getVisitorListApi(param: any) {
  return requestClient.get('/visitor/findVisitor', {
    params: param,
  });
}

/**
 * 删除留资记录
 */
export async function deleteVisitorApi(data: any) {
  return requestClient.delete('/visitor/deleteVisitor', {
    data,
  });
}
