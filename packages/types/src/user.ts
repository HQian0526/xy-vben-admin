import type { BasicUserInfo } from '@vben-core/typings';

interface OwnedStore {
  storeId: number | string;
  storeName?: string;
  expired?: boolean;
  enablePay?: number;
  shopStatus?: number;
}

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /**
   * 用户描述
   */
  desc: string;
  /**
   * 首页地址
   */
  homePath: string;

  /**
   * accessToken
   */
  token: string;

  identityType?: number;
  lastStoreId?: number | string | null;
  ownedStores?: OwnedStore[];
  storeExpired?: boolean;
}

export type { UserInfo };
