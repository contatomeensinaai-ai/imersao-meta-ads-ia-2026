const slides = [...document.querySelectorAll("[data-slide]")];
const count = document.querySelector("[data-slide-count]");
let current = 0;

function showSlide(index) {
  if (!slides.length) return;
  current = Math.max(0, Math.min(index, slides.length - 1));
  slides.forEach((slide, slideIndex) => {
    const active = slideIndex === current;
    slide.classList.toggle("is-active", active);
    slide.setAttribute("aria-hidden", String(!active));
  });
  if (count) count.textContent = `${current + 1} / ${slides.length}`;
  history.replaceState(null, "", `#${current + 1}`);
}

document.querySelector("[data-prev]")?.addEventListener("click", () => showSlide(current - 1));
document.querySelector("[data-next]")?.addEventListener("click", () => showSlide(current + 1));

document.addEventListener("keydown", (event) => {
  if (["ArrowRight", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    showSlide(current + 1);
  }
  if (["ArrowLeft", "PageUp"].includes(event.key)) {
    event.preventDefault();
    showSlide(current - 1);
  }
  if (event.key === "Home") showSlide(0);
  if (event.key === "End") showSlide(slides.length - 1);
});

const initial = Number.parseInt(location.hash.slice(1), 10);
showSlide(Number.isFinite(initial) ? initial - 1 : 0);
