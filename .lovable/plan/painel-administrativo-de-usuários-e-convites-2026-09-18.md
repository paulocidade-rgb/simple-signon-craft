# Painel administrativo de usuários e convites

## Objetivo
Substituir o LovableHub por um painel interno para administrar usuários, departamentos e convites de acesso.

## Experiência
- Tela de entrada por e-mail e senha, com recuperação de senha.
- Painel protegido com resumo por departamento, busca e filtros.
- Gestão de usuários: visualizar nome, e-mail, departamento, status e data de criação; alterar departamento e ativar/desativar acesso.
- Gestão de convites: criar convite por e-mail e departamento, acompanhar validade/status e cancelar quando necessário.
- Layout administrativo responsivo, com navegação adaptada para celular.

## Segurança e dados
- Usar o sistema de autenticação gerenciado; senhas nunca serão salvas em tabelas da aplicação.
- Criar perfis vinculados à identidade autenticada, com nome, departamento e status.
- Armazenar papéis administrativos separadamente, sem confiar em dados do navegador.
- Criar convites com token protegido, expiração e uso único.
- Permitir que somente administradores gerenciem usuários e convites.
- Usar os departamentos ADMIN, FINANCEIRO, VENDAS, ESTOQUE e JURIDICO.

## Implementação técnica
- Remover da experiência ativa as rotas e integrações de marketplace, GitHub e créditos.
- Criar funções autenticadas no servidor para leituras e alterações administrativas.
- Criar páginas públicas de login e recuperação; páginas administrativas ficam protegidas.
- Adicionar validação, carregamento, mensagens de erro e metadados próprios.

## Validação
- Testar login, bloqueio de acesso não administrativo, listagem, filtros, alteração de usuário e convites.
- Verificar desktop, celular, erros do navegador e permissões do banco.
