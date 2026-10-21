import { isSupabaseConfigured, supabase } from './supabase-client.js';

const status = document.getElementById('chatStatus');
const signInPrompt = document.getElementById('chatSignIn');
const layout = document.getElementById('chatLayout');
const conversationList = document.getElementById('conversationList');
const heading = document.getElementById('activeConversationHeading');
const messageList = document.getElementById('messageList');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');

let currentUser;
let conversations = [];
let activeConversationId = null;
let refreshing = false;

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('text-rose-800', isError);
  status.classList.toggle('text-gray-600', !isError);
}

function createElement(tag, className, content) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = content;
  return element;
}

function getCounterparty(conversation) {
  return currentUser.role === 'client'
    ? conversation.professional_id
    : conversation.client_id;
}

function getCounterpartyName(conversation) {
  return conversation.counterparty?.full_name || 'Conta cadastrada';
}

async function loadConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, client_id, professional_id, updated_at')
    .or(`client_id.eq.${currentUser.id},professional_id.eq.${currentUser.id}`)
    .order('updated_at', { ascending: false });
  if (error) throw error;

  const peerIds = [...new Set((data || []).map(getCounterparty))];
  let profiles = [];
  if (peerIds.length) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', peerIds);
    if (profileError) throw profileError;
    profiles = profileData || [];
  }

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  conversations = (data || []).map((conversation) => ({
    ...conversation,
    counterparty: profilesById.get(getCounterparty(conversation))
  }));
  renderConversationList();
}

function renderConversationList() {
  const buttons = conversations.map((conversation) => {
    const button = createElement(
      'button',
      'chat-conversation-button',
      getCounterpartyName(conversation)
    );
    button.type = 'button';
    button.setAttribute('aria-current', String(conversation.id === activeConversationId));
    button.addEventListener('click', () => selectConversation(conversation.id));
    return button;
  });
  conversationList.replaceChildren(...buttons);

  if (!conversations.length) {
    conversationList.append(createElement(
      'p',
      'px-4 pb-5 text-sm text-gray-500',
      currentUser.role === 'client'
        ? 'Nenhuma conversa iniciada. Acesse o diretório de profissionais para começar.'
        : 'Você ainda não recebeu mensagens.'
    ));
  }
}

async function loadMessages(conversationId, scrollToBottom = true) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const messageNodes = (data || []).map((message) => {
    const wrapper = document.createElement('article');
    wrapper.className = `chat-message${message.sender_id === currentUser.id ? ' chat-message--mine' : ''}`;
    wrapper.append(
      createElement('p', 'whitespace-pre-wrap text-sm leading-6', message.body),
      createElement('time', 'mt-2 block text-right text-xs text-gray-500', new Date(message.created_at).toLocaleString('pt-BR'))
    );
    return wrapper;
  });
  messageList.replaceChildren(...messageNodes);
  if (!messageNodes.length) {
    messageList.append(createElement('p', 'text-sm text-gray-500', 'Esta conversa ainda não tem mensagens.'));
  } else if (scrollToBottom) {
    messageList.scrollTop = messageList.scrollHeight;
  }
}

async function selectConversation(conversationId) {
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) return;
  activeConversationId = conversationId;
  renderConversationList();
  heading.replaceChildren(createElement('h2', 'font-display text-lg text-graphite', getCounterpartyName(conversation)));
  messageForm.classList.remove('hidden');
  try {
    await loadMessages(conversationId);
    messageInput.focus();
  } catch (error) {
    console.error('Falha ao carregar mensagens:', error);
    messageList.replaceChildren(createElement('p', 'text-sm text-rose-800', error.message || 'Não foi possível carregar esta conversa.'));
  }
}

messageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = messageInput.value.trim();
  if (!activeConversationId || !body) return;

  const submit = messageForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      sender_id: currentUser.id,
      body
    });
    if (error) throw error;
    messageInput.value = '';
    await loadMessages(activeConversationId);
    await loadConversations();
  } catch (error) {
    console.error('Falha ao enviar mensagem:', error);
    showStatus(error.message || 'Não foi possível enviar a mensagem.', true);
  } finally {
    submit.disabled = false;
  }
});

async function initializeChat() {
  if (!isSupabaseConfigured) {
    showStatus('O serviço de mensagens ainda não está configurado. Configure a URL e a chave publicável do Supabase.', true);
    return;
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) {
      showStatus('Entre na sua conta para acessar as mensagens.');
      signInPrompt.classList.remove('hidden');
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', data.user.id)
      .single();
    if (profileError) throw profileError;
    currentUser = profile;
    layout.classList.remove('hidden');

    await loadConversations();
    showStatus(conversations.length
      ? 'Suas conversas privadas estão carregadas.'
      : 'Ainda não há conversas vinculadas à sua conta.');

    const requestedConversation = new URLSearchParams(window.location.search).get('conversation');
    if (requestedConversation && conversations.some((item) => item.id === requestedConversation)) {
      await selectConversation(requestedConversation);
    } else if (conversations.length) {
      await selectConversation(conversations[0].id);
    }

    window.setInterval(async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        await loadConversations();
        if (activeConversationId && conversations.some((item) => item.id === activeConversationId)) {
          await loadMessages(activeConversationId, false);
        }
      } catch (pollError) {
        console.error('Falha ao atualizar conversas:', pollError);
      } finally {
        refreshing = false;
      }
    }, 6000);
  } catch (error) {
    console.error('Falha ao carregar a área de mensagens:', error);
    showStatus(error.message || 'Não foi possível carregar suas conversas. Tente novamente.', true);
  }
}

initializeChat();
