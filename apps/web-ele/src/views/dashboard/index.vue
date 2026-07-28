<!-- 系统首页：公司业务介绍与商务合作入口（前端静态路由，不依赖后端菜单） -->
<template>
  <div class="dashboard-home">
    <!-- 品牌与业务介绍 -->
    <section class="hero-section">
      <div class="hero-brand">
        <img class="hero-logo" :src="logoSrc" alt="星萤网络" />
        <div class="hero-brand-text">
          <h1 class="hero-title">星萤网络</h1>
          <p class="hero-subtitle">软件服务 · 智能化解决方案</p>
        </div>
      </div>
      <p class="hero-desc">
        广州市星萤网络有限公司专注于软件服务与智能化领域，为客户提供一站式数字化解决方案，覆盖智慧物业、智慧家居、智慧小区、智慧小店及无人经济等场景，助力企业降本增效、实现业务数字化升级。
      </p>
    </section>

    <!-- 业务能力 -->
    <section class="section-block">
      <h2 class="section-title">我们的业务</h2>
      <p class="section-desc">
        以自主研发为核心，围绕软件定制开发、系统集成与运维服务，持续交付稳定、可扩展的行业产品。
      </p>
      <div class="biz-grid">
        <div v-for="item in businessList" :key="item.title" class="biz-item">
          <div class="biz-name">{{ item.title }}</div>
          <div class="biz-text">{{ item.desc }}</div>
        </div>
      </div>
    </section>

    <!-- 商务合作 / 联系我们 -->
    <section class="section-block contact-section">
      <h2 class="section-title">商务合作 / 联系我们</h2>
      <p class="section-desc">
        如需产品咨询、项目合作或技术支持，欢迎通过以下方式与我们联系。
      </p>
      <div class="contact-panel">
        <div class="contact-row">
          <span class="contact-label">公司名称</span>
          <span class="contact-value">广州市星萤网络有限公司</span>
        </div>
        <div class="contact-row">
          <span class="contact-label">所属行业</span>
          <span class="contact-value">软件服务</span>
        </div>
        <div class="contact-row">
          <span class="contact-label">合作邮箱</span>
          <a class="contact-value link" :href="`mailto:${contactEmail}`">
            {{ contactEmail }}
          </a>
        </div>
      </div>
    </section>

    <!-- 页脚备案 -->
    <footer class="page-footer">
      <a
        class="icp-link"
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="noopener noreferrer"
      >
        粤ICP备2024284312号
      </a>
      <span class="footer-copy">© {{ currentYear }} 星萤网络</span>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import logoUrl from '#/assets/logo.png';

const logoSrc = logoUrl;
const contactEmail = 'xingying003@126.com';
const currentYear = new Date().getFullYear();

// 业务介绍卡片
const businessList = [
  {
    title: '智慧物业',
    desc: '物业运营、设备巡检与社区服务一体化管理，提升管理效率与住户体验。',
  },
  {
    title: '无人经济',
    desc: '无人小店等新零售场景的软硬件协同方案，支撑智能化运营与数据决策。',
  },
  {
    title: '智慧家居',
    desc: '面向家庭与空间的智能控制与场景联动，构建安全便捷的互联生活。',
  },
  {
    title: '定制开发',
    desc: '按业务需求提供系统定制、接口对接与平台运维，保障长期稳定交付。',
  },
];
</script>

<style lang="scss" scoped>
.dashboard-home {
  min-height: calc(100vh - 120px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background:
    radial-gradient(
      1200px 400px at 10% -10%,
      rgb(14 116 144 / 12%),
      transparent 60%
    ),
    radial-gradient(
      900px 360px at 100% 0%,
      rgb(15 118 110 / 10%),
      transparent 55%
    ),
    linear-gradient(180deg, #f7fafc 0%, #eef2f6 100%);
}

.hero-section {
  padding: 28px 32px;
  border-radius: 16px;
  background: linear-gradient(135deg, #0f766e 0%, #0e7490 55%, #155e75 100%);
  color: #fff;
  box-shadow: 0 10px 30px rgb(15 118 110 / 18%);
}

.hero-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-logo {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: rgb(255 255 255 / 92%);
  padding: 6px;
  object-fit: contain;
}

.hero-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1.2;
}

.hero-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.hero-desc {
  margin: 18px 0 0;
  max-width: 920px;
  font-size: 15px;
  line-height: 1.8;
  letter-spacing: 0.5px;
  text-indent: 2em;
  opacity: 0.95;
}

.section-block {
  padding: 24px 28px;
  border-radius: 14px;
  background: rgb(255 255 255 / 88%);
  border: 1px solid rgb(226 232 240 / 90%);
  backdrop-filter: blur(6px);
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
  color: #0f172a;
}

.section-desc {
  margin: 10px 0 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.7;
}

.biz-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.biz-item {
  padding: 16px;
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.biz-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgb(15 23 42 / 8%);
}

.biz-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f766e;
}

.biz-text {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
}

.contact-panel {
  margin-top: 16px;
  padding: 16px 18px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.contact-row + .contact-row {
  border-top: 1px solid #e2e8f0;
}

.contact-label {
  width: 88px;
  flex-shrink: 0;
  color: #64748b;
  font-size: 13px;
}

.contact-value {
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
}

.contact-value.link {
  color: #0e7490;
  text-decoration: none;
}

.contact-value.link:hover {
  text-decoration: underline;
}

.page-footer {
  margin-top: auto;
  padding: 16px 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.icp-link {
  color: #64748b;
  text-decoration: none;
}

.icp-link:hover {
  color: #0e7490;
}

.footer-copy {
  opacity: 0.9;
}

@media (max-width: 960px) {
  .biz-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .dashboard-home {
    padding: 16px;
  }

  .hero-section,
  .section-block {
    padding: 18px;
  }

  .hero-title {
    font-size: 22px;
  }

  .biz-grid {
    grid-template-columns: 1fr;
  }

  .contact-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
