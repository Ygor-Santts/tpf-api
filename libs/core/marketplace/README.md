# marketplace

Tudo o que o cliente usa para encontrar um profissional.

- Rota `worker/paginated`: busca por nome, profissão, categoria, cidade ou raio (latitude, longitude e km). Quem tem Destaque ativo vem primeiro; `sort=best` mostra só quem tem 3 ou mais avaliações, pela nota. O telefone só vai para quem está logado.
- Rotas `job`: categorias, profissões de uma categoria e sugestão de profissão nova (fica em análise até um admin aprovar).
- Rotas `locales`: estados e cidades.

Visão geral do sistema: [docs/ARQUITETURA.md](../../../docs/ARQUITETURA.md).
