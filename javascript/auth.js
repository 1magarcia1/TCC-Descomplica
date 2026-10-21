import { isSupabaseConfigured, supabase } from './supabase-client.js';

const USER_STORAGE_KEY = 'descomplicaCurrentUser';
const PENDING_AVATAR_KEY = 'descomplicaPendingProfessionalAvatar';

const formMessage = document.getElementById('formMessage');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const recoverForm = document.getElementById('recoverForm');
const newPasswordForm = document.getElementById('newPasswordForm');
const professionalFields = document.getElementById('professionalFields');
const accountRole = document.getElementById('accountRole');
const avatarInput = document.getElementById('avatar');
const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));

function setMessage(message, state = 'info') {
  formMessage.textContent = message;
  formMessage.dataset.state = state;
}

function setBusy(form, busy) {
  form.querySelectorAll('button[type="submit"]').forEach((button) => {
    button.disabled = busy;
    button.setAttribute('aria-busy', String(busy));
  });
}

function updateRoleFields() {
  const isProfessional = accountRole.value === 'professional';
  professionalFields.classList.toggle('hidden', !isProfessional);
  professionalFields.querySelectorAll('input, textarea').forEach((field) => {
    field.disabled = !isProfessional;
    field.required = isProfessional && field.id !== 'avatar' && field.id !== 'bio';
  });
  avatarInput.required = isProfessional;
}

function showTab(tabName) {
  const isRegister = tabName === 'register';
  loginForm.classList.toggle('hidden', isRegister);
  registerForm.classList.toggle('hidden', !isRegister);
  recoverForm.classList.add('hidden');
  newPasswordForm.classList.add('hidden');
  tabButtons.forEach((button) => {
    const active = button.dataset.tab === tabName;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  setMessage(isRegister
    ? 'Cadastre-se como cliente ou profissional do Direito.'
    : 'Entre com o e-mail e a senha da sua conta.');
}

function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
  document.cookie = `${USER_STORAGE_KEY}=; Max-Age=0; path=/`;
}

function saveCurrentUser(profile) {
  const user = {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  document.cookie = `${USER_STORAGE_KEY}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; samesite=lax`;
  window.checkAuthState?.();
}

async function readAvatarAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(new Error('Não foi possível ler a foto selecionada.')));
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl, type, name) {
  const encoded = dataUrl.split(',')[1];
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new File([bytes], name, { type });
}

