# Guia de Implantação (Deployment)

Este guia explica passo a passo como configurar o banco de dados e colocar o **Sistema MedGroup** no ar.

## 1. Configuração do Banco de Dados (Supabase)

O sistema utiliza o Supabase como backend.

1.  **Criar Projeto**: Acesse [Supabase](https://supabase.com/) e crie um novo projeto.
2.  **Obter Credenciais**:
    - Vá em **Project Settings** (ícone de engrenagem) -> **API**.
    - Copie a `Project URL` e a chave `anon public`.
3.  **Criar Tabelas**:
    - Vá no **SQL Editor** (ícone de terminal) no painel do Supabase.
    - Abra o arquivo `supabase_schema.sql` que está na pasta raiz deste projeto.
    - Copie todo o conteúdo e cole no SQL Editor do Supabase.
    - Clique em **Run**.
    - *Nota: Isso criará todas as tabelas necessárias. O sistema preencherá automaticamente os dados iniciais se as tabelas estiverem vazias.*

## 2. Desenvolvimento Local

Para rodar o projeto no seu computador:

1.  **Configurar Ambiente**:
    - Crie um arquivo chamado `.env` na raiz do projeto.
    - Adicione suas credenciais do Supabase (copie do passo anterior):
      ```env
      VITE_SUPABASE_URL=sua_url_do_projeto
      VITE_SUPABASE_ANON_KEY=sua_chave_anon
      ```
2.  **Instalar e Rodar**:
    - Abra o terminal na pasta do projeto.
    - Execute `npm install` para baixar as dependências.
    - Execute `npm run dev` para iniciar o servidor local.

## 3. Implantação (Vercel)

Para colocar o site online publicamente usando a Vercel:

1.  **Enviar para o GitHub**:
    - **IMPORTANTE**: Certifique-se de que todas as suas alterações (incluindo a correção do `GlobalStore.tsx`) foram enviadas (push) para o seu repositório no GitHub.
    - Se você fez alterações locais, use a aba de "Source Control" do seu editor para fazer o Commit e o Sync/Push.

2.  **Importar na Vercel**:
    - Acesse [Vercel](https://vercel.com/) e faça login.
    - Clique em **Add New...** -> **Project**.
    - Selecione o repositório `medgroup-system` do seu GitHub e clique em **Import**.

3.  **Configurar Variáveis de Ambiente**:
    - Na tela de configuração da Vercel, procure a seção **Environment Variables**.
    - Adicione as mesmas variáveis que você usou no `.env` local:
      - **Nome**: `VITE_SUPABASE_URL` | **Valor**: (Sua URL do Supabase)
      - **Nome**: `VITE_SUPABASE_ANON_KEY` | **Valor**: (Sua chave anon do Supabase)

4.  **Deploy**:
    - Clique em **Deploy**.
    - Aguarde o processo finalizar. Se tudo estiver correto, você receberá o link do seu site.

## Solução de Problemas (Troubleshooting)

### Erro de Build: "Could not resolve ./context/Store"
Este erro ocorre devido a uma diferença de maiúsculas/minúsculas entre Windows e Linux (Vercel).
**Solução Já Aplicada**: O arquivo foi renomeado para `GlobalStore.tsx` e todas as importações foram atualizadas.
**Ação Necessária**: Apenas certifique-se de fazer o **Push** dessas alterações para o GitHub.

### "Usuário não encontrado" ao logar
Se você não conseguir entrar, verifique se o banco de dados foi populado.
- O usuário administrador padrão é:
  - **Email**: `admin@medgroup.com`
  - **Senha**: `admin123`

### Erro de Conexão
Se o sistema não carregar os dados:
- Verifique se as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) estão corretas na Vercel.
- Verifique se o projeto no Supabase não está "Pausado" (projetos gratuitos pausam após inatividade).
