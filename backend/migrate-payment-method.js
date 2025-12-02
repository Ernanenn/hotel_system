/**
 * Script para migrar valores 'stripe' para 'mock' na tabela payments
 * Execute este script antes de reiniciar o backend após a remoção do Stripe
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

async function migratePaymentMethod() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando migração de payment method...');
    
    // Verifica se há registros com 'stripe'
    const checkResult = await client.query(
      "SELECT COUNT(*) as count FROM payments WHERE method::text = 'stripe'"
    );
    const count = parseInt(checkResult.rows[0].count);
    
    if (count > 0) {
      console.log(`📊 Encontrados ${count} registros com method="stripe"`);
      
      // PRIMEIRA TRANSAÇÃO: Adiciona 'mock' ao enum
      await client.query('BEGIN');
      try {
        // Verifica se 'mock' já existe
        const enumCheck = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'mock' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payments_method_enum')
          ) as exists
        `);
        
        if (!enumCheck.rows[0].exists) {
          await client.query(
            "ALTER TYPE payments_method_enum ADD VALUE 'mock'"
          );
          console.log('✅ Valor "mock" adicionado ao enum');
        } else {
          console.log('ℹ️  Valor "mock" já existe no enum');
        }
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('ℹ️  Valor "mock" já existe no enum');
        } else {
          throw e;
        }
      }
      await client.query('COMMIT');
      
      // SEGUNDA TRANSAÇÃO: Atualiza os registros
      await client.query('BEGIN');
      const updateResult = await client.query(`
        UPDATE payments 
        SET method = 'mock'::payments_method_enum 
        WHERE method::text = 'stripe'
      `);
      await client.query('COMMIT');
      
      console.log(`✅ ${updateResult.rowCount} registros atualizados de 'stripe' para 'mock'`);
    } else {
      console.log('✅ Nenhum registro com method="stripe" encontrado.');
    }
    
    console.log('✅ Migração concluída com sucesso!');
    console.log('ℹ️  O TypeORM irá atualizar o enum na próxima sincronização.');
    
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {
      // Ignora erro de rollback se não houver transação ativa
    }
    console.error('❌ Erro durante a migração:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migratePaymentMethod()
  .then(() => {
    console.log('✨ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

