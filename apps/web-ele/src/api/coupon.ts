import { requestClient } from '#/api/request';

export async function getMallCouponListApi(param: any) {
  return requestClient.get('/mallCoupon/findMallCouponTemplate', {
    params: param,
  });
}

export async function addMallCouponApi(data: any) {
  return requestClient.post('/mallCoupon/addMallCouponTemplate', data);
}

export async function editMallCouponApi(data: any) {
  return requestClient.put('/mallCoupon/updateMallCouponTemplate', data);
}

export async function deleteMallCouponApi(data: any) {
  return requestClient.delete('/mallCoupon/deleteMallCouponTemplate', {
    data,
  });
}

export async function grantMallCouponApi(data: any) {
  return requestClient.post('/mallCoupon/grant', data);
}
