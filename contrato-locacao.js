const form = document.getElementById('leaseForm');
const preview = document.getElementById('contractPreview');
const previewStatus = document.getElementById('previewStatus');
const exportActions = document.getElementById('exportActions');
const formMessage = document.getElementById('formMessage');
const leaseTypeButtons = Array.from(document.querySelectorAll('.lease-type-btn'));
const endDateInput = form.elements.dataFim;
let leaseType = 'residencial';
let generatedContract = null;

function getFormData() {
  return Object.fromEntries(new FormData(form).entries());
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildContract(data) {
  const typeLabel = leaseType === 'residencial' ? 'RESIDENCIAL' : 'COMERCIAL';
  const useDescription = data.finalidade.trim();
  const guaranteeDetails = data.garantiaDetalhes.trim()
    ? ` Detalhes informados: ${data.garantiaDetalhes.trim()}.`
    : '';
  const expenseDescription = data.despesas.trim()
    ? data.despesas.trim()
    : 'As partes deverão registrar por escrito a responsabilidade por cada despesa incidente sobre o imóvel.';
  const commercialClause = leaseType === 'comercial'
    ? `A atividade comercial autorizada deverá observar as regras aplicáveis ao imóvel e as licenças necessárias, cuja obtenção caberá à parte responsável conforme a lei e o acordo entre as partes.`
    : `O imóvel será utilizado exclusivamente para moradia, vedada a alteração de finalidade sem concordância expressa do(a) LOCADOR(A).`;

  const paragraphs = [
    `Pelo presente instrumento, ${data.locadorNome.trim()}, inscrito(a) no CPF/CNPJ sob nº ${data.locadorDocumento.trim()}, com endereço em ${data.locadorEndereco.trim()}, doravante denominado(a) LOCADOR(A), e ${data.locatarioNome.trim()}, inscrito(a) no CPF/CNPJ sob nº ${data.locatarioDocumento.trim()}, com endereço em ${data.locatarioEndereco.trim()}, doravante denominado(a) LOCATÁRIO(A), ajustam esta locação ${typeLabel.toLowerCase()}, observada a legislação aplicável, especialmente a Lei nº 8.245/1991 quando pertinente.`,
    `CLÁUSULA 1 — IMÓVEL E DESTINAÇÃO\nO objeto da locação é o imóvel do tipo ${data.imovelTipo.trim()}, situado em ${data.imovelEndereco.trim()}. ${commercialClause} Finalidade informada: ${useDescription}.`,
    `CLÁUSULA 2 — PRAZO\nA locação terá início em ${formatDate(data.dataInicio)} e término em ${formatDate(data.dataFim)}. A prorrogação ou encerramento deverá observar a legislação aplicável e ser formalizada pelas partes quando necessário.`,
    `CLÁUSULA 3 — ALUGUEL E PAGAMENTO\nO aluguel mensal será de ${formatCurrency(data.aluguel)}, com vencimento no dia ${data.vencimento} de cada mês, por meio de ${data.pagamento.trim()}. O reajuste poderá ocorrer na periodicidade legalmente admitida, pelo índice ${data.indice} escolhido pelas partes, observadas as normas vigentes.`,
    `CLÁUSULA 4 — GARANTIA\nModalidade indicada pelas partes: ${data.garantia}.${guaranteeDetails} A constituição, os limites e a substituição de eventual garantia deverão observar a legislação aplicável e ser documentados pelas partes.`,
    `CLÁUSULA 5 — DESPESAS E ENCARGOS\n${expenseDescription}`,
    `CLÁUSULA 6 — CONSERVAÇÃO E ENTREGA\nO(A) LOCATÁRIO(A) deverá zelar pelo imóvel e comunicar ao(à) LOCADOR(A) ocorrências que exijam providências de sua responsabilidade. Ao final da locação, o imóvel será restituído conforme o estado registrado na entrega, ressalvado o desgaste decorrente do uso regular.`,
    `CLÁUSULA 7 — ENCERRAMENTO ANTECIPADO\nA rescisão antecipada e eventual multa deverão observar a legislação aplicável e as condições acordadas entre as partes. Para fins de minuta, as partes indicam o percentual de ${data.multa}%; antes da assinatura, devem definir expressamente a base de cálculo e a proporcionalidade aplicáveis.`,
    `CLÁUSULA 8 — DISPOSIÇÕES FINAIS\nAs partes declaram que leram e compreenderam as condições deste instrumento. Qualquer ajuste deverá ser registrado por escrito. Fica indicado o foro da comarca de ${data.foro.trim()}, respeitadas as regras legais de competência.`
  ];

  const signatures = [
    `${data.foro.trim()}, ____ de __________________ de ______.`,
    `LOCADOR(A): ${data.locadorNome.trim()}\nCPF/CNPJ: ${data.locadorDocumento.trim()}`,
    `LOCATÁRIO(A): ${data.locatarioNome.trim()}\nCPF/CNPJ: ${data.locatarioDocumento.trim()}`,
    'TESTEMUNHA 1: ______________________________  CPF: ____________________',
    'TESTEMUNHA 2: ______________________________  CPF: ____________________'
  ];

  return {
    title: `CONTRATO DE LOCAÇÃO ${typeLabel} DE IMÓVEL`,
    paragraphs,
    signatures
  };
}

function renderContract(contract) {
  preview.replaceChildren();

  const title = document.createElement('h2');
  title.className = 'contract-title';
  title.textContent = contract.title;
  preview.append(title);

  contract.paragraphs.forEach((text) => {
    const paragraph = document.createElement('p');
    paragraph.className = 'contract-paragraph';
    paragraph.textContent = text;
    preview.append(paragraph);
  });

  const signatureBlock = document.createElement('div');
  signatureBlock.className = 'contract-signatures';
  contract.signatures.forEach((text) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    signatureBlock.append(paragraph);
  });
  preview.append(signatureBlock);
  previewStatus.textContent = 'Prévia gerada';
  exportActions.hidden = false;
}

