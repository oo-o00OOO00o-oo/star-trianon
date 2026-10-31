(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'starry-sky-canvas';
  canvas.id = 'starrySkyCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  const sky = document.createElement('canvas');
  const skyCtx = sky.getContext('2d');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const palette = ['#102b4e', '#173b60', '#205172', '#2b647d', '#467f8b', '#78958d'];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let stars = [];
  let swirls = [];
  let swirlArcs = [];
  let flowStrokes = [];
  let stardust = [];
  let animationId = 0;
  let resizeId = 0;
  let seed = 20261030;

  function random() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  function rgba(hex, alpha) {
    const value = parseInt(hex.slice(1), 16);
    return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha.toFixed(3)})`;
  }

  function flowVector(x, y) {
    let vx = 1;
    let vy = Math.sin(x * 0.006 + y * 0.009) * 0.25;

    for (const swirl of swirls) {
      const dx = (x - swirl.x) / swirl.radius;
      const dy = (y - swirl.y) / (swirl.radius * 0.58);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 0.02 && distance < 1.75) {
        const force = (1 - distance / 1.75) * 2.7 * swirl.direction;
        vx += (-dy / distance) * force;
        vy += (dx / distance) * force;
      }
    }

    return Math.atan2(vy, vx);
  }

  function createScene() {
    seed = 20261030;
    const unit = Math.min(width, height);

    swirls = [
      { x: width * 0.16, y: height * 0.34, radius: Math.max(width * 0.19, unit * 0.27), direction: 1 },
      { x: width * 0.82, y: height * 0.50, radius: Math.max(width * 0.16, unit * 0.23), direction: -1 },
      { x: width * 0.50, y: height * 0.16, radius: Math.max(width * 0.13, unit * 0.18), direction: 1 }
    ];

    swirlArcs = [];
    for (const swirl of swirls) {
      for (let i = 0; i < 120; i++) {
        const radiusRatio = 0.08 + Math.pow(random(), 0.72) * 0.98;
        const radius = radiusRatio * swirl.radius;
        const golden = random() < 0.14;
        const cream = !golden && random() < 0.04;
        let color = palette[2 + Math.floor(random() * 4)];
        if (golden) color = '#f2c14e';
        else if (cream) color = '#f5e9c8';

        swirlArcs.push({
          swirl,
          angle: random() * TAU,
          radius,
          angularSpeed: (0.18 + (1 - radiusRatio) * 0.35 + random() * 0.15) * swirl.direction,
          arcSpan: (6 + random() * 14) / Math.max(28, radius),
          lineWidth: 0.8 + random() * 1.9,
          color,
          baseAlpha: golden ? (0.28 + random() * 0.28) : (0.22 + random() * 0.32),
          phase: random() * TAU,
          pulseSpeed: 1.2 + random() * 1.8
        });
      }
    }

    const dynamicStrokeCount = Math.min(300, Math.max(200, Math.floor((width * height) / 5400)));
    flowStrokes = [];
    for (let i = 0; i < dynamicStrokeCount; i++) {
      const isGold = random() < 0.11;
      flowStrokes.push({
        x: random() * width,
        y: random() * height,
        length: 7 + random() * 5.8,
        lineWidth: 0.7 + random() * 1.8,
        speed: 14 + random() * 28,
        bend: (random() - 0.5) * 3.8,
        color: isGold ? '#f2c14e' : palette[1 + Math.floor(random() * (palette.length - 1))],
        baseAlpha: isGold ? (0.22 + random() * 0.32) : (0.16 + random() * 0.28),
        phase: random() * TAU
      });
    }

    const positions = [
      [0.09, 0.18, 0.72], [0.18, 0.58, 0.56], [0.30, 0.15, 1.05],
      [0.42, 0.38, 0.68], [0.54, 0.11, 0.58], [0.66, 0.28, 1.02],
      [0.82, 0.16, 1.42], [0.91, 0.46, 0.65], [0.52, 0.68, 0.52],
      [0.76, 0.72, 0.48], [0.08, 0.76, 0.45],
      [0.24, 0.34, 0.62], [0.37, 0.62, 0.54], [0.61, 0.48, 0.64],
      [0.73, 0.12, 0.58], [0.87, 0.70, 0.52], [0.15, 0.38, 0.48],
      [0.47, 0.22, 0.76]
    ];

    stars = positions.filter((_, index) => index % 3 === 0).map(([x, y, scale], index) => {
      const arcCount = 18 + Math.floor(scale * 6);
      return {
        x: x * width + (random() - 0.5) * unit * 0.02,
        y: y * height + (random() - 0.5) * unit * 0.02,
        size: Math.max(4.8, Math.min(14, unit * 0.013)) * scale,
        phase: random() * TAU,
        speed: 1.4 + random() * 1.2,
        rotation: random() * TAU,
        rotSpeed: (random() > 0.5 ? 1 : -1) * (0.18 + random() * 0.25),
        rays: Array.from({ length: 14 }, () => ({
          len: 1.45 + random() * 1.35,
          wobblePhase: random() * TAU,
          wobbleSpeed: 2.0 + random() * 2.2
        })),
        arcs: Array.from({ length: arcCount }, (_, arcIndex) => {
          const ringLayer = arcIndex / arcCount;
          return {
            radius: 1.15 + ringLayer * 2.4 + random() * 0.18,
            start: random() * TAU,
            length: 0.45 + random() * 1.15,
            spinSpeed: (arcIndex % 2 === 0 ? 1 : -1) * (0.35 + random() * 0.55),
            lineWidth: 0.9 + (1 - ringLayer * 0.5) * 1.35,
            alpha: 0.28 + (1 - ringLayer) * 0.34,
            isCream: arcIndex % 4 === 0,
            phase: random() * TAU
          };
        }),
        warm: index === 6 || index === 2 || index === 5
      };
    });

    stardust = Array.from({ length: Math.floor(width / 7) }, () => ({
      x: random() * width,
      y: random() * height * 0.88,
      radius: 0.4 + random() * 1.1,
      baseAlpha: 0.18 + random() * 0.45,
      speed: 1.5 + random() * 2.8,
      phase: random() * TAU,
      isCream: random() < 0.25
    }));

    for (const swirl of swirls) swirl.y *= 0.4;
    for (const stroke of flowStrokes) stroke.y *= 0.4;
    for (const star of stars) star.y *= 0.4;
    for (const dust of stardust) dust.y *= 0.4;
  }

  const backgroundImage = new Image();
  let backgroundReady = false;
  backgroundImage.addEventListener('load', () => {
    backgroundReady = true;
    paintBackground();
    if (motionPreference.matches || document.hidden) render(0);
  });
  backgroundImage.src = '__STARRY_BACKGROUND__';

  function paintBackground() {
    skyCtx.fillStyle = '#07111f';
    skyCtx.fillRect(0, 0, width, height);
    if (backgroundReady) {
      const scale = Math.max(width / backgroundImage.naturalWidth, height / backgroundImage.naturalHeight);
      const sourceWidth = width / scale;
      const sourceHeight = height / scale;
      const sourceX = (backgroundImage.naturalWidth - sourceWidth) * 0.5;
      const sourceY = (backgroundImage.naturalHeight - sourceHeight) * 0.5;
      skyCtx.drawImage(backgroundImage, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
    }
  }

  function paintSwirlArcs(time) {
    ctx.lineCap = 'round';
    for (let i = 0; i < swirlArcs.length; i++) {
      const a = swirlArcs[i];
      const currentAngle = a.angle + time * a.angularSpeed;
      const pulse = Math.sin(time * a.pulseSpeed + a.phase);
      const r = a.radius * (1 + pulse * 0.03);

      const x1 = a.swirl.x + Math.cos(currentAngle) * r;
      const y1 = a.swirl.y + Math.sin(currentAngle) * r * 0.58;
      const midAngle = currentAngle + a.arcSpan * 0.5 * a.swirl.direction;
      const endAngle = currentAngle + a.arcSpan * a.swirl.direction;
      const xm = a.swirl.x + Math.cos(midAngle) * (r + 1.8);
      const ym = a.swirl.y + Math.sin(midAngle) * (r + 1.8) * 0.58;
      const x2 = a.swirl.x + Math.cos(endAngle) * r;
      const y2 = a.swirl.y + Math.sin(endAngle) * r * 0.58;

      const alpha = Math.max(0.05, a.baseAlpha + pulse * 0.12);
      ctx.strokeStyle = rgba(a.color, alpha);
      ctx.lineWidth = a.lineWidth;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(xm, ym, x2, y2);
      ctx.stroke();
    }
  }

  function paintFlowStrokes(dt, time) {
    ctx.lineCap = 'round';
    for (let i = 0; i < flowStrokes.length; i++) {
      const s = flowStrokes[i];
      const angle = flowVector(s.x, s.y);

      s.x += Math.cos(angle) * s.speed * dt;
      s.y += Math.sin(angle) * s.speed * dt;

      if (s.x > width + 25) s.x = -20;
      else if (s.x < -25) s.x = width + 20;
      if (s.y > height * 0.4 + 25) s.y = -20;
      else if (s.y < -25) s.y = height * 0.4 + 20;

      const wave = Math.sin(time * 2.2 + s.phase);
      const alpha = Math.max(0.04, (s.baseAlpha + wave * 0.1) * (1 - (s.y / height) * 0.3));
      const len = s.length * (0.88 + wave * 0.16);

      ctx.strokeStyle = rgba(s.color, alpha);
      ctx.lineWidth = s.lineWidth;
      ctx.beginPath();
      ctx.moveTo(s.x - Math.cos(angle) * len * 0.5, s.y - Math.sin(angle) * len * 0.5);
      ctx.quadraticCurveTo(
        s.x - Math.sin(angle) * s.bend,
        s.y + Math.cos(angle) * s.bend,
        s.x + Math.cos(angle) * len * 0.5,
        s.y + Math.sin(angle) * len * 0.5
      );
      ctx.stroke();
    }
  }

  function paintStar(star, time) {
    const pulse = 1 + Math.sin(time * star.speed + star.phase) * 0.16;
    const arm = Math.max(2, Math.round(star.size * pulse * 0.42));
    const x = Math.round(star.x);
    const y = Math.round(star.y);

    ctx.fillStyle = '#f2c14e';
    for (let step = 2; step <= arm; step++) {
      ctx.fillRect(x, y - step, 1, 1);
      ctx.fillRect(x, y + step, 1, 1);
      ctx.fillRect(x - step, y, 1, 1);
      ctx.fillRect(x + step, y, 1, 1);
    }
    ctx.fillStyle = '#f5e9c8';
    ctx.fillRect(x - 1, y - 1, 3, 3);
  }

  const PIXEL_SCALE = 3;
  let lastTime = 0;
  let lastFrame = 0;

  function render(timestamp = 0) {
    const time = Math.floor(timestamp / 100) * 0.1;
    const dt = Math.min(0.1, lastTime ? (timestamp - lastTime) / 1000 : 0.1);
    lastTime = timestamp;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(sky, 0, 0, width, height);
    paintFlowStrokes(dt, time);
    paintSwirlArcs(time);

    for (let i = 0; i < stardust.length; i++) {
      const d = stardust[i];
      const twinkle = Math.sin(time * d.speed + d.phase);
      if (twinkle < -0.4) continue;
      const x = Math.round(d.x);
      const y = Math.round(d.y);
      const arm = twinkle > 0.45 ? 3 : 2;
      ctx.fillStyle = twinkle > -0.2 ? '#f2c14e' : '#c9962c';
      for (let step = 2; step <= arm; step++) {
        ctx.fillRect(x, y - step, 1, 1);
        ctx.fillRect(x, y + step, 1, 1);
        ctx.fillRect(x - step, y, 1, 1);
        ctx.fillRect(x + step, y, 1, 1);
      }
      ctx.fillStyle = d.isCream || twinkle > 0.6 ? '#f5e9c8' : '#f2c14e';
      ctx.fillRect(x - 1, y - 1, 3, 3);
    }

    const lowerShade = ctx.createLinearGradient(0, height * 0.58, 0, height);
    lowerShade.addColorStop(0, 'rgba(4, 12, 25, 0)');
    lowerShade.addColorStop(1, 'rgba(4, 12, 25, 0.56)');
    ctx.fillStyle = lowerShade;
    ctx.fillRect(0, height * 0.58, width, height * 0.42);

    for (const star of stars) {
      paintStar(star, time);
    }
  }

  function animate(timestamp) {
    if (timestamp - lastFrame >= 100) {
      lastFrame = timestamp;
      render(timestamp);
    }
    animationId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    cancelAnimationFrame(animationId);
    lastTime = 0;
    lastFrame = 0;
    if (motionPreference.matches || document.hidden) {
      render(0);
    } else {
      animationId = requestAnimationFrame(animate);
    }
  }

  function resize() {
    width = Math.floor(window.innerWidth / PIXEL_SCALE);
    height = Math.floor(window.innerHeight / PIXEL_SCALE);
    dpr = 1;
    canvas.width = width;
    canvas.height = height;
    sky.width = width;
    sky.height = height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    skyCtx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    skyCtx.imageSmoothingEnabled = false;
    createScene();
    paintBackground();
    startAnimation();
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeId);
    resizeId = requestAnimationFrame(resize);
  });
  document.addEventListener('visibilitychange', startAnimation);
  motionPreference.addEventListener('change', startAnimation);
  resize();
})();
