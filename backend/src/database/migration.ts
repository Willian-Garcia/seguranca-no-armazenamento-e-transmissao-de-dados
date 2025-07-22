import Pool from './db';

export async function runMigrations() {
  try {
    // Criar tabela users se não existir
    await Pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);

    // Criar tabela contacts se não existir
    await Pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(255) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('✅ Migrações executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
  }
}
