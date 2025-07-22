import fs from 'fs';
import path from 'path';
const selfsigned = require('selfsigned');

export function generateSelfSignedCert() {
  const certDir = path.join(__dirname, '../../certs');
  const keyPath = path.join(certDir, 'server.key');
  const certPath = path.join(certDir, 'server.cert');

  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir);
  }

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048 });

    // Aceitar RSA PRIVATE KEY
    if (
      (!pems.private.includes('BEGIN RSA PRIVATE KEY') && !pems.private.includes('BEGIN PRIVATE KEY')) ||
      !pems.cert.includes('BEGIN CERTIFICATE')
    ) {
      console.error('Conteúdo da chave:', pems.private);
      throw new Error('❌ Certificado inválido gerado!');
    }

    fs.writeFileSync(keyPath, pems.private, { encoding: 'utf8' });
    fs.writeFileSync(certPath, pems.cert, { encoding: 'utf8' });
    console.log('✅ Certificado SSL autoassinado gerado com sucesso!');
  }
}
