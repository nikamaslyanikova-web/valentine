
/**
 * Серце з повторюваного тексту по кривій + легка 3D-ілюзія через шарування.
 * Працює швидко і виглядає "як з рілсів".
 */

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const btn = document.getElementById("btn");
const msg = document.getElementById("msg");

btn.addEventListener("click", () => {
  msg.classList.toggle("hidden");
  btn.textContent = msg.classList.contains("hidden") ? "Відкрити послання" : "Сховати послання";
});

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

// --- Налаштування, які ти можеш змінити:
const phrase = "i love you ";
const glowColor = "rgba(255, 140, 214, 0.85)";
const glowColor2 = "rgba(255, 200, 240, 0.85)";
const baseSize = 18;    // базовий розмір тексту
const layers = 12;      // “товщина” серця
const density = 820;    // скільки точок по кривій

let t0 = performance.now();

function heartPoint(a) {
  // класична параметрична "heart curve"
  // a: 0..2π
  const x = 16 * Math.pow(Math.sin(a), 3);
  const y = 13 * Math.cos(a) - 5 * Math.cos(2*a) - 2 * Math.cos(3*a) - Math.cos(4*a);
  return {x, y};
}

function draw() {
  const now = performance.now();
  const time = (now - t0) / 1000;

  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;

  ctx.clearRect(0, 0, w, h);

  // легке “дихання”
  const pulse = 1 + 0.03 * Math.sin(time * 2.1);

  // центр і масштаб
  const scale = Math.min(w, h) * 0.022 * pulse;

  // повільна ротація (псевдо-3D)
  const rot = time * 0.55;

  ctx.save();
  ctx.translate(w/2, h/2 + 10);

  // тінь/світіння
  ctx.shadowBlur = 22;
  ctx.shadowColor = glowColor;

  for (let layer = 0; layer < layers; layer++) {
    const z = (layer - layers/2) / (layers/2); // -1..1
    const depth = 0.35 + 0.65 * (1 - Math.abs(z));

    // “3D”: трошки зсув і масштаб від шару
    const sx = 1 + z * 0.06 * Math.cos(rot);
    const sy = 1 + z * 0.06 * Math.sin(rot);
    const ox = z * 10 * Math.cos(rot + 0.9);
    const oy = z * 8 * Math.sin(rot + 0.9);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale * sx, -scale * sy);

    // колір шару
    ctx.fillStyle = layer % 2 === 0 ? glowColor : glowColor2;
    ctx.globalAlpha = 0.35 + 0.65 * depth;

    // шрифт у “нормальному” просторі (тому тимчасово повернемось)
    ctx.scale(1/(scale*sx), -1/(scale*sy));
    ctx.font = `600 ${baseSize + layer*0.25}px ui-sans-serif, system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // повертаємось в "heart space"
    ctx.scale(scale*sx, -scale*sy);

    // обхід кривої
    const step = (Math.PI * 2) / density;

    // невеликий нахил як у референсі
    const tilt = -0.35;

    for (let i = 0; i < density; i++) {
      const a = i * step;
      const p = heartPoint(a);

      // трохи “приплюснути” серце
      const hx = p.x * 1.05;
      const hy = p.y * 1.00;

      // позиція в піксельному просторі
      const px = hx * scale;
      const py = -hy * scale;

      // кут дотичної для орієнтації тексту
      const p2 = heartPoint(a + step);
      const tx = (p2.x - p.x);
      const ty = (p2.y - p.y);
      const ang = Math.atan2(ty, tx) + tilt;

      // малюємо текст
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // в пікселі
      ctx.translate(w/2 + ox + px, h/2 + 10 + oy + py);
      ctx.rotate(ang);
      ctx.shadowBlur = 16;
      ctx.shadowColor = glowColor;

      const s = phrase.repeat(3);
      // зсув по часу щоб "бігло"
      const shift = (time * 18 + i * 0.15 + layer * 0.6) % phrase.length;
      const txt = s.slice(Math.floor(shift), Math.floor(shift) + 18);

      ctx.fillText(txt, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  ctx.restore();

  requestAnimationFrame(draw);
}

draw();
