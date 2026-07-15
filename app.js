// Arquivo responsável pelo controle do menu lateral e troca de temas.
// Ele pode ser reutilizado em todas as páginas do sistema para manter consistência visual.

const STORAGE_KEY = 'app-selected-theme';

function applyTheme(themeName) {
  document.body.classList.remove('theme-harvard', 'theme-dark', 'theme-light');
  document.body.classList.add(themeName);
  localStorage.setItem(STORAGE_KEY, themeName);

  const select = document.getElementById('theme-select');
  if (select) {
    select.value = themeName;
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const initialTheme = savedTheme || 'theme-harvard';
  applyTheme(initialTheme);
}

function toggleMenu(forceOpen) {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawer-overlay');

  if (!drawer || !overlay) return;

  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !drawer.classList.contains('menu-open');

  drawer.classList.toggle('menu-open', shouldOpen);
  overlay.classList.toggle('is-visible', shouldOpen);
}

function bindUi() {
  const toggleButton = document.getElementById('menu-toggle');
  const closeButton = document.getElementById('drawer-close');
  const overlay = document.getElementById('drawer-overlay');
  const themeSelect = document.getElementById('theme-select');

  toggleButton?.addEventListener('click', () => toggleMenu());
  closeButton?.addEventListener('click', () => toggleMenu(false));
  overlay?.addEventListener('click', () => toggleMenu(false));

  themeSelect?.addEventListener('change', (event) => {
    applyTheme(event.target.value);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      toggleMenu(false);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  bindUi();
});
