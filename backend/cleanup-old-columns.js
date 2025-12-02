/**
 * Script para remover colunas e constraints antigas do Stripe
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

async function cleanupOldColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Limpando colunas e constraints antigas do Stripe...');
    
    await client.query('BEGIN');
    
    // Verifica se a coluna stripePaymentIntentId ainda existe
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name IN ('stripePaymentIntentId', 'stripeSessionId')
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log(`📋 Colunas antigas encontradas: ${columnCheck.rows.map(r => r.column_name).join(', ')}`);
      
      // Remove constraints primeiro
      try {
        await client.query(`
          ALTER TABLE payments 
          DROP CONSTRAINT IF EXISTS UQ_57059f281caef51ef1c15adaf35
        `);
        console.log('✅ Constraint única antiga removida');
      } catch (e) {
        console.log('ℹ️  Constraint já foi removida ou não existe');
      }
      
      // Remove as colunas
      for (const row of columnCheck.rows) {
        try {
          await client.query(`
            ALTER TABLE payments 
            DROP COLUMN IF EXISTS "${row.column_name}"
          `);
          console.log(`✅ Coluna ${row.column_name} removida`);
        } catch (e) {
          console.log(`⚠️  Erro ao remover coluna ${row.column_name}:`, e.message);
        }
      }
    } else {
      console.log('✅ Nenhuma coluna antiga encontrada');
    }
    
    await client.query('COMMIT');
    console.log('✅ Limpeza concluída com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante a limpeza:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupOldColumns()
  .then(() => {
    console.log('✨ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

