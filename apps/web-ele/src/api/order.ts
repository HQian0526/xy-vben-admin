import { requestClient } from '#/api/request';

/**
 * 获取商城订单列表
 */
export async function getMallOrderListApi(param: any) {
  return requestClient.get('/mallOrder/findMallOrder', {
    params: param,
  });
}
