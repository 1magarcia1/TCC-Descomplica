import { isSupabaseConfigured, supabase } from './supabase-client.js';

const list = document.getElementById('professionalList');
const status = document.getElementById('directoryMessage');
const search = document.getElementById('professionalSearch');
const signInPrompt = document.getElementById('directorySignIn');
let professionals = [];
let currentUser = null;

function textElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toLocaleUpperCase('pt-BR');
}

function professionalCard(profile) {
  const card = document.createElement('article');
  card.className = 'professional-card soft-card rounded-2xl p-6';
  card.dataset.searchText = [
    profile.full_name,
    profile.specialty,
    profile.address
  ].join(' ').toLocaleLowerCase('pt-BR');

  const identity = document.createElement('div');
  identity.className = 'flex items-center gap-4';
  if (profile.avatar_url) {
    const avatar = document.createElement('img');
    avatar.className = 'professional-card__avatar';
    avatar.src = profile.avatar_url;
    avatar.alt = `Foto de ${profile.full_name}`;
    avatar.loading = 'lazy';
    identity.append(avatar);
  } else {
    identity.append(textElement('div', 'professional-card__initials', initials(profile.full_name)));
  }

  const heading = document.createElement('div');
  heading.append(
    textElement('h2', 'font-display text-xl text-graphite', profile.full_name),
    textElement('p', 'mt-1 text-sm text-gray-600', profile.specialty || 'Área de atuação não informada')
  );
  identity.append(heading);
  card.append(identity);

  const details = document.createElement('div');
  details.className = 'mt-5 flex-1 space-y-2 text-sm text-gray-700';
  details.append(textElement('p', '', `Registro informado: ${profile.registration_number || 'não informado'}`));
  if (profile.address) details.append(textElement('p', '', `Endereço: ${profile.address}`));
  if (profile.phone) {
    const phoneLink = document.createElement('a');
    phoneLink.className = 'block break-words text-crimson underline underline-offset-2';
    phoneLink.href = `tel:${profile.phone.replace(/[^\d+]/g, '')}`;
    phoneLink.textContent = `Celular: ${profile.phone}`;
    details.append(phoneLink);
  }
  if (profile.bio) details.append(textElement('p', 'pt-2 leading-6', profile.bio));
  details.append(textElement('p', 'pt-2 text-xs text-gray-500', 'O registro informado pelo perfil não foi verificado pela plataforma.'));
  card.append(details);

  if (currentUser.role === 'client') {
    const contact = textElement('button', 'account-submit mt-5', 'Iniciar conversa privada');
    contact.type = 'button';
    contact.addEventListener('click', () => startConversation(profile.id, contact));
    card.append(contact);
  }
  return card;
}

function renderProfessionals() {
  const query = search.value.trim().toLocaleLowerCase('pt-BR');
  const matches = professionals.filter((profile) => {
    const searchText = [profile.full_name, profile.specialty, profile.address]
      .join(' ')
      .toLocaleLowerCase('pt-BR');
    return searchText.includes(query);
  });

  list.replaceChildren(...matches.map(professionalCard));
  if (!matches.length) {
    status.textContent = professionals.length
      ? 'Nenhum profissional corresponde à busca.'
      : 'Ainda não há profissionais cadastrados no diretório.';
  } else {
    status.textContent = `${matches.length} profissional(is) encontrado(s).`;
  }
}

async function startConversation(professionalId, button) {
  button.disabled = true;
  button.textContent = 'Abrindo conversa...';
  try {
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('id')
      .eq('client_id', currentUser.id)
      .eq('professional_id', professionalId)
      .maybeSingle();
    if (findError) throw findError;

    let conversationId = existing?.id;
    if (!conversationId) {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ client_id: currentUser.id, professional_id: professionalId })
        .select('id')
        .single();
      if (error) {
        if (error.code !== '23505') throw error;
        const { data: duplicate, error: duplicateError } = await supabase
          .from('conversations')
          .select('id')
          .eq('client_id', currentUser.id)
          .eq('professional_id', professionalId)
          .single();
        if (duplicateError) throw duplicateError;
        conversationId = duplicate.id;
      } else {
        conversationId = data.id;
      }
    }

    window.location.href = `mensagens.html?conversation=${encodeURIComponent(conversationId)}`;
  } catch (error) {
    console.error('Falha ao iniciar conversa:', error);
    status.textContent = error.message || 'Não foi possível iniciar a conversa. Tente novamente.';
    button.disabled = false;
    button.textContent = 'Iniciar conversa privada';
  }
}

search.addEventListener('input', renderProfessionals);

async function initializeDirectory() {
  if (!isSupabaseConfigured) {
    status.textContent = 'O diretório ainda não está conectado ao Supabase. Configure a URL do projeto e a chave publicável.';
    return;
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) {
      status.textContent = 'Entre como cliente para consultar profissionais e iniciar uma conversa privada.';
      signInPrompt.classList.remove('hidden');
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userData.user.id)
      .single();
    if (profileError) throw profileError;
    currentUser = { id: profile.id, role: profile.role };

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, address, registration_number, specialty, bio, avatar_url')
      .eq('role', 'professional')
      .order('full_name', { ascending: true });
    if (error) throw error;
    professionals = data || [];

    if (currentUser.role !== 'client') {
      status.textContent = 'Você está conectado como profissional. Use Mensagens para acompanhar suas conversas.';
    }
    renderProfessionals();
  } catch (error) {
    console.error('Falha ao carregar o diretório profissional:', error);
    status.textContent = error.message || 'Não foi possível carregar o diretório. Tente novamente mais tarde.';
  }
}

initializeDirectory();
