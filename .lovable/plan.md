# Painel administrativo de usuários e convites

## Objetivo
Substituir o LovableHub por um painel interno para administrar usuários, departamentos e convites de acesso.

## Experiência
- Tela de entrada por e-mail e senha, com recuperação de senha.
- Painel protegido com resumo por departamento, busca e filtros.
- Gestão de usuários: visualizar nome, e-mail, departamento, status e data de criação; alterar departamento e ativar/desativar acesso.
- Gestão de convites: criar convite por e-mail e departamento, acompanhar validade/status e cancelar ou reenviar quando aplicável.
- Layout administrativo responsivo, com navegação lateral no desktop e menu compacto no celular.

## Segurança e dados
- Usar o sistema de autenticação gerenciado; senhas nunca serão salvas em tabelas da aplicação.
- Criar perfis vinculados à identidade autenticada, com nome, departamento e status.
- Armazenar papéis administrativos em tabela separada, sem confiar em dados do navegador.
- Criar convites com token armazenado de forma segura, expiração e uso único.
- Aplicar permissões de banco para que somente administradores possam listar e gerenciar usuários e convites.
- Adaptar os departamentos solicitados: ADMIN, FINANCEIRO, VENDAS, ESTOQUE e JURIDICO.

## Implementação técnica
- Remover as rotas e integrações específicas do marketplace, GitHub e créditos da experiência ativa.
- Criar funções autenticadas no servidor para leituras e alterações administrativas.
- Criar rotas públicas de login, recuperação e aceite de convite; páginas administrativas ficam protegidas.
- Adicionar validação de formulários, estados de carregamento, mensagens de erro e metadados próprios por página.

## Validação
- Testar login, bloqueio de acesso não administrativo, listagem/filtros, alteração de usuário e ciclo de convite.
- Verificar desktop e celular, erros do navegador e permissões do banco.
