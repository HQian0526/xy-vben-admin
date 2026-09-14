import { requestClient } from '#/api/request';

export function updateStoreMemberStatusApi(data: any) {
  return requestClient.put('/storeMember/status', data);
}
