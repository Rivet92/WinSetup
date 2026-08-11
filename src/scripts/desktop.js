// ============================================================
//  WinSetup - comportamiento del escritorio
//  Todas las ventanas estan incrustadas en el HTML (ocultas con
//  el atributo hidden) y se muestran/ocultan al navegar. Sin AJAX.
// ============================================================
import { ui } from "../i18n/index.mjs";
import shutdownSoundUrl from "../assets/shutdown.mp3";

const lang = document.documentElement.lang === "es" ? "es" : "en";
const t = ui[lang];

const desktopMQ = window.matchMedia("(min-width: 769px)");
const isDesktop = () => desktopMQ.matches;

const startMenu = document.querySelector(".begin-menu");
const startButton = document.querySelector(".start-button");
const taskbarButtons = document.querySelector(".taskbar-buttons");
const clock = document.querySelector("[data-clock]");
const balloon = document.querySelector(".balloon");
const balloonTitle = document.querySelector(".balloon-title");
const balloonBody = document.querySelector(".balloon-body");

let toastTimer;
let zTop = 50;
let windowCount = 0;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isOpen = (win) => win && !win.classList.contains("is-hidden") && !win.classList.contains("closed");

// ---------- Reloj ----------
function tick() {
  if (!clock) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  clock.textContent = `${hh}:${mm}`;
}
tick();
setInterval(tick, 1000);

// ---------- Notificacion estilo XP (bocadillo de la bandeja) ----------
function showToast(message, title = "WinSetup") {
  if (!balloon) return;
  if (balloonTitle) balloonTitle.textContent = title;
  if (balloonBody) balloonBody.textContent = message;
  balloon.hidden = false;
  if (reduceMotion) {
    balloon.classList.add("show");
  } else {
    balloon.classList.remove("show");
    void balloon.offsetWidth;
    balloon.classList.add("show");
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideBalloon, 4000);
}

function hideBalloon() {
  if (!balloon) return;
  balloon.classList.remove("show");
  balloon.hidden = true;
}

document.querySelector(".balloon-close")?.addEventListener("click", hideBalloon);

// ---------- Menu de inicio ----------
function toggleStart(force) {
  if (!startMenu) return;
  const show = force !== undefined ? force : startMenu.hidden;
  startMenu.hidden = !show;
}

startButton?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleStart();
});

document.addEventListener("click", (e) => {
  if (!startMenu || startMenu.hidden) return;
  const inside = startMenu.contains(e.target) || startButton.contains(e.target);
  if (!inside) startMenu.hidden = true;
});

// Reproduce el sonido de apagado una sola vez. No cierra nada mas.
function playShutdownSound() {
  try {
    const audio = new Audio(shutdownSoundUrl);
    audio.play().catch(() => {});
  } catch {
    /* sin audio disponible */
  }
}

document.querySelector("[data-shutdown]")?.addEventListener("click", () => {
  toggleStart(false);
  playShutdownSound();
});

// ---------- Foco ----------
function setActive(win, active) {
  const btn = win._tbBtn;
  if (btn) btn.classList.toggle("active", active);
}

function focus(win) {
  if (win.classList.contains("minimized")) win.classList.remove("minimized");
  zTop += 1;
  win.style.zIndex = zTop;
  document.querySelectorAll(".xp-window").forEach((w) => {
    const isFocused = w === win;
    w.classList.toggle("focused", isFocused);
    setActive(w, isFocused && isOpen(w) && !w.classList.contains("minimized"));
  });
}

