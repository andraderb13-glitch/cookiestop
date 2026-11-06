# Doce Gestão 3.0 — Multiestabelecimentos

Projeto educacional full stack. Frontend Vue 3 + TypeScript + Pinia; API Node.js + Express + TypeScript; MySQL/MariaDB AlwaysData.

## 1. Criar o banco no AlwaysData

No painel AlwaysData, crie um banco **MySQL/MariaDB** exclusivo e um usuário com permissão para ele. Use o nome real fornecido pelo painel (frequentemente prefixado pelo nome da conta). No DBeaver ou no gerenciador SQL do AlwaysData, execute **backend/schema.sql**.

## 2. Instalação simples: apenas UM terminal

Abra **somente a pasta `doce-gestao`** no VS Code e use **um único terminal**, sem entrar em `backend`.

1. No AlwaysData, crie o banco `rodrigodb_vue` e importe `backend/schema.sql`.
2. Copie `backend/.env.example` para `backend/.env`. Preencha a senha do **usuário MySQL**, `JWT_SECRET` (32+ caracteres aleatórios), `ADMIN_EMAIL` e `ADMIN_PASSWORD` (12+ caracteres). Nunca compartilhe esse arquivo.
3. No terminal da pasta `doce-gestao`, execute uma vez:

```bash
npm install
npm run seed:admin
```

4. Para abrir o sistema, execute **um único comando** no mesmo terminal:

```bash
npm run dev
```

O comando inicia **API e site juntos** no mesmo terminal, com logs identificados como `API` e `SITE`. Acesse `http://localhost:5173`. Para parar ambos, pressione `Ctrl+C`.

**Importante:** um terminal simplifica a inicialização, mas não dispensa a configuração do MySQL no AlwaysData e do `.env` local. O arquivo `.env` com senhas não está incluído no ZIP.

## 4. Fluxo

1. Entre com o e-mail/senha do administrador configurados no `backend/.env`.
2. Cadastre estabelecimento e responsável (senha inicial com no mínimo 12 caracteres).
3. Saia e entre com o login individual do cliente.
4. Cadastre produtos, despesas, estoque, vendas e exporte PDF/Excel.
5. Cada estabelecimento possui dados isolados, validados na API pelo login; nunca pelo ID enviado pelo navegador.

## Observações importantes

- Os dados da versão antiga no `localStorage` **não são migrados automaticamente**. O novo sistema começa com cada estabelecimento vazio. Faça backup da versão antiga antes de substituir.
- Os relatórios são gerados no navegador usando os dados carregados da API; não há exportação CSV.
- O armazenamento de operações está em um documento JSON por estabelecimento dentro do MySQL, com revisão otimista para impedir sobrescritas silenciosas entre sessões. Para escala comercial, recomenda-se normalizar vendas, produtos e despesas em tabelas e registrar vendas com transações atômicas no servidor.
- A sincronização de dados é feita após as alterações. Se houver falha de rede ou conflito de revisão, a aplicação exibe um erro e exige atualização antes de continuar. **Não use para operação comercial crítica sem testes adicionais, backups e auditoria.**
- `backend/.env` nunca deve ser publicado. Configure HTTPS, backups e políticas de segurança antes de colocar o serviço na internet.
- A senha inicial dos clientes deve ser comunicada por canal seguro; fluxo de troca de senha ainda não está implementado.
