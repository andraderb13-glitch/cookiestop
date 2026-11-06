# Configuração do AlwaysData

Dados preenchidos no `.env.example`:
- Banco: `rodrigodb_vue`
- Usuário: `rodrigodb`
- Host provável: `mysql-rodrigodb.alwaysdata.net` (confirme no painel do AlwaysData em Bancos de dados > MySQL)
- Porta: `3306`

## Antes de executar
1. Copie `backend/.env.example` para `backend/.env`.
2. Preencha `DB_PASSWORD` **somente no `.env` local**. Não envie nem publique este arquivo.
3. Preencha `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `JWT_SECRET` com valores seguros.
4. Importe `backend/schema.sql` no banco `rodrigodb_vue` via DBeaver ou painel do AlwaysData.
5. Execute `npm install`, `npm run seed:admin` e `npm run dev` dentro de `backend`.
6. Em outro terminal, execute `npm install` e `npm run dev` na raiz do projeto.

**Importante:** este pacote não testa a conexão real e não contém senhas. Se a senha compartilhada anteriormente for uma senha em uso, altere-a antes de prosseguir.
