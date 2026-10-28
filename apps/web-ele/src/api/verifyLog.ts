import { requestClient } from '#/api/request';

export function getStoreVerifyLogApi(param: any) {
  return requestClient.get('/storeVerifyLog/findStoreVerifyLog', {
    params: param,
  });
}
