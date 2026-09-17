# LovableHub — marketplace de extensões para projetos GitHub

## Objetivo
Transformar a tela atual em um SaaS dark completo onde usuários conectam o GitHub, escolhem um repositório, instalam extensões com créditos e editam o `README.md`, com cobrança via Stripe e administração exclusiva do owner.

## Experiência e páginas
- Criar uma identidade visual dark inspirada em Linear e GitHub, usando Inter, superfícies compactas e contraste alto.
- Usar uma marca tipográfica temporária “LovableHub” até a logo prometida ser enviada, sem bloquear a implementação.
- Criar navegação compartilhada com saldo de créditos em tempo real, conta e saída.
- `/`: apresentação do produto com a mensagem solicitada e botão “Começar”.
- `/auth`: entrada exclusiva com GitHub e autorização `repo`.
- `/marketplace`: catálogo com as três extensões iniciais, instalação por 10 créditos e estado de licença.
- `/my-github`: repositórios do usuário, busca/seleção e persistência do repositório ativo.
- `/editor`: Monaco com leitura segura do `README.md`, edição, comparação básica e commit por 5 créditos.
- `/pricing`: planos de 100, 300 e 1.000 créditos e redirecionamento ao Stripe Checkout.
- `/admin`: visão exclusiva do owner com usuários, saldos e vendas.
- Modal de créditos insuficientes com acesso direto aos planos.

## Autenticação e GitHub
- Trocar o fluxo atual por GitHub OAuth com escopo `repo` e retorno seguro para a origem do app.
- No primeiro acesso, provisionar 20 créditos e atribuir o papel `owner` somente ao e-mail `paulomanus304@gmail.com`.
- Capturar o token concedido pelo GitHub uma única vez, enviá-lo a uma função autenticada e armazená-lo cifrado; ele nunca será retornado ao navegador nem consultável diretamente.
- Executar listagem de repositórios, leitura e commit exclusivamente no servidor via Octokit, sempre vinculando a operação ao usuário autenticado.

## Banco de dados e segurança
- Criar `extensions`, `licenses`, `user_credits`, `credit_transactions`, `github_connections` e `user_roles`, com UUIDs, datas, validações, índices, grants e RLS.
- Manter papéis apenas em `user_roles`, com função `has_role` protegida contra recursão.
- Adicionar os campos técnicos mínimos para segurança e operação: token cifrado, metadados de transação, referência Stripe e idempotência de eventos.
- Semear no próprio SQL as três extensões solicitadas.
- Criar `consume_credits` como transação atômica: valida o usuário, bloqueia o saldo, aplica bypass de owner, impede saldo negativo e registra o débito.
- Criar funções seguras para provisionamento inicial, instalação de extensão e crédito confirmado por pagamento.

## Pagamentos
- Ativar Stripe e criar Checkout para os três pacotes informados.
- Implementar endpoint público de webhook com verificação de assinatura, validação, idempotência e concessão atômica dos créditos somente após pagamento confirmado.
- Exibir retorno de sucesso/cancelamento sem confiar em parâmetros do navegador para liberar créditos.

## Arquitetura técnica
- Manter TanStack Start e criar rotas reais para todos os destinos.
- Usar funções autenticadas do servidor para GitHub, créditos, instalações, pagamentos e administração.
- Usar TanStack Query para dados remotos, estados de carregamento/erro e invalidação após ações.
- Adicionar limites e validação Zod para owner/repositório/caminho/conteúdo/mensagem de commit.
- Preservar tokens semânticos, acessibilidade por teclado e adaptação mobile/desktop.
- Adicionar metadados únicos em todas as páginas.

## Validação e entrega
- Testar acesso público e protegido, OAuth, créditos iniciais, bypass do owner, saldo insuficiente, instalação, seleção de repositório, leitura/commit e autorização do admin.
- Verificar desktop e mobile, erros de navegador, chamadas de rede e estados vazios.
- Rodar auditoria de segurança do banco e dependências.
- Publicar a versão validada. A conexão real ao GitHub depende do login OAuth; o checkout depende da ativação/configuração do Stripe durante a execução.
