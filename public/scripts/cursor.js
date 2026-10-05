export function setupCursor() {
  const cursor = document.getElementById("custom-cursor");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!cursor || !finePointer.matches || reducedMotion.matches) return () => {};

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let rafId = 0;
  const aborter = new AbortController();
  const { signal } = aborter;

  const tick = () => {
    currentX += (targetX - currentX) * 0.18;
    currentY += (targetY - currentY) * 0.18;
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    rafId = requestAnimationFrame(tick);
  };
  const onMove = (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    cursor.classList.add("is-active");
  };
  const onEnter = (event) => {
    const target = event.target instanceof Element ? event.target.closest("a[href], button, input, textarea, .project-card") : null;
    if (!target) return;
    cursor.classList.add("is-hovering");
    if (target.closest(".project-card")) cursor.classList.add("is-target");
  };
  const onLeave = (event) => {
    const target = event.target instanceof Element ? event.target.closest("a[href], button, input, textarea, .project-card") : null;
    if (!target) return;
    cursor.classList.remove("is-hovering");
    if (target.closest(".project-card")) cursor.classList.remove("is-target");
  };
  window.addEventListener("pointermove", onMove, { passive: true, signal });
  document.addEventListener("pointerover", onEnter, { passive: true, signal });
  document.addEventListener("pointerout", onLeave, { passive: true, signal });
  rafId = requestAnimationFrame(tick);
  return () => {
    aborter.abort();
    cancelAnimationFrame(rafId);
    cursor.classList.remove("is-active", "is-hovering", "is-target");
  };
}
