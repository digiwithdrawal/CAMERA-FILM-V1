// app.js — FilmRoll Cam (Live Film Preview + Auto/Manual Ratios + Brand Film Picker + Random + Flash)
// Photo-only. No sliders.

const $ = (id) => document.getElementById(id);

const video = $("video");
const view = $("view");
const vctx = view.getContext("2d", { willReadFrequently: true });

const ui = {
  ratio: $("ratio"),
  flashBtn: $("flashBtn"),
  screenFlash: $("screenFlash"),
  openFilm: $("openFilm"),
  closeFilm: $("closeFilm"),
  modal: $("modal"),
  filmList: $("filmList"),
  filmName: $("filmName"),
  randomFilm: $("randomFilm"),
  snap: $("snap"),
  tip: $("tip"),
};

function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }
function lerp(a,b,t){ return a + (b-a)*t; }

// --------- Film presets (top-ish popular per brand; some marked "vibe") ----------
const FILMS = [
  // CineStill (doesn't have 10 official mainstream, so we include common variants/vibes)
  { id:"cs_50d",   brand:"CineStill", name:"50D",   bw:false, exp:-0.02, contrast:1.00, sat:1.10, temp:-0.06, tint:0.03, grain:0.06, vignette:0.10, halation:0.10, lift:0.02 },
  { id:"cs_50d_p", brand:"CineStill", name:"50D (Pushed)", bw:false, exp:0.04, contrast:1.06, sat:1.12, temp:-0.04, tint:0.04, grain:0.10, vignette:0.12, halation:0.12, lift:0.02 },
  { id:"cs_400d",  brand:"CineStill", name:"400D",  bw:false, exp:0.02, contrast:1.03, sat:1.14, temp:0.02, tint:0.06, grain:0.10, vignette:0.14, halation:0.14, lift:0.02 },
  { id:"cs_400d_p",brand:"CineStill", name:"400D (Pushed)", bw:false, exp:0.06, contrast:1.08, sat:1.16, temp:0.04, tint:0.06, grain:0.14, vignette:0.16, halation:0.16, lift:0.02 },
  { id:"cs_800t",  brand:"CineStill", name:"800T",  bw:false, exp:0.08, contrast:1.08, sat:1.14, temp:0.20, tint:0.10, grain:0.14, vignette:0.18, halation:0.26, lift:0.03 },
  { id:"cs_800t_p",brand:"CineStill", name:"800T (Pushed)", bw:false, exp:0.12, contrast:1.12, sat:1.16, temp:0.22, tint:0.10, grain:0.18, vignette:0.20, halation:0.30, lift:0.03 },
  { id:"cs_800t_soft", brand:"CineStill", name:"800T (Soft)", bw:false, exp:0.06, contrast:1.02, sat:1.12, temp:0.20, tint:0.10, grain:0.12, vignette:0.16, halation:0.22, lift:0.04 },
  { id:"cs_bwxx",  brand:"CineStill", name:"BWXX",   bw:true,  exp:0.02, contrast:1.14, sat:0.00, temp:0.00, tint:0.00, grain:0.12, vignette:0.18, halation:0.00, lift:0.03 },
  { id:"cs_bwxx_hc",brand:"CineStill", name:"BWXX (High Contrast)", bw:true, exp:0.02, contrast:1.22, sat:0.00, temp:0.00, tint:0.00, grain:0.14, vignette:0.20, halation:0.00, lift:0.02 },
  { id:"cs_bwxx_soft",brand:"CineStill", name:"BWXX (Soft)", bw:true, exp:0.00, contrast:1.06, sat:0.00, temp:0.00, tint:0.00, grain:0.10, vignette:0.16, halation:0.00, lift:0.04 },

  // Kodak (10)
  { id:"kd_portra160", brand:"Kodak", name:"Portra 160", bw:false, exp:-0.03, contrast:0.95, sat:1.00, temp:0.05, tint:0.05, grain:0.06, vignette:0.10, halation:0.08, lift:0.03 },
  { id:"kd_portra400", brand:"Kodak", name:"Portra 400", bw:false, exp:0.02, contrast:0.98, sat:1.06, temp:0.08, tint:0.06, grain:0.10, vignette:0.12, halation:0.10, lift:0.03 },
  { id:"kd_portra800", brand:"Kodak", name:"Portra 800", bw:false, exp:0.08, contrast:1.05, sat:1.10, temp:0.12, tint:0.08, grain:0.14, vignette:0.14, halation:0.14, lift:0.03 },
  { id:"kd_ektar100",  brand:"Kodak", name:"Ektar 100",  bw:false, exp:0.00, contrast:1.12, sat:1.35, temp:0.02, tint:0.05, grain:0.05, vignette:0.08, halation:0.06, lift:0.01 },
  { id:"kd_gold200",   brand:"Kodak", name:"Gold 200",   bw:false, exp:0.03, contrast:1.06, sat:1.18, temp:0.16, tint:0.06, grain:0.11, vignette:0.15, halation:0.12, lift:0.03 },
  { id:"kd_ultramax400", brand:"Kodak", name:"UltraMax 400", bw:false, exp:0.04, contrast:1.08, sat:1.22, temp:0.14, tint:0.06, grain:0.14, vignette:0.16, halation:0.12, lift:0.03 },
  { id:"kd_colorplus200", brand:"Kodak", name:"ColorPlus 200", bw:false, exp:0.02, contrast:1.03, sat:1.15, temp:0.18, tint:0.04, grain:0.12, vignette:0.16, halation:0.10, lift:0.03 },
  { id:"kd_trix400", brand:"Kodak", name:"Tri-X 400", bw:true, exp:0.02, contrast:1.20, sat:0.00, temp:0.00, tint:0.00, grain:0.16, vignette:0.18, halation:0.00, lift:0.02 },
  { id:"kd_tmax100", brand:"Kodak", name:"T-Max 100", bw:true, exp:-0.02, contrast:1.10, sat:0.00, temp:0.00, tint:0.00, grain:0.06, vignette:0.10, halation:0.00, lift:0.02 },
  { id:"kd_tmax400", brand:"Kodak", name:"T-Max 400", bw:true, exp:0.01, contrast:1.15, sat:0.00, temp:0.00, tint:0.00, grain:0.12, vignette:0.12, halation:0.00, lift:0.02 },

  // Fujifilm (10; some “vibe” because availability varies)
  { id:"fj_superia400", brand:"Fujifilm", name:"Superia X-TRA 400", bw:false, exp:0.03, contrast:1.06, sat:1.18, temp:-0.05, tint:0.08, grain:0.14, vignette:0.14, halation:0.10, lift:0.03 },
  { id:"fj_c200", brand:"Fujifilm", name:"C200", bw:false, exp:0.02, contrast:1.02, sat:1.12, temp:-0.03, tint:0.06, grain:0.10, vignette:0.12, halation:0.08, lift:0.03 },
  { id:"fj_400h", brand:"Fujifilm", name:"Pro 400H (vibe)", bw:false, exp:-0.01, contrast:0.95, sat:0.98, temp:-0.06, tint:0.08, grain:0.10, vignette:0.10, halation:0.06, lift:0.04 },
  { id:"fj_velvia50", brand:"Fujifilm", name:"Velvia 50 (vibe)", bw:false, exp:-0.02, contrast:1.18, sat:1.45, temp:-0.04, tint:0.04, grain:0.05, vignette:0.08, halation:0.06, lift:0.01 },
  { id:"fj_provia100f", brand:"Fujifilm", name:"Provia 100F (vibe)", bw:false, exp:-0.01, contrast:1.06, sat:1.18, temp:-0.05, tint:0.05, grain:0.06, vignette:0.08, halation:0.06, lift:0.02 },
  { id:"fj_natura1600", brand:"Fujifilm", name:"Natura 1600 (vibe)", bw:false, exp:0.10, contrast:1.04, sat:1.05, temp:-0.02, tint:0.07, grain:0.20, vignette:0.12, halation:0.08, lift:0.03 },
  { id:"fj_fujicolor800", brand:"Fujifilm", name:"Fujicolor 800 (vibe)", bw:false, exp:0.07, contrast:1.07, sat:1.12, temp:-0.02, tint:0.08, grain:0.16, vignette:0.14, halation:0.10, lift:0.03 },
  { id:"fj_reala100", brand:"Fujifilm", name:"Reala 100 (vibe)", bw:false, exp:-0.02, contrast:1.02, sat:1.08, temp:-0.06, tint:0.07, grain:0.06, vignette:0.08, halation:0.06, lift:0.03 },
  { id:"fj_acros100", brand:"Fujifilm", name:"Acros 100 (vibe)", bw:true, exp:-0.02, contrast:1.10, sat:0.00, temp:0.00, tint:0.00, grain:0.07, vignette:0.10, halation:0.00, lift:0.02 },
  { id:"fj_neopan400", brand:"Fujifilm", name:"Neopan 400 (vibe)", bw:true, exp:0.02, contrast:1.18, sat:0.00, temp:0.00, tint:0.00, grain:0.14, vignette:0.14, halation:0.00, lift:0.02 },

  // Ilford (10; Kentmere included under Ilford/Harman family as common B&W option)
  { id:"il_hp5", brand:"Ilford", name:"HP5 Plus 400", bw:true, exp:0.02, contrast:1.18, sat:0.00, temp:0.00, tint:0.00, grain:0.14, vignette:0.14, halation:0.00, lift:0.02 },
  { id:"il_fp4", brand:"Ilford", name:"FP4 Plus 125", bw:true, exp:-0.02, contrast:1.12, sat:0.00, temp:0.00, tint:0.00, grain:0.08, vignette:0.10, halation:0.00, lift:0.02 },
  { id:"il_delta100", brand:"Ilford", name:"Delta 100", bw:true, exp:-0.02, contrast:1.10, sat:0.00, temp:0.00, tint:0.00, grain:0.06, vignette:0.10, halation:0.00, lift:0.02 },
  { id:"il_delta400", brand:"Ilford", name:"Delta 400", bw:true, exp:0.01, contrast:1.14, sat:0.00, temp:0.00, tint:0.00, grain:0.10, vignette:0.12, halation:0.00, lift:0.02 },
  { id:"il_delta3200", brand:"Ilford", name:"Delta 3200", bw:true, exp:0.10, contrast:1.18, sat:0.00, temp:0.00, tint:0.00, grain:0.22, vignette:0.16, halation:0.00, lift:0.02 },
  { id:"il_panf50", brand:"Ilford", name:"Pan F Plus 50", bw:true, exp:-0.03, contrast:1.16, sat:0.00, temp:0.00, tint:0.00, grain:0.05, vignette:0.10, halation:0.00, lift:0.01 },
  { id:"il_xp2", brand:"Ilford", name:"XP2 Super 400 (vibe)", bw:true, exp:0.02, contrast:1.12, sat:0.00, temp:0.00, tint:0.00, grain:0.09, vignette:0.12, halation:0.00, lift:0.03 },
  { id:"il_ortho80", brand:"Ilford", name:"Ortho Plus 80 (vibe)", bw:true, exp:-0.02, contrast:1.20, sat:0.00, temp:0.00, tint:0.00, grain:0.08, vignette:0.12, halation:0.00, lift:0.02 },
  { id:"il_sfx200", brand:"Ilford", name:"SFX 200 (vibe)", bw:true, exp:0.00, contrast:1.14, sat:0.00, temp:0.00, tint:0.00, grain:0.10, vignette:0.12, halation:0.00, lift:0.02 },
  { id:"il_kent400", brand:"Ilford", name:"Kentmere 400 (vibe)", bw:true, exp:0.02, contrast:1.16, sat:0.00, temp:0.00, tint:0.00, grain:0.16, vignette:0.12, halation:0.00, lift:0.02 },
];