function contractAsText() {
  return [generatedContract.title, ...generatedContract.paragraphs, ...generatedContract.signatures].join('\n\n');
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function setLeaseType(type) {
  leaseType = type;
  leaseTypeButtons.forEach((button) => {
    const isActive = button.dataset.leaseType === type;
    button.classList.toggle('border-crimson', isActive);
    button.classList.toggle('bg-crimson', isActive);
    button.classList.toggle('text-white', isActive);
    button.classList.toggle('border-gray-300', !isActive);
    button.classList.toggle('bg-white', !isActive);
    button.classList.toggle('text-graphite', !isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  const purposeLabel = document.querySelector('#purposeField');
  const purposeInput = form.elements.finalidade;
  const isCommercial = type === 'comercial';
  purposeLabel.firstChild.textContent = isCommercial ? 'Atividade comercial' : 'Uso residencial';
  purposeInput.placeholder = isCommercial ? 'Ex.: escritório, loja, consultório' : 'Moradia';
  purposeInput.value = isCommercial ? '' : 'Moradia';
  purposeInput.required = true;
  generatedContract = null;
  preview.replaceChildren();
  const emptyState = document.createElement('div');
  emptyState.className = 'contract-empty';
  emptyState.textContent = 'Preencha os dados e selecione Gerar prévia para visualizar a minuta.';
  preview.append(emptyState);
  previewStatus.textContent = 'Aguardando preenchimento';
  exportActions.hidden = true;
  formMessage.textContent = '';
}

leaseTypeButtons.forEach((button) => {
  button.addEventListener('click', () => setLeaseType(button.dataset.leaseType));
});

endDateInput.addEventListener('input', () => endDateInput.setCustomValidity(''));
form.elements.dataInicio.addEventListener('input', () => endDateInput.setCustomValidity(''));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formMessage.textContent = '';

  if (!form.reportValidity()) {
    return;
  }

  if (new Date(endDateInput.value) <= new Date(form.elements.dataInicio.value)) {
    endDateInput.setCustomValidity('A data final deve ser posterior à data inicial.');
    endDateInput.reportValidity();
    return;
  }

  generatedContract = buildContract(getFormData());
  renderContract(generatedContract);
  formMessage.textContent = 'Prévia pronta. Revise todos os dados antes de exportar ou assinar.';
});

document.getElementById('copyContract').addEventListener('click', async () => {
  if (!generatedContract) return;
  try {
    await navigator.clipboard.writeText(contractAsText());
    formMessage.textContent = 'Texto do contrato copiado.';
  } catch (error) {
    console.error('Não foi possível copiar o contrato:', error);
    formMessage.textContent = 'Não foi possível copiar automaticamente. Selecione e copie o texto da prévia.';
  }
});

document.getElementById('wordContract').addEventListener('click', () => {
  if (!generatedContract) return;
  const content = [generatedContract.title, ...generatedContract.paragraphs, ...generatedContract.signatures]
    .map((paragraph, index) => `<p${index === 0 ? ' class="title"' : ''}>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const documentHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.6;margin:2.5cm}p{white-space:normal;margin:0 0 16px}.title{text-align:center;font-weight:bold;font-size:16pt;margin-bottom:28px}</style></head><body>${content}</body></html>`;
  const file = new Blob(['\ufeff', documentHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `contrato-locacao-${leaseType}.doc`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.getElementById('pdfContract').addEventListener('click', () => {
  if (!generatedContract) return;
  window.print();
});

form.addEventListener('reset', () => {
  window.setTimeout(() => {
    setLeaseType('residencial');
    form.elements.finalidade.value = 'Moradia';
    generatedContract = null;
    previewStatus.textContent = 'Aguardando preenchimento';
    exportActions.hidden = true;
    formMessage.textContent = '';
  });
});
