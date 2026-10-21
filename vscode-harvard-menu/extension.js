const vscode = require('vscode');

function activate(context) {
  const command = vscode.commands.registerCommand('descomplicaMenu.open', () => {
    const panel = vscode.window.createWebviewPanel(
      'descomplicaMenu',
      'Descomplica Direito | Navegação',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent(panel.webview);
    panel.webview.onDidReceiveMessage((message) => {
      if (message.command === 'close') {
        panel.dispose();
      } else if (message.command === 'selectCategory' && typeof message.text === 'string') {
        vscode.window.showInformationMessage(`Você selecionou: ${message.text}`);
      }
    }, undefined, context.subscriptions);
  });

  context.subscriptions.push(command);
}

function getWebviewContent(webview) {
  const nonce = getNonce();
  const cspSource = webview.cspSource;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Descomplica Direito | Navegação</title>
  <style>
    :root {
      color-scheme: dark;
      --ink: #101010;
      --muted: #9aa0a3;
      --white: #f6f4f0;
      --red: #8f2638;
      --line: rgba(255, 255, 255, .12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-width: 320px;
      min-height: 100vh;
      overflow: hidden;
      color: var(--white);
      background: #111;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    button { color: inherit; font: inherit; }
    .menu {
      min-height: 100vh;
      display: grid;
      grid-template-rows: 64px minmax(0, 1fr) 76px;
      background:
        linear-gradient(90deg, rgba(9, 9, 9, .97), rgba(9, 9, 9, .88)),
        radial-gradient(ellipse at 68% 55%, rgba(100, 49, 37, .38), transparent 55%),
        repeating-linear-gradient(0deg, transparent 0 58px, rgba(255,255,255,.025) 59px 60px);
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 30px;
      border-bottom: 1px solid rgba(255,255,255,.06);
      background: rgba(8,8,8,.72);
      backdrop-filter: blur(16px);
    }
    .brand { display: inline-flex; align-items: center; gap: 12px; color: var(--white); text-decoration: none; }
    .brand-mark {
      display: grid;
      width: 34px;
      height: 40px;
      place-items: center;
      background: var(--red);
      border: 1px solid rgba(255,255,255,.35);
      font-family: Georgia, serif;
      font-size: 18px;
    }
    .brand-name { font: 20px/1 Georgia, serif; letter-spacing: 1.8px; }
    .brand-subtitle { display: block; margin-top: 4px; font: 10px/1.2 Georgia, serif; letter-spacing: 2px; text-align: center; }
    .close {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      border: 0;
      background: transparent;
      font-weight: 650;
      cursor: pointer;
    }
    .close-icon {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255,255,255,.36);
      border-radius: 50%;
      font-size: 24px;
      line-height: 1;
      background: rgba(255,255,255,.03);
    }
    .close:hover .close-icon, .close:focus-visible .close-icon { background: rgba(255,255,255,.17); }
    .columns { display: grid; min-height: 0; grid-template-columns: minmax(225px, 25%) minmax(270px, 29%) minmax(320px, 1fr); }
    .column { min-width: 0; overflow: auto; scrollbar-color: #555 transparent; scrollbar-width: thin; }
    .categories { padding: 20px 26px 24px 30px; border-right: 1px solid var(--line); }
    .category {
      display: block;
      width: 100%;
      padding: 8px 0;
      border: 0;
      background: transparent;
      color: #81888b;
      text-align: left;
      font: clamp(30px, 4.2vw, 54px)/1.24 Georgia, "Times New Roman", serif;
      cursor: pointer;
      transition: color .2s ease, padding .2s ease;
    }
    .category:hover { color: #c2c6c7; }
    .category.active { color: var(--white); text-decoration: underline; text-underline-offset: 8px; padding-left: 3px; }
    .listing { padding: 52px 38px 32px; border-right: 1px solid var(--line); }
    .eyebrow { margin: 0 0 14px; color: #b6bec0; font-size: 12px; font-weight: 750; letter-spacing: 1.6px; text-transform: uppercase; }
    .intro { margin: 0 0 22px; color: #f0eeee; font-size: 15px; line-height: 1.65; }
    .item-list { display: grid; gap: 2px; }
    .item {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 0;
      border: 0;
      background: transparent;
      color: #929a9d;
      text-align: left;
      font-size: 18px;
      font-weight: 720;
      line-height: 1.45;
      cursor: pointer;
      transition: color .18s ease;
    }
    .item:hover, .item.active { color: #fff; }
    .chevron { color: #8b969a; font-size: 25px; font-weight: 400; }
    .feature { padding: 85px clamp(36px, 5vw, 76px) 32px; }
    .feature h1 { max-width: 660px; margin: 0 0 12px; font-size: clamp(22px, 2vw, 29px); line-height: 1.25; }
    .feature p { max-width: 680px; margin: 0; color: #ededeb; font-size: 16px; font-weight: 560; line-height: 1.7; }
    .feature-link { display: inline-flex; align-items: center; gap: 12px; margin-top: 24px; padding: 0; border: 0; background: transparent; color: #fff; font-weight: 700; cursor: pointer; }
    .arrow-circle { display: grid; width: 38px; height: 38px; flex: none; place-items: center; border-radius: 50%; background: #68747a; font-size: 23px; transition: transform .18s ease, background .18s ease; }
    .feature-link:hover .arrow-circle { transform: translateX(4px); background: var(--red); }
    .quicklinks {
      display: flex;
      align-items: center;
      gap: clamp(18px, 2.6vw, 40px);
      overflow-x: auto;
      padding: 0 30px;
      border-top: 1px solid rgba(255,255,255,.2);
      background: rgba(8,8,8,.78);
      backdrop-filter: blur(14px);
      white-space: nowrap;
      scrollbar-width: thin;
    }
    .quicklinks-label { color: #96b2c8; }
    .quicklink { padding: 12px 0; border: 0; background: transparent; color: white; font-weight: 700; cursor: pointer; }
    .quicklink:hover { color: #d9b4b8; }
    button:focus-visible { outline: 2px solid #e6b8be; outline-offset: 4px; }
    @media (max-width: 850px) {
      body { overflow: auto; }
      .menu { min-height: 100vh; grid-template-rows: 62px auto auto; }
      .columns { grid-template-columns: minmax(150px, 36%) minmax(0, 1fr); }
      .categories { padding: 16px 18px; }
      .category { font-size: clamp(27px, 7vw, 42px); }
      .listing { padding: 30px 24px; border-right: 0; }
      .feature { grid-column: 1 / -1; padding: 30px 24px 42px; border-top: 1px solid var(--line); }
      .quicklinks { min-height: 68px; }
    }
    @media (max-width: 520px) {
      .topbar { padding: 0 16px; }
      .brand-name { font-size: 16px; }
      .close { gap: 8px; }
      .columns { grid-template-columns: 1fr; }
      .categories { display: flex; gap: 22px; overflow-x: auto; padding: 10px 16px; border-right: 0; border-bottom: 1px solid var(--line); }
      .category { width: auto; flex: none; padding: 6px 0; font-size: 25px; }
      .listing { padding: 24px 20px; }
      .feature { padding: 25px 20px 34px; }
      .quicklinks { gap: 24px; padding: 0 18px; }
    }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: .01ms !important; scroll-behavior: auto !important; } }
  </style>
</head>
<body>
  <main class="menu" aria-label="Menu de navegação Descomplica Direito">
    <header class="topbar">
      <div class="brand" aria-label="Descomplica Direito">
        <span class="brand-mark" aria-hidden="true">D</span>
        <span><span class="brand-name">DESCOMPLICA</span><span class="brand-subtitle">DIREITO</span></span>
      </div>
      <button class="close" id="closeMenu" type="button"><span>Fechar</span><span class="close-icon" aria-hidden="true">×</span></button>
    </header>
    <section class="columns">
      <nav class="column categories" id="categories" aria-label="Categorias principais"></nav>
      <section class="column listing" aria-label="Itens da categoria">
        <p class="eyebrow" id="sectionLabel">Em foco</p>
        <p class="intro" id="sectionIntro"></p>
        <div class="item-list" id="itemList"></div>
      </section>
      <section class="column feature" aria-live="polite" aria-atomic="true">
        <h1 id="featureTitle"></h1>
        <p id="featureDescription"></p>
        <button class="feature-link" id="featureAction" type="button"><span class="arrow-circle" aria-hidden="true">→</span><span id="featureActionText"></span></button>
      </section>
    </section>
    <nav class="quicklinks" aria-label="Links rápidos">
      <span class="quicklinks-label">Links rápidos　›</span>
      <button class="quicklink" type="button" data-quicklink="Dicionário Jurídico">Dicionário A a Z</button>
      <button class="quicklink" type="button" data-quicklink="Advogados Parceiros">Encontre um profissional</button>
      <button class="quicklink" type="button" data-quicklink="Linha do Tempo Jurídica">Etapas de um processo</button>
      <button class="quicklink" type="button" data-quicklink="Guia de Direitos">Guia de direitos</button>
      <button class="quicklink" type="button" data-quicklink="Cadastro / Login">Acessar conta</button>
    </nav>
  </main>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const menuData = [
      { name: 'Ferramentas', intro: 'Acesse recursos práticos para compreender e organizar questões jurídicas.', items: [
        { title: 'Tradutor de Juridiquês', description: 'Transforme textos jurídicos complexos em explicações mais claras, com indicadores de leitura e consulta rápida de termos.', action: 'Abrir o tradutor de juridiquês' },
        { title: 'Dicionário Jurídico', description: 'Consulte definições, contextos, exemplos e termos relacionados em um glossário pensado para leitura simples.', action: 'Consultar o dicionário jurídico' },
        { title: 'Gerador de Documentos', description: 'Preencha informações básicas para criar modelos iniciais de documentos e declarações.', action: 'Conhecer o gerador de documentos' },
        { title: 'Simulador de Custos', description: 'Faça uma estimativa inicial de custos com base no tipo de ação, valor, renda e complexidade.', action: 'Usar o simulador de custos' }
      ]},
      { name: 'Conteúdos', intro: 'Informação jurídica organizada para ajudar você a entender seus direitos e os próximos passos.', items: [
        { title: 'Guia de Direitos', description: 'Explore orientações introdutórias sobre trabalho, consumo, família, direitos da pessoa idosa e educação.', action: 'Explorar o guia de direitos' },
        { title: 'Linha do Tempo Jurídica', description: 'Conheça as principais etapas de um processo judicial, do início ao encerramento.', action: 'Ver as etapas de um processo' },
        { title: 'Dicionário Jurídico', description: 'Encontre o significado de expressões jurídicas com explicações, exemplos e contexto.', action: 'Pesquisar um termo jurídico' }
      ]},
      { name: 'Portal', intro: 'Conheça as áreas e os recursos disponíveis no Descomplica Direito.', items: [
        { title: 'Página Inicial', description: 'Volte ao portal para encontrar ferramentas, conteúdos em destaque e informações institucionais.', action: 'Ir para a página inicial' },
        { title: 'Advogados Parceiros', description: 'Consulte perfis de profissionais e áreas de atuação para buscar orientação inicial.', action: 'Encontrar um profissional' },
        { title: 'Sobre o Projeto', description: 'O Descomplica Direito aproxima informação jurídica e linguagem acessível.', action: 'Conhecer o projeto' }
      ]},
      { name: 'Conta', intro: 'Entre ou crie uma conta para acessar as opções de cadastro do portal.', items: [
        { title: 'Cadastro / Login', description: 'Acesse sua conta ou inicie seu cadastro no Descomplica Direito.', action: 'Acessar cadastro e login' }
      ]}
    ];
    let selectedCategory = 0;
    let selectedItem = 0;

    function selectCategory(index) {
      selectedCategory = index;
      selectedItem = 0;
      renderMenu();
    }

    function selectItem(index) {
      selectedItem = index;
      renderMenu();
    }

    function renderMenu() {
      const categories = document.getElementById('categories');
      const data = menuData[selectedCategory];
      categories.replaceChildren(...menuData.map((category, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `category${index === selectedCategory ? ' active' : ''}`;
        button.textContent = category.name;
        button.setAttribute('aria-current', index === selectedCategory ? 'true' : 'false');
        button.addEventListener('click', () => selectCategory(index));
        return button;
      }));

      document.getElementById('sectionLabel').textContent = selectedCategory === 0 ? 'Em foco' : data.name;
      document.getElementById('sectionIntro').textContent = data.intro;
      const itemList = document.getElementById('itemList');
      itemList.replaceChildren(...data.items.map((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `item${index === selectedItem ? ' active' : ''}`;
        button.innerHTML = `<span>${item.title}</span><span class="chevron" aria-hidden="true">›</span>`;
        button.setAttribute('aria-current', index === selectedItem ? 'true' : 'false');
        button.addEventListener('click', () => selectItem(index));
        return button;
      }));

      const item = data.items[selectedItem];
      document.getElementById('featureTitle').textContent = item.title;
      document.getElementById('featureDescription').textContent = item.description;
      document.getElementById('featureActionText').textContent = item.action;
      document.getElementById('featureAction').onclick = () => vscode.postMessage({ command: 'selectCategory', text: item.title });
    }

    document.getElementById('closeMenu').addEventListener('click', () => vscode.postMessage({ command: 'close' }));
    document.querySelectorAll('[data-quicklink]').forEach((button) => {
      button.addEventListener('click', () => vscode.postMessage({ command: 'selectCategory', text: button.dataset.quicklink }));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') vscode.postMessage({ command: 'close' });
    });
    renderMenu();
  </script>
</body>
</html>`;
}

function getNonce() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let index = 0; index < 32; index += 1) {
    nonce += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return nonce;
}

function deactivate() {}

module.exports = { activate, deactivate };
