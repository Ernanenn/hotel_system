/**
 * Script para recriar o enum payments_method_enum sem o valor 'stripe'
 * Execute este script após a migração dos dados
 */

require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'hotel_db',
});

async function recreateEnum() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Recriando enum payments_method_enum...');
    
    await client.query('BEGIN');
    
    // Verifica se ainda há registros com 'stripe'
    const checkResult = await client.query(
      "SELECT COUNT(*) as count FROM payments WHERE method::text = 'stripe'"
    );
    const count = parseInt(checkResult.rows[0].count);
    
    if (count > 0) {
      throw new Error(`Ainda existem ${count} registros com method="stripe". Execute migrate-payment-method.js primeiro.`);
    }
    
    // Remove o default primeiro
    await client.query(`
      ALTER TABLE payments 
      ALTER COLUMN method DROP DEFAULT
    `);
    console.log('✅ Default removido');
    
    // Remove a constraint do enum da coluna
    await client.query(`
      ALTER TABLE payments 
      ALTER COLUMN method TYPE text
    `);
    console.log('✅ Coluna method convertida para text temporariamente');
    
    // Remove o enum antigo
    await client.query(`
      DROP TYPE IF EXISTS payments_method_enum_old
    `);
    
    await client.query(`
      DROP TYPE IF EXISTS payments_method_enum CASCADE
    `);
    console.log('✅ Enum antigo removido');
    
    // Cria o novo enum apenas com 'mock' e 'cash'
    await client.query(`
      CREATE TYPE payments_method_enum AS ENUM ('mock', 'cash')
    `);
    console.log('✅ Novo enum criado com valores: mock, cash');
    
    // Converte a coluna de volta para o enum
    await client.query(`
      ALTER TABLE payments 
      ALTER COLUMN method TYPE payments_method_enum USING method::payments_method_enum
    `);
    console.log('✅ Coluna method convertida de volta para enum');
    
    // Restaura o default
    await client.query(`
      ALTER TABLE payments 
      ALTER COLUMN method SET DEFAULT 'mock'::payments_method_enum
    `);
    console.log('✅ Default restaurado');
    
    await client.query('COMMIT');
    console.log('✅ Enum recriado com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante a recriação do enum:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

recreateEnum()
  .then(() => {
    console.log('✨ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