let currentFilm = FILMS.find(f => f.id === "kd_portra400") || FILMS[0];
ui.filmName.textContent = `${currentFilm.brand} ${currentFilm.name}`;

// --------- Ratio helpers (Auto + Manual) ----------
function viewportSize(){
  const vw = Math.floor(window.visualViewport?.width || window.innerWidth);
  const vh = Math.floor(window.visualViewport?.height || window.innerHeight);
  return { vw, vh };
}
function deviceIsLandscape(){
  const { vw, vh } = viewportSize();
  return vw > vh;
}
function chosenMode(){
  const m = ui.ratio.value;
  if (m === "auto") return deviceIsLandscape() ? "landscape" : "portrait";
  return m;
}
function modeAspect(mode){
  if (mode === "square") return 1;
  if (mode === "landscape") return 16/9;
  return 9/16; // portrait
}
function computeCropRect(srcW, srcH, mode){
  const ar = modeAspect(mode);
  const srcAR = srcW / srcH;

  let cropW, cropH;
  if (srcAR > ar){
    cropH = srcH;
    cropW = Math.round(srcH * ar);
  } else {
    cropW = srcW;
    cropH = Math.round(srcW / ar);
  }
  const cx = Math.floor((srcW - cropW) / 2);
  const cy = Math.floor((srcH - cropH) / 2);
  return { cx, cy, cropW, cropH };
}
function exportSizeForMode(mode){
  const longEdge = 2000; // good quality without massive files
  if (mode === "square") return { w: longEdge, h: longEdge };
  if (mode === "landscape") return { w: longEdge, h: Math.round(longEdge / (16/9)) };
  return { h: longEdge, w: Math.round(longEdge * (9/16)) };
}

