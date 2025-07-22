import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Caminho para os certificados (pode ser compartilhado com backend)
const certPath = path.join(__dirname, '../../backend/certs');
const options = {
  key: fs.readFileSync(path.join(certPath, 'server.key')),
  cert: fs.readFileSync(path.join(certPath, 'server.cert'))
};

// Servir arquivos estáticos da pasta public
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Rota padrão -> login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'login.html'));
});

app.get('/login', (req, res) => res.sendFile(path.join(publicDir, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(publicDir, 'register.html')));
app.get('/contatos', (req, res) => res.sendFile(path.join(publicDir, 'contatos.html')));

https.createServer(options, app).listen(PORT, () => {
  console.log(`✅ Frontend rodando em https://localhost:${PORT}`);
});
