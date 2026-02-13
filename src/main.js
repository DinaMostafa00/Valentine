import "./style.css";
import gsap from "gsap";


const canvas = document.querySelector("#bg");
const hero = document.querySelector("#hero");
const CanvasContext = canvas.getContext("2d"); // 2D context for drawing
const btnHeart = document.querySelector("#btnHeart");
const btnScatter = document.querySelector("#btnScatter");


// GSAP helpers: efficient setters for lots of updates
const moveX = gsap.quickTo(btnScatter, "x", { duration: 0.25, ease: "power2.out" });
const moveY = gsap.quickTo(btnScatter, "y", { duration: 0.25, ease: "power2.out" });

hero.addEventListener("mousemove", (event) => {
  // 1) measure button center NOW (important: it can move)
  const rect = btnScatter.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // 2) vector from button -> mouse (viewport coords)
  const dx = event.clientX - cx;
  const dy = event.clientY - cy;

  const dist2 = dx * dx + dy * dy;

  // 3) influence radius (how close triggers movement)
  const radius = 140;
  const r2 = radius * radius;

  if (dist2 < r2) {
    const dist = Math.sqrt(dist2) + 0.0001;

    // 4) strength: 1 when very close, 0 at edge of radius
    const strength = 1 - dist / radius;

    // 5) unit direction (normalize)
    const ux = dx / dist;
    const uy = dy / dist;

    // 6) move AWAY from mouse
    const maxMove = 18; // keep small so it can still be clicked
    const offsetX = -ux * maxMove * strength;
    const offsetY = -uy * maxMove * strength;

    moveX(offsetX);
    moveY(offsetY);
  } else {
    // return to original position
    moveX(0);
    moveY(0);
  }
});



// prepare canvas size and scaling for high-DPR screens
function resizeCanvas() {
  const heroProperties = hero.getBoundingClientRect(); //method returns an object containing properties like top, left, width, and height, which describe the element's location and dimensions relative to the viewport.
  const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1); //determines the device's pixel ratio, which is important for rendering graphics crisply on high-resolution screens


  canvas.width = Math.floor(heroProperties.width * devicePixelRatio);
  canvas.height = Math.floor(heroProperties.height * devicePixelRatio);

  // draw in CSS pixels
  CanvasContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); //setting both the horizontal and vertical scaling factors to devicePixelRatio, this line ensures that all subsequent drawing operations are scaled to match the device's pixel density.
  return { w: heroProperties.width, h: heroProperties.height }; // return size in CSS pixels
}


let size = resizeCanvas();

window.addEventListener("resize", () => {
  size = resizeCanvas();
    buildHeartTargets();

});



// mouse position object
const mouse = { x: 0, y: 0, active: false };

hero.addEventListener("mousemove", (event) => {
  console.log("Mouse move event:", event);
  const positionRelativeToThebrowserViewport = hero.getBoundingClientRect();
  mouse.x = event.clientX - positionRelativeToThebrowserViewport.left;
  mouse.y = event.clientY - positionRelativeToThebrowserViewport.top;
  mouse.active = true;
});

hero.addEventListener("mouseleave", () => {
  mouse.active = false;
});

// button mouse movement

// get the button scatter center point
const btnScatterPosition = btnScatter.getBoundingClientRect();
const btnScatterCenter = {
  x: btnScatterPosition.left + btnScatterPosition.width / 2,
  y: btnScatterPosition.top + btnScatterPosition.height / 2,
};

// get the distance from the mouse to the button center
hero.addEventListener("mousemove", (event) => {
  const distanceX = event.clientX - btnScatterCenter.x;
  const distanceY = event.clientY - btnScatterCenter.y;
  const dist2 = distanceX * distanceX + distanceY * distanceY;
  });

// utility function to get a random number between min and max
function rand(min, max) {
  return min + Math.random() * (max - min);
}


const dots = Array.from({ length: 1500 }, () => {
  const x = rand(0, size.w);
  const y = rand(0, size.h);
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    tx: x, // target x
    ty: y, // target y
    hx: x, // heart target x (filled later)
    hy: y, // heart target y (filled later)

  };
});

// const spring = 0.02;
// const friction = 0.86;
const params = {
  heartMix: 0,
  spring: 0.02,
  friction: 0.86,
  mouseStrength: 0.8,
};



