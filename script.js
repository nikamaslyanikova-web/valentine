// ======= toggle message =======
const btn = document.getElementById("btn");
const msg = document.getElementById("msg");
btn.addEventListener("click", () => {
  msg.classList.toggle("hidden");
  btn.textContent = msg.classList.contains("hidden") ? "Відкрити послання" : "Сховати послання";
});

// ======= 3D Heart (Plotly) =======
// Це JS-версія: будує 3D-серце параметрично (без Python),
// працює на GitHub Pages і виглядає красиво + обертається.

const el = document.getElementById("plotlyHeart");

// параметрична 2D-крива серця (класична)
function heart2D(t){
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
  return { x, y };
}

// будуємо "товсте" 3D: екструзія вздовж v (товщина)
function buildHeartPoints({
  du = 0.08,
  dv = 0.22,
  thickness = 0.32,
  scale = 0.065
} = {}){
  const xs = [], ys = [], zs = [];

  // u: по контуру, v: по товщині
  for(let u=0; u<=Math.PI*2 + 1e-9; u += du){
    const p = heart2D(u);
    // трохи ширше як у реф
    const bx = p.x * 1.12;
    const by = p.y * 1.02;

    for(let v=-Math.PI; v<=Math.PI + 1e-9; v += dv){
      // товщина з м’яким “заокругленням”
      const r = 1 + 0.20*Math.cos(v);
      const z = thickness * Math.sin(v);

      xs.push(bx * r * scale);
      ys.push(by * r * scale);
      zs.push(z * scale * 16);
    }
  }
  return { xs, ys, zs };
}

const { xs, ys, zs } = buildHeartPoints();

// красивий рожево-фіолетовий градієнт без шкали
const trace = {
  type: "scatter3d",
  mode: "markers",
  x: xs,
  y: ys,
  z: zs,
  marker: {
    size: 2.2,
    color: zs,
    colorscale: "twilight",
    opacity: 0.95,
    showscale: false
  },
  hoverinfo: "skip"
};

const layout = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  margin: { l:0, r:0, t:0, b:0 },
  scene: {
    bgcolor: "rgba(0,0,0,0)",
    xaxis: { visible:false },
    yaxis: { visible:false },
    zaxis: { visible:false },
    aspectmode: "data",
    camera: {
      eye: { x: 1.55, y: 1.35, z: 0.9 }
    }
  }
};

const config = {
  displayModeBar: false,
  responsive: true,
  scrollZoom: false
};

Plotly.newPlot(el, [trace], layout, config);

// ======= Auto-rotate camera (рух) =======
// (користувач може крутити вручну, але ми робимо плавний автоповорот)
let start = performance.now();
let userInteracted = false;

el.on("plotly_relayout", () => {
  // якщо користувач покрутив — не зупиняємо назавжди,
  // просто ставимо паузу на трохи
  userInteracted = true;
  setTimeout(() => userInteracted = false, 1800);
});

function animate(){
  const t = (performance.now() - start) / 1000;

  if(!userInteracted){
    const r = 1.9;
    const x = r * Math.cos(t * 0.35);
    const y = r * Math.sin(t * 0.35);
    const z = 0.85 + 0.15*Math.sin(t * 0.6);

    Plotly.relayout(el, {
      "scene.camera.eye": { x, y, z }
    });
  }
  requestAnimationFrame(animate);
}

animate();