// --------- Film processing ----------
function softCurve(x, contrast){
  const y = (x - 0.5) * contrast + 0.5;
  const t = clamp(y,0,1);
  return t*t*(3 - 2*t);
}
function applyWhiteBalance(r,g,b, temp, tint){
  const rm = 1 + 0.18*temp - 0.06*tint;
  const gm = 1 - 0.08*temp - 0.10*tint;
  const bm = 1 - 0.18*temp + 0.14*tint;
  return { r:r*rm, g:g*gm, b:b*bm };
}
function saturate(r,g,b, sat){
  const l = 0.2126*r + 0.7152*g + 0.0722*b;
  return { r:l+(r-l)*sat, g:l+(g-l)*sat, b:l+(b-l)*sat };
}
function vignetteFactor(nx, ny, strength){
  const dx = nx - 0.5;
  const dy = ny - 0.5;
  const d = Math.sqrt(dx*dx + dy*dy);
  const v = clamp(1 - d*1.35, 0, 1);
  return lerp(1, v, strength);
}
function randNoise(seed){
  seed ^= seed << 13; seed >>>= 0;
  seed ^= seed >> 17; seed >>>= 0;
  seed ^= seed << 5;  seed >>>= 0;
  return [(seed>>>0)/4294967296, seed>>>0];
}

