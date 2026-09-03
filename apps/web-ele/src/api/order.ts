import { requestClient } from '#/api/request';

/**
 * 获取商城订单列表
 */
export async function getMallOrderListApi(param: any) {
  return requestClient.get('/mallOrder/findMallOrder', {
    params: param,
  });
}

/**
 * 查询单个订单（含明细）
 */
export async function getMallOrderDetailApi(orderNo: string) {
  return requestClient.get('/mallOrder/queryOrder', {
    params: { orderNo },
  });
}

/**
 * 订单退款
 */
export async function refundMallOrderApi(data: any) {
  return requestClient.post('/mallOrder/refund', data);
}
