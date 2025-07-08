<template>
  <div class="home">
    <div class="nav-container">
      <el-affix>
        <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" background-color="#545c64"
          text-color="#fff" active-text-color="#ffd04b" @select="handleSelect">
          <el-menu-item index="0">
            <template #default>
              <img style="width: 50px" :src="src" />
              <span class="mgl5 font22">星萤网络</span>
            </template>
          </el-menu-item>
          <div class="centered-menu">
            <el-menu-item index="0">首页</el-menu-item>
            <el-menu-item index="1">服务内容</el-menu-item>
            <el-menu-item index="2">公司产品</el-menu-item>
            <el-menu-item index="3">核心优势</el-menu-item>
            <el-menu-item index="4">联系我们</el-menu-item>
          </div>
        </el-menu>
      </el-affix>
      <!-- banner图 -->
      <div id="home" class="banner">
        <img :src="bannerSrc" alt="banner" style="width: 100%; height: 100%; object-fit: fill" />
        <div class="banner-text">万物互联，未来已来</div>
      </div>
    </div>
    <div class="content">
      <!-- 服务内容 -->
      <div id="about" class="about-us">
        <img :src="bgSrc1" alt="banner" style="width: 100%; height: 100%; object-fit: fill; opacity: 0.3" />
        <div class="intro-text">
          <h1 style="font-weight: bold; font-size: 24px">关于星萤网络</h1>
          <p style="text-indent: 2em; margin-top: 40px; letter-spacing: 2px">
            广州市星萤网络有限公司是一家专注于智能化解决方案的公司，致力于为客户提供一站式的智能化解决方案，包括智慧物业、智慧家居、智慧小区、智慧小店、无人经济等领域的综合性解决方案。客户满意度超95%，处于行业领先水平。</p>
          <p style="text-indent: 2em; margin-top: 40px; letter-spacing: 2px">
            公司拥有丰富的行业经验，拥有一支高素质的团队，并以“专注、创新、服务”的理念，为客户提供一流的保障服务。迄今为止，公司服务客户超100+，覆盖全国多个省市，拥有自研核心产品以及多项著作权，具备自主知识产权、自研云平台等核心优势。
          </p>
        </div>
      </div>

      <!-- 公司产品 -->
      <div id="product" class="main-production">
        <img :src="bgUrl2" alt="banner" style="width: 100%; height: 100%; object-fit: fill" />
        <div class="product1" @click="handleSystem(1)">【智慧物业系统】</div>
        <div class="product2" @click="handleSystem(2)">【无人小店系统】</div>
        <div class="product3" @click="handleSystem(3)">【智能家居系统】</div>
      </div>

      <!-- 核心优势 -->
      <div id="advantage" class="main-advantage">
        <img :src="bgUrl3" alt="banner" style="width: 100%; height: 100%; object-fit: fill" />
        <div class="advantage">【核心优势】</div>
        <div class="advantage1">自研大平台，特殊加密算法，数据无忧</div>
        <div class="advantage2">一台手机，随时随地，轻松控制</div>
      </div>

      <!-- 联系我们 -->
      <div id="contact" class="communication">
        <img :src="bgUrl4" alt="banner" style="width: 100%; height: 100%; object-fit: fill" />
        <div class="communication-item">
          <div style="font-size: 20px; font-weight: bold">联系我们：</div>
          <div class="mgt10">公司名称：广州市星萤网络有限公司</div>
          <div class="mgt10">公司地址：广州市天河区燕岭路89号2901</div>
          <div class="mgt10">邮箱地址：963497073@qq.com</div>
        </div>
        <img :src="logoUrl" alt="banner" style="position: absolute; top: 0px; right: 50px; width: 200px; height: 200px; object-fit: contain" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import bannerUrl from "#/assets/home/banner1.png";
import bgUrl1 from "#/assets/home/bg1.png";
import bgUrl4 from "#/assets/home/bg4.jpg";
import bgUrl2 from "#/assets/home/product.png";
import bgUrl3 from "#/assets/home/use.png";
import logoUrl from "#/assets/logo.png";
import { $t } from '#/locales';
import { router } from "#/router";
import { ElMessage } from 'element-plus';
import { ref } from "vue";

// const isMobile = ref(false);
const src = logoUrl;
const bannerSrc = bannerUrl;
const bgSrc1 = bgUrl1;
const activeIndex = ref("0");

const handleSelect = (index: number) => {
  activeIndex.value = index;
  const sections = ['home', 'about', 'product', 'advantage', 'contact'];
  if (index < sections.length) {
    const element = document.getElementById(sections[index]);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

const handleSystem = (index: number) => {
  if (index === 1) {
    // 智慧物业系统
    router.push('/web-ele/home/smart-property');
  } else if (index === 2) {
    // 无人小店系统
    ElMessage({
      type: 'warning',
      message: $t('global.message.noPermission'),
    });
  } else if (index === 3) {
    // 无人小店系统
    ElMessage({
      type: 'warning',
      message: $t('global.message.noPermission'),
    });
  }
}
</script>

<style lang="scss" scoped>
.home {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  scroll-behavior: smooth; // 添加平滑滚动效果
}

.nav-container {
  position: relative;
}

.el-menu-demo {
  display: flex;
  position: relative;
}

.centered-menu {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}

.content {
  padding: 0 200px;
  background-color: #edeff1;
}

.banner {
  width: 100%;
  height: calc(100vh - 100px);
  margin: 0 auto;
  position: relative;
}

.banner-text {
  font-size: 44px;
  font-weight: bold;
  color: #fff;
  letter-spacing: 8px;
  position: absolute;
  top: 35px;
  left: 50%;
  transform: translateX(-50%);
}

.about-us,
.main-production,
.main-advantage,
.communication {
  width: 1000px;
  height: 300px;
  margin: 0 auto;
  position: relative;
  color: #fff;
  margin-top: 5px;
}

.intro-text {
  color: #333333;
  position: absolute;
  top: 40px;
  left: 40px;
  right: 40px;
}

.main-production {
  height: 500px;
  font-size: 22px;
  font-weight: bold;

  .product1 {
    position: absolute;
    top: 50px;
    left: 80px;
    cursor: pointer;
  }

  .product2 {
    position: absolute;
    top: 50px;
    left: 420px;
    cursor: pointer;
  }

  .product3 {
    position: absolute;
    top: 50px;
    left: 750px;
    cursor: pointer;
  }
}

.main-advantage {
  height: 600px;
  color: #333333;
  font-size: 24px;
  font-weight: bold;

  .advantage {
    font-size: 20px;
    color: #fff;
    position: absolute;
    top: 230px;
    left: 50%;
    transform: translateX(-50%);
  }

  .advantage1 {
    position: absolute;
    bottom: 40px;
    left: 35px;
  }

  .advantage2 {
    position: absolute;
    bottom: 40px;
    right: 70px;
  }
}

.communication {
  height: 200px;
  color: #fff;

  .communication-item {
    position: absolute;
    top: 45px;
    left: 100px;
    right: 100px;
  }
}
#about, #product, #advantage, #contact {
  scroll-margin-top: 80px; /* 根据导航栏高度调整，建议比实际导航栏高10-20px */
}
</style>
