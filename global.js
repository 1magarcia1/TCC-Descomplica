(function () {
  const USER_STORAGE_KEY = 'descomplicaCurrentUser';
  const MENU_CATEGORIES = [
    {
      title: 'Ferramentas',
      intro: 'Recursos práticos para compreender questões jurídicas e organizar os próximos passos.',
      items: [
        ['tradutor.html', 'Tradutor de Juridiquês', 'Transforme textos jurídicos complexos em explicações claras e consulte expressões com facilidade.'],
        ['dicionario.html', 'Dicionário Jurídico', 'Consulte definições, contextos e exemplos em um glossário de leitura simples.'],
        ['gerador.html', 'Gerador de Documentos', 'Crie modelos iniciais de documentos e declarações com informações básicas.'],
        ['simulador.html', 'Simulador de Custos', 'Estime custos considerando o tipo de ação, o valor, a renda e a complexidade.']
      ]
    },
    {
      title: 'Conteúdos',
      intro: 'Informações jurídicas para ajudar você a entender seus direitos e conhecer os próximos passos.',
      items: [
        ['guia.html', 'Guia de Direitos', 'Explore orientações introdutórias sobre trabalho, consumo, família, pessoa idosa e educação.'],
        ['linha-tempo.html', 'Linha do Tempo Jurídica', 'Conheça as principais etapas de um processo judicial, do início ao fim.'],
        ['dicionario.html', 'Dicionário Jurídico', 'Encontre o significado de expressões jurídicas com explicações, exemplos e contexto.']
      ]
    },
    {
      title: 'Portal',
      intro: 'Conheça as áreas e os recursos disponíveis no Descomplica Direito.',
      items: [
        ['index.html', 'Página Inicial', 'Volte ao portal para encontrar ferramentas, conteúdos em destaque e informações institucionais.'],
        ['advogados.html', 'Advogados Parceiros', 'Consulte perfis de profissionais e áreas de atuação para buscar orientação inicial.']
      ]
    },
    {
      title: 'Conta',
      intro: 'Entre ou crie uma conta para acessar os recursos do portal.',
      items: [
        ['cadastro.html', 'Cadastro / Login', 'Acesse sua conta ou inicie seu cadastro no Descomplica Direito.'],
        ['mensagens.html', 'Mensagens', 'Acesse conversas privadas com profissionais ou clientes cadastrados.']
      ]
    }
  ];
  let activeCategoryIndex = null;
  let activeMenuItemIndex = null;

  function isHtmlPage() {
    return window.location.pathname.includes('/html/');
  }

  function siteHref(fileName) {
    if (fileName === 'index.html') {
      return isHtmlPage() ? '../index.html' : 'index.html';
    }
    return isHtmlPage() ? fileName : `html/${fileName}`;
  }

  function assetHref(assetPath) {
    return `${isHtmlPage() ? '../' : ''}${assetPath}`;
  }

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
        accountButton.href = siteHref('index.html');
        accountButton.textContent = `Olá, ${firstName}`;
        accountButton.classList.add('bg-white/10');
        accountButton.classList.add('px-3');
      } else {
        accountButton.href = siteHref('cadastro.html');
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
    logoutButton?.addEventListener('click', async () => {
      try {
        const { supabase } = await import('./supabase-client.js');
        if (!supabase) {
          persistUser(null);
          checkAuthState();
          window.location.href = siteHref('index.html');
          return;
        }
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        persistUser(null);
        checkAuthState();
        window.location.href = siteHref('index.html');
      } catch (error) {
        console.error('Não foi possível encerrar a sessão:', error);
        window.alert(error.message || 'Não foi possível encerrar a sessão. Tente novamente.');
      }
    });
  }

  let drawerTrigger;

  function renderDrawer() {
    if (document.getElementById('drawer')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="overlay" class="overlay" aria-hidden="true"></div>
      <aside id="drawer" class="drawer" data-menu-state="categories" role="dialog" aria-modal="true" aria-labelledby="drawerTitle" aria-hidden="true" inert>
        <video class="drawer__video" autoplay muted loop playsinline preload="metadata" aria-hidden="true" tabindex="-1">
          <source src="${assetHref('img/videomenu.mp4')}" type="video/mp4">
        </video>
        <div class="menu-topbar">
          <a class="menu-brand" href="${siteHref('index.html')}" aria-label="Descomplica Direito, página inicial">
            <img class="menu-brand__image" src="${assetHref('img/logo-hero.png')}" alt="Descomplica Direito">
          </a>
          <button id="closeDrawer" class="drawer-close" type="button"><span>Fechar</span><span class="drawer-close__icon" aria-hidden="true">&times;</span></button>
        </div>
        <div class="menu-columns">
          <nav id="menuCategories" class="menu-categories" aria-label="Categorias principais"></nav>
          <section class="menu-listing" id="menuListing" aria-label="Itens da categoria" aria-hidden="true" inert>
            <p id="menuEyebrow" class="menu-eyebrow">Em foco</p>
            <p id="menuIntro" class="menu-intro"></p>
            <nav id="menuItems" class="menu-items" aria-label="Recursos disponíveis"></nav>
          </section>
          <section class="menu-feature" id="menuFeature" aria-label="Detalhes do recurso" aria-hidden="true" inert>
            <h2 id="menuFeatureTitle"></h2>
            <p id="menuFeatureDescription"></p>
            <a id="menuFeatureLink" class="menu-feature-link" href="#"><span class="menu-feature-arrow" aria-hidden="true">&rarr;</span><span id="menuFeatureAction"></span></a>
          </section>
        </div>
        <nav class="menu-quicklinks" aria-label="Links rápidos">
          <span class="menu-quicklinks__label">Links rápidos <span aria-hidden="true">&#8250;</span></span>
          <a href="${siteHref('dicionario.html')}">Dicionário de A a Z</a>
          <a href="${siteHref('advogados.html')}">Encontre um profissional</a>
          <a href="${siteHref('linha-tempo.html')}">Etapas de um processo</a>
          <a href="${siteHref('guia.html')}">Guia de direitos</a>
          <a href="${siteHref('cadastro.html')}">Acessar conta</a>
        </nav>
      </aside>
    `);

    renderMenuCategories();
  }

  function renderMenuCategories() {
    const categories = document.getElementById('menuCategories');
    if (!categories) return;

    categories.replaceChildren(...MENU_CATEGORIES.map((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `menu-category${index === activeCategoryIndex ? ' active' : ''}`;
      button.textContent = entry.title;
      button.setAttribute('aria-expanded', String(index === activeCategoryIndex));
      button.addEventListener('click', () => {
        activeCategoryIndex = index;
        activeMenuItemIndex = null;
        renderMenuCategories();
        renderMenuItems();
        setMenuStage('items');
        categories.children[index]?.focus();
      });
      return button;
    }));
  }

  function renderMenuItems() {
    const category = MENU_CATEGORIES[activeCategoryIndex];
    const items = document.getElementById('menuItems');
    if (!category || !items) return;

    document.getElementById('menuEyebrow').textContent = category.title;
    document.getElementById('menuIntro').textContent = category.intro;
    items.replaceChildren(...category.items.map(([, title], index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'menu-item';
      button.setAttribute('aria-pressed', 'false');
      const label = document.createElement('span');
      label.textContent = title;
      const chevron = document.createElement('span');
      chevron.className = 'menu-item__chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = '\u203a';
      button.append(label, chevron);
      button.addEventListener('click', () => {
        activeMenuItemIndex = index;
        items.querySelectorAll('.menu-item').forEach((menuItem, itemIndex) => {
          menuItem.classList.toggle('active', itemIndex === index);
          menuItem.setAttribute('aria-pressed', String(itemIndex === index));
        });
        updateMenuFeature();
        setMenuStage('detail');
      });
      return button;
    }));
  }

  function setMenuStage(stage) {
    const drawer = document.getElementById('drawer');
    const listing = document.getElementById('menuListing');
    const feature = document.getElementById('menuFeature');
    if (!drawer || !listing || !feature) return;

    drawer.dataset.menuState = stage;
    listing.setAttribute('aria-hidden', String(stage === 'categories'));
    listing.toggleAttribute('inert', stage === 'categories');
    feature.setAttribute('aria-hidden', String(stage !== 'detail'));
    feature.toggleAttribute('inert', stage !== 'detail');
  }

  function updateMenuFeature() {
    const category = MENU_CATEGORIES[activeCategoryIndex];
    if (!category || activeMenuItemIndex === null) return;
    const [href, title, description] = category.items[activeMenuItemIndex];
    document.getElementById('menuFeatureTitle').textContent = title;
    document.getElementById('menuFeatureDescription').textContent = description;
    document.getElementById('menuFeatureLink').href = siteHref(href);
    document.getElementById('menuFeatureAction').textContent = `Saiba mais sobre ${title.toLowerCase()}.`;
  }

  function setDrawerState(open, trigger) {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');

    if (!drawer || !overlay) {
      return;
    }

    drawer.classList.toggle('open', open);
    overlay.classList.toggle('show', open);
    document.body.classList.toggle('lock-scroll', open);
    document.documentElement.classList.toggle('lock-scroll', open);
    drawer.setAttribute('aria-hidden', String(!open));
    drawer.toggleAttribute('inert', !open);
    overlay.setAttribute('aria-hidden', String(!open));

    document.querySelectorAll('#menuToggle, #menuToggleMobile').forEach((button) => {
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-controls', 'drawer');
    });

    if (open) {
      activeCategoryIndex = null;
      activeMenuItemIndex = null;
      renderMenuCategories();
      setMenuStage('categories');
      drawerTrigger = trigger || document.activeElement;
      document.getElementById('closeDrawer')?.focus();
    } else if (drawerTrigger instanceof HTMLElement) {
      drawerTrigger.focus();
      drawerTrigger = null;
    }
  }

  function bindDrawer() {
    const drawer = document.getElementById('drawer');
    const openButtons = [
      document.getElementById('menuToggle'),
      document.getElementById('menuToggleMobile')
    ];
    const closeButton = document.getElementById('closeDrawer');
    const overlay = document.getElementById('overlay');

    openButtons.forEach((button) => {
      button?.addEventListener('click', () => setDrawerState(true, button));
    });

    closeButton?.addEventListener('click', () => setDrawerState(false));
    overlay?.addEventListener('click', () => setDrawerState(false));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setDrawerState(false);
        return;
      }

      if (event.key === 'Tab' && document.getElementById('drawer')?.classList.contains('open')) {
        const focusable = Array.from(document.querySelectorAll('#drawer a, #drawer button'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });

    drawer?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setDrawerState(false));
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
    renderDrawer();
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