// ---------- Animacion minimizar / restaurar ----------
// Contrae la ventana hacia su boton de la barra de tareas (y viceversa).
function animateWindow(win, minimizing, done) {
  if (reduceMotion) {
    done();
    return;
  }
  const btn = win._tbBtn;
  if (!btn) {
    done();
    return;
  }
  const rect = win.getBoundingClientRect();
  const brect = btn.getBoundingClientRect();
  const dx = brect.left + brect.width / 2 - (rect.left + rect.width / 2);
  const dy = brect.top + brect.height / 2 - (rect.top + rect.height / 2);
  const small = `translate(${dx}px, ${dy}px) scale(0.05)`;
  const anim = win.animate(
    minimizing
      ? [
          { transform: "none", opacity: 1 },
          { transform: small, opacity: 0 },
        ]
      : [
          { transform: small, opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
    { duration: 280, easing: "ease-in-out" },
  );
  anim.addEventListener("finish", () => {
    win.style.transform = "";
    win.style.opacity = "";
    done();
  });
}

function minimizeWindow(win) {
  if (win.classList.contains("minimized") || win._animating) return;
  win._animating = true;
  animateWindow(win, true, () => {
    win._animating = false;
    win.classList.add("minimized");
    win.classList.remove("focused");
    setActive(win, false);
  });
}

function restoreWindow(win) {
  if (!win.classList.contains("minimized") || win._animating) return;
  win._animating = true;
  win.classList.remove("minimized");
  focus(win);
  animateWindow(win, false, () => {
    win._animating = false;
  });
}

// ---------- Botones de taskbar ----------
function addTaskbarButton(win) {
  if (!isDesktop() || !taskbarButtons || win.dataset.tbAdded) return;
  win.dataset.tbAdded = "1";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "taskbar-btn";
  const title = win.querySelector(".title-bar-text")?.textContent || t.runtime.windowFallback;
  const icon = win.querySelector(".title-bar .app-icon");
  if (icon) {
    const clone = icon.cloneNode(true);
    clone.classList.add("app-icon");
    btn.appendChild(clone);
  }
  const label = document.createElement("span");
  label.className = "taskbar-btn-label";
  label.textContent = title;
  btn.appendChild(label);
  btn.title = title;
  btn.addEventListener("click", () => {
    if (!isOpen(win)) return;
    if (win.classList.contains("minimized")) {
      restoreWindow(win);
    } else if (win.classList.contains("focused")) {
      minimizeWindow(win);
    } else {
      focus(win);
    }
  });
  taskbarButtons.appendChild(btn);
  win._tbBtn = btn;
}

function removeTaskbarButton(win) {
  const btn = win._tbBtn;
  if (btn) {
    btn.remove();
    win._tbBtn = null;
    delete win.dataset.tbAdded;
  }
}

// ---------- Arrastre ----------
function bindDrag(win) {
  if (win.dataset.dragBound) return;
  win.dataset.dragBound = "1";
  const bar = win.querySelector(".title-bar");
  if (!bar) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origX = 0;
  let origY = 0;

  bar.addEventListener("pointerdown", (e) => {
    if (!isDesktop() || e.target.closest(".title-bar-controls")) return;
    dragging = true;
    // Arrastrar una ventana maximizada la restaura antes de moverla (como XP).
    win.classList.remove("maximized");
    win.classList.add("dragging");
    startX = e.clientX;
    startY = e.clientY;
    origX = win.offsetLeft;
    origY = win.offsetTop;
    bar.setPointerCapture(e.pointerId);
  });

  bar.addEventListener("pointermove", (e) => {
    if (!dragging || !isDesktop()) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const maxX = window.innerWidth - win.offsetWidth - 8;
    // En Y no se limita arriba de la barra de tareas: la ventana puede bajar
    // por debajo de ella y salirse por el borde inferior de la pantalla.
    const maxY = window.innerHeight;
    win.style.left = Math.max(0, Math.min(origX + dx, maxX)) + "px";
    win.style.top = Math.max(0, Math.min(origY + dy, maxY)) + "px";
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    win.classList.remove("dragging");
    bar.releasePointerCapture?.(e.pointerId);
  };

  bar.addEventListener("pointerup", endDrag);
  bar.addEventListener("pointercancel", endDrag);
}

// ---------- Redimensionado desde los bordes ----------
function bindResize(win) {
  if (win.dataset.resizeBound) return;
  win.dataset.resizeBound = "1";
  const dirs = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
  const MIN_W = 260;
  const MIN_H = 120;

  dirs.forEach((dir) => {
    const handle = document.createElement("div");
    handle.className = `win-resize-handle ${dir}`;
    handle.dataset.dir = dir;
    handle.addEventListener("pointerdown", (e) => {
      if (!isDesktop() || win.classList.contains("maximized")) return;
      e.preventDefault();
      e.stopPropagation();
      focus(win);
      win.classList.add("resized");
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = win.getBoundingClientRect();

      const move = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let left = rect.left;
        let top = rect.top;
        let width = rect.width;
        let height = rect.height;
        if (dir.includes("e")) width = Math.max(MIN_W, rect.width + dx);
        if (dir.includes("s")) height = Math.max(MIN_H, rect.height + dy);
        if (dir.includes("w")) {
          width = Math.max(MIN_W, rect.width - dx);
          left = Math.max(0, rect.right - width);
          width = rect.right - left;
        }
        if (dir.includes("n")) {
          height = Math.max(MIN_H, rect.height - dy);
          top = Math.max(0, rect.bottom - height);
          height = rect.bottom - top;
        }
        win.style.left = left + "px";
        win.style.top = top + "px";
        win.style.width = width + "px";
        win.style.height = height + "px";
      };

      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    });
    win.appendChild(handle);
  });
}

// ---------- Inicializar ventana ----------
function initWindow(win) {
  windowCount += 1;
  win.style.zIndex = zTop + windowCount;

  const controls = win.querySelector(".title-bar-controls");

  // En movil los botones de ventana no hacen nada.
  controls
    ?.querySelector('button[aria-label="Minimize"]')
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isDesktop()) minimizeWindow(win);
    });

  controls
    ?.querySelector('button[aria-label="Maximize"]')
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isDesktop()) win.classList.toggle("maximized");
    });

  controls
    ?.querySelector('button[aria-label="Close"]')
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      win.classList.add("is-hidden");
      win.classList.add("closed");
      win.classList.remove("focused");
      removeTaskbarButton(win);
    });

  win.addEventListener("pointerdown", () => {
    if (isOpen(win)) focus(win);
  });
}

