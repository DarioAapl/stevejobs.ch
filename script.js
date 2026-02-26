/* Cinematic entrance per room */
(() => {
  const rooms = document.querySelectorAll("[data-animate]");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.classList.add("is-visible");
    }
  }, { threshold: 0.35 });

  rooms.forEach(r => io.observe(r));
})();

/* Cursor dot (desktop only-ish) */
(() => {
  const dot = document.querySelector(".cursor-dot");
  if (!dot) return;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x, ty = y;

  const isTouch = matchMedia("(pointer: coarse)").matches;
  if (isTouch) {
    dot.style.display = "none";
    return;
  }

  window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
  }, { passive: true });

  function raf() {
    // smooth follow
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    requestAnimationFrame(raf);
  }
  raf();
})();

/* Minimal “connecting dots” canvas (subtle, museum-like) */
(() => {
  const canvas = document.getElementById("dots");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  const dots = [];
  const DOT_COUNT = 70;
  const MAX_LINK_DIST = 160;

  let mouse = { x: -9999, y: -9999 };

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // reset dots
    dots.length = 0;
    for (let i = 0; i < DOT_COUNT; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // background stays black; we only draw lines/dots subtly
    // move dots
    for (const p of dots) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;
    }

    // links
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist < MAX_LINK_DIST) {
          const alpha = (1 - dist / MAX_LINK_DIST) * 0.18; // subtle
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // mouse magnet (very gentle)
    for (const p of dots) {
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 140) {
        p.vx += dx * 0.000015;
        p.vy += dy * 0.000015;
      }
      // slight damping to keep it calm
      p.vx *= 0.995;
      p.vy *= 0.995;

      // dot
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  // mouse tracking only when in that section
  const dotsRoom = canvas.closest(".room--dots");
  let inView = false;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) inView = e.isIntersecting;
    if (!inView) mouse = { x: -9999, y: -9999 };
  }, { threshold: 0.25 });

  if (dotsRoom) io.observe(dotsRoom);

  window.addEventListener("mousemove", (e) => {
    if (!inView) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    mouse = { x: -9999, y: -9999 };
  });

  window.addEventListener("resize", resize);
  resize();
  draw();
})();


//////////// BLACKHOLE ///////////////

document.addEventListener("DOMContentLoaded", () => {

  const section = document.querySelector(".room--blackhole");
  const tunnel = document.querySelector(".blackhole");
  const items = document.querySelectorAll(".bh-item");

  if (!section || !tunnel || items.length === 0) return;

  const radius = 120;
  const spacing = 180;

  // Position items in simple horizontal layout (for now)
  items.forEach((item, i) => {
    item.style.transform = `
      translate(-50%, -50%)
      translateX(${i * 60}px)
    `;
  });

  function update() {

    const rect = section.getBoundingClientRect();

    const progress = Math.min(
      Math.max(-rect.top / (section.offsetHeight - window.innerHeight), 0),
      1
    );

    const travel = progress * spacing * (items.length - 1);

    tunnel.style.transform = `translateZ(${travel}px)`;

    items.forEach((item, i) => {
      const depth = Math.abs(i * spacing - travel);
      item.style.opacity = 1 - Math.min(depth / 900, 1);
    });
  }

  window.addEventListener("scroll", update);
  window.addEventListener("resize", update);

  update();
});