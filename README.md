# 🎸 Mevam Scale - Gestão de Voluntários

O **Mevam Scale** é um sistema de gestão de escalas desenvolvido para o departamento de música (Worship) da **Mevam Santana**. O projeto visa facilitar a confirmação de presença e organização dos voluntários em cultos e eventos.

## 🚀 Tecnologias Utilizadas

### Frontend
- **React.js** com Vite
- **Tailwind CSS** (Estilização baseada na identidade visual da Mevam)
- **Axios** (Integração com API)

### Backend
- **Node.js** com Express
- **PostgreSQL** (Banco de dados relacional)
- **JWT** (Autenticação segura)
- **Bcrypt** (Criptografia de senhas)

### Infraestrutura
- **Docker** & **Docker Compose** (Containerização do banco de dados)

## 🛠️ Status do Projeto

- [x] Configuração do Banco de Dados (Postgres via Docker)
- [x] API de Usuários e Login
- [x] Interface de Login (UI/UX baseada no Mevam Music)
- [x] Integração Frontend-Backend
- [ ] Dashboard de Escalas (Em desenvolvimento)
- [ ] Confirmação de presença via App

## 🔧 Como rodar o projeto

1. **Subir o Banco de Dados:**
   ```bash
   docker-compose up
   ```
2. ***Rodar o Backend:***
   ```bash
   cd backend
   node index.js
   ```
3. ***Rodar o frontend:***
   ```bash
   cd frontend
   npm run dev
   ```
   ---------------

   Desenvolvido por Matheus de Paula 🚀
