/* =====================================================================
   starry phase 2 · 对话记录卡片 = 三段式异形像素轮廓

   每个卡片只加一个 class（.pxcard + .px-<kind>），外形全部由四层背景画出：
     1. 顶部异形 SVG（按 190 单位网格等比缩放，不随文字纵向变形）
     2. 顶盖下方的固定比例挂件（月亮下半 / 星徽舱，只有 moon / star 有）
     3. 中段 1px 侧墙切片（preserveAspectRatio="none"，纵向无限拉伸不失真）
     4. 底部异形 SVG（台阶基座 / 气泡尾尖 / 山脚岩层）
   背景的像素高度由卡片实际宽度算出来，所以宽度变化（窗口缩放、抽屉开合）
   只会让屋顶/新月/山脊按比例缩放，绝不会被拉长。
   ===================================================================== */
(() => {
  'use strict';

  const NAVY = '#0D1B2E';
  const GOLD = '#F2C14E';
  const CREAM = '#FFF8DC';

  const svg = (vb, body, extra) =>
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${vb}' shape-rendering='crispEdges'${extra || ''}>${body}</svg>`;
  const uri = (s) => 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
  const R = (x, y, w, h, fill) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='${fill}'/>`;

  /* 中段切片：只有两侧 1 单位侧墙 + 深蓝填充，纵向拉多长都不会变形 */
  const mid = (l, r) => uri(svg('190 1',
    R(l, 0, 1, 1, GOLD) + R(l + 1, 0, r - l - 1, 1, NAVY) + R(r, 0, 1, 1, GOLD),
    " preserveAspectRatio='none'"));

  /* ---------------------------------------------------------------- 月亮气泡 */
  const MOON_TOP = svg('190 11',
    `<path fill='${NAVY}' d='M 14,3 H 156 V 2 H 174 V 3 H 178 V 5 H 180 V 9 H 182 V 11 H 6 V 10 H 8 V 6 H 10 V 4 H 14 Z'/>` +
    R(14, 2, 142, 1, GOLD) + R(156, 1, 18, 1, GOLD) + R(174, 2, 4, 1, GOLD) +
    R(178, 3, 2, 2, GOLD) + R(180, 5, 2, 4, GOLD) + R(182, 9, 1, 2, GOLD) +
    /* 左上 4 阶像素圆角 */
    R(10, 3, 4, 1, GOLD) + R(8, 4, 2, 2, GOLD) + R(6, 6, 2, 4, GOLD) + R(5, 10, 1, 1, GOLD) +
    /* 右上角暖金新月上半部 */
    R(167, 5, 3, 1, GOLD) + R(170, 6, 2, 1, GOLD) + R(171, 7, 2, 4, GOLD));

  const MOON_POD = svg('190 5',
    R(170, 0, 2, 1, GOLD) + R(167, 1, 3, 1, GOLD) + R(164, 2, 4, 1, GOLD) + R(163, 1, 2, 1, GOLD));

  const MOON_BOT = svg('190 17',
    `<path fill='${NAVY}' d='M 6,0 H 182 V 1 H 180 V 5 H 178 V 7 H 174 V 8 H 168 V 12 H 171 V 14 H 174 V 17 H 163 V 15 H 160 V 12 H 158 V 8 H 14 V 7 H 10 V 5 H 8 V 1 H 6 Z'/>` +
    R(6, 1, 2, 4, GOLD) + R(8, 5, 2, 2, GOLD) + R(10, 7, 4, 1, GOLD) + R(14, 8, 142, 1, GOLD) +
    R(180, 1, 2, 4, GOLD) + R(178, 5, 2, 2, GOLD) + R(174, 7, 4, 1, GOLD) +
    R(168, 8, 6, 1, GOLD) + R(168, 9, 1, 3, GOLD) + R(169, 12, 2, 2, GOLD) +
    R(171, 14, 3, 2, GOLD) + R(174, 16, 2, 2, GOLD) + R(163, 17, 11, 1, GOLD) +
    R(160, 15, 3, 2, GOLD) + R(158, 12, 2, 3, GOLD) + R(156, 9, 2, 3, GOLD));

  /* ---------------------------------------------------------------- 星星气泡 */
  const STAR_TOP = svg('190 10',
    `<path fill='${NAVY}' d='M 12,2 H 28 V 3 H 176 V 4 H 180 V 6 H 182 V 10 H 4 V 8 H 6 V 5 H 8 V 3 H 12 Z'/>` +
    /* 左上星徽凸起舱顶拱 */
    R(12, 1, 16, 1, GOLD) + R(8, 2, 4, 1, GOLD) + R(6, 3, 2, 2, GOLD) + R(4, 5, 2, 3, GOLD) + R(3, 8, 1, 2, GOLD) +
    /* 顶部主边 + 右上 4 阶像素圆角 */
    R(28, 2, 148, 1, GOLD) + R(176, 3, 4, 1, GOLD) + R(180, 4, 2, 2, GOLD) + R(182, 6, 2, 4, GOLD) +
    /* 星星顶芒尖端 */
    R(13, 9, 1, 1, GOLD));

  const STAR_POD = svg('190 13',
    R(4, 0, 7, 8, NAVY) + R(6, 8, 5, 3, NAVY) +
    R(3, 0, 1, 8, GOLD) + R(4, 8, 2, 3, GOLD) + R(6, 11, 3, 1, GOLD) + R(9, 12, 1, 1, GOLD) +
    R(13, 0, 1, 1, GOLD) + R(13, 5, 1, 2, GOLD) + R(10, 2, 2, 1, GOLD) + R(15, 2, 2, 1, GOLD) +
    R(12, 1, 3, 3, GOLD) + R(13, 2, 1, 1, CREAM));

  const STAR_BOT = svg('190 17',
    `<path fill='${NAVY}' d='M 10,0 H 184 V 1 H 182 V 5 H 180 V 7 H 176 V 8 H 33 V 12 H 30 V 15 H 27 V 17 H 16 V 14 H 19 V 12 H 22 V 8 H 16 V 7 H 12 V 5 H 10 Z'/>` +
    R(9, 0, 1, 5, GOLD) + R(10, 5, 2, 2, GOLD) + R(12, 7, 4, 1, GOLD) + R(16, 8, 6, 1, GOLD) +
    R(21, 9, 1, 3, GOLD) + R(19, 12, 2, 2, GOLD) + R(16, 14, 3, 2, GOLD) +
    R(14, 16, 2, 2, GOLD) + R(16, 17, 11, 1, GOLD) + R(27, 15, 3, 2, GOLD) +
    R(30, 12, 2, 3, GOLD) + R(32, 9, 2, 3, GOLD) +
    R(34, 8, 142, 1, GOLD) + R(176, 7, 4, 1, GOLD) + R(180, 5, 2, 2, GOLD) + R(182, 1, 2, 4, GOLD));

  /* ---------------------------------------------------------------- 房屋卡片 */
  const HOUSE_TOP = svg('190 18',
    /* 左坡悬挑屋面阶梯 */
    R(4, 16, 6, 1, GOLD) + R(6, 15, 8, 1, GOLD) + R(14, 13, 8, 2, GOLD) + R(22, 11, 8, 2, GOLD) +
    R(30, 9, 8, 2, GOLD) + R(38, 7, 8, 2, GOLD) + R(46, 5, 8, 2, GOLD) + R(54, 3, 8, 2, GOLD) +
    /* 屋脊与右侧缓坡阶梯 */
    R(62, 2, 46, 2, GOLD) + R(108, 4, 14, 2, GOLD) + R(122, 6, 14, 2, GOLD) + R(136, 8, 14, 2, GOLD) +
    R(150, 10, 12, 2, GOLD) + R(162, 12, 12, 2, GOLD) + R(174, 14, 8, 2, GOLD) + R(180, 16, 6, 1, GOLD) +
    /* 山墙内部线框桁架 */
    R(62, 4, 1, 12, GOLD) + R(40, 12, 22, 1, GOLD) + R(63, 12, 36, 1, GOLD) +
    /* 屋檐底梁 */
    R(10, 16, 170, 1, GOLD) +
    /* 屋身缩进衔接行 */
    R(14, 17, 1, 1, GOLD) + R(15, 17, 160, 1, NAVY) + R(175, 17, 1, 1, GOLD));

  const HOUSE_BOT = svg('190 5',
    R(11, 0, 4, 1, GOLD) + R(15, 0, 160, 1, NAVY) + R(175, 0, 4, 1, GOLD) +
    R(11, 1, 1, 2, GOLD) + R(12, 1, 166, 2, NAVY) + R(178, 1, 1, 2, GOLD) +
    R(10, 3, 170, 1, GOLD));

  /* ---------------------------------------------------------------- 大山卡片 */
  const MTN_TOP = svg('190 16',
    `<path fill='${NAVY}' d='M 8,14 H 18 V 12 H 26 V 9 H 34 V 6 H 44 V 9 H 52 V 11 H 64 V 13 H 106 V 11 H 116 V 8 H 126 V 5 H 134 V 2 H 144 V 5 H 152 V 8 H 162 V 11 H 172 V 14 H 182 V 15 H 184 V 16 H 6 V 15 H 8 Z'/>` +
    /* 左侧次峰 */
    R(6, 14, 2, 1, GOLD) + R(8, 13, 10, 1, GOLD) + R(18, 11, 8, 1, GOLD) + R(26, 8, 8, 1, GOLD) +
    R(34, 5, 10, 1, GOLD) + R(44, 8, 8, 1, GOLD) + R(52, 10, 12, 1, GOLD) +
    R(39, 7, 5, 1, GOLD) + R(44, 9, 4, 1, GOLD) +
    /* 鞍部谷底 */
    R(64, 12, 42, 1, GOLD) +
    /* 右侧主峰 */
    R(106, 10, 10, 1, GOLD) + R(116, 7, 10, 1, GOLD) + R(126, 4, 8, 1, GOLD) + R(134, 1, 10, 1, GOLD) +
    R(144, 4, 8, 1, GOLD) + R(152, 7, 10, 1, GOLD) + R(162, 10, 10, 1, GOLD) + R(172, 13, 10, 1, GOLD) +
    R(182, 14, 2, 1, GOLD) + R(138, 3, 6, 1, GOLD) + R(132, 6, 6, 1, GOLD) +
    /* 与中段的衔接点 */
    R(5, 15, 1, 1, GOLD) + R(184, 15, 1, 1, GOLD));

  const MTN_BOT = svg('190 7',
    `<path fill='${NAVY}' d='M 6,0 H 184 V 1 H 180 V 4 H 174 V 6 H 16 V 4 H 10 V 1 H 6 Z'/>` +
    R(5, 0, 1, 1, GOLD) + R(6, 1, 4, 1, GOLD) + R(9, 2, 1, 2, GOLD) + R(10, 4, 6, 1, GOLD) + R(15, 5, 1, 1, GOLD) +
    R(184, 0, 1, 1, GOLD) + R(180, 1, 4, 1, GOLD) + R(180, 2, 1, 2, GOLD) + R(174, 4, 6, 1, GOLD) + R(174, 5, 1, 1, GOLD) +
    R(16, 6, 158, 1, GOLD));

  /* ---------------------------------------------------------------- 四种卡片 */
  const KIND = {
    moon: {
      t: 11, b: 17, pod: 5, walls: [5, 182],
      img: [uri(MOON_TOP), uri(MOON_POD), mid(5, 182), uri(MOON_BOT)],
    },
    star: {
      t: 10, b: 17, pod: 13, walls: [9, 184],
      img: [uri(STAR_TOP), uri(STAR_POD), mid(9, 184), uri(STAR_BOT)],
    },
    house: {
      t: 18, b: 5, pod: 0, walls: [14, 175],
      img: [uri(HOUSE_TOP), 'none', mid(14, 175), uri(HOUSE_BOT)],
    },
    mtn: {
      t: 16, b: 7, pod: 0, walls: [5, 184],
      img: [uri(MTN_TOP), 'none', mid(5, 184), uri(MTN_BOT)],
    },
  };

  const STYLE = Object.keys(KIND)
    .map((k) => `.px-${k}{--pc-img:${KIND[k].img.join(', ')}}`)
    .join('\n');
  const st = document.createElement('style');
  st.id = 'pixelCards';
  st.textContent = STYLE;
  document.head.appendChild(st);

  /* 哪些元素是哪一种卡片 */
  const MAP = [
    ['.row.out .b', 'moon'],
    ['.row.in .col > .b', 'star'],
    ['.thread .tn', 'house'],
    ['.thread .tool', 'house'],
    ['.thread .ts-p', 'mtn'],
  ];
  const ALL = MAP.map((m) => m[0]).join(',');

  const ro = ('ResizeObserver' in window)
    ? new ResizeObserver((list) => { for (const e of list) layout(e.target); })
    : null;

  function layout(el) {
    const kind = KIND[el.__px];
    if (!kind) return;
    const w = el.getBoundingClientRect().width;
    if (!(w > 24)) return;
    const px = (u) => Math.round((w * u) / 190) + 'px';
    el.style.setProperty('--pc-t', px(kind.t));
    el.style.setProperty('--pc-b', px(kind.b));
    if (kind.pod) el.style.setProperty('--pc-pod', px(kind.pod));
  }

  const seen = new WeakSet();
  function decorate(root) {
    for (const [sel, kind] of MAP) {
      for (const el of (root || document).querySelectorAll(sel)) {
        if (seen.has(el) || el.__px) continue;
        seen.add(el);
        el.__px = kind;
        el.classList.add('pxcard', 'px-' + kind);
        layout(el);
        if (ro) ro.observe(el);
      }
    }
  }

  function boot() {
    decorate(document);
    // 版面（视图切换 / 抽屉开合 / 字体加载）稳定后再量一次，像素高度不会半路停在旧值
    [80, 400, 1200, 2400].forEach((ms) => setTimeout(() => decorate(), ms));
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();

  // 窗口宽度变化时 ResizeObserver 已经会重算；这里再补一次兜底（打印、缩放）
  addEventListener('resize', () => { for (const el of document.querySelectorAll('.pxcard')) layout(el); });
  addEventListener('hashchange', () => setTimeout(() => decorate(), 60));
  window.__pxRefresh = () => decorate();
})();
