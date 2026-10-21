// Arquivo responsável pelo controle do menu lateral, troca de temas e autenticação administrativa.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const STORAGE_KEY = 'app-selected-theme';

const firebaseConfig = {
  apiKey: 'AIzaSyAxTCzFD4RS0WsPpowYGTrX_FxAEPjpAX4',
  authDomain: 'meu-sistema-admin.firebaseapp.com',
  projectId: 'meu-sistema-admin',
  storageBucket: 'meu-sistema-admin.firebasestorage.app',
  messagingSenderId: '1051070873568',
  appId: '1:1051070873568:web:4ab374c5f418f96bdeb585',
  measurementId: 'G-0XZPL7DSV'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const ADMIN_UID = 'COLE_AQUI_O_SEU_UID_GERADO';

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

function bindFirebaseAdminLogin() {
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminEmail = document.getElementById('adminEmail');
  const adminPassword = document.getElementById('adminPassword');
  const adminMessage = document.getElementById('adminMessage');

  if (!adminLoginForm || !adminEmail || !adminPassword || !adminMessage) {
    return;
  }

  adminLoginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = adminEmail.value.trim();
    const senha = adminPassword.value;

    if (!email || !senha) {
      adminMessage.textContent = 'Informe e-mail e senha para entrar no painel administrativo.';
      adminMessage.className = 'mt-4 text-sm text-crimson';
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, senha);
      const usuarioLogado = credential.user;

      if (usuarioLogado.uid !== ADMIN_UID) {
        await signOut(auth);
        adminMessage.textContent = 'Acesso negado. Esta conta não é autorizada como administrador.';
        adminMessage.className = 'mt-4 text-sm text-crimson';
        return;
      }

      localStorage.setItem('descomplicaAdminSession', 'true');
      adminMessage.textContent = 'Login autorizado. Bem-vindo, administrador.';
      adminMessage.className = 'mt-4 text-sm text-green-600';
      window.location.href = 'admin.html';
    } catch (error) {
      console.error('Erro no login:', error.code);
      adminMessage.textContent = 'E-mail ou senha inválidos. Verifique as credenciais do administrador.';
      adminMessage.className = 'mt-4 text-sm text-crimson';
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  bindUi();
  bindFirebaseAdminLogin();
});
