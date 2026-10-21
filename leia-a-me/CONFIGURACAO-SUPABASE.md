# Configuração do Supabase

O portal usa Supabase Auth para login e cadastro, Postgres com Row Level Security para perfis e conversas, e Storage para fotos profissionais. A integração não funciona até conectar um projeto Supabase.

## Conectar o projeto

1. Crie ou selecione um projeto Supabase.
2. No SQL Editor do projeto, execute o conteúdo de [`../supabase/schema.sql`](../supabase/schema.sql).
3. Copie a URL do projeto e a chave **publishable** (ou a chave pública `anon` legada) para `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` em [`../javascript/supabase-client.js`](../javascript/supabase-client.js).
4. Em **Authentication > URL Configuration**, configure a URL do site e permita os endereços de retorno usados pelo portal, incluindo `/html/index.html` e `/html/cadastro.html`.
5. Publique o site por HTTP ou HTTPS. Os módulos JavaScript e o login não funcionam ao abrir as páginas diretamente com `file://`.

Nunca coloque a chave `service_role` no navegador ou no repositório. O site utiliza somente a chave pública; as políticas RLS do SQL são a proteção dos dados.

## E-mail e fotos

Com confirmação de e-mail habilitada, a pessoa precisa confirmar o endereço antes de entrar. A foto escolhida durante o cadastro fica temporariamente na sessão do navegador e é enviada ao Storage após o primeiro login. Se a confirmação for feita em outro navegador ou dispositivo, será necessário entrar no dispositivo do cadastro para enviar a foto ou selecionar outra.

Configure o envio de e-mails e os modelos de confirmação e recuperação de senha no painel Supabase. O fluxo de recuperação retorna à página de cadastro para definir uma nova senha.

## Verificação manual

- Cadastre um cliente e um profissional com e-mails diferentes; confirme os e-mails se essa opção estiver ativa.
- Entre como cliente, abra o diretório e inicie uma conversa. Entre como profissional para responder.
- Confirme que cada participante vê a conversa e as mensagens e que outra conta não consegue acessá-las.
- Teste recuperação de senha, logout, busca do diretório e envio de foto.

Os dados de registro profissional são informados pelo próprio usuário e não são verificados pelo portal. Os perfis exibem esse aviso aos visitantes.
