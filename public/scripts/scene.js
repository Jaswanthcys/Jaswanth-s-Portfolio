import { portfolioConfig } from "./config.js";
import { playCue } from "./audio.js";

const INTRO_MS = portfolioConfig.scene.introDurationMs;
const TRANSITION_HOLD_MS = 1650;
const AMBIENT_MS = portfolioConfig.scene.ambientLoopMs;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const canvas = document.getElementById("scene-canvas");
const ctx = canvas?.getContext("2d", { alpha: true });
const shell = document.querySelector(".scene-shell");
const plate = document.getElementById("scene-plate");
const video = document.getElementById("scene-video");
const progressBar = document.getElementById("loading-progress");
const progressLabel = document.getElementById("loading-percent");
const caption = document.getElementById("loading-caption");

let width = 1;
let height = 1;
let dpr = 1;
let mode = "ambient";
let introStart = 0;
let ambientOffset = performance.now();
let rafId = 0;
let previousIntroBeat = -1;
let pointerX = 0;
let pointerY = 0;
let shakeUntil = 0;
let lastImpactAt = -Infinity;
let particles = [];
let dust = [];
let introCompleteCallback = null;
const aborter = new AbortController();

function seeded(index) {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function resize() {
  if (!canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  width = Math.max(1, rect.width);
  height = Math.max(1, rect.height);
  dpr = Math.min(window.devicePixelRatio || 1, 1.6);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = reducedMotion.matches ? 18 : width < 640 ? 28 : 62;
  dust = Array.from({ length: count }, (_, index) => ({
    x: seeded(index + 1) * width,
    y: height * (0.43 + seeded(index + 61) * 0.52),
    radius: 0.4 + seeded(index + 121) * 1.15,
    speed: 5 + seeded(index + 181) * 14,
    phase: seeded(index + 241) * Math.PI * 2,
  }));
  if (reducedMotion.matches) drawScene(0, performance.now(), true);
}

function pointerMove(event) {
  if (event.pointerType !== "mouse" || reducedMotion.matches || width < 640) {
    pointerX = 0;
    pointerY = 0;
    return;
  }
  pointerX = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 5;
  pointerY = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 3;
}

function drawAtmosphere(now, still) {
  if (!ctx) return;
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "rgba(4, 7, 11, .12)");
  sky.addColorStop(.44, "rgba(7, 11, 16, .10)");
  sky.addColorStop(.68, "rgba(7, 11, 15, .28)");
  sky.addColorStop(1, "rgba(3, 5, 7, .46)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const lightX = width * .73 + pointerX * .2;
  const lightY = height * .22 + pointerY * .18;
  const light = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, Math.min(width, height) * .56);
  light.addColorStop(0, "rgba(182, 206, 223, .13)");
  light.addColorStop(.26, "rgba(140, 167, 185, .065)");
  light.addColorStop(1, "rgba(101, 126, 145, 0)");
  ctx.fillStyle = light;
  ctx.fillRect(lightX - width * .56, 0, width * 1.12, height * .78);

  // Layered distant ridgelines deepen the real photographic plate without obscuring it.
  for (let layer = 0; layer < 3; layer += 1) {
    const horizon = height * (.54 + layer * .063);
    ctx.beginPath();
    ctx.moveTo(0, horizon + height * .06);
    const points = width < 640 ? 7 : 12;
    for (let i = 0; i <= points; i += 1) {
      const x = width * i / points;
      const y = horizon + Math.sin(i * 1.63 + layer * 2.1) * height * (.024 + layer * .006) + (i % 3) * height * .009;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height * .76);
    ctx.lineTo(0, height * .76);
    ctx.closePath();
    ctx.fillStyle = `rgba(5, 8, 11, ${.15 + layer * .09})`;
    ctx.fill();
  }

  const groundY = height * .76;
  const ground = ctx.createLinearGradient(0, groundY, 0, height);
  ground.addColorStop(0, "rgba(24, 31, 36, .12)");
  ground.addColorStop(.23, "rgba(7, 10, 12, .15)");
  ground.addColorStop(1, "rgba(2, 4, 5, .52)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, groundY, width, height - groundY);

  // Wet-ground reflections: broken, perspective-scaled glints rather than a flat grid.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 34; i += 1) {
    const t = seeded(i + 401);
    const y = groundY + Math.pow(t, 1.7) * height * .23;
    const x = seeded(i + 501) * width;
    const len = (12 + seeded(i + 601) * 110) * (y / height);
    const alpha = .018 + seeded(i + 701) * .045;
    ctx.strokeStyle = `rgba(178, 201, 215, ${alpha})`;
    ctx.lineWidth = .45 + (y / height) * .8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y - len * .012);
    ctx.stroke();
  }
  ctx.restore();

  const fogLayers = width < 640 ? 3 : 6;
  for (let layer = 0; layer < fogLayers; layer += 1) {
    const speed = still ? 0 : now * (.000012 + layer * .0000035);
    const cycle = ((speed + layer * .233) % 1.45 + 1.45) % 1.45;
    const x = width * (cycle - .22);
    const y = height * (.56 + layer * .067);
    const rx = width * (width < 640 ? .38 : .33);
    const fog = ctx.createRadialGradient(x + rx, y, 0, x + rx, y, rx);
    fog.addColorStop(0, `rgba(168, 185, 196, ${.075 - layer * .007})`);
    fog.addColorStop(.45, `rgba(135, 154, 167, ${.038 - layer * .003})`);
    fog.addColorStop(1, "rgba(120, 141, 155, 0)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, y - height * .16, width, height * .33);
  }

  if (!still) {
    for (const mote of dust) {
      const x = (mote.x + now * .001 * mote.speed) % (width + 4);
      const y = mote.y + Math.sin(now * .0004 + mote.phase) * 8;
      ctx.globalAlpha = .11 + (Math.sin(now * .0013 + mote.phase) + 1) * .07;
      ctx.fillStyle = "#c5d2d9";
      ctx.beginPath();
      ctx.arc(x, y, mote.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawSword(x, y, angle, length, glow = 0, scale = 1) {
  if (!ctx) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  // Wrapped handle, guard and curved steel silhouette.
  ctx.strokeStyle = "rgba(3, 5, 7, .98)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.lineTo(5, 0);
  ctx.stroke();
  ctx.strokeStyle = "rgba(145, 157, 163, .9)";
  ctx.lineWidth = 1.4;
  for (let stripe = 0; stripe < 4; stripe += 1) {
    ctx.beginPath();
    ctx.moveTo(-21 + stripe * 6, -3);
    ctx.lineTo(-17 + stripe * 6, 3);
    ctx.stroke();
  }
  ctx.fillStyle = "#10161a";
  ctx.beginPath();
  ctx.ellipse(6, 0, 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(9, -4);
  ctx.quadraticCurveTo(length * .56, -4, length, 0);
  ctx.quadraticCurveTo(length * .57, 3.2, 9, 4);
  ctx.closePath();
  ctx.fillStyle = "rgba(24, 31, 35, .98)";
  ctx.fill();
  ctx.strokeStyle = glow ? `rgba(245, 247, 244, ${.65 + glow * .32})` : "rgba(206, 220, 227, .75)";
  ctx.lineWidth = glow ? 2 : 1.1;
  ctx.shadowColor = glow ? "rgba(226, 237, 242, .95)" : "rgba(174, 203, 219, .58)";
  ctx.shadowBlur = glow ? 22 * glow : 4;
  ctx.beginPath();
  ctx.moveTo(11, -2.2);
  ctx.quadraticCurveTo(length * .6, -2.8, length - 2, 0);
  ctx.stroke();
  ctx.restore();
}

function drawWarrior(x, groundY, scale, facing, pose, phase, impact, opacity = 1) {
  if (!ctx) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  const stagger = pose === "stagger" || pose === "kneel";
  ctx.translate(x + (stagger ? scale * 12 : 0), groundY + (pose === "kneel" ? scale * 38 : 0));
  if (pose === "stagger") ctx.rotate(.17 * facing);
  if (pose === "kneel") ctx.rotate(.34 * facing);
  ctx.scale(scale * facing, scale);
  const ink = "rgba(4, 6, 8, .985)";
  const rim = "rgba(171, 195, 207, .3)";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Hakama legs, knees and split coat silhouette.
  ctx.fillStyle = ink;
  ctx.strokeStyle = "rgba(125, 148, 162, .23)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (pose === "kneel") {
    ctx.moveTo(-20, -113); ctx.lineTo(21, -111); ctx.lineTo(31, -64); ctx.lineTo(71, -29);
    ctx.lineTo(55, -17); ctx.lineTo(8, -48); ctx.lineTo(-9, -78); ctx.lineTo(-34, -35);
    ctx.lineTo(-62, -25); ctx.lineTo(-38, -73); ctx.closePath();
  } else {
    ctx.moveTo(-18, -105); ctx.lineTo(20, -105); ctx.lineTo(30, -68);
    ctx.lineTo(24, -15); ctx.lineTo(3, -12); ctx.lineTo(-4, -60);
    ctx.lineTo(-19, -13); ctx.lineTo(-42, -12); ctx.lineTo(-32, -65); ctx.closePath();
  }
  ctx.fill(); ctx.stroke();
  // Tabi boots and split hems.
  ctx.strokeStyle = "rgba(3, 5, 7, .98)";
  ctx.lineWidth = 12;
  if (pose !== "kneel") {
    ctx.beginPath(); ctx.moveTo(-30, -17); ctx.lineTo(-38, -3); ctx.lineTo(-55, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, -17); ctx.lineTo(24, -3); ctx.lineTo(41, -2); ctx.stroke();
  }

  // Layered kimono, shoulder mantle and trailing hem.
  const cloth = ctx.createLinearGradient(-43, -175, 40, -45);
  cloth.addColorStop(0, "rgba(29, 37, 43, .98)");
  cloth.addColorStop(.5, "rgba(9, 13, 16, .99)");
  cloth.addColorStop(1, "rgba(3, 5, 7, 1)");
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.moveTo(-22, -158); ctx.lineTo(17, -159); ctx.lineTo(36, -132);
  ctx.lineTo(30, -99); ctx.lineTo(38, -58); ctx.lineTo(20, -48);
  ctx.lineTo(7, -87); ctx.lineTo(-5, -57); ctx.lineTo(-40, -48);
  ctx.lineTo(-29, -105); ctx.lineTo(-38, -134); ctx.closePath();
  ctx.fill(); ctx.strokeStyle = rim; ctx.lineWidth = 1.1; ctx.stroke();
  ctx.fillStyle = "rgba(43, 52, 57, .7)";
  ctx.beginPath(); ctx.moveTo(-21, -156); ctx.lineTo(1, -142); ctx.lineTo(-4, -91); ctx.lineTo(-29, -108); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(134, 151, 158, .27)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-17, -107); ctx.lineTo(22, -101); ctx.stroke();
  ctx.fillStyle = "rgba(26, 32, 36, .98)";
  ctx.fillRect(-18, -105, 39, 8);
  ctx.fillStyle = "rgba(172, 184, 188, .48)";
  ctx.fillRect(1, -105, 4, 8);

  // Head, hood and a broad shadowed kasa brim; no facial features.
  ctx.fillStyle = "rgba(7, 10, 12, .99)";
  ctx.beginPath(); ctx.ellipse(-1, -174, 15, 19, -.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-28, -178); ctx.quadraticCurveTo(-3, -193, 24, -178);
  ctx.lineTo(19, -174); ctx.quadraticCurveTo(-4, -181, -27, -174); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(181, 204, 215, .38)"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-24, -178); ctx.quadraticCurveTo(-4, -189, 19, -178); ctx.stroke();
  ctx.strokeStyle = "rgba(140, 158, 167, .24)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(10, -161); ctx.lineTo(25, -148); ctx.stroke();

  const swing = Math.sin(Math.min(1, Math.max(0, phase)) * Math.PI);
  const isAttack = pose === "attack";
  const isBlock = pose === "block";
  let shoulderX = 12, shoulderY = -135, elbowX = 34, elbowY = -117, handX = 53, handY = -108;
  if (isAttack) {
    shoulderX = 12; shoulderY = -134;
    elbowX = 34 + 18 * swing; elbowY = -123 - 11 * swing;
    handX = 54 + 27 * swing; handY = -106 - 28 * swing;
  } else if (isBlock) {
    elbowX = 34; elbowY = -152 - 8 * swing; handX = 56; handY = -168 - 6 * swing;
  } else if (pose === "draw") {
    elbowX = 15; elbowY = -114; handX = 5; handY = -111;
  } else if (stagger) {
    elbowX = 30; elbowY = -111; handX = 43; handY = -92;
  }
  ctx.strokeStyle = "rgba(6, 8, 10, .99)";
  ctx.lineWidth = 16;
  ctx.beginPath(); ctx.moveTo(-23, -136); ctx.lineTo(-39, -117); ctx.lineTo(-48, -94); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(shoulderX, shoulderY); ctx.lineTo(elbowX, elbowY); ctx.lineTo(handX, handY); ctx.stroke();
  ctx.fillStyle = "#090c0e"; ctx.beginPath(); ctx.arc(handX, handY, 7, 0, Math.PI * 2); ctx.fill();
  if (pose !== "stagger" && pose !== "kneel") {
    const swordAngle = isBlock ? -.83 : isAttack ? -.27 + swing * .43 : pose === "draw" ? -.06 : -.42;
    if (isAttack && !reducedMotion.matches) {
      ctx.save();
      ctx.globalAlpha *= .22;
      drawSword(handX - 9, handY + 8, swordAngle - .24, scale * 113, 0, 1);
      ctx.restore();
    }
    drawSword(handX, handY, swordAngle, scale * 113, impact ? .75 : 0, 1);
  }
  // A narrow cool rim on the outside of the clothing separates each silhouette from fog.
  ctx.shadowColor = "rgba(184, 211, 226, .3)";
  ctx.shadowBlur = 8;
  ctx.strokeStyle = "rgba(169, 194, 206, .14)";
  ctx.lineWidth = .9;
  ctx.beginPath(); ctx.moveTo(-22, -157); ctx.lineTo(-38, -134); ctx.lineTo(-29, -105); ctx.stroke();
  ctx.restore();
}

function burst(x, y, now, count = 28, force = 1) {
  const mobile = width < 640;
  const amount = reducedMotion.matches ? Math.floor(count * .25) : mobile ? Math.floor(count * .45) : count;
  for (let i = 0; i < amount; i += 1) {
    const angle = Math.PI * 2 * i / amount + Math.random() * .22;
    const speed = (38 + Math.random() * (mobile ? 85 : 170)) * force;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      start: now, duration: 380 + Math.random() * 630, size: .7 + Math.random() * 2.2,
      color: Math.random() > .42 ? "226, 132, 76" : "224, 232, 233" });
  }
}

function drawParticles(now) {
  if (!ctx) return;
  particles = particles.filter((particle) => now - particle.start < particle.duration);
  for (const particle of particles) {
    const age = (now - particle.start) / 1000;
    const life = Math.max(0, 1 - (now - particle.start) / particle.duration);
    const x = particle.x + particle.vx * age;
    const y = particle.y + particle.vy * age + 52 * age * age;
    ctx.globalAlpha = life * .92;
    ctx.strokeStyle = `rgba(${particle.color}, ${life})`;
    ctx.lineWidth = particle.size * life;
    ctx.shadowBlur = 7 * life;
    ctx.shadowColor = `rgba(${particle.color}, .7)`;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - particle.vx * .025, y - particle.vy * .025); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

function blend(from, to, progress) {
  const t = Math.max(0, Math.min(1, (progress - from) / (to - from)));
  const eased = t * t * (3 - 2 * t);
  return eased;
}

function choreography(p) {
  if (p < .11) return { a: "approach", b: "approach", distance: .49 - .1 * blend(0, .11, p), caption: "THE NIGHT HOLDS ITS BREATH" };
  if (p < .20) return { a: "draw", b: "draw", distance: .39 - .04 * blend(.11, .20, p), caption: "STEEL LEAVES ITS SHEATH" };
  if (p < .38) return { a: "attack", b: "block", distance: .35 - .115 * blend(.20, .38, p), caption: "THE FIRST STRIKE IS MET" };
  if (p < .55) return { a: "block", b: "attack", distance: .235 - .015 * blend(.38, .55, p), caption: "THE COUNTER FINDS ITS MARK" };
  if (p < .72) return { a: "attack", b: "block", distance: .22 - .02 * blend(.55, .72, p), caption: "STEEL ANSWERS STEEL" };
  if (p < .80) return { a: "guard", b: "guard", distance: .20 + .15 * blend(.72, .80, p), caption: "THE WARRIORS PART" };
  if (p < .88) return { a: "guard", b: "guard", distance: .35 - .04 * blend(.80, .88, p), caption: "A BREATH BEFORE THE END" };
  if (p < .905) return { a: "attack", b: "attack", distance: .31 - .085 * blend(.88, .905, p), caption: "THE FINAL CLASH" };
  if (p < .932) return { a: "stagger", b: "guard", distance: .225 + .065 * blend(.905, .932, p), caption: "ONE BLADE FALLS SILENT" };
  if (p < .966) return { a: "kneel", b: "guard", distance: .29 + .05 * blend(.932, .966, p), caption: "THE KATANA DESCENDS" };
  if (p < .99) return { a: "kneel", b: "guard", distance: .34 + .02 * blend(.966, .99, p), caption: "A MOMENT OF STILLNESS" };
  return { a: "kneel", b: "guard", distance: .36, caption: "MOONLIGHT ON STEEL" };
}

function displayPercent(p) {
  if (p < .8) return Math.floor(p / .8 * 80);
  if (p < .88) return 80 + Math.floor((p - .8) / .08 * 10);
  if (p < .905) return 90 + Math.floor((p - .88) / .025 * 8);
  if (p < .966) return Math.min(99, 98 + Math.floor((p - .905) / .061));
  if (p < .99) return 99;
  return 100;
}

function updateIntroEvents(p, now) {
  const beats = [.18, .325, .355, .47, .505, .67, .695, .89, .966, .99];
  for (let i = 0; i < beats.length; i += 1) {
    if (p < beats[i] || previousIntroBeat >= i) continue;
    if (i === 0) playCue("sword_draw");
    if ([1, 3, 5, 7].includes(i)) playCue("sword_clash");
    if ([2, 4, 6].includes(i)) playCue("spark");
    if (i === 8) playCue("katana_land");
    if (i === 9) playCue("transition");
    if ([1, 3, 5, 7, 8].includes(i)) {
      lastImpactAt = now;
      shakeUntil = now + (i === 7 ? 230 : i === 8 ? 100 : 125);
      const center = width * .5;
      burst(center, height * (i === 8 ? .82 : .65), now, i === 7 ? 60 : i === 8 ? 20 : 30, i === 7 ? 1.22 : 1);
    }
    previousIntroBeat = i;
  }
}

function drawClash(x, y, intensity = 1) {
  if (!ctx) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(241, 170, 111, ${.72 * intensity})`;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "rgba(234, 132, 74, .95)";
  ctx.shadowBlur = 14 * intensity;
  for (let i = 0; i < 15; i += 1) {
    const a = i * Math.PI * 2 / 15 + .23;
    const r = 13 + (i % 4) * 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke();
  }
  ctx.restore();
}

function drawFallingKatana(p, aX, groundY, scale, transition) {
  if (!ctx || p < .905) return null;
  const start = .905, land = .966;
  const t = Math.max(0, Math.min(1, (p - start) / (land - start)));
  const ease = t * t * (3 - 2 * t);
  const x0 = aX + scale * 74;
  const x1 = width * .54;
  const x = x0 + (x1 - x0) * ease;
  const topY = groundY - scale * 150;
  const y = topY + (groundY - topY - 9) * ease;
  const angle = -.85 + ease * 3.35;
  const onGround = p >= land;
  drawSword(x, y, onGround ? -.055 : angle, Math.min(width * (width < 640 ? .27 : .19), 220), t > .22 && !onGround ? .45 : onGround ? Math.max(.25, transition) : 0, 1);
  if (onGround) {
    const hit = Math.max(0, 1 - (p - land) / .035);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const reflection = ctx.createLinearGradient(x - width * .12, groundY + 10, x + width * .12, groundY + 10);
    reflection.addColorStop(0, "rgba(203, 222, 231, 0)");
    reflection.addColorStop(.5, `rgba(226, 239, 242, ${.32 + .45 * Math.max(hit, transition)})`);
    reflection.addColorStop(1, "rgba(203, 222, 231, 0)");
    ctx.fillStyle = reflection;
    ctx.shadowColor = "rgba(196, 222, 235, .95)";
    ctx.shadowBlur = 18 + transition * 32;
    ctx.fillRect(x - width * .14, groundY + 4, width * .28, 2 + transition * 3);
    ctx.restore();
    if (transition > .18) {
      const radius = Math.max(width, height) * transition * .74;
      const flare = ctx.createRadialGradient(x, groundY, 0, x, groundY, radius);
      flare.addColorStop(0, `rgba(231, 241, 245, ${.12 + transition * .52})`);
      flare.addColorStop(.24, `rgba(202, 223, 235, ${.08 + transition * .2})`);
      flare.addColorStop(1, "rgba(224, 236, 243, 0)");
      ctx.fillStyle = flare;
      ctx.fillRect(0, 0, width, height);
    }
  }
  return { x, y, onGround };
}

function drawScene(progress = 0, now = performance.now(), still = false, transition = 0) {
  if (!ctx || !width || !height) return;
  ctx.clearRect(0, 0, width, height);
  const isIntro = mode === "intro";
  const p = isIntro ? progress : 0;
  const pose = isIntro ? choreography(p) : ambientPose(((now - ambientOffset) % AMBIENT_MS) / AMBIENT_MS);
  const slow = still || reducedMotion.matches;
  const shakeFactor = now < shakeUntil && !slow ? Math.min(1, (shakeUntil - now) / 80) : 0;
  const shake = shakeFactor * (width < 640 ? 1.2 : 4.2) * (Math.random() - .5);
  const camera = !slow && isIntro ? Math.max(0, Math.min(1, (p - .966) / .034)) * (width < 640 ? .012 : .035) : 0;
  ctx.save();
  ctx.translate((slow ? 0 : pointerX) + shake, (slow ? 0 : pointerY) + shake * .4);
  if (camera) {
    ctx.translate(width * .54, height * .68);
    ctx.scale(1 + camera, 1 + camera);
    ctx.translate(-width * .54, -height * .68);
  }
  drawAtmosphere(now, slow);
  const mobile = width < 640;
  const scale = Math.max(mobile ? .69 : .83, Math.min(mobile ? .88 : 1.42, height / (mobile ? 850 : 690)));
  const center = width * .5;
  const spread = Math.min(width * pose.distance, width * (mobile ? .51 : .49));
  const groundY = height * (mobile ? .86 : .865);
  const aX = center - spread * .5;
  const bX = center + spread * .5;
  const activePhase = isIntro ? Math.max(0, Math.min(1, ((p % .12) / .12))) : slow ? 0 : Math.sin((now - ambientOffset) * Math.PI * 2 / AMBIENT_MS) * .5 + .5;
  const clashWindow = isIntro && [.325, .47, .67, .89].some((point) => Math.abs(p - point) < (point === .89 ? .012 : .018));
  const idlePhase = slow ? 0 : Math.sin(now * .0016) * 1.3;
  const opacityA = isIntro && p > .925 ? Math.max(.08, 1 - (p - .925) / .05) : 1;
  const aPose = isIntro ? pose.a : activePhase > .3 && activePhase < .48 ? "attack" : "guard";
  const bPose = isIntro ? pose.b : activePhase > .3 && activePhase < .48 ? "block" : "guard";
  drawWarrior(aX, groundY + idlePhase, scale, 1, aPose, activePhase, clashWindow, opacityA);
  drawWarrior(bX, groundY - idlePhase, scale * .97, -1, bPose, activePhase, clashWindow, 1);

  if (clashWindow) {
    const cx = (aX + bX) * .5;
    drawClash(cx, height * .65, Math.abs(p - .89) < .015 ? 1.55 : 1);
    if (Math.abs(p - .89) < .015 && !slow) {
      const flashAlpha = Math.max(0, 1 - Math.abs(p - .89) / .015) * .23;
      ctx.fillStyle = `rgba(231, 237, 237, ${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }
  }
  if (isIntro && p >= .905) drawFallingKatana(p, aX, groundY, scale, transition);
  if (!slow) drawParticles(now);
  else particles = [];
  // Gentle vignette and distant haze unite the hand-drawn fighters with the photo plate.
  const vignette = ctx.createRadialGradient(width * .5, height * .48, Math.min(width, height) * .22, width * .5, height * .48, Math.max(width, height) * .76);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(1, 3, 5, .42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function ambientPose(progress) {
  if (progress < .2) return { a: "guard", b: "guard", distance: .35 };
  if (progress < .36) return { a: "attack", b: "block", distance: .23 };
  if (progress < .56) return { a: "guard", b: "guard", distance: .3 };
  return { a: "guard", b: "guard", distance: .35 };
}

function animate(now) {
  if (mode === "intro") {
    const elapsed = Math.max(0, now - introStart);
    const p = Math.min(1, elapsed / INTRO_MS);
    const percent = displayPercent(p);
    if (progressBar) progressBar.value = percent;
    if (progressLabel) progressLabel.textContent = `${percent}%`;
    const pose = choreography(p);
    if (caption) caption.textContent = pose.caption;
    updateIntroEvents(p, now);
    const transition = p >= 1 ? Math.min(1, Math.max(0, (elapsed - INTRO_MS) / TRANSITION_HOLD_MS)) : 0;
    drawScene(p, now, reducedMotion.matches, transition);
    if (p >= 1 && elapsed >= INTRO_MS + TRANSITION_HOLD_MS) {
      if (progressBar) progressBar.value = 100;
      if (progressLabel) progressLabel.textContent = "100%";
      mode = "ambient";
      ambientOffset = now;
      const callback = introCompleteCallback;
      introCompleteCallback = null;
      callback?.();
    }
  } else {
    const ambientProgress = ((now - ambientOffset) % AMBIENT_MS) / AMBIENT_MS;
    if (!reducedMotion.matches && ambientProgress > .325 && ambientProgress < .33 && lastImpactAt < now - 1100) {
      lastImpactAt = now;
      shakeUntil = now + 65;
      burst(width * .5, height * .65, now, 14);
      playCue("spark");
    }
    drawScene(ambientProgress, now, reducedMotion.matches);
  }
  if (mode === "intro" || !reducedMotion.matches) rafId = requestAnimationFrame(animate);
  else rafId = 0;
}

function setupOptionalVideo() {
  if (!video || !portfolioConfig.scene.video) return;
  video.poster = portfolioConfig.scene.videoPoster || portfolioConfig.scene.image;
  video.src = portfolioConfig.scene.video;
  video.muted = true; video.loop = true; video.autoplay = true; video.playsInline = true;
  video.addEventListener("canplay", () => {
    shell?.classList.add("video-ready");
    void video.play().catch(() => shell?.classList.remove("video-ready"));
  }, { once: true, signal: aborter.signal });
  video.addEventListener("error", () => shell?.classList.remove("video-ready"), { once: true, signal: aborter.signal });
  void video.play().catch(() => shell?.classList.remove("video-ready"));
}

function onVisibilityChange() {
  if (document.hidden) { cancelAnimationFrame(rafId); rafId = 0; }
  else if (mode === "intro" || !reducedMotion.matches) rafId = requestAnimationFrame(animate);
  else drawScene(0, performance.now(), true);
}

function onMotionPreferenceChange() {
  resize();
  if (document.hidden) return;
  if (mode === "intro") { if (!rafId) rafId = requestAnimationFrame(animate); return; }
  if (reducedMotion.matches) { cancelAnimationFrame(rafId); rafId = 0; drawScene(0, performance.now(), true); }
  else if (!rafId) rafId = requestAnimationFrame(animate);
}

plate?.addEventListener("error", () => plate.classList.add("is-unavailable"), { signal: aborter.signal });
window.addEventListener("resize", resize, { passive: true, signal: aborter.signal });
window.addEventListener("pointermove", pointerMove, { passive: true, signal: aborter.signal });
document.addEventListener("visibilitychange", onVisibilityChange, { signal: aborter.signal });
reducedMotion.addEventListener?.("change", onMotionPreferenceChange, { signal: aborter.signal });
setupOptionalVideo();
resize();
rafId = requestAnimationFrame(animate);

export function startIntro(onComplete) {
  mode = "intro";
  shell?.classList.add("is-loading");
  introStart = performance.now();
  introCompleteCallback = typeof onComplete === "function" ? onComplete : null;
  previousIntroBeat = -1; lastImpactAt = -Infinity; shakeUntil = 0; particles = [];
  if (!rafId && !document.hidden) rafId = requestAnimationFrame(animate);
}

export function destroyScene() {
  aborter.abort();
  cancelAnimationFrame(rafId);
  introCompleteCallback = null;
  if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
}
