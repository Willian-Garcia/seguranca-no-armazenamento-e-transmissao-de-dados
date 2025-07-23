# 🔐 Segurança no Armazenamento e Transmissão de Dados

## ✅ Descrição do Projeto
Este projeto implementa uma aplicação **cliente-servidor segura** para **cadastro de usuários** e **gerenciamento de contatos pessoais**, com foco em **segurança da informação** e boas práticas contra vulnerabilidades comuns.

### ⚡ O que este projeto oferece?
- **Autenticação segura** com JWT e bcrypt.
- **Proteção contra ataques comuns**: XSS, SQL Injection, CSRF.
- **Criptografia híbrida** (AES + RSA) para comunicação segura.
- **Criptografia de dados sensíveis em repouso** com AES-256-CBC.
- **Comunicação segura via HTTPS** com certificado autoassinado.

---

## ✅ Funcionalidades
- **Cadastro e Login de Usuários**
  - Senhas armazenadas com hash seguro (**bcrypt**).
  - Username criptografado antes de salvar no banco (**AES-256-CBC**).
- **Gerenciamento de Contatos**
  - Inserir, listar, atualizar e excluir contatos.
  - Nome e telefone criptografados com AES no banco.
- **Proteções Implementadas**
  - **Criptografia Híbrida (AES + RSA-OAEP)** entre frontend e backend.
  - **HTTPS** (SSL autoassinado).
  - **CSRF Tokens** em requisições sensíveis.
  - **Sanitização** de entradas para prevenir XSS.
  - **Prepared Statements** para evitar SQL Injection.
- **Exibição segura no frontend**
  - Mostra dados criptografados e opcionalmente descriptografados (`SHOW_PLAIN=true` no .env).

---

## ✅ Tecnologias Utilizadas
- **Frontend**: HTML, CSS, JavaScript puro.
- **Backend**: Node.js (Express).
- **Banco de Dados**: PostgreSQL.
- **Criptografia**:
  - RSA-OAEP (2048 bits) para chaves.
  - AES-256-CBC para dados.
  - bcrypt para senhas.
- **Segurança adicional**:
  - HTTPS com certificado SSL.
  - CSRF Protection.
  - Helmet para headers seguros.

---

### 📁 Estrutura do projeto
```
├── backend/
│   ├── certs/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   └── contactController.ts
│   │   ├── database/
│   │   │   ├── db.ts
│   │   │   └── migration.ts
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.ts
│   │   │   └── csrfMiddleware.ts
│   │   ├── routes/
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── selfsigned.d.ts
│   │   ├── utils/
│   │   │   ├── crypto.ts
│   │   │   ├── csrf.ts
│   │   │   ├── sanitize.ts
│   │   │   └── ssl.ts
│   │   └── index.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── public/
    │   ├── contatos.html
    │   ├── login.html
    │   ├──  register.html
    │   ├──  scripts.js
    │   └──  styles.css        
    ├── src/
    │   └── index.ts
    ├── .env
    ├── package.json
    └── tsconfig.json
```

---

## ✅ Como Executar

### 1. Clone o repositório
```bash
git clone <link-do-repositorio>
```

### 2. Instale dependências do backend
```bash
cd backend
npm install
```

### 3. Configure o arquivo .env
```bash
PORT=3000
BD_HOST=localhost
BD_USER=postgres
BD_PASSWORD=sua_senha
BD_DATABASE=bdseguranca
BD_PORT=5432
STORAGE_KEY=12345678901234567890123456789012
STORAGE_IV=1234567890123456
SHOW_PLAIN=true
```

### 4. Inicie o backend
```bash
npm start
```

### 5. Instale dependências do frontend
```bash
cd frontend
npm install
```

### 6. Inicie o frontend
```bash
npm start
```

### 7.  Acesse:
```bash
Backend: https://localhost:3000
Frontend: https://localhost:3001
```

---

## ✅ Fluxo de Segurança
  - **Frontend:** Criptografa dados com AES e a chave AES com RSA.
  - **Backend:** Descriptografa chave AES com RSA, descriptografa dados com AES, sanitiza e salva criptografado no banco.
  - **Comunicação via HTTPS**
  - **JWT** para autenticação.
  - **CSRF Token** para proteção adicional.

---

## ✅ Requisitos Atendidos
  ✅ Criptografia híbrida AES + RSA.
  ✅ Hash seguro para senhas (bcrypt).
  ✅ Proteção contra XSS, SQL Injection e CSRF.
  ✅ HTTPS com certificado autoassinado.
  ✅ Dados criptografados em repouso no banco.

## 🔐 Segurança em primeiro lugar!
    Este projeto segue as melhores práticas para proteger dados sensíveis e evitar vulnerabilidades comuns.