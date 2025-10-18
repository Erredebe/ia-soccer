const TEMPLATE_PATHS = {
  'start-menu': 'templates/start-menu.html',
  'dashboard': 'templates/dashboard.html',
};

const templateCache = new Map();

async function loadTemplate(name) {
  if (templateCache.has(name)) {
    return templateCache.get(name);
  }

  const path = TEMPLATE_PATHS[name];
  if (!path) {
    throw new Error(`No se ha definido la plantilla "${name}"`);
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`No se pudo cargar la plantilla "${name}" (${response.status})`);
  }

  const html = await response.text();
  templateCache.set(name, html);
  return html;
}

function createFragment(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.cloneNode(true);
}

async function renderTemplates() {
  const placeholders = Array.from(document.querySelectorAll('[data-template]'));
  await Promise.all(
    placeholders.map(async (placeholder) => {
      const name = placeholder.getAttribute('data-template');
      if (!name) {
        return;
      }

      try {
        const html = await loadTemplate(name);
        placeholder.replaceWith(createFragment(html));
      } catch (error) {
        console.error(error);
      }
    })
  );
}

renderTemplates().catch((error) => {
  console.error('Error al renderizar plantillas', error);
});
