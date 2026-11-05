# 星萤经营管理系统 · PC 管理端

适用场景：店铺需要会员储值系统、预约系统、商城系统等。

已验证场景/已接入案例：理发店会员充值、美妆美甲店预约、社区跑腿小程序、大学跑腿小程序、便利店、餐饮店、花店、奶茶店。

系统包含：微信小程序（顾客充值、点单、预约、支付等功能）+电脑管理端（商家在后台查看经营数据、流水、对账、管理员工等），以及一套后端。

本仓库是 **PC 管理端**，基于 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) 5 + Element Plus 改的，实际业务在 `apps/web-ele`。

| 仓库                                                                  | 说明        |
| ------------------------------------------------------------------- | --------- |
| [xy-vben-admin](https://github.com/HQian0526/xy-vben-admin)         | 本仓库，PC 后台 |
| [xy-control-java](https://github.com/HQian0526/xy-control-java)     | Java 后端   |
| [xy-community-sapp](https://github.com/HQian0526/xy-community-sapp) | 微信小程序     |

> 想上线或让作者帮你部署：邮箱 **xingying003@126.com**，GitHub [@HQian0526](https://github.com/HQian0526)。

## 页面大致有哪些

- 工作台
- 商户 / 店铺资料、营业时间、员工、打印机、微信配置
- 商品分类与商品
- 订单、流水、结算
- 会员、储值、优惠券、促销
- 客资、黑名单、核销记录
- 合同列表、我的合同（打印）、合同模板与变量
- 系统用户、角色、菜单、字典、操作日志

## 技术栈

- Vue 3、Vite、TypeScript
- Element Plus（应用包 `@vben/web-ele`）
- pnpm monorepo

## 环境

- Node.js ≥ 20.10
- pnpm ≥ 9.12（可用 `corepack`）
- 先启动后端 `xy-control-java`（默认 `http://localhost:8080/api`）

## 本地运行

```bash
git clone https://github.com/HQian0526/xy-vben-admin.git
cd xy-vben-admin
npm i -g corepack
corepack enable
pnpm install
```

连真实后端时，把 `apps/web-ele/.env.development` 里的 Mock 关掉：

```env
VITE_NITRO_MOCK=false
VITE_PORT=5777
VITE_GLOB_API_URL=/api
VITE_MINIO_URL=https://你的文件域名
```

开发代理在 `apps/web-ele/vite.config.mts`，默认把 `/api` 转到 `http://localhost:8080/api`。

```bash
pnpm dev:ele
```

浏览器打开控制台提示的地址（一般是 `http://localhost:5777`）。账号在后端用户表里，首次请用库里的管理员或自己插入的用户登录。

### 打包

```bash
pnpm build:ele
```

产物在 `apps/web-ele/dist`。生产环境把 Nginx 的 `/api` 反代到后端，并改 `apps/web-ele/.env.production` 里的文件访问前缀 `VITE_MINIO_URL`。

## 目录（业务相关）

```
apps/web-ele/
  src/api/           接口
  src/views/         页面（店铺、商品、订单、合同等）
  src/locales/       中英文案
  .env.development   本地环境
  vite.config.mts    开发代理
```

不要改其它 `apps/web-antd`、`playground` 也能跑模板，但星萤业务只维护 `web-ele`。

## 部署

需要：静态资源托管或 Nginx、已上线的后端、HTTPS、文件 CDN。微信相关在小程序仓库配置。

**不想自己折腾环境，发邮件 xingying003@126.com**，写明有几家店、要不要支付和小程序，作者按这套代码帮你部署。

## 说明

- UI 框架版权见原项目 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin)（MIT）
- 业务代码用于学习与对接；商用请先联系作者
- 不要把账号密码、密钥提交进仓库


