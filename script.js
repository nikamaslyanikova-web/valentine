// ======= Toggle message =======
const btn = document.getElementById("btn");
const msg = document.getElementById("msg");

btn.addEventListener("click", () => {
  msg.classList.toggle("hidden");
  btn.textContent = msg.classList.contains("hidden") ? "Відкрити послання" : "Сховати послання";
});

// ======= Canvas heart =======
const canvas = document.getElementById("heartCanvas");
const ctx = canvas.getContext("2d", { alpha: true });

const S = {
  text: "I love you",
  fontSize: 18,
  letterSpacing: 2,
  color: "rgba(234,128,176,0.90)",
  glow: "rgba(255,255,255,0.60)",
  glowBlur: 10,

  // менше написів (як у реф)
  gapMin: 40,
  gapExtra: 12,

  // рух
  speed: 44,
  tilt: -Math.PI / 6, // -30deg
  rotateHeart: -0.18,

  // форма/масштаб
  scaleMul: 1.02,

  // ліва частина тонша, права “обʼємніша”
  leftLanes: 7,
  leftSpacing: 11,
  rightLanes: 13,
  rightSpacing: 7,

  depthX: 26,
  depthY: -12,
};

let path = [];
let totalLen = 0;

function heartParam(t){
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
  return { x, y };
}

function buildPath(){
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  const cx = w * 0.50;
  const cy = h * 0.52;

  const base = Math.min(w, h) * 0.020 * S.scaleMul;

  const N = 1000;
  const pts = [];

  for(let i=0;i<=N;i++){
    const t = (i/N) * Math.PI * 2;
    let p = heartParam(t);

    // під реф: трохи ширше
    p.x *= 1.13;
    p.y *= 1.02;

    let x = p.x * base;
    let y = -p.y * base;

    const cr = Math.cos(S.rotateHeart);
    const sr = Math.sin(S.rotateHeart);
    const xr = x*cr - y*sr;
    const yr = x*sr + y*cr;

    pts.p
