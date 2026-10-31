/* =====================================================================
   右侧卷宗 · 拉手 → 人物

   靠近屏幕右缘热区（右侧 1/3、上半 42%）时：
     fx-sparkle 正向播一遍（角色从火花里浮现）
       → 接 ballet-spin 循环（61 帧，一圈约 2.5s）
       → 固定时间 HOLD_MS 后：
            期间点了  → 打开卷宗（人物淡出，卷宗掀开）
            没点      → fx-sparkle 倒放，火花收拢，角色散掉

   帧素材在 src/rpa/（由 build_rococo_v2.py 以 data URI 注入）。两个序列按
   “角色身体中心”对齐：fx 中心 x≈238/502，spin 中心 x≈111/219，所以 spin
   层放在 stage 的 127/502 = 25.3% 处。
   ===================================================================== */
(() => {
  'use strict';

  const FX = __RPA_FX__;        // 30 帧，502×306
  const SPIN = __RPA_SPIN__;    // 61 帧，219×306

  const FPS_IN = 24;            // 火花：30 帧 ≈ 1.25s
  const FPS_SPIN = 18;          // 旋转：61 帧 ≈ 3.4s 一圈
  const HOLD_MS = 6000;         // 浮现后站住等你点的时间
  const RM = matchMedia('(prefers-reduced-motion: reduce)');

  let tab = null, fx = null, spin = null;
  let state = 'idle';           // idle | in | hold | out
  let t0 = 0, frame = -1, raf = 0, holdT = 0;
  let warmed = false;

  /* ?rpalog：把状态迁移写进 body[data-rpalog]，方便无头环境核对时序 */
  const LOG = location.search.indexOf('rpalog') >= 0;
  const log = (m) => {
    if (!LOG) return;
    document.body.setAttribute('data-rpalog',
      (document.body.getAttribute('data-rpalog') || '') + ' ' + m + '@' + Math.round(performance.now()));
  };

  function ensure() {
    if (tab) return true;
    tab = document.getElementById('rpTab');
    if (!tab) return false;
    tab.classList.add('rpa');
    tab.innerHTML = '<span class="rpa-stage">' +
      '<img class="rpa-fx" alt="" draggable="false">' +
      '<img class="rpa-spin" alt="" draggable="false">' +
      '<i class="rpa-hit"></i></span>';
    fx = tab.querySelector('.rpa-fx');
    spin = tab.querySelector('.rpa-spin');
    return true;
  }

  /* 预解码：91 张 data URI，等页面空下来再热，靠近时就不卡 */
  function warm() {
    if (warmed) return;
    warmed = true;
    [].concat(FX, SPIN).forEach((src) => { const im = new Image(); im.decoding = 'async'; im.src = src; });
  }
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 3000 });
  else setTimeout(warm, 1200);

  /* rAF 的时间戳可能比定时器里取的 t0 还早一点，负数取模会得到 undefined 帧，这里统一夹到 0 */
  const idx = (v) => { const k = Math.floor(v); return k < 0 ? 0 : k; };

  function show(list, i, node) {
    if (i === frame) return;
    if (!list[i]) return;          // 越界/未加载的帧不写进 src，否则 <img> 会变成裂图
    frame = i;
    node.src = list[i];
  }

  function loop(now) {
    raf = 0;
    if (state === 'in') {
      const i = Math.min(FX.length - 1, idx((now - t0) / (1000 / FPS_IN)));
      show(FX, i, fx);
    } else if (state === 'hold') {
      const i = idx((now - t0) / (1000 / FPS_SPIN)) % SPIN.length;
      show(SPIN, i, spin);
    } else if (state === 'out') {
      const i = Math.max(0, FX.length - 1 - idx((now - t0) / (1000 / FPS_IN)));
      show(FX, i, fx);
    } else {
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  function start() { if (!raf) raf = requestAnimationFrame(loop); }

  /* 状态迁移一律用定时器，rAF 只负责画帧：标签页被挂起、rAF 被节流时也不会卡死 */
  const FX_MS = (FX.length * 1000) / FPS_IN;

  function summon() {
    if (!ensure()) return;
    if (state === 'in' || state === 'hold') return;
    clearTimeout(holdT);
    state = 'in';
    t0 = performance.now();
    log('summon');
    frame = -1;
    tab.classList.add('on');
    tab.classList.remove('hold');
    if (RM.matches) { fx.src = FX[FX.length - 1]; enterHold(); return; }
    start();
    holdT = setTimeout(enterHold, FX_MS);
  }

  function enterHold() {
    if (state !== 'in') return;
    clearTimeout(holdT);
    state = 'hold';
    t0 = performance.now();
    log('hold');
    frame = -1;
    tab.classList.add('hold');          // 火花层淡出、旋转层淡入
    spin.src = SPIN[0];
    holdT = setTimeout(dismiss, HOLD_MS);
    start();
  }

  function dismiss() {
    clearTimeout(holdT);
    if (state === 'idle' || state === 'out') return;
    tab.classList.remove('hold');
    if (RM.matches) { finish(); return; }
    state = 'out';
    t0 = performance.now();
    log('out');
    frame = -1;
    start();
    holdT = setTimeout(finish, FX_MS);
  }

  function finish() {
    clearTimeout(holdT);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    state = 'idle';
    frame = -1;
    log('finish');
    if (tab) tab.classList.remove('on', 'hold');
  }

  /* 点了卷宗 / 别处要收起来：直接消失，不播退场 */
  function hide() {
    clearTimeout(holdT);
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    state = 'idle';
    frame = -1;
    log('hide');
    if (tab) tab.classList.remove('on', 'hold');
  }

  window.__rpa = {
    summon,
    dismiss,
    hide,
    get state() { return state; },
    get playing() { return state !== 'idle'; },
    HOLD_MS,
  };

  /* 先把舞台挂上去（透明），热区一碰就直接出画，不会先闪一下 layout */
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', ensure);
  else ensure();

  /* ?rpclick：2.6s 后自动点她一下，方便无头验收「点人物 → 卷宗打开」这条链 */
  if (location.search.indexOf('rpclick') >= 0) {
    setTimeout(() => { if (tab) tab.click(); }, 2600);
  }
  /* ?rpstill：直接喊出来并停在站立的循环里，方便截图核对（不触发收场） */
  if (location.search.indexOf('rpstill') >= 0) {
    setTimeout(() => {
      summon();
      setTimeout(() => clearTimeout(holdT), FX_MS + 60);
    }, 200);
  }
})();
