import { requestClient } from '#/api/request';

export function updateStoreMemberStatusApi(data: any) {
  return requestClient.put('/storeMember/status', data);
}

export function lookupStoreMemberApi(params: {
  phone?: string;
  userId?: string;
  storeId?: string;
}) {
  return requestClient.get('/storeMember/lookup', { params });
}

export function verifyStoreMemberDebitApi(data: any) {
  return requestClient.post('/storeMember/verifyDebit', data);
}

export function assistStoreMemberRechargeApi(data: any) {
  return requestClient.post('/storeMember/assistRecharge', data);
}