async function uploadProfessionalAvatar(user, file) {
  const extension = file.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `${user.id}/profile.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from('professional-avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('professional-avatars').getPublicUrl(path);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', user.id);

  if (updateError) throw updateError;
}

async function uploadPendingAvatar(user) {
  const pending = sessionStorage.getItem(PENDING_AVATAR_KEY);
  if (!pending) return;

  let avatar;
  try {
    avatar = JSON.parse(pending);
  } catch (error) {
    sessionStorage.removeItem(PENDING_AVATAR_KEY);
    console.error('Foto temporária inválida; removendo a cópia local.', error);
    return;
  }

  if (avatar.email !== user.email) return;
  await uploadProfessionalAvatar(
    user,
    dataUrlToFile(avatar.dataUrl, avatar.type, 'profile')
  );
  sessionStorage.removeItem(PENDING_AVATAR_KEY);
}

async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('A conta foi autenticada, mas o perfil não foi localizado.');
  return data;
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => showTab(button.dataset.tab));
});

accountRole.addEventListener('change', updateRoleFields);
updateRoleFields();

document.getElementById('showRecoveryBtn').addEventListener('click', () => {
  recoverForm.classList.toggle('hidden');
});

newPasswordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isSupabaseConfigured) {
    setMessage('A alteração de senha ainda não está configurada.', 'error');
    return;
  }

  setBusy(newPasswordForm, true);
  const password = document.getElementById('newPassword').value;
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    newPasswordForm.reset();
    newPasswordForm.classList.add('hidden');
    window.history.replaceState(null, '', window.location.pathname);
    clearStoredUser();
    window.checkAuthState?.();
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setMessage(`Senha atualizada. Não foi possível encerrar a sessão automaticamente: ${signOutError.message}`, 'error');
      return;
    }
    setMessage('Sua senha foi atualizada. Entre novamente com a nova senha.', 'success');
  } catch (error) {
    console.error('Falha ao atualizar a senha:', error);
    setMessage(error.message || 'Não foi possível atualizar sua senha.', 'error');
  } finally {
    setBusy(newPasswordForm, false);
  }
});

if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY' || new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery') {
      newPasswordForm.classList.remove('hidden');
      recoverForm.classList.add('hidden');
      loginForm.classList.add('hidden');
      registerForm.classList.add('hidden');
      setMessage('Defina uma nova senha para sua conta.');
    }
  });
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isSupabaseConfigured) {
    setMessage('O acesso ainda não está configurado. O administrador precisa conectar este site ao projeto Supabase.', 'error');
    return;
  }

  setBusy(loginForm, true);
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const profile = await loadProfile(data.user.id);
    await uploadPendingAvatar(data.user);
    saveCurrentUser(profile);
    window.location.href = profile.role === 'professional' ? 'mensagens.html' : 'advogados.html';
  } catch (error) {
    console.error('Falha ao entrar na conta:', error);
    setMessage(error.message || 'Não foi possível entrar. Confira os dados e tente novamente.', 'error');
  } finally {
    setBusy(loginForm, false);
  }
});

recoverForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isSupabaseConfigured) {
    setMessage('A recuperação de senha ainda não está configurada.', 'error');
    return;
  }

  setBusy(recoverForm, true);
  const email = document.getElementById('recoverEmail').value.trim();

  try {
    const redirectTo = new URL('cadastro.html', window.location.href).href;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    setMessage('Se houver uma conta para esse e-mail, você receberá um link de recuperação.', 'success');
    recoverForm.reset();
  } catch (error) {
    console.error('Falha ao solicitar recuperação de senha:', error);
    setMessage(error.message || 'Não foi possível enviar o link de recuperação.', 'error');
  } finally {
    setBusy(recoverForm, false);
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isSupabaseConfigured) {
    setMessage('O cadastro ainda não está configurado. O administrador precisa conectar este site ao projeto Supabase.', 'error');
    return;
  }

  const role = accountRole.value;
  const avatar = avatarInput.files[0];
  if (role === 'professional' && (!avatar || avatar.size > 1024 * 1024)) {
    setMessage('Selecione uma foto de até 1 MB para o perfil profissional.', 'error');
    return;
  }

  if (avatar && !['image/jpeg', 'image/png', 'image/webp'].includes(avatar.type)) {
    setMessage('A foto precisa estar no formato JPG, PNG ou WebP.', 'error');
    return;
  }

  setBusy(registerForm, true);
  const email = document.getElementById('registerEmail').value.trim().toLowerCase();
  const password = document.getElementById('registerPassword').value;

  try {
    let avatarDataUrl = null;
    if (avatar) avatarDataUrl = await readAvatarAsDataUrl(avatar);

    const metadata = {
      role,
      full_name: document.getElementById('name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      address: role === 'professional' ? document.getElementById('address').value.trim() : '',
      registration_number: role === 'professional' ? document.getElementById('registrationNumber').value.trim() : '',
      specialty: role === 'professional' ? document.getElementById('specialty').value.trim() : '',
      bio: role === 'professional' ? document.getElementById('bio').value.trim() : '',
      avatar_url: ''
    };

    const redirectTo = new URL('index.html', window.location.href).href;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata, emailRedirectTo: redirectTo }
    });
    if (error) throw error;

    if (!data.user) throw new Error('O Supabase não retornou a conta criada.');

    if (!data.session) {
      if (avatarDataUrl) {
        sessionStorage.setItem(PENDING_AVATAR_KEY, JSON.stringify({
          email,
          dataUrl: avatarDataUrl,
          type: avatar.type
        }));
      }
      registerForm.reset();
      updateRoleFields();
      setMessage('Cadastro iniciado. Confirme seu e-mail e depois entre na conta para continuar.', 'success');
      return;
    }

    if (avatar) await uploadProfessionalAvatar(data.user, avatar);
    const profile = await loadProfile(data.user.id);
    saveCurrentUser(profile);
    window.location.href = role === 'professional' ? 'mensagens.html' : 'advogados.html';
  } catch (error) {
    console.error('Falha ao criar conta:', error);
    setMessage(error.message || 'Não foi possível concluir o cadastro. Confira os dados e tente novamente.', 'error');
  } finally {
    setBusy(registerForm, false);
  }
});

if (!isSupabaseConfigured) {
  setMessage('Integração pendente: configure a URL do projeto e a chave publicável do Supabase para habilitar contas e mensagens.', 'error');
}
