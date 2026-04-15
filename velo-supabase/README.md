# 🚗 Velo — Deploy com Vercel + Supabase

## Passo a Passo Completo

---

### PASSO 1: Criar conta no Supabase

1. Acesse **https://supabase.com** e clique "Start your project"
2. Faça login com GitHub
3. Clique "New Project"
4. Preencha:
   - **Name:** `velo`
   - **Database Password:** anote essa senha!
   - **Region:** South America (São Paulo)
5. Clique "Create new project" e espere ~2 min

---

### PASSO 2: Criar as tabelas no Supabase

1. No painel do Supabase, vá em **SQL Editor** (menu lateral esquerdo)
2. Clique **"New query"**
3. Abra o arquivo `supabase-schema.sql` deste projeto
4. Copie TODO o conteúdo e cole no editor SQL
5. Clique **"Run"** (botão verde)
6. Deve aparecer "Success" — todas as tabelas, indexes, policies e triggers foram criados

---

### PASSO 3: Configurar autenticação

1. No Supabase, vá em **Authentication** > **Providers**
2. Certifique-se que **Email** está habilitado
3. Em **Authentication** > **Settings**:
   - Desmarque "Enable email confirmations" (para facilitar nos testes)
   - Clique "Save"

---

### PASSO 4: (Opcional) Criar bucket de storage para LADV

1. No Supabase, vá em **Storage**
2. Clique "New bucket"
3. Nome: `documents`
4. Marque "Public bucket"
5. Clique "Create bucket"

---

### PASSO 5: Pegar as chaves do Supabase

1. No Supabase, vá em **Settings** > **API**
2. Copie:
   - **Project URL** → ex: `https://abcdefg.supabase.co`
   - **anon public** key → a chave grande que começa com `eyJ...`

---

### PASSO 6: Subir o código no GitHub

1. Crie um repositório no GitHub (ex: `velo`)
2. No terminal:

```bash
cd velo-supabase
git init
git add .
git commit -m "Velo - projeto completo"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/velo.git
git push -u origin main
```

---

### PASSO 7: Deploy na Vercel

1. Acesse **https://vercel.com** e faça login com GitHub
2. Clique **"Add New" > "Project"**
3. Selecione o repositório `velo`
4. Em **Environment Variables**, adicione:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://abcdefg.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...sua-chave-aqui` |

5. Clique **"Deploy"**
6. Em ~1 minuto seu app estará online! 🎉

---

### PASSO 8: Testar

1. Acesse a URL que a Vercel gerou (ex: `velo-abc123.vercel.app`)
2. Cadastre uma conta de instrutor e uma de aluno
3. Teste o fluxo completo

---

## Estrutura do Projeto

```
velo-supabase/
├── src/
│   ├── App.tsx              # Aplicação React principal
│   ├── main.tsx             # Entry point
│   ├── index.css            # Estilos globais + Tailwind
│   └── lib/
│       ├── supabase.ts      # Cliente Supabase
│       ├── api.ts           # Todas as funções de dados
│       └── utils.ts         # Utilitários CSS
├── supabase-schema.sql      # SQL para criar tudo no Supabase
├── package.json
├── vite.config.ts
├── .env.example             # Template das variáveis
└── README.md                # Este arquivo
```

## Arquitetura

```
┌─────────────┐     ┌──────────────────┐
│   Vercel     │     │    Supabase      │
│  (Frontend)  │────▶│  PostgreSQL      │
│  React+Vite  │     │  Auth            │
│              │     │  Storage         │
└─────────────┘     └──────────────────┘
```

- **Sem servidor backend** — o frontend fala direto com o Supabase
- **Auth** gerenciado pelo Supabase (email/senha)
- **RLS (Row Level Security)** protege os dados no banco
- **Triggers** calculam rating automaticamente

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion |
| Banco + Auth | Supabase (PostgreSQL) |
| Hospedagem | Vercel |

## Comandos locais

```bash
npm install          # Instala dependências
npm run dev          # Roda local em http://localhost:3000
npm run build        # Build para produção
```
