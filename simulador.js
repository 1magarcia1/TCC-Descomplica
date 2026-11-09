const costExamples = {
  danos: {
    title: 'Danos Morais',
    estimate: 'R$ 600,00 - R$ 3.000,00',
    items: [
      'Custas iniciais: valores para dar início ao processo, que variam conforme o tribunal e o valor da causa.',
      'Citação: custos para comunicar oficialmente a outra parte, por correio ou oficial de justiça.',
      'Honorários: combinados com o advogado; podem ser fixos, percentuais ou uma combinação dos dois.',
      'Perícia: pode ser necessária uma avaliação técnica, com custo variável.',
      'Recursos: recorrer de uma decisão pode gerar novas despesas.',
      'Sucumbência: dependendo do resultado e das regras aplicáveis, pode haver honorários devidos à outra parte.'
    ]
  },
  trabalhista: {
    title: 'Ação Trabalhista',
    estimate: 'R$ 0,00 inicial',
    items: [
      'Custos iniciais: podem não ser cobrados do trabalhador em determinadas situações; a gratuidade depende dos requisitos legais.',
      'Honorários do advogado: valor combinado com o profissional, podendo ser fixo, percentual ou ambos.',
      'Perícia: em casos como acidente ou doença do trabalho, pode ser necessária uma avaliação técnica.',
      'Recursos: recorrer da decisão pode gerar despesas conforme as regras do processo.',
      'Se perder o processo: podem existir honorários de sucumbência e outros custos, observadas as regras legais aplicáveis.',
      'Se ganhar o processo: a outra parte pode ser responsável por despesas e honorários, conforme a decisão.'
    ]
  },
  familia: {
    title: 'Divórcio Litigioso',
    estimate: 'R$ 0,00 ou até mais de R$ 20.000 + honorários',
    items: [
      'Custas: podem variar conforme o tribunal e o valor dos bens envolvidos.',
      'Honorários: cada parte combina os honorários de seu advogado; o valor pode ser fixo ou percentual.',
      'Perícia: pode ser necessária para avaliar bens, como imóveis, veículos ou empresas.',
      'Recursos: recorrer da decisão pode gerar novas despesas.',
      'Se perder o processo: pode haver responsabilidade por honorários da outra parte e despesas, conforme a decisão.',
      'Se ganhar o processo: a outra parte pode ser responsabilizada por parte das despesas e honorários.'
    ]
  },
  pequenas: {
    title: 'Pequenas Causas',
    estimate: 'R$ 0,00 inicial',
    items: [
      'Em muitos casos, não há cobrança para iniciar o processo no Juizado Especial; consulte as regras aplicáveis.',
      'A necessidade de advogado depende do valor e da etapa do processo.',
      'Perícia: pode ser solicitada em alguns casos.',
      'Recursos: podem existir taxas para recorrer da decisão.',
      'Se perder o processo: podem ser cobradas despesas e, em determinadas situações, honorários.',
      'Se ganhar o processo: a outra parte pode ser responsabilizada por despesas.',
      'Faltar a uma audiência sem justificativa pode gerar consequências.'
    ]
  },
  penal: {
    title: 'Processo Penal',
    estimate: 'Custos variáveis',
    items: [
      'Inquérito policial.',
      'Advogado particular ou atendimento pela Defensoria Pública, conforme o caso.',
      'Perícias técnicas.',
      'Custas e despesas podem variar conforme o procedimento.'
    ]
  },
  tributario: {
    title: 'Processo Tributário',
    estimate: 'Depende do imposto',
    items: [
      'Dívidas e cobranças do governo.',
      'Multas e juros.',
      'Defesa contra cobrança.',
      'Honorários de profissionais especializados.'
    ]
  },
  previdenciario: {
    title: 'Previdenciário',
    estimate: 'Sem custo inicial',
    items: [
      'Pedido de benefício junto ao INSS.',
      'Pode haver ação judicial se o pedido for negado.',
      'Perícia médica em determinados casos.',
      'Possível recebimento de valores atrasados, conforme a decisão.'
    ]
  },
  empresarial: {
    title: 'Empresarial',
    estimate: 'R$ 1.000 a R$ 10.000+',
    items: [
      'Honorários podem variar conforme o serviço e a complexidade.',
      'Custas podem depender do valor envolvido e do tribunal.',
      'Recuperação judicial.',
      'Documentação e análises especializadas.'
    ]
  },
  extrajudicial: {
    title: 'Extrajudicial',
    estimate: 'R$ 200 a R$ 2.000',
    items: [
      'Procedimentos realizados em cartório.',
      'Divórcio extrajudicial, quando os requisitos forem atendidos.',
      'Inventário extrajudicial, quando os requisitos forem atendidos.',
      'Pode ser uma alternativa com menos etapas judiciais.'
    ]
  }
};

const categoryButtons = Array.from(document.querySelectorAll('.cost-category'));
const resultPanel = document.getElementById('costResult');
const searchInput = document.getElementById('costSearch');
const searchEmpty = document.getElementById('costSearchEmpty');

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function filterCategories(query) {
  const normalizedQuery = normalizeText(query.trim());
  let visibleCount = 0;

  categoryButtons.forEach((button) => {
    const matches = normalizeText(button.textContent).includes(normalizedQuery);
    button.closest('li').hidden = !matches;
    if (matches) visibleCount += 1;
  });

  searchEmpty.classList.toggle('hidden', visibleCount > 0);
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function showCostExample(button) {
  const example = costExamples[button.dataset.category];
  if (!example) return;

  categoryButtons.forEach((categoryButton) => {
    const isActive = categoryButton === button;
    categoryButton.classList.toggle('border-crimson/20', isActive);
    categoryButton.classList.toggle('bg-crimson/5', isActive);
    categoryButton.setAttribute('aria-pressed', String(isActive));
  });

  const content = document.createElement('div');
  content.className = 'w-full max-w-3xl';
  content.append(createTextElement('h2', 'font-display text-3xl text-crimson', example.title));

  const estimateCard = document.createElement('div');
  estimateCard.className = 'my-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6';
  estimateCard.append(
    createTextElement('p', 'text-xs font-semibold uppercase tracking-wider text-gray-500', 'Estimativa de custo'),
    createTextElement('p', 'mt-2 font-display text-2xl font-bold text-graphite sm:text-3xl', example.estimate)
  );
  content.append(estimateCard);

  const topics = document.createElement('ul');
  topics.className = 'list-disc space-y-3 pl-5 text-sm leading-7 text-gray-700 sm:text-base';
  example.items.forEach((item) => topics.append(createTextElement('li', '', item)));
  content.append(topics);
  content.append(createTextElement(
    'p',
    'mt-6 text-center text-xs italic leading-5 text-gray-500',
    'Estimativa ilustrativa. Os valores reais dependem do caso, das regras do tribunal e dos honorários acordados.'
  ));

  resultPanel.replaceChildren(content);
}

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => showCostExample(button));
});

searchInput.addEventListener('input', (event) => {
  filterCategories(event.target.value);
});
