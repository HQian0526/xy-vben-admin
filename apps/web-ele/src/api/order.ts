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

/**
 * 店铺订单金额流水（年/季/月/日）
 * 商家查本店；管理员必须传 storeId
 */
export async function getMallIncomeFlowApi(param: any) {
  return requestClient.get('/mallOrder/incomeFlow', {
    params: param,
  });
}

/**
 * 店铺资金明细（一单一收入 / 一单一退款）
 * 商家查本店；管理员必须传 storeId
 */
export async function getMallFinanceLedgerApi(param: any) {
  return requestClient.get('/mallOrder/financeLedger', {
    params: param,
  });
}

/**
 * 商家待结算金额、今日收入
 */
export async function getMallSettlementSummaryApi(param?: any) {
  return requestClient.get('/mallOrder/settlementSummary', {
    params: param,
  });
}

/**
 * 管理员：待结算店铺列表
 */
export async function getPendingSettlementStoresApi(param: any) {
  return requestClient.get('/mallOrder/pendingSettlementStores', {
    params: param,
  });
}

/**
 * 管理员：标记店铺已结算（打款线下进行）
 */
export async function settleStoreApi(data: { storeId: string | number }) {
  return requestClient.post('/mallOrder/settleStore', data);
}
