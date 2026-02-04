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
}
window.addEventListener("resize", resize);
resize();

// ====== Налаштування (можеш підкрутити) ======
const phrase = "i love you ";
const fontSize = 18;
const layers = 5;          // було 12+ (лагало). 4-6 ок
const pointsCount = 220;   // було ~820 (лагало). 180-260 ок
const textEvery = 2;       // малювати текст не на кожній точці
const tilt = -0.35;        // нахил тексту як у референсі
const speed = 10;          // швидкість “бігу” тексту

const glow1 = "rgba(255, 140, 214, 0.9)";
const glow2 = "rgba(255, 200, 240, 0.85)";

// ====== Серце (класична крива) ======
function heartPoint(a) {
  const x = 16 * Math.pow(Math.sin(a), 3);
  const y = 13 * Math.cos(a) - 5 * Math.cos(2*a) - 2 * Math.cos(3*a) - Math.cos(4*a);
  return { x, y };
}

// Попередньо рахуємо точки + кути дотичної (1 раз)
const pts = [];
for (let i = 0; i < pointsCount; i++) {
  const a = (i / pointsCount) * Math.PI * 2;
  const p = heartPoint(a);
  const a2 = ((i + 1) / pointsCount) * Math.PI * 2;
  const p2 = heartPoint(a2);

  const tx = p2.x - p.x;
  const ty = p2.y - p.y;
  const ang = Math.atan2(ty, tx) + tilt;

  pts.push({ x: p.x * 1.05, y: p.y * 1.0, ang });
}

// ====== Рендер ======
let t0 = performance.now();

function draw() {
  const now = performance.now();
  const time = (now - t0) / 1000;

  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;

  ctx.clearRect(0, 0, w, h);

  // масштаб
  const pulse = 1 + 0.03 * Math.sin(time * 2.1);
  const scale = Math.min(w, h) * 0.022 * pulse;

  const cx = w / 2;
  const cy = h / 2 + 10;

  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // менше шарів = швидше, але все ще “об’ємно”
  for (let layer = 0; layer < layers; layer++) {
    const z = (layer - (layers - 1) / 2) / ((layers - 1) / 2); // -1..1
    const depth = 0.35 + 0.65 * (1 - Math.abs(z));

    const rot = time * 0.55;
    const ox = z * 10 * Math.cos(rot + 0.9);
    const oy = z * 8 * Math.sin(rot + 0.9);

    ctx.globalAlpha = depth;
    ctx.fillStyle = layer % 2 === 0 ? glow1 : glow2;
    ctx.shadowBlur = 18;
    ctx.shadowColor = glow1;

    for (let i = 0; i < pts.length; i += textEvery) {
      const p = pts[i];

      // позиція точки серця в пікселях
      const px = cx + ox + p.x * scale;
      const py = cy + oy - p.y * scale;

      // шматок тексту, що “біжить”
      const s = phrase.repeat(4);
      const shift = Math.floor((time * speed + i * 0.18 + layer * 0.6) % phrase.length);
      const txt = s.slice(shift, shift + 18);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.ang);
      ctx.fillText(txt, 0, 0);
      ctx.restore();
    }
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(draw);
}

draw();