// Halation: cheap glow on highlights (helps CineStill vibes)
const off = document.createElement("canvas");
const offCtx = off.getContext("2d", { willReadFrequently:true });

function addHalation(imgData, w, h, amount){
  if (amount <= 0) return;

  const tmp = document.createElement("canvas");
  const tw = Math.max(120, Math.floor(w / 6));
  const th = Math.max(120, Math.floor(h / 6));
  tmp.width = tw; tmp.height = th;
  const tctx = tmp.getContext("2d", { willReadFrequently:true });

  tctx.drawImage(off, 0,0,w,h, 0,0,tw,th);
  tctx.globalAlpha = 0.35;
  for (let i=0;i<4;i++){
    tctx.drawImage(tmp, -2,0);
    tctx.drawImage(tmp,  2,0);
    tctx.drawImage(tmp, 0,-2);
    tctx.drawImage(tmp, 0, 2);
  }
  tctx.globalAlpha = 1;

  const blurData = tctx.getImageData(0,0,tw,th).data;
  const d = imgData.data;

  for (let y=0; y<h; y++){
    const ty = Math.floor(y * th / h);
    for (let x=0; x<w; x++){
      const tx = Math.floor(x * tw / w);
      const bi = (ty*tw + tx)*4;
      const i = (y*w + x)*4;

      const lum = (d[i]*0.2126 + d[i+1]*0.7152 + d[i+2]*0.0722)/255;
      const hi = clamp((lum - 0.55) / 0.45, 0, 1);

      d[i]   = clamp(d[i]   + blurData[bi]   * amount * hi * 0.60, 0, 255);
      d[i+1] = clamp(d[i+1] + blurData[bi+1] * amount * hi * 0.28, 0, 255);
      d[i+2] = clamp(d[i+2] + blurData[bi+2] * amount * hi * 0.10, 0, 255);
    }
  }
}

