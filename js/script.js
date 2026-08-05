(function () {
  "use strict";

  const isCoarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  // ---------- Background node graph ----------
  (function () {
    const canvas = document.getElementById("bgCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0, h = 0, nodes = [];

    function isLightTheme() {
      return document.documentElement.getAttribute("data-theme") === "light";
    }
    function nodeColor() {
      const styles = getComputedStyle(document.documentElement);
      return styles.getPropertyValue("--accent-2").trim() || "#7c5cff";
    }
    function lineColor() {
      const styles = getComputedStyle(document.documentElement);
      return styles.getPropertyValue("--accent-1").trim() || "#5ce1ff";
    }
    function hexToRgb(hex) {
      const m = hex.replace("#", "").match(/.{1,2}/g);
      return m ? m.map((v) => parseInt(v, 16)).join(",") : "124,92,255";
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = w < 600 ? 18000 : w < 1024 ? 13000 : 9000;
      const count = Math.max(18, Math.min(75, Math.round((w * h) / density)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
      }));
    }

    function drawStatic() {
      const light = isLightTheme();
      const rgbNode = hexToRgb(nodeColor());
      const rgbLine = hexToRgb(lineColor());
      const lineAlphaBase = light ? 0.28 : 0.22;
      const nodeAlpha = light ? 0.65 : 0.6;
      const lineWidth = light ? 1.2 : 1.1;
      const nodeRadius = light ? 1.6 : 1.8;

      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = w < 600 ? 150 : 210;
          if (dist < maxDist) {
            ctx.strokeStyle = `rgba(${rgbLine},${lineAlphaBase * (1 - dist / maxDist)})`;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach((n) => {
        ctx.fillStyle = `rgba(${rgbNode},${nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, nodeRadius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function draw() {
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });
      drawStatic();
      if (!prefersReduced) requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("portfolio-theme-change", drawStatic);
  })();

  // ---------- Hero terminal ----------
  (function () {
    const termEl = document.querySelector(".hero-terminal");
    const output = document.getElementById("heroTermOutput");
    const input = document.getElementById("heroTermInput");
    if (!termEl || !output || !input) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function printLine(html) {
      const line = document.createElement("div");
      line.innerHTML = html;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }

    function typeWelcome() {
      const line1 = "Hi, I'm Naveen — welcome to my terminal.";
      const line2 = "Type 'help' to look around →";
      if (prefersReduced) {
        printLine(line1);
        printLine(`<span class="term-hint">${line2}</span>`);
        return;
      }
      const l1 = document.createElement("div");
      output.appendChild(l1);
      let i = 0;
      (function typeChar() {
        if (i <= line1.length) {
          l1.textContent = line1.slice(0, i);
          i++;
          setTimeout(typeChar, 22);
        } else {
          printLine(`<span class="term-hint">${line2}</span>`);
        }
      })();
    }

    const sections = ["about", "skills", "projects", "experience", "education", "certifications", "contact"];

    const commands = {
      help: () => {
        printLine("Commands: help, whoami, about, skills, projects, experience, education, certifications, contact, clear");
      },
      whoami: () => {
        printLine("Full Stack Software Engineer building event-driven microservices with Spring Boot, Kafka, AWS — and AI-powered workflows.");
      },
      clear: () => {
        output.innerHTML = "";
      },
    };
    sections.forEach((id) => {
      commands[id] = () => {
        printLine(`opening ${id}…`);
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
      };
    });

    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const raw = input.value.trim();
      if (!raw) return;
      printLine(`<span class="hero-terminal-prompt">&gt;</span> ${raw}`);
      const handler = commands[raw.toLowerCase()];
      if (handler) {
        handler();
      } else {
        printLine(`<span class="term-error">command not found: ${raw} (try 'help')</span>`);
      }
      input.value = "";
    });

    typeWelcome();
  })();

  // ---------- Theme toggle ----------
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const themeThumb = document.getElementById("themeToggleThumb");

  function applyTheme(mode) {
    root.setAttribute("data-theme", mode);
    themeThumb.textContent = mode === "dark" ? "🌙" : "☀️";
    try { localStorage.setItem("portfolio-theme", mode); } catch (e) {}
    window.dispatchEvent(new Event("portfolio-theme-change"));
  }

  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem("portfolio-theme"); } catch (e) {}
    if (saved) {
      applyTheme(saved);
    } else {
      const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      applyTheme(prefersLight ? "light" : "dark");
    }
  })();

  themeToggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  // ---------- Custom cursor ----------
  if (!isCoarsePointer) {
    const dot = document.getElementById("cursorDot");
    const ring = document.getElementById("cursorRing");
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + "px";
      dot.style.top = mouseY + "px";
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.left = ringX + "px";
      ring.style.top = ringY + "px";
      requestAnimationFrame(animateRing);
    }
    animateRing();

    document.querySelectorAll("[data-hover]").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("hover"));
    });
  }

  // ---------- Mobile nav ----------
  const navBurger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");
  const navOverlay = document.getElementById("navOverlay");

  function closeMobileNav() {
    navBurger.classList.remove("open");
    navBurger.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("open");
    navOverlay.classList.remove("open");
  }

  navBurger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navBurger.classList.toggle("open", isOpen);
    navBurger.setAttribute("aria-expanded", String(isOpen));
    navOverlay.classList.toggle("open", isOpen);
  });
  navOverlay.addEventListener("click", closeMobileNav);
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMobileNav));

  // ---------- Scroll reveal ----------
  const revealEls = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => observer.observe(el));

  // ---------- Typewriter ----------
  const phrases = ["shipping with Spring Boot & Kafka.", "securing APIs with OAuth 2.0.", "building cloud-native systems on AWS.", "crafting responsive UIs with Angular.", "building with LLMs & prompt engineering."];
  const twEl = document.getElementById("typewriter");
  if (twEl) {
    let phraseIdx = 0, charIdx = 0, deleting = false;

    function tick() {
      const current = phrases[phraseIdx];
      if (!deleting) {
        charIdx++;
        twEl.textContent = current.slice(0, charIdx);
        if (charIdx === current.length) {
          deleting = true;
          setTimeout(tick, 1400);
          return;
        }
      } else {
        charIdx--;
        twEl.textContent = current.slice(0, charIdx);
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
        }
      }
      setTimeout(tick, deleting ? 40 : 60);
    }
    tick();
  }

  // ---------- Counters ----------
  const counters = document.querySelectorAll(".stat-num");
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const duration = 1200;
        const start = performance.now();
        function step(now) {
          const progress = Math.min((now - start) / duration, 1);
          el.textContent = Math.floor(progress * target);
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target;
        }
        requestAnimationFrame(step);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => counterObserver.observe(el));

  // ---------- Tilt cards ----------
  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * -8;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(800px) rotateX(0) rotateY(0)";
    });
  });

  // ---------- Magnetic buttons ----------
  document.querySelectorAll(".magnetic").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translate(0, 0)";
    });
  });

  // ---------- Footer year ----------
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
