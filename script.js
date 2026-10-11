// ===== Edit your invitation details here =====
const CONFIG = {
  groom: "Husain",
  bride: "Dr. Alisha",
  groomParents: "S/o Mr & Mrs Khairunnisa Abdul Habib Thekiya",
  brideParents: "D/o Mr & Mrs Shabana Shakil Memon",
  groomCity: "Mumbra Dist. Thane",
  brideCity: "Chiplun Dist. Ratnagiri",
  nikah: {
    dateText: "Saturday, 02 Jan 2027",
    timeText: "4:00 pm to 8:00 pm",
    venue: "Minara Masjid, Mumbai",
    mapUrl: "https://share.google/co7MMW6MzE7HSqx4V",
    start: "2027-01-02T16:00:00+05:30", // countdown target, Mumbai time (IST is +05:30)
  },
  walima: {
    dateText: "Sunday, 03 Jan 2027",
    timeText: "2:00 pm to 4:00 pm",
    venue: "Kutchi Memon Hall, Mumbai",
    mapUrl: "https://share.google/dLmMFAW1HQ3yvKJXS",
    start: "2027-01-03T14:00:00+05:30",
  },
};

// ===== Which invite: full (Nikah + Walima) or Walima-only =====
// Walima-only with ?walima (the /walima link forwards here, see walima/index.html)
const isWalimaOnly = new URLSearchParams(location.search).has("walima");

// Show the clean /walima address instead of index.html?walima (refreshing it still works)
if (isWalimaOnly && location.protocol !== "file:") {
  history.replaceState(null, "", new URL("walima", location.href).pathname + location.hash);
}
const mode = isWalimaOnly ? "walima" : "nikah";

// Drop whatever belongs to the other mode
document.querySelectorAll("[data-only]").forEach((el) => {
  if (el.dataset.only !== mode) el.remove();
});

// Fill text fields ("nikah.venue" style keys read nested values)
const getField = (path) => path.split(".").reduce((obj, key) => obj?.[key], CONFIG);
document.querySelectorAll("[data-field]").forEach((el) => {
  const value = getField(el.dataset.field);
  if (value) el.textContent = value;
  else el.remove();
});
document.querySelectorAll("[data-field-href]").forEach((el) => {
  el.href = getField(el.dataset.fieldHref);
});
document.title = `${CONFIG.groom.split(" ")[0]} & ${CONFIG.bride.split(" ")[0]} · ${isWalimaOnly ? "Walima" : "Nikah"}`;

// ===== Keep parent lines on one line =====
// Shrink both lines to the same size so the longer one fits the arch
const parentLines = [...document.querySelectorAll(".names .parent")];
function fitParentLines() {
  parentLines.forEach((el) => (el.style.fontSize = ""));
  const arch = document.querySelector(".arch");
  if (!arch || !parentLines.length) return;
  const pad = getComputedStyle(arch);
  const maxWidth = arch.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight);
  const scale = Math.min(1, ...parentLines.map((el) => maxWidth / el.scrollWidth));
  if (scale < 1) {
    const size = parseFloat(getComputedStyle(parentLines[0]).fontSize) * scale * 0.98;
    parentLines.forEach((el) => (el.style.fontSize = `${Math.max(size, 11)}px`));
  }
}
document.fonts.ready.then(fitParentLines);
window.addEventListener("resize", fitParentLines);

// ===== Envelope =====
// Always start from the first page; don't restore the old scroll position on refresh
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const envelope = document.getElementById("envelope");
const music = document.getElementById("music");
const musicBtn = document.getElementById("musicBtn");
const AUTO_OPEN_MS = 5000; // open by itself if the guest doesn't tap
let opened = false;

function openEnvelope() {
  if (opened) return;
  opened = true;
  clearTimeout(autoOpenTimer);
  window.scrollTo(0, 0);

  // Start music inside the tap gesture so mobile browsers allow it.
  // On auto-open there is no gesture, so browsers usually block it:
  // then start it on the guest's first touch instead.
  music.play().catch(() => {
    if (music.error) return; // no music file
    musicBtn.hidden = false;
    musicBtn.classList.add("paused");
    const startOnTouch = (e) => {
      if (!musicBtn.contains(e.target)) music.play().catch(() => {});
    };
    document.addEventListener("pointerdown", startOnTouch, { once: true });
  });

  envelope.classList.add("opening");
  setTimeout(() => envelope.classList.add("open"), 900);
  setTimeout(() => {
    document.body.classList.remove("locked");
    revealVisible();
    scrollArrow.hidden = false;
    updateArrow();
  }, 1500);
  setTimeout(() => envelope.classList.add("gone"), 2400);
}

const autoOpenTimer = setTimeout(openEnvelope, AUTO_OPEN_MS);
envelope.addEventListener("click", openEnvelope);
envelope.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    openEnvelope();
  }
});

// ===== Scroll-down arrow =====
const scrollArrow = document.getElementById("scrollArrow");
const pages = [...document.querySelectorAll(".page")];

scrollArrow.addEventListener("click", () => {
  // Next page whose top is below the current viewport top
  const next = pages.find((p) => p.getBoundingClientRect().top > 10);
  if (next) next.scrollIntoView({ behavior: "smooth" });
});

function updateArrow() {
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40;
  scrollArrow.classList.toggle("faded", atBottom);
}
window.addEventListener("scroll", updateArrow, { passive: true });
window.addEventListener("resize", updateArrow);

// ===== Music toggle =====
music.addEventListener("error", () => (musicBtn.hidden = true));
musicBtn.addEventListener("click", () => {
  if (music.paused) music.play();
  else music.pause();
});
music.addEventListener("playing", () => (musicBtn.hidden = false));
music.addEventListener("play", () => {
  musicBtn.classList.remove("paused");
  musicBtn.setAttribute("aria-label", "Pause music");
});
music.addEventListener("pause", () => {
  musicBtn.classList.add("paused");
  musicBtn.setAttribute("aria-label", "Play music");
});

// ===== Reveal on scroll =====
const revealEls = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

// Stagger items inside each section
document.querySelectorAll(".page").forEach((page) => {
  page.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.15}s`;
  });
});

function revealVisible() {
  revealEls.forEach((el) => io.observe(el));
}

// ===== Countdown =====
const target = new Date(CONFIG[mode].start).getTime();
const cd = {
  d: document.getElementById("cd-d"),
  h: document.getElementById("cd-h"),
  m: document.getElementById("cd-m"),
  s: document.getElementById("cd-s"),
};
const pad = (n) => String(n).padStart(2, "0");

function tick() {
  const diff = target - Date.now();
  if (diff <= 0) {
    document.querySelector(".countdown").hidden = true;
    return;
  }
  const s = Math.floor(diff / 1000);
  cd.d.textContent = Math.floor(s / 86400);
  cd.h.textContent = pad(Math.floor((s % 86400) / 3600));
  cd.m.textContent = pad(Math.floor((s % 3600) / 60));
  cd.s.textContent = pad(s % 60);
}
tick();
setInterval(tick, 1000);