function applyFilmPreset(imgData, w, h, film){
  const d = imgData.data;

  const exp = clamp(film.exp ?? 0, -0.6, 0.6);
  const contrast = clamp(film.contrast ?? 1.0, 0.75, 1.35);
  const sat = clamp(film.sat ?? 1.0, 0, 1.7);
  const temp = clamp(film.temp ?? 0, -1, 1);
  const tint = clamp(film.tint ?? 0, -1, 1);
  const grain = clamp(film.grain ?? 0, 0, 0.26);
  const vignette = clamp(film.vignette ?? 0, 0, 0.50);
  const lift = clamp(film.lift ?? 0, 0, 0.12);
  const hal = clamp(film.halation ?? 0, 0, 0.35);

  let seed = (Date.now() ^ (w*1315423911) ^ (h*2654435761)) >>> 0;

  for (let y=0; y<h; y++){
    const ny = y / (h-1);
    for (let x=0; x<w; x++){
      const nx = x / (w-1);
      const i = (y*w + x)*4;

      let r = d[i]/255, g = d[i+1]/255, b = d[i+2]/255;

      const e = Math.pow(2, exp);
      r *= e; g *= e; b *= e;

      r = r*(1 - lift) + lift;
      g = g*(1 - lift) + lift;
      b = b*(1 - lift) + lift;

      const wb = applyWhiteBalance(r,g,b, temp, tint);
      r = clamp(wb.r,0,1); g = clamp(wb.g,0,1); b = clamp(wb.b,0,1);

      if (film.bw){
        const l = clamp(0.2126*r + 0.7152*g + 0.0722*b, 0, 1);
        r = g = b = l;
      }

      r = softCurve(r, contrast);
      g = softCurve(g, contrast);
      b = softCurve(b, contrast);

      if (!film.bw){
        const s = saturate(r,g,b,sat);
        r = clamp(s.r,0,1); g = clamp(s.g,0,1); b = clamp(s.b,0,1);
      }

      const vf = vignetteFactor(nx, ny, vignette);
      r *= vf; g *= vf; b *= vf;

      if (grain > 0){
        let n; [n, seed] = randNoise(seed);
        const gn = (n - 0.5) * grain;
        r = clamp(r + gn, 0, 1);
        g = clamp(g + gn, 0, 1);
        b = clamp(b + gn, 0, 1);
      }

      d[i]   = Math.round(r*255);
      d[i+1] = Math.round(g*255);
      d[i+2] = Math.round(b*255);
      d[i+3] = 255;
    }
  }

  if (hal > 0){
    addHalation(imgData, w, h, hal);
  }

  return imgData;
}