// Sincroniza comportamientos segun el viewport (escritorio vs movil).
// Se ejecuta al cargar y en cada cambio del media query: al agrandar a
// escritorio se vuelven a enlazar arrastre/redimension/botones de taskbar.
function syncLayout() {
  document.querySelectorAll(".xp-window").forEach((win) => {
    if (isDesktop()) {
      bindDrag(win);
      bindResize(win);
      if (!win.classList.contains("is-hidden")) addTaskbarButton(win);
    } else {
      removeTaskbarButton(win);
    }
  });
  if (!isDesktop()) {
    // En movil se muestra una sola ventana.
    const wins = [...document.querySelectorAll(".xp-window")];
    const keep =
      wins.find(
        (w) => !w.classList.contains("is-hidden") && w.classList.contains("focused"),
      ) || wins.find((w) => !w.classList.contains("is-hidden"));
    wins.forEach((w) => {
      if (w !== keep) w.classList.add("is-hidden");
    });
  }
}

if (desktopMQ.addEventListener) {
  desktopMQ.addEventListener("change", syncLayout);
} else {
  desktopMQ.addListener(syncLayout);
}

// Pequeno desplazamiento en cascada para no apilar ventanas exactas
function cascadeShift(node) {
  const n = document.querySelectorAll(".xp-window:not(.is-hidden)").length;
  const d = (n % 6) * 22;
  const left = parseFloat(node.style.left) || 0;
  const top = parseFloat(node.style.top) || 0;
  node.style.left = left + d + "px";
  node.style.top = top + d + "px";
}

