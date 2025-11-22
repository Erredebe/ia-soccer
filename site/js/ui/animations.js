export function restartAnimation(element, className) {
  if (!element) {
    return;
  }
  element.classList.remove(className);
  requestAnimationFrame(() => {
    element.classList.add(className);
  });
}
