# Trampo Fácil: como o sistema funciona

Visão geral do sistema inteiro, para quem vai manter ou assumir o projeto. Cada repositório tem o seu README com os comandos do dia a dia.

## Os três repositórios

| Repositório | O que é | Endereço em produção |
| --- | --- | --- |
| [tpf-app](https://github.com/Ygor-Santts/tpf-app) | App de clientes e trabalhadores (Vue 3), responsivo para celular e computador | `https://app-trampofacil.com.br` |
| [tpf-api](https://github.com/Ygor-Santts/tpf-api) | API (NestJS + MySQL), usada pelo app e pelo admin | `https://api.app-trampofacil.com.br` |
| [tpf-admin](https://github.com/Ygor-Santts/tpf-admin) | Painel de administração (Vue 3) | `https://admin.app-trampofacil.com.br` |

## Como as peças se ligam

```
celular / computador ──► Caddy (HTTPS) ──► app web (arquivos estáticos)
                              │
                              ├──► API NestJS ──► MySQL
                              │        │
                              │        ├──► volume de fotos (portfólio)
                              │        └──► Resend (e-mails)
                              │
                              └──► admin (container próprio)
```

- Tudo roda num servidor só (VPS Ubuntu), com Docker Compose. O compose fica na tpf-api (`docker-compose.server.yml`) e compila o app a partir da pasta `../tpf-app`.
- O **Caddy** gera e renova os certificados HTTPS sozinho e encaminha cada endereço para o container certo (`Caddyfile`). A API também responde em `https://app-trampofacil.com.br/api`, como alternativa ao subdomínio `api.`.
- O **MySQL** não tem porta aberta para a internet. O banco, as fotos do portfólio e os certificados ficam em volumes, então não somem quando os containers são recriados.
- As **migrations** rodam sozinhas sempre que a API sobe.
- **Backup**: `deploy/backup.sh` salva o banco e as fotos todo dia e guarda os últimos 7 dias.
- **Deploy**: cada repositório tem um workflow `Deploy` no GitHub Actions. Todo merge na `main` é compilado e, se compilar, o servidor se atualiza. O admin tem deploy próprio.

## Quem usa e o que pode fazer

| Perfil | Pode |
| --- | --- |
| Visitante (sem conta) | Ver início, busca, categorias, perfis, portfólio e avaliações. Não vê o telefone. |
| Cliente | Tudo do visitante, mais ver o contato (WhatsApp e ligar) e avaliar profissionais. |
| Trabalhador | Montar o perfil (profissões, cidades, bio), portfólio de fotos e vídeos, ver o painel e as avaliações, sugerir categoria ou profissão que falta. |
| Cliente e trabalhador | A mesma conta pode ter os dois papéis (`/become-worker` no app). O app alterna entre os modos. |
| Admin | Entrar no painel: aprovar e organizar categorias e profissões, buscar, desativar e excluir contas. Acesso dado por comando (`npm run admin`). |

## Regras de negócio importantes

- **Região**: a busca usa a localização do celular e mostra quem atende num raio de 10, 30 ou 50 km. Sem localização, a pessoa escolhe estado e cidade. Todas as cidades do Brasil são carregadas por migration (com latitude e longitude).
- **Contato**: o telefone do trabalhador só vai na resposta da API para quem está logado. O e-mail do trabalhador nunca é público.
- **Destaque (pago)**: `worker.featured_until`. Enquanto a data não passou, o trabalhador aparece primeiro na busca, com selo. É ligado pelo comando `npm run destaque -- <email> <dias>` (soma dias; `0` desliga). Ainda não existe pagamento dentro do app.
- **Melhores no ramo (grátis)**: `sort=best` na busca. Só entra quem tem 3 ou mais avaliações, ordenado pela nota. O Destaque não conta aqui.
- **Aprovação**: categoria ou profissão criada por um trabalhador fica `approved = false` ("em análise") até um admin aprovar. O próprio trabalhador vê o item com a marca "(em análise)".
- **Conta**: nome e sobrenome obrigatórios, e-mail confirmado por link, recuperação de senha por e-mail, exclusão da própria conta pelo app. Conta desativada não consegue entrar.
- **Suporte**: a tela `/ajuda` do app manda a mensagem por e-mail para `SUPPORT_EMAIL`, com o e-mail de quem escreveu como resposta. Toda mensagem também vai para o log da API.

## Dados

| Tabela | Guarda |
| --- | --- |
| `user` | Conta: nome, e-mail, telefone, senha (bcrypt), ativo, admin, e-mail confirmado, último acesso |
| `worker` | Perfil de trabalhador ligado a um `user`: bio, `featured_until`, profissões e cidades onde atende |
| `job_category`, `job_occupation` | Categorias e profissões, com `approved` (aprovada ou em análise) |
| `city` | Todas as cidades do IBGE, com a sigla do estado e coordenadas (os estados são uma lista fixa no código) |
| `portfolio_item` | Foto ou vídeo do portfólio (arquivo no volume de uploads) |
| `rating` | Avaliação de um trabalhador: nota de 1 a 5, comentário e autor |

O esquema está nas migrations em `libs/infra/database/migrations`.

## API

A documentação interativa de todas as rotas fica em `/api-docs` (Swagger). Resumo:

| Grupo | Rotas |
| --- | --- |
| `auth` | `sign-in`, `client/sign-up`, `worker/sign-up`, `worker/activate` (cliente vira trabalhador), `forgot-password`, `reset-password`, `verify-email`, `verify-email/resend`, `GET/DELETE me` |
| `job` | Categorias, profissões de uma categoria, sugerir profissão |
| `locales` | Estados e cidades de um estado |
| `worker` | Busca paginada (`paginated`), perfil próprio (`me`, `PATCH profile`), perfil público, portfólio, avaliações e resumo das avaliações |
| `support` | Enviar mensagem de suporte |
| `admin` | Categorias, profissões e usuários (só admin) |
| `health-check` | Saúde da API |

Login por token JWT (`Authorization: Bearer ...`). As rotas usam três guardas: `JwtAuthGuard` (precisa estar logado), `OptionalJwtAuthGuard` (funciona sem login, mas mostra mais para quem está logado) e `AdminGuard` (só admin, conferido no banco a cada chamada).

## Organização do código

**API** (`tpf-api`): monorepo Nx. Cada contexto é uma biblioteca em `libs/core`, dividida em `presenter` (controllers e DTOs), `use-cases` (regras de negócio) e `data-access` (repositórios). `libs/infra` junta tudo (módulo principal, configuração, banco, health-check).

**App** (`tpf-app`): `domain` (tipos), `application/stores` (estado com Pinia), `infra/services` (chamadas à API), `presentation` (telas, componentes e rotas), `i18n` (pt-BR e inglês) e `shared` (validação e utilidades).

**Admin** (`tpf-admin`): projeto pequeno, com `views` (Entrar, Categorias, Usuários), `components` e `services.ts` com todas as chamadas à API.

## Qualidade

- TypeScript nos três projetos.
- Validação no app (mensagens por campo, em português) e de novo na API (`class-validator`).
- ESLint e Prettier configurados na API (`npm run lint`). O app tem os arquivos de configuração, mas o ESLint ainda não está nas dependências dele.
- O GitHub Actions compila cada mudança antes de publicar.
- **Testes automáticos**: o Jest está configurado na API, mas ainda não há testes escritos (só o teste e2e de exemplo do NestJS, que está desatualizado). Escrever a suíte é um dos próximos passos.

## Pendências conhecidas

- Publicação nas lojas (Google Play e App Store): ainda não feita. Plano: Capacitor para gerar os apps, contas de desenvolvedor (Google US$ 25 uma vez, Apple US$ 99 por ano), teste fechado de 14 dias no Google.
- `SUPPORT_EMAIL`: definir a caixa de entrada definitiva do suporte.
- Da revisão do painel admin (nenhuma bloqueia o uso):
  - desativar ou excluir uma conta não encerra as sessões já abertas;
  - os filtros da busca ainda aceitam profissões em análise;
  - um admin pode reativar outro admin desativado;
  - pequenos ajustes de tela no admin (mensagens de erro no celular, respostas fora de ordem).
- Pode esperar: limite de tentativas no login, esconder o Swagger em produção, avaliação só de quem contratou, chat no app.