function heartPoint(t) {
  // classic parametric heart
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);
  return { x, y };
}

function buildHeartTargets() {
  const pts = [];
  for (let i = 0; i < dots.length; i++) {
    const t = (i / dots.length) * Math.PI * 2;
    pts.push(heartPoint(t));
  }

  // find bounds of the heart points
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const heartW = maxX - minX;
  const heartH = maxY - minY;

  // scale heart to fit hero nicely
  const desiredW = size.w * 0.35;     // make heart about 38% hero width
  const scale = desiredW / heartW;

  const cx = size.w * 0.5;            // center x
  const cy = size.h * 0.45;           // center y (slightly up)

  for (let i = 0; i < dots.length; i++) {
    const p = pts[i];

    const x = (p.x - (minX + heartW / 2)) * scale + cx;
    const y = -(p.y - (minY + heartH / 2)) * scale + cy; // invert Y for canvas

    dots[i].hx = x;
    dots[i].hy = y;
  }
}

buildHeartTargets();

function animate() {
  CanvasContext.clearRect(0, 0, size.w, size.h);

  for (const d of dots) {
    // 1) spring acceleration toward target
    // const ax = (d.tx - d.x) * spring;
    // const ay = (d.ty - d.y) * spring;
    const targetX = d.tx + (d.hx - d.tx) * params.heartMix;
const targetY = d.ty + (d.hy - d.ty) * params.heartMix;

const ax = (targetX - d.x) * params.spring;
const ay = (targetY - d.y) * params.spring;

d.vx = (d.vx + ax) * params.friction;
d.vy = (d.vy + ay) * params.friction;


    // 3) mouse influence (add force into velocity)
    if (mouse.active) {
      const dx = mouse.x - d.x;
      const dy = mouse.y - d.y;
      const dist2 = dx * dx + dy * dy;

      const radius = 160;
      const r2 = radius * radius;

      if (dist2 < r2) {
        const dist = Math.sqrt(dist2) + 0.0001;
        const strength = (1 - dist / radius) * 0.8;

        d.vx += (dx / dist) * strength;
        d.vy += (dy / dist) * strength;
      }
    }

    // 4) integrate position
    d.x += d.vx;
    d.y += d.vy;

    // 5) wrap around edges of the screen with a little padding optional visual polish
    if (d.x < -10) d.x = size.w + 10;
if (d.x > size.w + 10) d.x = -10;
if (d.y < -10) d.y = size.h + 10;
if (d.y > size.h + 10) d.y = -10;


    // 5) draw
    CanvasContext.beginPath();
    CanvasContext.arc(d.x, d.y, 1.6, 0, Math.PI * 2);
    CanvasContext.fillStyle = "rgba(255,255,255,0.9)";
    CanvasContext.fill();
  }

  requestAnimationFrame(animate);
}




function scatterTargets() {
  for (const d of dots) {
    d.tx = rand(0, size.w);
    d.ty = rand(0, size.h);
  }
}




// btnScatter?.addEventListener("click", () => {
//   console.log("Scatter clicked!");
//   scatterTargets();
// });

btnHeart?.addEventListener("click", () => {
  // 1) quick outward scatter (anticipation)
  scatterTargets();

  gsap.timeline()
    // make it feel more energetic immediately
    .to(params, { spring: 0.035, friction: 0.82, mouseStrength: 0.2, duration: 0.25, ease: "power2.out" }, 0)

    // 2) pull into heart (main event)
    .to(params, { heartMix: 1, duration: 1.1, ease: "power4.inOut" }, 0.05)

    // 3) overshoot then settle (more drama)
    .to(params, { heartMix: 1.08, duration: 0.25, ease: "power2.out" }, 1.05)
    .to(params, { heartMix: 1.0, duration: 0.35, ease: "elastic.out(1, 0.35)" }, 1.25)

    // 4) return to your normal feel
    .to(params, { spring: 0.02, friction: 0.86, mouseStrength: 0.8, duration: 0.5, ease: "power2.out" }, 1.35);
});

btnScatter?.addEventListener("click", () => {
  scatterTargets();

  gsap.to(params, {
    heartMix: 0,
    duration: 1.0,
    ease: "power3.inOut",
  });
});



animate();
