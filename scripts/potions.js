// =============================================
// GAME STATE
// =============================================

// The 6 correct ingredient IDs in any order
const CORRECT_INGREDIENTS = [
  "water",
  "eggs",
  "thorns",
  "peppermint",
  "moonstone",
  "pearl",
];

// Liquid hue colors: index = number of correct ingredients added
const LIQUID_COLORS = [
  "#0d1a2a", // 0 - dark water
  "#1a2535", // 1
  "#2a2040", // 2
  "#3a1535", // 3
  "#502050", // 4
  "#703060", // 5
  null, // 6 - success (pearl sheen via canvas)
];

// Status messages per stage
const STATUS_MESSAGES = [
  "Awaiting ingredients…",
  "The water stirs faintly…",
  "A faint warmth rises from the depths…",
  "The cauldron hums with possibility…",
  "A delicate rose-hued mist forms…",
  "The potion shivers and glows…",
  "The liquid swirls with iridescent magic!",
];

let addedCorrect = []; // correct ingredient IDs added
let wrongAdded = false; // whether a wrong ingredient was added (resets on correct)
let brewing = false; // locked during animations
let steamParticles = []; // for canvas steam

// Drag state
let draggedElement = null;
let draggedId = null;
let draggedCorrect = false;

// Canvas
const canvas = document.getElementById("steam-canvas");
const ctx = canvas.getContext("2d");
let animFrameId = null;
let pearlAnimId = null;

// =============================================
// DRAG AND DROP SETUP
// =============================================

// Attach drag events to all ingredient divs
document.querySelectorAll(".ingredient").forEach((el) => {
  el.addEventListener("dragstart", onDragStart);
  el.addEventListener("dragend", onDragEnd);
});

const dropZone = document.getElementById("drop-zone");
dropZone.addEventListener("dragover", onDragOver);
dropZone.addEventListener("dragleave", onDragLeave);
dropZone.addEventListener("drop", onDrop);

function onDragStart(e) {
  draggedElement = this;
  draggedId = this.dataset.id;
  draggedCorrect = this.dataset.correct === "true";

  // Use a transparent ghost image so the default ghost doesn't show
  const ghost = document.getElementById("drag-ghost");
  e.dataTransfer.setDragImage(ghost, 0, 0);
  e.dataTransfer.effectAllowed = "move";

  this.style.opacity = "0.5";
}

function onDragEnd(e) {
  if (draggedElement) draggedElement.style.opacity = "";
  draggedElement = null;
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  dropZone.classList.add("drag-over");
}

function onDragLeave() {
  dropZone.classList.remove("drag-over");
}

function onDrop(e) {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  if (!draggedElement || brewing) return;

  const id = draggedId;
  const correct = draggedCorrect;

  // 1. Capture the exact element into a local variable before we clear it
  const currentEl = draggedElement;

  // Animate ingredient flying into cauldron
  animateFlyIn(currentEl, () => {
    // 2. Pass that local variable into the processing function
    processIngredient(id, correct, currentEl);
  });

  // Hide original immediately
  currentEl.style.opacity = "0";

  // 3. Now it is safe to clear the global state
  draggedElement = null;
}

// =============================================
// TOUCH / CLICK FALLBACK (Mobile friendly)
// =============================================
document.querySelectorAll(".ingredient").forEach((el) => {
  el.addEventListener("click", function () {
    if (brewing) return;
    const id = this.dataset.id;
    const correct = this.dataset.correct === "true";
    animateFlyIn(this, () => {
      processIngredient(id, correct, this);
    });
    this.style.opacity = "0";
  });
});

// =============================================
// ANIMATE INGREDIENT FLYING INTO CAULDRON
// =============================================
function animateFlyIn(el, callback) {
  // Get positions
  const rect = el.getBoundingClientRect();
  const cauldronRect = document
    .getElementById("cauldron-wrapper")
    .getBoundingClientRect();
  const targetX = cauldronRect.left + cauldronRect.width / 2;
  const targetY = cauldronRect.top + cauldronRect.height * 0.4;

  // Find either the new image or the fallback emoji
  const visualElement = el.querySelector(".ingredient-img, .ingredient-emoji");

  // Create flying clone
  const flying = document.createElement("div");

  // Copy the HTML of the image/emoji directly into the flying div
  flying.innerHTML = visualElement.outerHTML;

  flying.style.cssText = `
    position: fixed;
    font-size: 2rem;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top + rect.height / 2}px;
    z-index: 50;
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: left 0.4s cubic-bezier(0.4,0,1,1), top 0.4s cubic-bezier(0.4,0,1,1), opacity 0.4s, transform 0.4s;
  `;

  // If it's an image, ensure it shrinks properly during flight
  const flyingImg = flying.querySelector("img");
  if (flyingImg) {
    flyingImg.style.transition = "width 0.4s, height 0.4s";
  }

  document.body.appendChild(flying);

  // Trigger animation next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flying.style.left = targetX + "px";
      flying.style.top = targetY + "px";
      flying.style.opacity = "0";
      flying.style.transform = "translate(-50%, -50%) scale(0.2) rotate(30deg)";

      // Shrink image size
      if (flyingImg) {
        flyingImg.style.width = "10px";
        flyingImg.style.height = "10px";
      }
    });
  });

  setTimeout(() => {
    flying.remove();
    callback();
  }, 420);
}

