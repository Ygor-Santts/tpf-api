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
| `cliente01@teste.com` a `cliente09@teste.com` | Cliente comum |
| `cliente10@teste.com` | Conta desativada |
| `trabalhador01@teste.com` | Trabalhador com muitas avaliações boas |
| `trabalhador02@teste.com` | Trabalhador com nota baixa |
| `trabalhador03@teste.com` a `trabalhador05@teste.com` | Perfil vazio: sem bio, portfólio ou avaliações |
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
| `npm run test` | Executa os testes unitários |
| `npm run test:e2e` | Executa os testes end-to-end |
| `npm run lint` | Executa o linter e corrige erros automaticamente |

---

## 🐳 Docker

Este projeto utiliza `docker-compose` para subir o ambiente local, incluindo o banco de dados **MySQL**.

Você pode configurar as variáveis de ambiente no arquivo `.env`.

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
