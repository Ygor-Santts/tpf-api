# TPF Backend

Este é o repositório backend do projeto **Trampo Fácil**, construído com [NestJS](https://nestjs.com/), [MikroORM](https://mikro-orm.io/), [MySQL](https://www.mysql.com/), [Nx](https://nx.dev/) e [Docker](https://www.docker.com/).

## 🧱 Tecnologias Principais

- [NestJS](https://nestjs.com/) — Framework Node.js moderno e escalável
- [MikroORM](https://mikro-orm.io/) — ORM para TypeScript robusto
- [MySQL](https://www.mysql.com/) — Banco de dados relacional
- [Nx](https://nx.dev/) — Monorepo para escalar aplicações com eficiência
- [Docker](https://www.docker.com/) — Ambientes isolados e portáveis

---

## 🚀 Como iniciar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/Trampo-Facil/tpf-api
cd tpf-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie o arquivo `.env` com suas configurações locais.

### 4. Inicie o Docker

Certifique-se de que o **Docker Engine** está rodando.

Em seguida, suba os containers:

```bash
docker-compose up -d
```

### 5. Rode as migrações do banco de dados

Após os containers estarem ativos:

```bash
npm run migration:up
```

### 6. (Opcional) Crie os dados de teste

```bash
docker compose exec tpf_api npm run seed
```

Cria 40 contas de teste (10 clientes, 25 trabalhadores e 5 que também contratam), com profissões, cidades, portfólio e avaliações. Todas usam a senha `Teste@123`:

| Conta | Para testar |
|-------|-------------|
| `cliente01@teste.com` | Cliente comum e admin (entra no [tpf-admin](https://github.com/Ygor-Santts/tpf-admin)) |
| `cliente02@teste.com` a `cliente09@teste.com` | Cliente comum |
| `cliente10@teste.com` | Conta desativada |
| `trabalhador01@teste.com` | Trabalhador com muitas avaliações boas |
| `trabalhador02@teste.com` | Trabalhador com nota baixa |
| `trabalhador03@teste.com` a `trabalhador05@teste.com` | Perfil vazio: sem bio, portfólio ou avaliações |
| `trabalhador06@teste.com` e `trabalhador07@teste.com` | Em destaque por 30 dias |
| `trabalhador08@teste.com` | Destaque vencido ontem |
| `ambos01@teste.com` a `ambos05@teste.com` | Trabalhador que também avalia outros |

Pode rodar de novo quando quiser: ele apaga só as contas `@teste.com` e recria tudo igual. Contas reais, cidades e profissões não são alteradas. Não roda com `NODE_ENV=production`.

---

## 📂 Estrutura do projeto

Este projeto utiliza o padrão **monorepo** com Nx. Os módulos estão organizados em `libs/`, separados por contexto (ex: aplicação, infraestrutura, etc).

---

## 📜 Scripts úteis

| Comando | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o servidor em modo desenvolvimento |
| `npm run start:prod` | Inicia a versão de produção |
| `npm run build` | Compila o projeto |
| `npm run migration:create --name=<nome>` | Cria uma nova migration |
| `npm run migration:generate` | Gera migration com base nas alterações |
| `npm run migration:up` | Aplica as migrations |
| `npm run migration:down` | Reverte a última migration |
| `npm run seed` | Recria os dados de teste (contas `@teste.com`) |
| `npm run destaque -- <email> <dias>` | Coloca um trabalhador em destaque (soma os dias; `0` desliga) |
| `npm run admin -- <email>` | Dá acesso ao painel de admin (`--remover` tira) |
| `npm run test` | Executa os testes unitários |
| `npm run test:e2e` | Executa os testes end-to-end |
| `npm run lint` | Executa o linter e corrige erros automaticamente |

---

## 🐳 Docker

Este projeto utiliza `docker-compose` para subir o ambiente local, incluindo o banco de dados **MySQL**.

Você pode configurar as variáveis de ambiente no arquivo `.env`.

---

## 🌐 Servidor (produção)

Tudo roda num servidor só, com Docker: a API (compilada), o MySQL (sem porta aberta para a internet) e o Caddy, que cuida do HTTPS sozinho e também serve a versão web do app. O banco, as fotos e os certificados ficam em volumes, então não somem quando você atualiza. As migrations rodam sozinhas sempre que a API sobe.

- App: `https://SEU_DOMINIO`
- API: `https://api.SEU_DOMINIO` (também responde em `https://SEU_DOMINIO/api`)
- Admin: `https://admin.SEU_DOMINIO` (repositório e deploy próprios: [tpf-admin](https://github.com/Ygor-Santts/tpf-admin))

### 1. Domínio (Registro.br)

Em **DNS → Editar zona**, crie três registros do tipo **A** com o IP do servidor: um com o nome vazio, um com o nome `api` e um com o nome `admin`. Um `www` (CNAME para o domínio) é opcional: o Caddy redireciona ele para o endereço principal.

### 2. Preparar o servidor (Ubuntu 24.04, uma vez só)

Entre no servidor com `ssh root@IP_DO_SERVIDOR` e rode:

```bash
curl -fsSL https://get.docker.com | sh
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable

git clone https://github.com/Ygor-Santts/tpf-api.git ~/tpf-api
git clone https://github.com/Ygor-Santts/tpf-app.git ~/tpf-app
cd ~/tpf-api
cp .env.server.example .env.server
nano .env.server   # DOMAIN, APP_URL, senhas e JWT_SECRET (openssl rand -hex 32)
```

Os repositórios são privados: o `git clone` pede seu usuário do GitHub e, como senha, um token (GitHub → Settings → Developer settings → Personal access tokens).

### 3. Subir

```bash
cd ~/tpf-api
docker compose --env-file .env.server -f docker-compose.server.yml up -d --build
```

O primeiro build demora alguns minutos. Depois abra `https://api.SEU_DOMINIO/api-docs` e `https://SEU_DOMINIO`.

### 4. Backup diário

`deploy/backup.sh` salva o banco e as fotos em `~/tpf-api/backups` e guarda os últimos 7 dias. Para rodar todo dia às 3h:

```bash
(crontab -l 2>/dev/null; echo "0 3 * * * $HOME/tpf-api/deploy/backup.sh >> $HOME/tpf-api/backups/backup.log 2>&1") | crontab -
```

Para baixar uma cópia para o seu PC: `scp -r root@IP_DO_SERVIDOR:tpf-api/backups ./backups-trampofacil`.

### 5. Publicação automática

Depois de configurada, todo merge na `main` (da API ou do app) é compilado no GitHub e, se compilar, o servidor se atualiza sozinho. Acompanhe na aba **Actions** de cada repositório. Configure uma vez:

**No servidor** (`ssh root@IP_DO_SERVIDOR`):

```bash
# Chave só para o GitHub entrar no servidor
ssh-keygen -t ed25519 -f ~/.ssh/github-deploy -N "" -C github-deploy
cat ~/.ssh/github-deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github-deploy        # copie tudo, de -----BEGIN até -----END
```

O `git pull` no servidor precisa rodar sem pedir senha. Com os repositórios públicos isso já acontece; se algum ficar privado, rode `git config --global credential.helper store` e um `git pull` à mão uma vez, informando usuário e token.

**No GitHub**, em cada um dos dois repositórios (**Settings → Secrets and variables → Actions → New repository secret**):

| Nome | Valor |
| --- | --- |
| `SERVER_HOST` | IP do servidor |
| `SERVER_USER` | `root` |
| `SERVER_SSH_KEY` | a chave copiada acima |

Enquanto os segredos não existirem, a compilação roda e a publicação é pulada. Para publicar sem um merge novo: **Actions → Deploy → Run workflow**.

### 6. E-mail do "Esqueci minha senha" (Resend)

1. Crie uma conta grátis em [resend.com](https://resend.com) e, em **Domains**, adicione o domínio.
2. Copie os registros que o Resend mostrar para o DNS do Registro.br (não adicione registros TLSA) e espere todos ficarem verificados no Resend.
3. Em **API Keys**, crie uma chave com permissão **Sending access** e coloque no servidor:

```bash
cd ~/tpf-api
sed -i '/^RESEND_API_KEY=/d; /^MAIL_FROM=/d' .env.server
echo 'RESEND_API_KEY=re_SUA_CHAVE' >> .env.server
echo 'MAIL_FROM=Trampo Fácil <nao-responda@SEU_DOMINIO>' >> .env.server
docker compose --env-file .env.server -f docker-compose.server.yml up -d
```

Sem a chave, o pedido de nova senha não envia nada (em produção) e só registra um aviso no log.

### Dia a dia (dentro de `~/tpf-api`)

```bash
alias dc='docker compose --env-file .env.server -f docker-compose.server.yml'
git pull && git -C ../tpf-app pull && dc up -d --build   # atualizar API e app
dc logs -f api                                         # ver os logs da API
dc exec api npm run destaque -- email@x.com 30
dc exec api npm run admin -- seu@email.com             # dá acesso ao painel de admin
```

Produção começa com o banco vazio (só cidades e profissões). O seed de teste é recusado com `NODE_ENV=production`.

Para testar tudo no seu PC antes, com o `tpf-app` na pasta ao lado, use `DOMAIN=localhost` e `APP_URL=https://localhost` e abra `https://localhost` (o navegador avisa do certificado local; é só aceitar).

---

## 🧪 Testes

Rodar os testes unitários:

```bash
npm run test
```

Rodar os testes e2e:

```bash
npm run test:e2e
```
