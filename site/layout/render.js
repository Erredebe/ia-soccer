const mount = document.getElementById('start-menu-root');
const template = document.getElementById('start-menu-template');

if (mount && template instanceof HTMLTemplateElement) {
  const fragment = template.content.cloneNode(true);
  mount.replaceWith(fragment);
  template.remove();
}