// =============================================
// PROCESS INGREDIENT DROP
// =============================================
function processIngredient(id, correct, el) {
  brewing = true;

  // Create ripple
  createRipple();

  if (correct) {
    // Don't add duplicate correct ingredients
    if (addedCorrect.includes(id)) {
      setStatus("You already added that ingredient!", "");
      el.style.opacity = "";
      brewing = false;
      return;
    }

    addedCorrect.push(id);

    // Mark ingredient as used
    el.classList.add("used");

    // Tick off recipe book
    const item = document.querySelector(`.recipe-item[data-id="${id}"]`);
    const check = document.getElementById(`check-${id}`);
    if (item) item.classList.add("checked");
    if (check) check.textContent = "✓";

    // Update liquid color
    const stage = addedCorrect.length;
    if (stage < 6) {
      setLiquidColor(LIQUID_COLORS[stage]);
      setStatus(STATUS_MESSAGES[stage], "");
      fillDot(stage - 1);
    }

    // Check for completion
    if (addedCorrect.length === 6) {
      setTimeout(triggerSuccess, 400);
      return;
    }
  } else {
    // Wrong ingredient!
    el.classList.add("wrong-used");
    el.style.opacity = "";
    shakeCaluron();
    spawnGreenSmoke();
    setStatus("⚠ That ingredient does not belong in Amortentia!", "error");
    setTimeout(() => {
      if (addedCorrect.length < 6)
        setStatus(STATUS_MESSAGES[addedCorrect.length], "");
    }, 2500);
  }

  brewing = false;
}

// =============================================
// RIPPLE EFFECT
// =============================================
function createRipple() {
  const wrapper = document.getElementById("cauldron-wrapper");
  const ripple = document.createElement("div");
  ripple.className = "ripple";
  ripple.style.left = "50%";
  ripple.style.top = "40%";
  wrapper.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
}

// =============================================
// UPDATE LIQUID COLOR
// =============================================
function setLiquidColor(color) {
  const surface = document.getElementById("liquid-surface");
  surface.style.transition = "fill 1.2s ease";
  surface.setAttribute("fill", color);
}

// =============================================
// FILL PROGRESS DOT
// =============================================
function fillDot(index) {
  const dot = document.getElementById(`dot-${index}`);
  if (dot) dot.classList.add("filled");
}

// =============================================
// CAULDRON STATUS MESSAGE
// =============================================
function setStatus(msg, cls) {
  const el = document.getElementById("cauldron-status");
  el.textContent = msg;
  el.className = "cauldron-status" + (cls ? ` ${cls}` : "");
}

// =============================================
// SHAKE CAULDRON
// =============================================
function shakeCaluron() {
  const wrapper = document.getElementById("cauldron-wrapper");
  wrapper.classList.add("shaking");
  setTimeout(() => wrapper.classList.remove("shaking"), 800);
}