// --------- Film picker (brand folders) ----------
function buildBrandGroups(films){
  const by = new Map();
  for (const f of films){
    if (!by.has(f.brand)) by.set(f.brand, []);
    by.get(f.brand).push(f);
  }
  return Array.from(by.keys()).sort().map(brand => ({ brand, films: by.get(brand) }));
}
function renderFilmPicker(){
  ui.filmList.innerHTML = "";
  const groups = buildBrandGroups(FILMS);

  for (const g of groups){
    const details = document.createElement("details");
    const sum = document.createElement("summary");
    sum.textContent = g.brand;
    details.appendChild(sum);

    const wrap = document.createElement("div");
    wrap.className = "filmBtns";

    for (const f of g.films){
      const btn = document.createElement("button");
      btn.className = "filmPick";
      btn.innerHTML = `${f.name}<small>${f.bw ? "B&W" : "Color"} • preset emulation</small>`;
      btn.addEventListener("click", ()=>{
        currentFilm = f;
        ui.filmName.textContent = `${currentFilm.brand} ${currentFilm.name}`;
        closeModal();
      });
      wrap.appendChild(btn);
    }

    details.appendChild(wrap);
    ui.filmList.appendChild(details);
  }
}

function openModal(){
  ui.modal.classList.remove("hidden");
  ui.modal.setAttribute("aria-hidden","false");
}
function closeModal(){
  ui.modal.classList.add("hidden");
  ui.modal.setAttribute("aria-hidden","true");
}
ui.openFilm.addEventListener("click", openModal);
ui.closeFilm.addEventListener("click", closeModal);
ui.modal.addEventListener("click", (e)=>{ if (e.target === ui.modal) closeModal(); });

ui.randomFilm.addEventListener("click", ()=>{
  currentFilm = FILMS[(Math.random() * FILMS.length) | 0];
  ui.filmName.textContent = `${currentFilm.brand} ${currentFilm.name}`;
  ui.tip.textContent = `Random: ${currentFilm.brand} ${currentFilm.name}`;
});

// --------- Flash toggle (Torch if possible, else Screen) ----------
let stream = null;
let videoTrack = null;
let torchAvailable = false;
let flashMode = "off"; // off | torch | screen

function updateFlashButton(){
  ui.flashBtn.textContent =
    flashMode === "off" ? "FLASH: OFF" :
    flashMode === "torch" ? "FLASH: TORCH" :
    "FLASH: SCREEN";
}

function screenFlashPulse(){
  ui.screenFlash.classList.remove("hidden");
  requestAnimationFrame(()=> ui.screenFlash.classList.add("on"));
  setTimeout(()=>{
    ui.screenFlash.classList.remove("on");
    setTimeout(()=> ui.screenFlash.classList.add("hidden"), 120);
  }, 90);
}

async function detectTorchSupport(){
  try{
    videoTrack = stream?.getVideoTracks?.()[0] || null;
    if (!videoTrack) return false;
    const caps = videoTrack.getCapabilities ? videoTrack.getCapabilities() : null;
    torchAvailable = !!(caps && "torch" in caps);
    return torchAvailable;
  }catch{
    torchAvailable = false;
    return false;
  }
}

async function setTorch(on){
  if (!torchAvailable || !videoTrack) return false;
  try{
    await videoTrack.applyConstraints({ advanced: [{ torch: !!on }] });
    return true;
  }catch{
    return false;
  }
}

ui.flashBtn.addEventListener("click", async ()=>{
  // cycle: OFF -> TORCH(if available) else SCREEN -> SCREEN -> OFF
  if (flashMode === "off"){
    flashMode = torchAvailable ? "torch" : "screen";
  } else if (flashMode === "torch"){
    flashMode = "screen";
    await setTorch(false);
  } else {
    flashMode = "off";
    await setTorch(false);
  }
  updateFlashButton();
});
updateFlashButton();

