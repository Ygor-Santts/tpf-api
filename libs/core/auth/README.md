# auth

Contas e acesso.

- Rotas `auth`: login, cadastro de cliente e de trabalhador, cliente que vira trabalhador (`worker/activate`), esqueci e redefinir senha, confirmação de e-mail, `GET/DELETE me`.
- Rota `support`: mensagens da tela "Ajuda e suporte" do app, enviadas por e-mail (Resend) para `SUPPORT_EMAIL`.
- Guardas usadas pelas outras bibliotecas: `JwtAuthGuard` (precisa estar logado), `OptionalJwtAuthGuard` (login opcional) e `AdminGuard` (só admin, conferido no banco).

Visão geral do sistema: [docs/ARQUITETURA.md](../../../docs/ARQUITETURA.md).
