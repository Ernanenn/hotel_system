/**
 * Script para verificar e remover constraints únicas desnecessárias
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

async function checkConstraints() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando constraints na tabela payments...');
    
    // Lista todas as constraints únicas
    const result = await client.query(`
      SELECT 
        conname as constraint_name,
        a.attname as column_name
      FROM pg_constraint con
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
      WHERE con.conrelid = 'payments'::regclass
      AND con.contype = 'u'
      ORDER BY conname;
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ Nenhuma constraint única encontrada');
    } else {
      console.log('\n📋 Constraints únicas encontradas:');
      result.rows.forEach(row => {
        console.log(`  - ${row.constraint_name} (coluna: ${row.column_name})`);
      });
    }
    
    // Verifica se há constraint única no paymentIntentId que precisa ser removida
    const paymentIntentConstraint = result.rows.find(
      row => row.column_name === 'paymentIntentId'
    );
    
    if (paymentIntentConstraint) {
      console.log(`\n⚠️  Constraint única encontrada em paymentIntentId: ${paymentIntentConstraint.constraint_name}`);
      console.log('ℹ️  Esta constraint será gerenciada pelo TypeORM na próxima sincronização.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkConstraints()
  .then(() => {
    console.log('\n✨ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

