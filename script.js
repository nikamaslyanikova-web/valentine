const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: true });

const btn = document.getElementById("btn");
const msg = document.getElementById("msg");

btn.addEventListener("click", () => {
  msg.classList.toggle("hidden");
  btn.textContent = msg.classList.contains("hidden") ? "Відкрити послання" : "Сховати послання";
});

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildPath(); // перебудувати точки під новий розмір
}
window.addEventListener("resize", resize);

// ===== НАЛАШТУВАННЯ під “як в референсі” =====
const TEXT = "I love you";        // можеш: "Кохаю тебе"
const fontSize = 18;
const lanes = 9;                  // кількість “рядів” тексту (менше = чистіше)
const laneSpacing = 12;           // відстань між рядами (більше = як у реф)
const wordGap = 34;               // відстань між словами вздовж контуру
const speed = 35;                 // швидкість бігу (px/сек)
const tilt = -0.35;               // легкий нахил як у реф
const rotateHeart = -0.10;        // трохи повернути серце (рад)
const scaleMul = 0.94;            // масштаб серця

const color = "rgba(255, 160, 220, 0.85)";
const glow = "rgba(255, 160, 220, 0.85)";

// ===== МАТЕМАТИКА СЕРЦЯ (точки + довжина) =====
let path = [];        // [{x,y,tx,ty,nx,ny,s}]  s = cumulative length
let totalLen = 0;

function heartParam(t) {
  // класична крива серця (добре як у референсі, якщо правильно відскейлити)
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
  return { x, y };
}

function buildPath() {
  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;

  const cx = w / 2;
  const cy = h / 2 + 10;

  // підберемо масштаб до полотна
  const base = Math.min(w, h) * 0.020 * scaleMul;

  // Дискретизація контуру (чим більше — тим плавніше, але не треба дуже багато)
  const N = 520;

  // Спочатку точки в “heart space”
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    let p = heartParam(t);

    // форма ближче до референсу: трохи ширше по X і компактніше по Y
    p.x *= 1.10;
    p.y *= 1.00;

    // перенесення в пікселі + інверт Y
    let x = p.x * base;
    let y = -p.y * base;

    // поворот серця
    const cr = Math.cos(rotateHeart);
    const sr = Math.sin(rotateHeart);
    const xr = x * cr - y * sr;
    const yr = x * sr + y * cr;

    pts.push({ x: cx + xr, y: cy + yr });
  }

  // Тепер рахуємо тангенси/нормалі і накопичену довжину
  path = [];
  totalLen = 0;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const pPrev = pts[(i - 1 + pts.length) % pts.length];
    const pNext = pts[(i + 1) % pts.length];

    // тангенс як напрямок між сусідами
    let tx = pNext.x - pPrev.x;
    let ty = pNext.y - pPrev.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;

    // нормаль (перпендикуляр)
    let nx = -ty;
    let ny = tx;

    // крок довжини
    if (i > 0) {
      totalLen += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
    }

    path.push({ x: p.x, y: p.y, tx, ty, nx, ny, s: totalLen });
  }

  // замкнути довжину
  totalLen += Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
}

function pointAtLen(L) {
  // L може бути будь-яке (зациклимо)
  L = ((L % totalLen) + totalLen) % totalLen;

  // лінійний пошук для простоти (path ~ 500, норм по швидкості)
  // якщо захочеш — можна бінпошук, але не треба
  for (let i = 1; i < path.length; i++) {
    if (path[i].s >= L) {
      const a = path[i - 1];
      const b = path[i];
      const segLen = (b.s - a.s) || 1;
      const t = (L - a.s) / segLen;

      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;

      // інтерполяція напрямків
      const tx = a.tx + (b.tx - a.tx) * t;
      const ty = a.ty + (b.ty - a.ty) * t;
      const tl = Math.hypot(tx, ty) || 1;

      const itx = tx / tl;
      const ity = ty / tl;

      const nx = -ity;
      const ny = itx;

      return { x, y, tx: itx, ty: ity, nx, ny };
    }
  }
  return path[0];
}

// ===== РЕНДЕР =====
resize();
let t0 = performance.now();

function draw() {
  const now = performance.now();
  const time = (now - t0) / 1000;

  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;

  ctx.clearRect(0, 0, w, h);

  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.fillStyle = color;
  ctx.shadowBlur = 18;
  ctx.shadowColor = glow;

  // робимо “доріжки” тексту паралельно контуру (як у референсі)
  // центральна доріжка + симетрично назовні/всередину
  const mid = (lanes - 1) / 2;

  for (let lane = 0; lane < lanes; lane++) {
    const k = lane - mid;                 // -..0..+
    const offset = k * laneSpacing;       // відступ нормаллю

    // трохи прозорості для глибини (але без “заливки”)
    ctx.globalAlpha = 0.28 + 0.72 * (1 - Math.min(1, Math.abs(k) / (mid + 0.0001)));

    // “біг” по довжині
    const run = time * speed + lane * 7;

    // розставляємо слова вздовж контуру з кроком wordGap
    for (let L = 0; L < totalLen; L += wordGap) {
      const p = pointAtLen(L + run);

      const x = p.x + p.nx * offset;
      const y = p.y + p.ny * offset;

      // кут по тангенсу + легкий нахил як у реф
      const ang = Math.atan2(p.ty, p.tx) + tilt;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillText(TEXT, 0, 0);
      ctx.restore();
    }
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(draw);
}

draw();
