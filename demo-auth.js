const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const recoverForm = document.getElementById('recoverForm');
const newPasswordForm = document.getElementById('newPasswordForm');
const accountHeading = document.getElementById('accountHeading');
const formMessage = document.getElementById('formMessage');
const accountRole = document.getElementById('accountRole');
const professionalFields = document.getElementById('professionalFields');
const avatarInput = document.getElementById('avatar');
const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));

function setMessage(message, state = 'info') {
  formMessage.textContent = message;
  formMessage.dataset.state = state;
}

function showTab(tabName) {
  const isRegister = tabName === 'register';
  loginForm.classList.toggle('hidden', isRegister);
  registerForm.classList.toggle('hidden', !isRegister);
  recoverForm.classList.add('hidden');
  newPasswordForm.classList.add('hidden');
  accountHeading.textContent = isRegister ? 'Crie sua conta' : 'Acesse sua conta';
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });
  setMessage(isRegister
    ? 'Demonstração: preencha o formulário para visualizar o fluxo de cadastro.'
    : 'Demonstração: preencha os campos para visualizar o fluxo de entrada.');
}

function updateRoleFields() {
  const isProfessional = accountRole.value === 'professional';
  professionalFields.classList.toggle('hidden', !isProfessional);
  professionalFields.querySelectorAll('input, textarea').forEach((field) => {
    field.disabled = !isProfessional;
    field.required = isProfessional && field.id !== 'avatar' && field.id !== 'bio';
  });
  avatarInput.required = false;
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => showTab(button.dataset.tab));
});

accountRole.addEventListener('change', updateRoleFields);
updateRoleFields();

document.getElementById('showRecoveryBtn').addEventListener('click', () => {
  recoverForm.classList.toggle('hidden');
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  setMessage('Demonstração concluída: o acesso não foi realizado e nenhum dado foi enviado ou salvo.', 'success');
});

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (document.getElementById('registerPassword').value !== document.getElementById('confirmPassword').value) {
    setMessage('As senhas de exemplo não coincidem. Confira os campos.', 'error');
    document.getElementById('confirmPassword').focus();
    return;
  }
  setMessage('Demonstração concluída: nenhuma conta foi criada e nenhum dado foi enviado ou salvo.', 'success');
});

recoverForm.addEventListener('submit', (event) => {
  event.preventDefault();
  setMessage('Demonstração: a recuperação de senha não envia e-mails.', 'success');
});
