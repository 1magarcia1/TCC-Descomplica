(function () {
  const USER_STORAGE_KEY = 'descomplicaCurrentUser';

  function readStoredUser() {
    try {
      const localValue = localStorage.getItem(USER_STORAGE_KEY);
      if (localValue) {
        return JSON.parse(localValue);
      }
    } catch (error) {
      console.warn('Não foi possível ler o usuário em localStorage.', error);
    }

    try {
      const sessionValue = sessionStorage.getItem(USER_STORAGE_KEY);
      if (sessionValue) {
        return JSON.parse(sessionValue);
      }
    } catch (error) {
      console.warn('Não foi possível ler o usuário em sessionStorage.', error);
    }

    const cookieValue = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('descomplicaCurrentUser='));

    if (cookieValue) {
      try {
        return JSON.parse(decodeURIComponent(cookieValue.split('=').slice(1).join('=')));
      } catch (error) {
        console.warn('Não foi possível ler o usuário em cookie.', error);
      }
    }

    return null;
  }

  function persistUser(user) {
    if (!user) {
      localStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem(USER_STORAGE_KEY);
      document.cookie = 'descomplicaCurrentUser=; Max-Age=0; path=/';
      return;
    }

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    document.cookie = `descomplicaCurrentUser=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400`;
  }

  function checkAuthState() {
    const user = readStoredUser();
    const accountButton = document.getElementById('accountButton');
    const logoutButton = document.getElementById('logoutButton');

    if (accountButton) {
      if (user?.name) {
        const firstName = String(user.name).trim().split(' ')[0];
        accountButton.href = 'index.html';
        accountButton.textContent = `Olá, ${firstName}`;
        accountButton.classList.add('bg-white/10');
        accountButton.classList.add('px-3');
      } else {
        accountButton.href = 'cadastro.html';
        accountButton.textContent = 'Entrar';
        accountButton.classList.remove('bg-white/10');
      }
    }

    if (logoutButton) {
      logoutButton.classList.toggle('hidden', !user?.name);
    }

    return user;
  }

  function bindLogout() {
    const logoutButton = document.getElementById('logoutButton');
    logoutButton?.addEventListener('click', () => {
      persistUser(null);
      checkAuthState();
      window.location.href = 'index.html';
    });
  }

  function setDrawerState(open) {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');

    if (!drawer || !overlay) {
      return;
    }

    drawer.classList.toggle('open', open);
    overlay.classList.toggle('show', open);
    document.body.classList.toggle('lock-scroll', open);
  }

  function bindDrawer() {
    const openButtons = [
      document.getElementById('menuToggle'),
      document.getElementById('menuToggleMobile')
    ];
    const closeButton = document.getElementById('closeDrawer');
    const overlay = document.getElementById('overlay');

    openButtons.forEach((button) => {
      button?.addEventListener('click', () => setDrawerState(true));
    });

    closeButton?.addEventListener('click', () => setDrawerState(false));
    overlay?.addEventListener('click', () => setDrawerState(false));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setDrawerState(false);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        setDrawerState(false);
      }
    });
  }

  function readCookieConsent() {
    const cookieValue = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('descomplicaCookieConsent='));

    if (!cookieValue) {
      try {
        return JSON.parse(localStorage.getItem('descomplicaCookieConsent') || 'null');
      } catch {
        return null;
      }
    }

    try {
      return JSON.parse(decodeURIComponent(cookieValue.split('=').slice(1).join('=')));
    } catch {
      return null;
    }
  }

  function persistCookieConsent(choice) {
    const payload = {
      choice,
      acceptedAt: new Date().toISOString()
    };

    document.cookie = `descomplicaCookieConsent=${encodeURIComponent(JSON.stringify(payload))}; path=/; max-age=31536000`;
    localStorage.setItem('descomplicaCookieConsent', JSON.stringify(payload));
  }

  function bindCookieBanner() {
    const existingBanner = document.getElementById('cookieConsentBanner');
    if (existingBanner) {
      return;
    }

    const consent = readCookieConsent();
    if (consent?.choice) {
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-banner__content">
        <div>
          <p class="cookie-banner__title">Uso de cookies</p>
          <p class="cookie-banner__text">
            Utilizamos cookies para lembrar sua sessão, melhorar a navegação e manter o acesso seguro.
            Ao continuar, você concorda com o uso de cookies neste portal.
          </p>
        </div>
        <div class="cookie-banner__actions">
          <button type="button" class="cookie-banner__button cookie-banner__button--secondary" data-cookie-choice="reject">Recusar</button>
          <button type="button" class="cookie-banner__button cookie-banner__button--primary" data-cookie-choice="accept">Aceitar</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    banner.querySelector('[data-cookie-choice="accept"]')?.addEventListener('click', () => {
      persistCookieConsent('accept');
      banner.remove();
    });

    banner.querySelector('[data-cookie-choice="reject"]')?.addEventListener('click', () => {
      persistCookieConsent('reject');
      banner.remove();
    });
  }

  function bindSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    if (!searchToggle || !searchInput || !searchButton) {
      return;
    }

    searchToggle.addEventListener('click', () => {
      searchInput.classList.toggle('hidden');
      searchButton.classList.toggle('hidden');
      if (!searchInput.classList.contains('hidden')) {
        searchInput.focus();
      }
    });

    function runSearch() {
      const query = searchInput.value.trim().toLowerCase();
      if (!query) {
        return;
      }

      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      const currentMatches = Array.from(document.querySelectorAll('[data-search-key]')).find((element) => {
        const value = (element.dataset.searchKey || '').toLowerCase();
        return value.includes(query);
      });

      if (currentMatches) {
        currentMatches.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (currentPage !== 'index.html') {
        window.location.href = `index.html?q=${encodeURIComponent(query)}`;
        return;
      }

      const homeMatch = Array.from(document.querySelectorAll('[data-search-key]')).find((element) => {
        const value = (element.dataset.searchKey || '').toLowerCase();
        return value.includes(query);
      });

      if (homeMatch) {
        homeMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    searchButton.addEventListener('click', runSearch);
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        runSearch();
      }
    });
  }

  function applySearchFromQueryParam() {
    const params = new URLSearchParams(window.location.search);
    const query = (params.get('q') || '').trim().toLowerCase();
    if (!query || window.location.pathname.split('/').pop() !== 'index.html') {
      return;
    }

    const target = Array.from(document.querySelectorAll('[data-search-key]')).find((element) => {
      const value = (element.dataset.searchKey || '').toLowerCase();
      return value.includes(query);
    });

    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindDrawer();
    bindSearch();
    bindLogout();
    checkAuthState();
    bindCookieBanner();
    applySearchFromQueryParam();
  });

  window.checkAuthState = checkAuthState;
  window.runSearch = function runSearchGlobal() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = searchInput.value.trim();
      const event = new Event('keydown', { bubbles: true });
      event.key = 'Enter';
      searchInput.dispatchEvent(event);
    }
  };
})();
