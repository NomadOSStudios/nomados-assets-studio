import type { Effect } from "./project";
function random(seed: number) {
  let n = seed | 0;
  return () => {
    n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function drawEffect(
  ctx: CanvasRenderingContext2D,
  e: Effect,
  time: number,
) {
  const { width: w, height: h } = e,
    t = Math.max(0, Math.min(e.duration, time)),
    r = random(e.seed),
    colors = [e.color, e.secondary, "#ffffff", "#facc15"];
  ctx.clearRect(0, 0, w, h);
  if (e.type === "background") {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, e.color);
    g.addColorStop(1, e.secondary);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < e.count / 2; i++) {
      const bx = r() * w,
        by = r() * h,
        phase = r() * Math.PI * 2,
        size = e.size * (1 + r() * 3),
        a = (2 * Math.PI * t) / e.duration;
      ctx.beginPath();
      ctx.arc(
        bx + Math.cos(a + phase) * e.speed * 22,
        by + Math.sin(a + phase) * e.speed * 22,
        size,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.1})`;
      ctx.fill();
    }
    return;
  }
  for (let i = 0; i < e.count; i++) {
    const phase = r(),
      angle = -Math.PI / 2 + ((r() - 0.5) * e.spread * Math.PI) / 180,
      speed = (65 + r() * 120) * e.speed,
      size = e.size * (0.5 + r()),
      spin = (r() - 0.5) * 12,
      color = colors[Math.floor(r() * colors.length)];
    let x, y, alpha, rotation;
    if (e.type === "confetti") {
      const age = Math.max(0, t - phase * 0.18);
      x = w / 2 + Math.cos(angle) * speed * age;
      y = h * 0.7 + Math.sin(angle) * speed * age + (e.gravity * age * age) / 2;
      alpha = Math.min(1, t * 16) * Math.min(1, (e.duration - t) * 3);
      rotation = spin * age;
    } else {
      const a = 2 * Math.PI * (t / e.duration + phase);
      x = r() * w + Math.sin(a) * e.speed * 12;
      y = r() * h + Math.cos(a) * e.speed * 12;
      alpha = (Math.sin(a) + 1) / 2;
      rotation = a / 2;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    if (e.type === "confetti")
      ctx.fillRect(
        -size / 2,
        -size / 4,
        size,
        Math.max(1, (Math.abs(Math.cos(t * spin)) * size) / 2),
      );
    else {
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(size * 0.2, -size * 0.2, size, 0);
      ctx.quadraticCurveTo(size * 0.2, size * 0.2, 0, size);
      ctx.quadraticCurveTo(-size * 0.2, size * 0.2, -size, 0);
      ctx.quadraticCurveTo(-size * 0.2, -size * 0.2, 0, -size);
      ctx.fill();
    }
    ctx.restore();
  }
}
export function renderEffect(e: Effect, time: number) {
  const c = document.createElement("canvas");
  c.width = e.width;
  c.height = e.height;
  drawEffect(c.getContext("2d")!, e, time);
  return c;
}
