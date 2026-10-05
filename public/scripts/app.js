import { portfolioConfig } from "./config.js?v=2";
import { startAudioFromGesture, setMuted, playCue, destroyAudio } from "./audio.js";
import { startIntro, destroyScene } from "./scene.js";
import { setupCursor } from "./cursor.js";

const aborter = new AbortController();
const { signal } = aborter;
const enterButton = document.getElementById("enter-experience-button");
const enterScreen = document.getElementById("enter-screen");
const loadingSequence = document.getElementById("loading-sequence");
const introScreen = document.getElementById("cinematic-intro");
const portfolio = document.getElementById("portfolio");
const certificateDialog = document.getElementById("certificate-dialog");
const projectDialog = document.getElementById("project-dialog");
const audioToggle = document.getElementById("audio-toggle");
const contactForm = document.getElementById("message-form");
const formStatus = document.getElementById("form-status");
const submitButton = document.getElementById("message-submit-button");
const customCursorCleanup = setupCursor();
let introStarted = false;
let muted = false;
let clockTimer = 0;
let journeyObserver = null;
let mouseFrame = 0;
let hoveredProject = null;
let lastCertificateTrigger = null;
let lastProjectTrigger = null;
let projectCloseTimer = 0;
let desiredMouseX = 0;
let desiredMouseY = 0;
let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function safeHref(value, protocolAllowlist = ["http:", "https:"]) {
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin === window.location.origin && value.startsWith("#")) return value;
    return protocolAllowlist.includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

function usableExternalUrl(value) {
  const candidate = String(value ?? "").trim();
  if (!candidate || /REPLACE_USERNAME|example\.(?:com|net|org)|placeholder/i.test(candidate)) return "";
  const url = safeHref(candidate, ["http:", "https:"]);
  return url === "#" ? "" : url;
}

function usableEmail(value) {
  const address = String(value ?? "").trim();
  if (!address || /example\.(?:com|net|org)|placeholder/i.test(address)) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? `mailto:${address}` : "";
}

function renderIdentity() {
  const { identity, hud } = portfolioConfig;
  const firstName = document.getElementById("hero-first-name");
  const lastName = document.getElementById("hero-last-name");
  const role = document.getElementById("hero-role");
  const quote = document.getElementById("hero-quote");
  const label = document.getElementById("archive-label");
  const brand = document.getElementById("brand-link");
  const icon = document.querySelector(".brand-icon");
  const plate = document.getElementById("scene-plate");
  if (firstName) firstName.textContent = identity.firstName;
  if (lastName) lastName.textContent = identity.lastName;
  if (role) role.textContent = identity.role;
  if (quote) quote.textContent = `“${identity.quote}”`;
  const kickerRole = document.getElementById("hero-kicker-role");
  const kickerLocation = document.getElementById("hero-kicker-location");
  if (kickerRole) kickerRole.textContent = identity.role.toUpperCase();
  if (kickerLocation) kickerLocation.textContent = `${identity.location.toUpperCase()}, ${identity.countryCode}`;
  const hudLocation = document.getElementById("hero-hud-location");
  const hudStatus = document.getElementById("hero-hud-status");
  const hudLevel = document.getElementById("hero-hud-level");
  if (hudLocation) hudLocation.textContent = `${identity.location.toUpperCase()} / ${identity.countryCode}`;
  if (hudStatus) hudStatus.textContent = hud.status;
  if (hudLevel) hudLevel.textContent = hud.level;
  if (label) label.textContent = identity.brand.replace(/^KM\s*\/\/\s*/, "");
  if (brand) brand.setAttribute("aria-label", `${identity.brand}, back to the beginning`);
  const letters = identity.name.split(/\s+/).map((word) => word[0] || "").join("").slice(0, 2);
  document.querySelectorAll("[data-initials]").forEach((item) => { item.textContent = letters; });
  if (icon) icon.src = portfolioConfig.scene.icon;
  if (plate) plate.src = portfolioConfig.scene.image;
  const profileLocation = document.getElementById("profile-location-note");
  if (profileLocation) profileLocation.textContent = `${identity.location.toUpperCase()}, ${identity.country.toUpperCase()}`;
  const footerName = document.getElementById("footer-name");
  if (footerName) footerName.textContent = identity.name;
  const footerLocation = document.getElementById("footer-location");
  if (footerLocation) footerLocation.textContent = identity.location.toUpperCase();
  const description = `${identity.name} — ${identity.role} in ${identity.location}. ${identity.quote}`;
  document.getElementById("meta-description")?.setAttribute("content", description);
  document.getElementById("og-title")?.setAttribute("content", `${identity.name} — ${identity.role}`);
  document.getElementById("og-description")?.setAttribute("content", identity.quote);
  document.title = `${identity.name} — ${identity.role}`;
}

