import { requestClient } from '#/api/request';

/**
 * 获取操作日志列表
 */
export async function getOperLogListApi(param: any) {
  return requestClient.get('/operLog/findOperLog', {
    params: param,
  });
}
