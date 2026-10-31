(() => {
  const container = document.createElement('div');
  container.className = 'starry-reflection-container';
  container.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  canvas.id = 'starryWaterCanvas';
  container.appendChild(canvas);
  document.body.appendChild(container);

  const ctx = canvas.getContext('2d', { alpha: true });
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const PIXEL_SCALE = 3;
  const BACKGROUND_WIDTH = 4128;
  const BACKGROUND_HEIGHT = 1024;
  const reflectionCols = [
    { xSrc: 0.31, width: 4, lenRatio: 0.92 },
    { xSrc: 0.38, width: 5, lenRatio: 0.96 },
    { xSrc: 0.43, width: 6, lenRatio: 0.98 },
    { xSrc: 0.48, width: 7, lenRatio: 0.99 },
    { xSrc: 0.54, width: 6, lenRatio: 0.98 },
    { xSrc: 0.60, width: 5, lenRatio: 0.94 },
    { xSrc: 0.62, width: 4, lenRatio: 0.90 },
    { xSrc: 0.69, width: 3, lenRatio: 0.85 },
    { xSrc: 0.76, width: 3, lenRatio: 0.80 },
    { xSrc: 0.92, width: 3, lenRatio: 0.80 }
  ];

  let width = 0;
  let height = 0;
  let strayRipples = [];
  let frameId = 0;
  let lastFrame = 0;

  function centerBiasedRandom() {
    const u = Math.random() * 2 - 1;
    const v = Math.random() * 2 - 1;
    const w = Math.random() * 2 - 1;
    return 0.5 + (u + v + w) / 6;
  }

  function pxRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function initRipples() {
    strayRipples = [];
    const strayCount = Math.floor(width * 0.28);
    for (let i = 0; i < strayCount; i++) {
      strayRipples.push({
        x: Math.floor(centerBiasedRandom() * width),
        y: Math.floor(3 + Math.random() * Math.max(1, height - 4)),
        len: 1 + Math.floor(Math.random() * 4),
        phase: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 2.5
      });
    }
  }

  function render(timestamp = 0) {
    const time = Math.floor(timestamp / 100);
    ctx.clearRect(0, 0, width, height);

    const backgroundHeight = Math.floor(window.innerHeight / PIXEL_SCALE);
    const backgroundScale = Math.max(width / BACKGROUND_WIDTH, backgroundHeight / BACKGROUND_HEIGHT);
    const visibleSourceWidth = width / backgroundScale;
    const sourceStart = (BACKGROUND_WIDTH - visibleSourceWidth) * 0.5 / BACKGROUND_WIDTH;
    const sourceRange = visibleSourceWidth / BACKGROUND_WIDTH;

    for (const col of reflectionCols) {
      const xScreen = (col.xSrc - sourceStart) / sourceRange;
      if (xScreen < 0 || xScreen > 1) continue;
      const baseX = Math.floor(xScreen * width);
      const maxRow = Math.floor((height - 2) * col.lenRatio);
      for (let dy = 0; dy < maxRow; dy++) {
        const y = 2 + dy;
        const progress = dy / maxRow;
        const waveShift = Math.round(Math.sin(dy * 0.45 - time * 0.24 + col.xSrc * 10) * 1.4);
        const segWidth = Math.max(1, Math.round(col.width * (1 - progress * 0.45) + Math.cos(dy * 0.7 + time * 0.3) * 1.2));
        if (Math.sin(dy * 1.3 + time * 0.2) < -0.65) continue;
        const drawX = baseX + waveShift - Math.floor(segWidth / 2);
        pxRect(drawX, y, segWidth, 1, '#C9962C');
        if (segWidth >= 2) pxRect(drawX + 1, y, Math.max(1, segWidth - 2), 1, '#F2C14E');
        if (dy < maxRow * 0.5 && Math.sin(dy * 0.9 - time * 0.4) > 0.78) pxRect(baseX + waveShift, y, 1, 1, '#F5E9C8');
      }
    }

    for (const r of strayRipples) {
      const wave = Math.sin(time * 0.1 * r.speed + r.phase);
      if (wave < -0.1) continue;
      const color = wave > 0.65 ? '#F2C14E' : '#7A591B';
      const curLen = wave > 0.4 ? r.len : Math.max(1, r.len - 1);
      pxRect(r.x, r.y, curLen, 1, color);
    }
  }

  function animate(timestamp) {
    if (timestamp - lastFrame >= 100) {
      lastFrame = timestamp;
      render(timestamp);
    }
    frameId = requestAnimationFrame(animate);
  }

  function motionChanged() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrame = 0;
    if (motionQuery.matches) render(0);
    else frameId = requestAnimationFrame(animate);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.floor(rect.width / PIXEL_SCALE);
    height = Math.floor(rect.height / PIXEL_SCALE);
    canvas.width = width;
    canvas.height = height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    initRipples();
    if (motionQuery.matches) render(0);
  }

  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(container);
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', motionChanged);
  else motionQuery.addListener(motionChanged);

  resize();
  motionChanged();
})();