// --------- Live preview (filtered) ----------
function fitCanvas(){
  const { vw, vh } = viewportSize();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  view.width = Math.floor(vw * dpr);
  view.height = Math.floor(vh * dpr);
}
fitCanvas();
window.addEventListener("resize", fitCanvas);
window.visualViewport?.addEventListener("resize", fitCanvas);

// Work canvas for fast live filter
const work = document.createElement("canvas");
const wctx = work.getContext("2d", { willReadFrequently:true });

function drawCover(ctx, srcCanvas, sw, sh, dw, dh){
  const s = Math.max(dw / sw, dh / sh);
  const rw = Math.round(sw * s);
  const rh = Math.round(sh * s);
  const dx = Math.floor((dw - rw) / 2);
  const dy = Math.floor((dh - rh) / 2);
  ctx.drawImage(srcCanvas, 0,0,sw,sh, dx,dy,rw,rh);
}

function tick(){
  if (!video.videoWidth || !video.videoHeight){
    requestAnimationFrame(tick);
    return;
  }

  const mode = chosenMode();
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const { cx, cy, cropW, cropH } = computeCropRect(vw, vh, mode);

  // performance knob (live preview only)
  const targetW = 560;
  const scale = targetW / cropW;
  const outW = Math.max(320, Math.floor(cropW * scale));
  const outH = Math.max(320, Math.floor(cropH * scale));

  work.width = outW;
  work.height = outH;

  wctx.drawImage(video, cx, cy, cropW, cropH, 0, 0, outW, outH);

  let img = wctx.getImageData(0,0,outW,outH);
  img = applyFilmPreset(img, outW, outH, currentFilm);
  wctx.putImageData(img,0,0);

  vctx.setTransform(1,0,0,1,0,0);
  vctx.clearRect(0,0,view.width,view.height);
  drawCover(vctx, work, outW, outH, view.width, view.height);

  requestAnimationFrame(tick);
}

// --------- SNAP (exports correct ratio, not the "cover" preview) ----------
ui.snap.addEventListener("click", async ()=>{
  if (!video.videoWidth || !video.videoHeight){
    ui.tip.textContent = "Camera not ready.";
    return;
  }

  // flash pulse
  if (flashMode === "torch" && torchAvailable){
    await setTorch(true);
    await new Promise(r => setTimeout(r, 120));
    await setTorch(false);
  } else if (flashMode === "screen"){
    screenFlashPulse();
    await new Promise(r => setTimeout(r, 90));
  }

  const mode = chosenMode();
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const { cx, cy, cropW, cropH } = computeCropRect(vw, vh, mode);

  const out = exportSizeForMode(mode);
  off.width = out.w;
  off.height = out.h;

  offCtx.imageSmoothingEnabled = true;
  offCtx.drawImage(video, cx, cy, cropW, cropH, 0, 0, out.w, out.h);

  let img = offCtx.getImageData(0,0,out.w,out.h);
  img = applyFilmPreset(img, out.w, out.h, currentFilm);
  offCtx.putImageData(img,0,0);

  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g,"-");
  a.download = `filmroll_${currentFilm.brand}_${currentFilm.name}_${stamp}.jpg`
    .replace(/\s+/g,"_")
    .replace(/[^\w\-\.]/g,"");
  a.href = off.toDataURL("image/jpeg", 0.92);
  a.click();

  ui.tip.textContent = `Saved (${mode.toUpperCase()}): ${currentFilm.brand} ${currentFilm.name}`;
});

// --------- Camera start ----------
async function startCamera(){
  try{
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    await detectTorchSupport();
    updateFlashButton();

    ui.tip.textContent = torchAvailable
      ? "Live preview ready. Torch supported."
      : "Live preview ready. Torch not supported (screen flash works).";

    tick();
  }catch(e){
    ui.tip.textContent = "Camera blocked. Use HTTPS + allow Camera in Safari.";
  }
}

// init
renderFilmPicker();
startCamera();