function renderSkills() {
  const root = document.getElementById("skills-loadout");
  if (!root) return;
  const groups = portfolioConfig.skills.map((group, index) => {
    const rating = Math.max(0, Math.min(portfolioConfig.skillsRating.max, Number(group.rating) || 0));
    const stars = `${"★".repeat(rating)}<span class="empty-star">${"☆".repeat(portfolioConfig.skillsRating.max - rating)}</span>`;
    const items = group.items.map((item) => `<span class="skill-chip">${escapeHtml(item)}</span>`).join("");
    return `<article class="skill-group"><div class="skill-group-head"><h3>${escapeHtml(group.name)}</h3><span class="skill-rating" role="img" aria-label="${rating} out of ${portfolioConfig.skillsRating.max} stars">${stars}</span></div><div class="skill-list">${items}</div><span class="skill-group-code eyebrow">KIT / ${String(index + 1).padStart(2, "0")}</span></article>`;
  }).join("");
  const note = escapeHtml(portfolioConfig.skillsRating.label || "");
  root.innerHTML = `${groups}<p class="loadout-footnote">${note}</p>`;
}

function renderProjects() {
  const root = document.getElementById("project-grid");
  if (!root) return;
  const projects = Array.isArray(portfolioConfig.projects) ? portfolioConfig.projects : [];
  root.innerHTML = projects.map((project, index) => {
    const tech = (project.technologies || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("");
    const projectId = String(index + 1).padStart(2, "0");
    const content = `<span class="project-topline"><span class="project-number">MISSION / ${projectId}</span><span>CLASSIFIED // PUBLIC</span></span><h3>${escapeHtml(project.title)}</h3><p class="project-description">${escapeHtml(project.description)}</p><div class="project-tech" aria-label="Technologies">${tech}</div>`;
    const action = `<span class="project-github"><span>OPEN MISSION FILE</span><span class="button-arrow" aria-hidden="true">→</span></span>`;
    return `<article class="project-card" data-project-card data-project-index="${index}" aria-label="Mission ${projectId}: ${escapeAttribute(project.title)}"><button class="project-link project-open" id="project-${projectId}-open" data-testid="project-${projectId}-open" data-project-open="${index}" type="button" aria-label="Open mission ${projectId}: ${escapeAttribute(project.title)}">${content}${action}</button><span class="project-light" aria-hidden="true"></span></article>`;
  }).join("");
}

function setProjectDestination(linkId, unavailableId, value) {
  const link = document.getElementById(linkId);
  const unavailable = document.getElementById(unavailableId);
  const url = usableExternalUrl(value);
  if (link) {
    if (url) {
      link.href = url;
      link.hidden = false;
    } else {
      link.removeAttribute("href");
      link.hidden = true;
    }
  }
  if (unavailable) unavailable.hidden = Boolean(url);
}

function openProject(index, trigger) {
  const projects = Array.isArray(portfolioConfig.projects) ? portfolioConfig.projects : [];
  const project = projects[index];
  if (!project || !projectDialog) return;
  const number = String(Number(index) + 1).padStart(2, "0");
  const title = document.getElementById("project-dialog-title");
  const description = document.getElementById("project-dialog-description");
  const numberLabel = document.getElementById("project-dialog-number");
  const technologies = document.getElementById("project-dialog-technologies");
  if (!title || !description || !numberLabel || !technologies) return;
  lastProjectTrigger = trigger;
  numberLabel.textContent = number;
  title.textContent = project.title || `MISSION / ${number}`;
  description.textContent = project.details || project.description || "Project matter to be added.";
  const items = Array.isArray(project.technologies) ? project.technologies : [];
  technologies.innerHTML = items.length
    ? items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")
    : "<span>TECHNOLOGY DETAILS TO BE ADDED</span>";
  setProjectDestination("project-dialog-live-link", "project-dialog-live-unavailable", project.live);
  setProjectDestination("project-dialog-github-link", "project-dialog-github-unavailable", project.github);
  if (projectCloseTimer) window.clearTimeout(projectCloseTimer);
  projectCloseTimer = 0;
  projectDialog.classList.remove("is-open");
  projectDialog.showModal();
  requestAnimationFrame(() => projectDialog.classList.add("is-open"));
  projectDialog.querySelector("[data-project-close]")?.focus();
  playCue("section_transition");
}

function finishProjectClose() {
  if (projectCloseTimer) window.clearTimeout(projectCloseTimer);
  projectCloseTimer = 0;
  if (projectDialog?.open) projectDialog.close();
}

function closeProject() {
  if (!projectDialog?.open) return;
  projectDialog.classList.remove("is-open");
  if (projectCloseTimer) window.clearTimeout(projectCloseTimer);
  projectCloseTimer = window.setTimeout(finishProjectClose, reducedMotion.matches ? 0 : 320);
}

function renderCertificates() {
  const root = document.getElementById("certificate-grid");
  if (!root) return;
  const certificates = Array.isArray(portfolioConfig.certificates) ? portfolioConfig.certificates : [];
  root.innerHTML = certificates.map((certificate, index) => {
    const number = String(index + 1).padStart(2, "0");
    const title = escapeHtml(certificate.title || "Certificate");
    const issuer = escapeHtml(certificate.issuer || "Issuer to be updated");
    const date = escapeHtml(certificate.date || "");
    const image = safeHref(certificate.image || "#");
    return `<button class="certificate-card" type="button" data-certificate-open="${index}" aria-label="View certificate ${number}: ${escapeAttribute(certificate.title || "Certificate")}"><span class="certificate-card-head"><span>CERTIFICATE / ${number}</span><span>${date}</span></span><span class="certificate-thumb"><img src="${escapeAttribute(image)}" alt="Preview of ${escapeAttribute(certificate.title || "certificate")}" loading="lazy" /></span><span class="certificate-card-title">${title}</span><span class="certificate-issuer">${issuer}</span><span class="certificate-card-foot"><span>VIEW CERTIFICATE</span><span class="certificate-card-arrow" aria-hidden="true">→</span></span></button>`;
  }).join("");
}

function openCertificate(index, trigger) {
  const certificate = portfolioConfig.certificates?.[index];
  if (!certificate || !certificateDialog) return;
  const image = document.getElementById("certificate-dialog-image");
  const title = document.getElementById("certificate-dialog-title");
  const issuer = document.getElementById("certificate-dialog-issuer");
  const date = document.getElementById("certificate-dialog-date");
  const number = document.getElementById("certificate-dialog-number");
  const verificationLink = document.getElementById("certificate-dialog-verification-link");
  if (!image || !title || !issuer || !date || !number) return;
  lastCertificateTrigger = trigger;
  image.src = safeHref(certificate.image || "#");
  image.alt = `${certificate.title || "Certificate"} — ${certificate.issuer || ""}`;
  title.textContent = certificate.title || "Certificate";
  issuer.textContent = certificate.issuer || "Issuer to be updated";
  date.textContent = certificate.date || "";
  number.textContent = String(Number(index) + 1).padStart(2, "0");
  const verificationUrl = usableExternalUrl(certificate.verificationUrl);
  if (verificationLink) {
    if (verificationUrl) {
      verificationLink.href = verificationUrl;
      verificationLink.hidden = false;
    } else {
      verificationLink.removeAttribute("href");
      verificationLink.hidden = true;
    }
  }
  if (!certificateDialog.open) certificateDialog.showModal();
  playCue("section_transition");
}

function closeCertificate() {
  if (certificateDialog?.open) certificateDialog.close();
  lastCertificateTrigger?.focus();
}

function renderProfile() {
  const root = document.getElementById("profile-fields");
  if (!root) return;
  const fields = [
    ["NAME", portfolioConfig.identity.name],
    ["ROLE", portfolioConfig.identity.role],
    ["LOCATION", portfolioConfig.identity.location],
    ["EDUCATION", portfolioConfig.profile.education],
    ["INTERESTS", portfolioConfig.profile.interests],
    ["CURRENT FOCUS", portfolioConfig.profile.currentFocus],
    ["AVAILABILITY", portfolioConfig.profile.availability],
  ];
  root.innerHTML = fields.map(([label, value]) => `<div class="dossier-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
}

function renderJourney() {
  const root = document.getElementById("journey-items");
  if (!root) return;
  root.innerHTML = portfolioConfig.journey.map((item, index) => `<article class="journey-item" data-journey-item><time class="journey-year" datetime="${escapeAttribute(item.year)}">${escapeHtml(item.year)}</time><p class="journey-detail">${escapeHtml(item.detail)}</p></article>`).join("");
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    journeyObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          const items = [...document.querySelectorAll("[data-journey-item]")];
          const revealed = items.filter((item) => item.classList.contains("is-revealed")).length;
          const line = document.getElementById("journey-progress");
          if (line) line.style.height = `${items.length ? Math.max(10, revealed / items.length * 100) : 0}%`;
          journeyObserver?.unobserve(entry.target);
        }
      }
    }, { threshold: 0.4 });
    root.querySelectorAll("[data-journey-item]").forEach((item) => journeyObserver.observe(item));
  } else {
    root.querySelectorAll("[data-journey-item]").forEach((item) => item.classList.add("is-revealed"));
    const line = document.getElementById("journey-progress");
    if (line) line.style.height = "100%";
  }
}

function wireContactLinks() {
  const emailLink = document.getElementById("email-link");
  const githubLink = document.getElementById("github-link");
  const linkedinLink = document.getElementById("linkedin-link");
  const wireLink = (link, href, label, external = true) => {
    if (!link) return;
    if (!href || href === "#") {
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.setAttribute("aria-disabled", "true");
      link.tabIndex = -1;
      link.textContent = `${label} — LINK TO BE ADDED`;
      return;
    }
    link.href = href;
    link.removeAttribute("aria-disabled");
    link.removeAttribute("tabindex");
    link.textContent = `${label} ${external ? "↗" : ""}`.trim();
    if (external) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    } else {
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }
  };
  wireLink(emailLink, usableEmail(portfolioConfig.links.email), "EMAIL", false);
  wireLink(githubLink, usableExternalUrl(portfolioConfig.links.github), "GITHUB");
  wireLink(linkedinLink, usableExternalUrl(portfolioConfig.links.linkedin), "LINKEDIN");
  const year = document.getElementById("footer-year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function updateLocationClock() {
  const clock = document.getElementById("tokyo-clock");
  if (!clock) return;

  const now = new Date();

  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);

  clock.textContent = `AMRITAPURI ${formatted}`;
  clock.dateTime = now.toISOString();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function startProjectPointerEffects() {
  document.addEventListener("pointerover", (event) => {
    const card = event.target instanceof Element ? event.target.closest("[data-project-card]") : null;
    if (card) hoveredProject = card;
  }, { passive: true, signal });
  document.addEventListener("pointerout", (event) => {
    const card = event.target instanceof Element ? event.target.closest("[data-project-card]") : null;
    if (card && !card.contains(event.relatedTarget)) {
      card.style.removeProperty("--drift-x");
      card.style.removeProperty("--drift-y");
      hoveredProject = null;
    }
  }, { passive: true, signal });
  document.addEventListener("pointermove", (event) => {
    if (!hoveredProject || event.pointerType !== "mouse") return;
    desiredMouseX = event.clientX;
    desiredMouseY = event.clientY;
    if (mouseFrame) return;
    mouseFrame = requestAnimationFrame(() => {
      mouseFrame = 0;
      if (!hoveredProject) return;
      const rect = hoveredProject.getBoundingClientRect();
      const x = (desiredMouseX - rect.left) / Math.max(1, rect.width);
      const y = (desiredMouseY - rect.top) / Math.max(1, rect.height);
      hoveredProject.style.setProperty("--drift-x", `${(x - 0.5) * 5}px`);
      hoveredProject.style.setProperty("--drift-y", `${(y - 0.5) * 4}px`);
      hoveredProject.style.setProperty("--light-x", `${x * 100}%`);
      hoveredProject.style.setProperty("--light-y", `${y * 100}%`);
    });
  }, { passive: true, signal });
}

function setupSectionAudio() {
  document.querySelectorAll(".main-nav a, .hero-actions a, .brand-lockup").forEach((link) => {
    link.addEventListener("click", () => playCue("section_transition"), { signal });
  });
  document.querySelectorAll("button, .hud-button, .project-github").forEach((item) => {
    item.addEventListener("pointerenter", () => playCue("button_hover"), { passive: true, signal });
  });
}

function startPortfolioReveal() {
  if (introStarted) return;
  introStarted = true;
  startAudioFromGesture();
  introScreen?.classList.add("is-sequence");
  document.body.classList.add("is-cinematic-loading");
  if (enterScreen) enterScreen.hidden = true;
  if (loadingSequence) loadingSequence.hidden = false;
  startIntro(() => {
    if (portfolio) {
      portfolio.hidden = false;
      requestAnimationFrame(() => portfolio.classList.add("is-visible"));
    }
    if (introScreen) introScreen.classList.add("is-leaving");
    document.querySelector(".scene-shell")?.classList.remove("is-loading");
    document.body.classList.remove("is-cinematic-loading");
    updateLocationClock();
    clockTimer = window.setInterval(updateLocationClock, 15_000);
  });
}

function setFormMessage(message, state = "") {
  if (!formStatus) return;
  formStatus.textContent = message;
  if (state) formStatus.dataset.state = state;
  else delete formStatus.dataset.state;
}

async function submitContact(event) {
  event.preventDefault();
  if (!contactForm || !submitButton) return;
  const formData = new FormData(contactForm);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    message: String(formData.get("message") || "").trim(),
  };
  if (payload.name.length < 2 || payload.name.length > 100) {
    setFormMessage("Please enter a name between 2 and 100 characters.", "error");
    document.getElementById("message-name-input")?.focus();
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || payload.email.length > 254) {
    setFormMessage("Please enter a valid email address.", "error");
    document.getElementById("message-email-input")?.focus();
    return;
  }
  if (payload.message.length < 10 || payload.message.length > 4000) {
    setFormMessage("Please write a message between 10 and 4,000 characters.", "error");
    document.getElementById("message-text-input")?.focus();
    return;
  }

  submitButton.disabled = true;
  contactForm.setAttribute("aria-busy", "true");
  submitButton.querySelector("span:first-child").textContent = "SENDING...";
  setFormMessage("Sending your message securely…");
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success !== true) {
      throw new Error("transmission-failed");
    }
    contactForm.reset();
    setFormMessage("TRANSMISSION RECEIVED.\nTHANK YOU — I’LL BE IN TOUCH.", "success");
  } catch {
    setFormMessage("TRANSMISSION FAILED.\nPLEASE TRY AGAIN.", "error");
  } finally {
    submitButton.disabled = false;
    contactForm.removeAttribute("aria-busy");
    submitButton.querySelector("span:first-child").textContent = "SEND TRANSMISSION";
  }
}

renderIdentity();
renderSkills();
renderProjects();
renderCertificates();
renderProfile();
renderJourney();
wireContactLinks();
startProjectPointerEffects();
setupSectionAudio();

enterButton?.addEventListener("click", startPortfolioReveal, { once: true, signal });
document.getElementById("certificate-grid")?.addEventListener("click", (event) => {
  const trigger = event.target instanceof Element ? event.target.closest("[data-certificate-open]") : null;
  if (trigger) openCertificate(Number(trigger.dataset.certificateOpen), trigger);
}, { signal });
document.getElementById("project-grid")?.addEventListener("click", (event) => {
  const trigger = event.target instanceof Element ? event.target.closest("[data-project-open]") : null;
  if (trigger) openProject(Number(trigger.dataset.projectOpen), trigger);
}, { signal });
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && certificateDialog?.open) {
    event.preventDefault();
    closeCertificate();
  }
}, { capture: true, signal });
certificateDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeCertificate();
}, { signal });
document.querySelector("[data-certificate-close]")?.addEventListener("click", closeCertificate, { signal });
certificateDialog?.addEventListener("click", (event) => {
  if (event.target === certificateDialog) closeCertificate();
}, { signal });
document.querySelector("[data-project-close]")?.addEventListener("click", closeProject, { signal });
projectDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeProject();
}, { signal });
projectDialog?.addEventListener("click", (event) => {
  if (event.target === projectDialog) closeProject();
}, { signal });
projectDialog?.addEventListener("close", () => {
  if (projectCloseTimer) window.clearTimeout(projectCloseTimer);
  projectCloseTimer = 0;
  projectDialog.classList.remove("is-open");
  lastProjectTrigger?.focus();
  lastProjectTrigger = null;
}, { signal });
audioToggle?.addEventListener("click", () => {
  muted = !muted;
  setMuted(muted);
  audioToggle.setAttribute("aria-pressed", String(!muted));
  audioToggle.setAttribute("aria-label", muted ? "Turn sound on" : "Turn sound off");
  audioToggle.textContent = muted ? "SOUND OFF" : "SOUND READY";
}, { signal });
contactForm?.addEventListener("submit", submitContact, { signal });

for (const anchor of document.querySelectorAll('a[href^="#"]')) {
  anchor.addEventListener("click", (event) => {
    const destination = document.querySelector(anchor.getAttribute("href"));
    if (!destination) return;
    event.preventDefault();
    destination.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    if (destination.id === "hero-section") history.replaceState(null, "", window.location.pathname + window.location.search);
    else history.replaceState(null, "", `#${destination.id}`);
  }, { signal });
}

window.addEventListener("pagehide", () => {
  aborter.abort();
  customCursorCleanup();
  if (journeyObserver) journeyObserver.disconnect();
  if (clockTimer) window.clearInterval(clockTimer);
  if (mouseFrame) cancelAnimationFrame(mouseFrame);
  destroyScene();
  destroyAudio();
}, { once: true, signal });
