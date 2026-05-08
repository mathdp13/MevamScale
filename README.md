# MevamScale

Sistema de gestão de escalas e voluntários desenvolvido para o departamento de música da **Mevam Santana**. Permite que admins organizem cultos, atribuam voluntários e acompanhem confirmações de presença — tudo via web, com experiência de webapp no celular.

---

## Funcionalidades

- **Autenticacao** — Login com email/senha ou Google OAuth, registro com onboarding
- **Ministerios** — Criar ministério, entrar por código de acesso, gerenciar membros e funções
- **Escalas** — Criar escalas manualmente ou gerar o mês inteiro automaticamente a partir de tipos de culto recorrentes (ex: "Culto de Domingo" toda semana)
- **Membros nas escalas** — Admin adiciona voluntários com função específica; cada voluntário confirma ou desconfirma presença
- **Agenda pessoal** — Voluntário vê todos os eventos em que está escalado (de todos os ministérios) em um único lugar, com confirmação de presença inline
- **Perfil** — Foto de perfil, nome, telefone, data de nascimento — modo visualização e modo edição separados
- **Mobile-first** — Bottom navigation bar, sem delay de toque, scroll com momentum, suporte a notch do iPhone (PWA-like)

---

## Stack

### Frontend
- React 19 + Vite
- Tailwind CSS v4
- React Router v7
- Axios
- Lucide React (ícones)
- React Hot Toast

### Backend
- Node.js + Express 5
- PostgreSQL (Neon DB)
- JWT (autenticação)
- Bcrypt (senhas)
- Google Auth Library (OAuth)

### Infraestrutura
- Vercel (deploy frontend + backend serverless)
- Neon (PostgreSQL gerenciado)
- Docker Compose (banco local para desenvolvimento)

---

## Arquitetura

### Monorepo

O projeto é um monorepo com dois pacotes independentes na mesma raiz:

```
MevamScale/
├── backend/        # API Express (Node.js)
├── frontend/       # SPA React (Vite)
├── vercel.json     # Configuração de deploy unificado
└── docker-compose.yml
```

O `vercel.json` orquestra os dois builds: o backend é servido como função serverless em `/api/*` e o frontend como site estático nas demais rotas.

### Clean Architecture (backend)

O backend segue os princípios de Clean Architecture, separando responsabilidades em camadas:

```
backend/src/
├── domain/
│   └── entities/          # Entidades de negócio (Usuario, etc.)
├── application/
│   └── usecases/          # Regras de negócio por feature
│       ├── auth/
│       ├── usuarios/
│       ├── ministerios/
│       └── escalas/
├── infrastructure/
│   ├── database/          # Pool PostgreSQL e migrations
│   └── repositories/      # Implementações concretas (Pg*)
└── api/
    ├── controllers/       # Adaptadores HTTP
    └── routes/            # Registro de rotas Express
```

**Fluxo de uma requisição:**

```
Request → Route → Controller → UseCase → Repository → PostgreSQL
```

- **Entities** — objetos de domínio sem dependência de framework
- **UseCases** — orquestram a lógica de negócio, recebem o repositório por injeção de dependência
- **Repositories** — abstraem o acesso ao banco; os use cases dependem da interface, não da implementação concreta
- **Controllers** — traduzem HTTP para chamadas de use case e vice-versa

Essa separação permite trocar o banco, o framework HTTP ou qualquer camada de infraestrutura sem tocar nas regras de negócio.

---

## Como rodar localmente

**Pré-requisito:** Node.js 18+ e Docker instalados.

1. Suba o banco local:
   ```bash
   docker-compose up -d
   ```

2. Configure o `.env` na raiz do projeto:
   ```env
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/mevamscale
   JWT_SECRET=sua_chave_secreta
   GOOGLE_CLIENT_ID=opcional
   ```

3. Rode o backend (migrations rodam automaticamente):
   ```bash
   cd backend
   node index.js
   ```

4. Rode o frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## Deploy

O projeto roda no Vercel conectado ao Neon (PostgreSQL serverless). As migrations são executadas automaticamente na primeira requisição após cada deploy — não é necessário nenhum passo manual.

---

Desenvolvido por Matheus de Paula Silva
