// const canvas = document.getElementById("c");
// const ctx = canvas.getContext("2d", { alpha: true });

// const btn = document.getElementById("btn");
// const msg = document.getElementById("msg");

// btn.addEventListener("click", () => {
//   msg.classList.toggle("hidden");
//   btn.textContent = msg.classList.contains("hidden") ? "Відкрити послання" : "Сховати послання";
// });

// function resize() {
//   const rect = canvas.getBoundingClientRect();
//   const dpr = Math.min(2, window.devicePixelRatio || 1);
//   canvas.width = Math.floor(rect.width * dpr);
//   canvas.height = Math.floor(rect.height * dpr);
//   // ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
//   buildPath();
// }
// window.addEventListener("resize", resize);

// // ====== НАЛАШТУВАННЯ “як у референсі” ======
// const TEXT = "i love you";          // можеш: "Кохаю тебе"
// const fontSize = 18;                // як у реф
// const innerLanes = 8;               // товщина контуру (всередину)
// const laneSpacing = 12;             // відстань між доріжками (як у реф)
// const speed = 40;                   // швидкість “бігу”
// const tilt = -0.45;                 // нахил тексту (у реф він сильніший)
// const rotateHeart = -0.12;          // легкий поворот серця
// const scaleMul = 0.98;              // розмір серця

// const color = "rgba(255, 170, 230, 0.72)";
// const glow = "rgba(255, 170, 230, 0.9)";
// const shadowBlur = 10;

// // ====== ГЕОМЕТРІЯ СЕРЦЯ ======
// let path = [];      // {x,y,tx,ty,nx,ny,s}
// let totalLen = 0;

// function heartParam(t) {
//   // класична крива серця
//   const x = 16 * Math.pow(Math.sin(t), 3);
//   const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
//   return { x, y };
// }

// function buildPath() {
//   const w = canvas.getBoundingClientRect().width;
//   const h = canvas.getBoundingClientRect().height;

//   const cx = w / 2;
//   const cy = h / 2 + 10;

//   // масштаб під canvas
//   const base = Math.min(w, h) * 0.020 * scaleMul;

//   // точність контуру
//   const N = 720;

//   const pts = [];
//   for (let i = 0; i <= N; i++) {
//     const t = (i / N) * Math.PI * 2;
//     let p = heartParam(t);

//     // ПІДГОНКА ФОРМИ ПІД РЕФ:
//     // у референсі серце трохи ширше і з “м’якшим” низом
//     p.x *= 1.12;
//     p.y *= 1.02;

//     let x = p.x * base;
//     let y = -p.y * base;

//     // поворот
//     const cr = Math.cos(rotateHeart);
//     const sr = Math.sin(rotateHeart);
//     const xr = x * cr - y * sr;
//     const yr = x * sr + y * cr;

//     pts.push({ x: cx + xr, y: cy + yr });
//   }

//   path = [];
//   totalLen = 0;

//   for (let i = 0; i < pts.length; i++) {
//     const p = pts[i];
//     const pPrev = pts[(i - 1 + pts.length) % pts.length];
//     const pNext = pts[(i + 1) % pts.length];

//     // тангенс
//     let tx = pNext.x - pPrev.x;
//     let ty = pNext.y - pPrev.y;
//     const tl = Math.hypot(tx, ty) || 1;
//     tx /= tl; ty /= tl;

//     // нормаль
//     let nx = -ty;
//     let ny = tx;

//     if (i > 0) totalLen += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);

//     path.push({ x: p.x, y: p.y, tx, ty, nx, ny, s: totalLen });
//   }

//   totalLen += Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
// }

// function pointAtLen(L) {
//   L = ((L % totalLen) + totalLen) % totalLen;

//   for (let i = 1; i < path.length; i++) {
//     if (path[i].s >= L) {
//       const a = path[i - 1];
//       const b = path[i];
//       const segLen = (b.s - a.s) || 1;
//       const t = (L - a.s) / segLen;

//       const x = a.x + (b.x - a.x) * t;
//       const y = a.y + (b.y - a.y) * t;

//       let tx = a.tx + (b.tx - a.tx) * t;
//       let ty = a.ty + (b.ty - a.ty) * t;
//       const tl = Math.hypot(tx, ty) || 1;
//       tx /= tl; ty /= tl;

//       const nx = -ty;
//       const ny = tx;

//       return { x, y, tx, ty, nx, ny };
//     }
//   }
//   return path[0];
// }

// // ====== РЕНДЕР ======
// resize();

// let t0 = performance.now();

// function draw() {
//   const now = performance.now();
//   const time = (now - t0) / 1000;

//   const w = canvas.getBoundingClientRect().width;
//   const h = canvas.getBoundingClientRect().height;

//   ctx.clearRect(0, 0, w, h);

//   // стиль
//   ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui`;
//   ctx.textAlign = "left";
//   ctx.textBaseline = "middle";
//   ctx.fillStyle = color;
//   ctx.shadowBlur = shadowBlur;
//   ctx.shadowColor = glow;

//   // ВАЖЛИВО: робимо wordGap по реальній ширині слова, щоб не було каші
//   const textW = ctx.measureText(TEXT).width;
//   const wordGap = Math.max(34, textW + 10); // “як у реф” — помітна відстань

//   // Контур у референсі виглядає чистіше, бо “товщина” йде всередину,
//   // тому offset беремо тільки В ОДИН БІК по нормалі (inner)
//   for (let lane = 0; lane < innerLanes; lane++) {
//     const offset = lane * laneSpacing;

//     // легкий fade всередину (у реф зовнішній край яскравіший)
//     ctx.globalAlpha = 0.85 - lane * 0.06;

//     const run = time * speed + lane * 9;

//     for (let L = 0; L < totalLen; L += wordGap) {
//       const p = pointAtLen(L + run);

//       // ВАЖЛИВО: offset “всередину” — беремо МІНУС нормаль
//       const x = p.x - p.nx * offset;
//       const y = p.y - p.ny * offset;

//       // кут по тангенсу + нахил
//       const ang = Math.atan2(p.ty, p.tx) + tilt;

//       ctx.save();
//       ctx.translate(x, y);
//       ctx.rotate(ang);
//       ctx.fillText(TEXT, 0, 0);
//       ctx.restore();
//     }
//   }

//   ctx.globalAlpha = 1;
//   requestAnimationFrame(draw);
// }

// draw();