// =============================================
// GREEN SMOKE EFFECT
// =============================================
function spawnGreenSmoke() {
  const wrapper = document.getElementById("cauldron-wrapper");
  const colors = ["#2a6a2a", "#3a8a3a", "#1a5a1a", "#4aaa4a"];

  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const puff = document.createElement("div");
      puff.className = "smoke-puff";
      const size = 20 + Math.random() * 30;
      puff.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    background: ${colors[Math.floor(Math.random() * colors.length)]};
    left: ${100 + Math.random() * 80}px;
    top: ${80 + Math.random() * 30}px;
  `;
      wrapper.appendChild(puff);
      setTimeout(() => puff.remove(), 1900);
    }, i * 80);
  }
}

// =============================================
// SUCCESS STATE — PEARL SHEEN + SPIRAL STEAM
// =============================================
function triggerSuccess() {
  brewing = true;

  // Fill last dot
  fillDot(5);

  // Change liquid to animated pearl sheen via overlay
  const surface = document.getElementById("liquid-surface");
  surface.setAttribute("fill", "#c090c0");

  // Add pearl sheen overlay via SVG foreignObject isn't feasible,
  // so we animate via canvas overlay + CSS on the SVG
  setStatus("✨ Amortentia brewed successfully! ✨", "success");

  // Start pearl animation on liquid (change fill rapidly)
  startPearlLiquid(surface);

  // Start spiral steam particles
  startSpiralSteam();

  // Show success overlay
  setTimeout(() => {
    document.getElementById("success-overlay").classList.add("show");
  }, 1800);
}

// Animate the liquid SVG fill with pearl colors
function startPearlLiquid(surface) {
  const pearlColors = [
    "#ffb6d9",
    "#e0d0f0",
    "#c0e0f8",
    "#f0c0e0",
    "#d0f0e0",
    "#f8e0d0",
    "#e8d0f8",
    "#ffb6d9",
  ];
  let idx = 0;
  pearlAnimId = setInterval(() => {
    surface.style.transition = "fill 0.6s ease";
    surface.setAttribute("fill", pearlColors[idx % pearlColors.length]);
    idx++;
  }, 600);
}

// =============================================
// CANVAS STEAM PARTICLE SYSTEM
// =============================================

class SteamParticle {
  constructor() {
    this.reset();
  }
  reset() {
    // Start near cauldron opening
    this.x = 130 + Math.random() * 80; // within cauldron width
    this.y = 240; // top of cauldron (canvas coords)
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = -(0.6 + Math.random() * 1.2);
    this.size = 4 + Math.random() * 10;
    this.alpha = 0.4 + Math.random() * 0.3;
    this.decay = 0.004 + Math.random() * 0.006;
    this.spiral = (Math.random() - 0.5) * 0.04;
    this.age = 0;
    this.hue = Math.random() < 0.5 ? "pink" : "white";
  }
  update() {
    this.age++;
    this.x += this.vx + Math.sin(this.age * 0.08) * this.spiral * 10;
    this.y += this.vy;
    this.vy *= 0.995;
    this.vx *= 0.998;
    this.alpha -= this.decay;
    this.size += 0.08;
    if (this.alpha <= 0) this.reset();
  }
  draw(ctx) {
    ctx.save();
    const gradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.size,
    );
    const color =
      this.hue === "pink"
        ? `rgba(255,180,210,${this.alpha})`
        : `rgba(240,235,255,${this.alpha})`;
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Regular bubbling steam (before success — subtle wisps)
class SimpleWisp {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = 120 + Math.random() * 100;
    this.y = 240;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = -(0.3 + Math.random() * 0.5);
    this.size = 2 + Math.random() * 5;
    this.alpha = 0.08 + Math.random() * 0.12;
    this.decay = 0.003 + Math.random() * 0.003;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
    this.size += 0.05;
    if (this.alpha <= 0) this.reset();
  }
  draw(ctx) {
    ctx.save();
    const g = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.size,
    );
    g.addColorStop(0, `rgba(200,190,210,${this.alpha})`);
    g.addColorStop(1, "rgba(200,190,210,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Init wisps for idle state
let wisps = Array.from({ length: 12 }, () => new SimpleWisp());
let spiralParticles = [];
let isSuccess = false;

function startSpiralSteam() {
  isSuccess = true;
  spiralParticles = Array.from({ length: 60 }, () => new SteamParticle());
  if (!animFrameId) startCanvasLoop();
}

function startCanvasLoop() {
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw wisps (always)
    wisps.forEach((w) => {
      w.update();
      w.draw(ctx);
    });

    // Draw spiral particles (on success)
    if (isSuccess) {
      spiralParticles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });
    }

    animFrameId = requestAnimationFrame(loop);
  }
  loop();
}

// Start idle steam loop immediately
startCanvasLoop();

// =============================================
// RESET / BREW AGAIN
// =============================================
function resetBrew() {
  // Hide overlay
  document.getElementById("success-overlay").classList.remove("show");

  // Reset state
  addedCorrect = [];
  brewing = false;
  isSuccess = false;
  spiralParticles = [];

  // Stop pearl anim
  if (pearlAnimId) {
    clearInterval(pearlAnimId);
    pearlAnimId = null;
  }

  // Reset liquid color
  const surface = document.getElementById("liquid-surface");
  surface.style.transition = "fill 1s ease";
  surface.setAttribute("fill", LIQUID_COLORS[0]);

  // Reset recipe items
  document
    .querySelectorAll(".recipe-item")
    .forEach((el) => el.classList.remove("checked"));
  document
    .querySelectorAll(".recipe-check")
    .forEach((el) => (el.textContent = ""));

  // Reset progress dots
  document
    .querySelectorAll(".dot")
    .forEach((el) => el.classList.remove("filled"));

  // Reset ingredients
  document.querySelectorAll(".ingredient").forEach((el) => {
    el.classList.remove("used", "wrong-used");
    el.style.opacity = "";
  });

  // Reset status
  setStatus(STATUS_MESSAGES[0], "");
}

// =============================================
// PREVENT DEFAULT DRAG BEHAVIOR ON PAGE
// =============================================
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());
