import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes';
import cors from 'cors';
import { generateRSAKeys } from './utils/crypto';
import { runMigrations } from './database/migration';
import { generateSelfSignedCert } from './utils/ssl';

dotenv.config();

async function startServer() {
  generateRSAKeys();
  await runMigrations();
  generateSelfSignedCert();

  const app = express();

  // ✅ Habilitar CORS para o frontend
  app.use(cors({
    origin: 'https://localhost:3001', // URL do frontend
    credentials: true // para enviar cookies
  }));

  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', routes);

  const certPath = path.join(__dirname, '../certs');
  const options = {
    key: fs.readFileSync(path.join(certPath, 'server.key')),
    cert: fs.readFileSync(path.join(certPath, 'server.cert')),
  };

  https.createServer(options, app).listen(process.env.PORT || 3000, () => {
    console.log(`✅ Backend rodando em https://localhost:${process.env.PORT || 3000}`);
  });
}

startServer();