// ---------- Abrir ventana (solo alterna la visibilidad) ----------
function openWindow(pageId, focusOnOpen = false) {
  const win = document.getElementById(`win-${pageId}`);
  if (!win) return;
  if (!isDesktop()) {
    // En movil se muestra una sola ventana: ocultar las demas.
    document.querySelectorAll(".xp-window").forEach((w) => {
      if (w !== win) w.classList.add("is-hidden");
    });
  }
  if (isOpen(win)) {
    focus(win);
    if (focusOnOpen) win.focus({ preventScroll: true });
    return;
  }
  win.classList.remove("is-hidden");
  win.classList.remove("closed", "minimized");
  if (isDesktop()) cascadeShift(win);
  addTaskbarButton(win);
  focus(win);
  if (focusOnOpen) win.focus({ preventScroll: true });
}

// ---------- Navegacion entre ventanas (delegado) ----------
// Los iconos del escritorio se seleccionan con un clic y abren con doble clic
// (como XP); el resto de elementos con data-window abren con un solo clic y
// los que llevan data-href abren el enlace externo en una pestana nueva.
function clearIconSelection() {
  document
    .querySelectorAll(".desktop-icon.selected")
    .forEach((el) => el.classList.remove("selected"));
}

function selectIcon(icon) {
  clearIconSelection();
  icon.classList.add("selected");
}

document.addEventListener("click", (e) => {
  const icon = e.target.closest("a.desktop-icon");
  if (icon && isDesktop()) {
    e.preventDefault();
    selectIcon(icon);
    if (!startMenu?.hidden) toggleStart(false);
    return;
  }
  const link = e.target.closest("[data-window]");
  if (link) {
    e.preventDefault();
    openWindow(link.dataset.window, e.detail === 0);
    if (!startMenu?.hidden) toggleStart(false);
    return;
  }
  const external = e.target.closest("[data-href]");
  if (external) {
    e.preventDefault();
    window.open(external.dataset.href, "_blank", "noopener");
  }
});

document.addEventListener("dblclick", (e) => {
  const icon = e.target.closest(".desktop-icon");
  if (!icon) return;
  e.preventDefault();
  if (icon.dataset.window) {
    openWindow(icon.dataset.window);
  } else if (icon.href) {
    window.open(icon.href, "_blank", "noopener");
  }
});

// Clic en el fondo del escritorio: deseleccionar iconos
document.addEventListener("click", (e) => {
  if (e.target.closest(".desktop-icon")) return;
  if (e.target.closest(".xp-window")) return;
  if (e.target.closest(".begin-menu") || e.target.closest(".taskbar")) return;
  clearIconSelection();
});

// ---------- Copiar comandos (delegado) ----------
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".copy-btn");
  if (!btn) return;
  const input = btn.closest(".command-box")?.querySelector(".command-input");
  if (!input) return;
  try {
    await navigator.clipboard.writeText(input.value);
  } catch {
    input.focus();
    input.select();
    document.execCommand("copy");
  }
  showToast(t.runtime.copyBody, t.runtime.copyTitle);
});

// Al enfocar un comando se selecciona entero para poder copiarlo a mano.
document.addEventListener("focusin", (e) => {
  const input = e.target.closest(".command-input");
  if (input) input.select();
});

// ---------- Selector de idioma (bandeja) ----------
// Recuerda la eleccion en localStorage y navega a la version equivalente.
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-set-lang]");
  if (!el) return;
  e.preventDefault();
  try {
    localStorage.setItem("winsetup-lang", el.dataset.setLang);
  } catch {
    /* sin almacenamiento: igualmente cambia de idioma */
  }
  location.href = el.dataset.langHref || (el.dataset.setLang === "es" ? "/es/" : "/");
});

// ---------- Inicializacion ----------
const allWindows = [...document.querySelectorAll(".xp-window")];
allWindows.forEach((win) => initWindow(win));

syncLayout();

const initialWindows = allWindows.filter(
  (win) => !win.classList.contains("is-hidden"),
);
if (initialWindows.length) focus(initialWindows[initialWindows.length - 1]);
