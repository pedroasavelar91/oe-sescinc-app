# 🚒 OE-SESCINC Med Mais

Sistema de gestão completo para operações de ensino e treinamento de bombeiros, desenvolvido para o Operações Especiais do SESCINC (Serviço de Segurança Contra Incêndio).

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Enabled-green)

---

## 📋 Índice

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura](#estrutura)
- [Deploy](#deploy)
- [Contribuindo](#contribuindo)

---

## 🎯 Sobre

O **OE-SESCINC Med Mais** é um sistema web completo de gestão operacional e administrativa para treinamento de bombeiros. O sistema oferece controle total sobre:

- 📚 Gestão de turmas e cursos
- 👥 Controle de alunos e instrutores
- 📊 Acompanhamento financeiro
- 🔥 Controle de vencimentos (AT e Exercício com Fogo)
- 📝 Sistema de tarefas e checklists
- 📄 Gestão de documentos
- 🔧 Controle de montagem/desmontagem
- 🚐 Gestão de bases operacionais

---

## ✨ Funcionalidades

### 👤 Controle de Acesso (RBAC)

Sistema com 5 níveis de acesso:

- **Motorista**: Acesso básico
- **Instrutor**: Gestão de aulas e alunos
- **Coordenador**: Coordenação de turmas
- **Gestor**: Gestão completa
- **Embaixador**: Acesso especial

### 📚 Gestão de Turmas

- Criação e edição de turmas
- Agendamento de aulas
- Controle de presença
- Gestão de notas
- Histórico completo

### 💰 Controle Financeiro

- Extrato detalhado por instrutor
- Cálculo automático de valores
- Filtros por período e modalidade
- Exportação para CSV
- Integração com montagem/desmontagem

### 🔥 Controle de Vencimentos

- Dashboard visual de vencimentos
- Controle de AT (Atualização Técnica)
- Controle de Exercício com Fogo
- Matriz mensal por base
- Alertas de vencimento

### 📄 Gestão de Documentos

- Upload de arquivos (PDF, imagens)
- Organização em pastas
- Controle de acesso por role
- Preview de imagens
- Armazenamento no Supabase

### ✅ Sistema de Tarefas

- Criação de tarefas
- Atribuição a usuários
- Controle de prioridade
- Acompanhamento de status
- Notificações

### 🔧 Montagem/Desmontagem

- Registro de atividades
- Cálculo automático (R$ 350/dia)
- Atribuição de instrutores
- Integração financeira

### 📋 Checklists

- Templates personalizáveis
- Registro de execução
- Histórico completo
- Controle por turma

---

## 🛠️ Tecnologias

### Frontend

- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones

### Backend/Database

- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Storage (arquivos)
  - Row Level Security (RLS)
  - Real-time subscriptions

### Deploy

- **Vercel** - Hospedagem e CI/CD
- **GitHub** - Controle de versão

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Conta no Vercel (opcional)

### Passo a Passo

1. **Clone o repositório**

```bash
git clone https://github.com/ManifoldAI-Apps/oesescinc-app.git
cd oesescinc-app
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
```

4. **Execute o projeto**

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

---

## ⚙️ Configuração

### Supabase

1. **Criar projeto no Supabase**
   - Acesse https://supabase.com
   - Crie um novo projeto

2. **Executar SQL Schema**
   - Vá em SQL Editor
   - Execute o arquivo `schema_completo_corrigido.sql`

3. **Configurar Storage**
   - Crie bucket `documents` (público)
   - Crie bucket `profile-photos` (público)
   - Execute as políticas RLS do arquivo `storage_policies_public.sql`

4. **Obter credenciais**
   - Settings → API
   - Copie Project URL e anon key

### Vercel (Deploy)

1. **Conectar repositório**
   - Importe o projeto do GitHub

2. **Configurar variáveis**
   - Settings → Environment Variables
   - Adicione `VITE_SUPABASE_URL`
   - Adicione `VITE_SUPABASE_ANON_KEY`

3. **Deploy**
   - Push para main = deploy automático

---

## 🚀 Uso

### Login

Acesse o sistema com credenciais de usuário. O sistema possui usuários mock para desenvolvimento:

- **Gestor**: admin@medgroup.com
- **Instrutor**: instrutor@medgroup.com
- **Coordenador**: coordenador@medgroup.com

### Navegação

O menu lateral possui duas seções:

**ADMINISTRATIVO**
- 📄 Documentos
- ✅ Tarefas
- 💰 Financeiro
- 🔥 Bombeiros
- 👥 Usuários

**OPERACIONAL**
- 🔧 Montagem/Desmontagem
- 📋 Checklists

### Funcionalidades Principais

#### Criar Turma

1. Vá em "Turmas"
2. Clique em "Nova Turma"
3. Preencha os dados
4. Adicione aulas
5. Salve

#### Registrar Presença

1. Selecione a turma
2. Vá em "Presença"
3. Marque presentes/ausentes
4. Salve

#### Lançar Notas

1. Selecione a turma
2. Vá em "Notas"
3. Insira as notas
4. Salve

#### Fazer Upload de Documento

1. Vá em "Documentos"
2. Clique em "Novo Arquivo"
3. Digite o nome
4. Selecione o arquivo
5. Clique em "Adicionar"

---

## 📁 Estrutura do Projeto

```
medgroup-app/
├── components/          # Componentes React
│   ├── Layout.tsx      # Layout principal
│   ├── FileUpload.tsx  # Upload de arquivos
│   └── ...
├── pages/              # Páginas da aplicação
│   ├── Classes.tsx     # Gestão de turmas
│   ├── Students.tsx    # Gestão de alunos
│   ├── Finance.tsx     # Controle financeiro
│   ├── Firefighters.tsx # Controle de bombeiros
│   ├── Documents.tsx   # Gestão de documentos
│   └── ...
├── context/            # Context API
│   └── AppStore.tsx    # Estado global
├── services/           # Serviços
│   ├── supabase.ts     # Cliente Supabase
│   └── mockData.ts     # Dados mock
├── types.ts            # Definições TypeScript
├── App.tsx             # Componente raiz
└── main.tsx            # Entry point
```

---

## 🌐 Deploy

### Vercel (Recomendado)

```bash
# Fazer deploy
git push origin main

# Vercel faz deploy automático
```

### Build Manual

```bash
# Gerar build de produção
npm run build

# Testar build localmente
npm run preview
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: Nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Padrões de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

---

## 📝 Licença

Este projeto é proprietário e confidencial.

---

## 👥 Equipe

Desenvolvido para **OE-SESCINC** - Operações Especiais do Serviço de Segurança Contra Incêndio

---

## 📞 Suporte

Para suporte e dúvidas, entre em contato com a equipe de desenvolvimento.

---

## 🔄 Changelog

### v1.0.0 (2025-11-29)

- ✅ Sistema completo de gestão
- ✅ Upload de arquivos
- ✅ Controle financeiro
- ✅ Dashboard de vencimentos
- ✅ Sistema de tarefas
- ✅ Gestão de documentos
- ✅ Montagem/desmontagem
- ✅ Checklists

---

**Desenvolvido com ❤️ para OE-SESCINC**
