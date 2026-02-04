// ======= Toggle message =======
const btn = document.getElementById("btn");
const msg = document.getElementById("msg");
btn.addEventListener("click", () => {
  msg.classList.toggle("hidden");
  btn.textContent = msg.classList.contains("hidden") ? "Відкрити послання" : "Сховати послання";
});

// ======= Heart Canvas (reference-like) =======
const canvas = document.getElementById("heartCanvas");
const ctx = canvas.getContext("2d", { alpha: true });

const SETTINGS = {
  text: "I love you",
  fontSize: 18,              // близько як у референсі
  letterSpacingPx: 2,
  glowBlur: 10,
  baseColor: "rgba(234,128,176,0.85)",
  glowColor: "rgba(255,255,255,0.55)",

  // Контур (ліва частина) — чистіша і менш "товста"
  leftLanes: 6,
  leftLaneSpacing: 10,

  // Правий "обʼєм" — більше доріжок і ближче одна до одної (як у реф)
  rightLanes: 12,
  rightLaneSpacing: 7,

  // Крок по довжині (менше написів і більша відстань між ними)
  wordGapMin: 34,            // мінімальна відстань між словами вздовж контуру
  wordGapExtra: 10,          // + до ширини тексту (авто підстройка)

  // Рух
  speed: 42,                 // px/сек уздовж контуру
  tilt: -0.42,               // нахил слова (реф ~ -30deg)
  rotateHeart: -0.18,        // повернути все серце
  scaleMul: 1.00,

  // “3D” зміщення вглиб по правій стороні
  depthShiftX: 22,
  depthShiftY: -10,
};

let path = [];    // {x,y,tx,ty,nx,ny,s}
let totalLen = 0;

function heartParam(t) {
  // Класична крива серця (гарно схожа на референс)
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
  return { x, y };
}

function buildPath() {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const cx = w / 2;
  const cy = h / 2 + 10;

  const base = Math.min(w, h) * 0.020 * SETTINGS.scaleMul;

  // гладкість
  const N = 900;

  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    let p = heartParam(t);

    // Підгонка пропорцій під референс (трохи ширше)
    p.x *= 1.13;
    p.y *= 1.02;

    let x = p.x * base;
    let y = -p.y * base;

    // поворот серця
    const cr = Math.cos(SETTINGS.rotateHeart);
    const sr = Math.sin(SETTINGS.rotateHeart);
    const xr = x * cr - y * sr;
    const yr = x * sr + y * cr;

    pts.push({ x: cx + xr, y: cy + yr });
  }

  path = [];
  totalLen = 0;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const pPrev = pts[(i - 1 + pts.length) % pts.length];
    const pNext = pts[(i + 1) % pts.length];

    let tx = pNext.x - pPrev.x;
    let ty = pNext.y - pPrev.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;

    const nx = -ty;
    const ny = tx;

    if (i > 0) totalLen += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);

    path.push({ x: p.x, y: p.y, tx, ty, nx, ny, s: totalLen });
  }

  totalLen += Math.hypot(
    pts[0].x - pts[pts.length - 1].x,
    pts[0].y - pts[pts.length - 1].y
  );
}

function pointAtLen(L) {
  L = ((L % totalLen) + totalLen) % totalLen;

  for (let i = 1; i < path.length; i++) {
    if (path[i].s >= L) {
      const a = path[i - 1];
      const b = path[i];
      const segLen = (b.s - a.s) || 1;
      const t = (L - a.s) / segLen;

      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;

      let tx = a.tx + (b.tx - a.tx) * t;
      let ty = a.ty + (b.ty - a.ty) * t;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;

      const nx = -ty;
      const ny = tx;

      return { x, y, tx, ty, nx, ny };
    }
  }
  return path[0];
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildPath();
}
window.addEventListener("resize", resize);
resize();

function setupTextStyle() {
  ctx.font = `600 ${SETTINGS.fontSize}px ui-sans-serif, system-ui`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = SETTINGS.baseColor;
  ctx.shadowBlur = SETTINGS.glowBlur;
  ctx.shadowColor = SETTINGS.glowColor;
}

function drawWord(x, y, ang, word, alpha) {
  ctx.globalAlpha = alpha;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  // “letter-spacing” на canvas напряму нема — робимо вручну
  const ls = SETTINGS.letterSpacingPx;
  let xx = 0;
  for (const ch of word) {
    ctx.fillText(ch, xx, 0);
    xx += ctx.measureText(ch).width + ls;
  }
  ctx.restore();
}

let t0 = performance.now();

function draw() {
  const now = performance.now();
  const time = (now - t0) / 1000;

  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  // чорне тло як у референсі (підкреслює неон)
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(0,0,0,0.88)";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  setupTextStyle();

  // wordGap під реальну ширину слова (як у референсі — не надто густо)
  const baseW = ctx.measureText(SETTINGS.text).width + SETTINGS.wordGapExtra;
  const wordGap = Math.max(SETTINGS.wordGapMin, baseW);

  // Малюємо по довжині контуру
  // Розділяємо на ліву і праву сторону: на правій робимо “обʼєм”
  const run = time * SETTINGS.speed;

  // Невелике "пульс" світіння
  const pulse = 0.85 + 0.15 * Math.sin(time * 2.2);

  for (let L = 0; L < totalLen; L += wordGap) {
    const p = pointAtLen(L + run);

    // Кут по дотичній + нахил
    const ang = Math.atan2(p.ty, p.tx) + SETTINGS.tilt;

    // визначаємо “праву” сторону серця (за x відносно центру)
    const isRight = p.x > w / 2;

    if (!isRight) {
      // Ліва сторона: 6 доріжок, чисто
      for (let i = 0; i < SETTINGS.leftLanes; i++) {
        const off = i * SETTINGS.leftLaneSpacing;
        const x = p.x + p.nx * off;
        const y = p.y + p.ny * off;

        const a = (0.92 - i * 0.10) * pulse;
        drawWord(x, y, ang, SETTINGS.text, a);
      }
    } else {
      // Права сторона: більше доріжок + "depth" зсув (як у референсі)
      for (let i = 0; i < SETTINGS.rightLanes; i++) {
        const off = i * SETTINGS.rightLaneSpacing;

        // контурні доріжки
        const x1 = p.x + p.nx * off;
        const y1 = p.y + p.ny * off;

        // "обʼєм" зміщуємо по діагоналі (праворуч-вгору) і трохи слабше
        const depthK = i / (SETTINGS.rightLanes - 1);
        const dx = SETTINGS.depthShiftX * depthK;
        const dy = SETTINGS.depthShiftY * depthK;

        const a = (0.95 - i * 0.055) * pulse;
        drawWord(x1 + dx, y1 + dy, ang, SETTINGS.text, a);
      }
    }
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(draw);
}

draw();
