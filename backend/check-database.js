const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'hotel_db',
});

async function checkDatabase() {
  try {
    console.log('🔄 Conectando ao banco de dados...\n');
    await client.connect();
    
    // Verificar se as tabelas foram criadas
    console.log('📊 Verificando tabelas criadas...\n');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const expectedTables = ['users', 'rooms', 'reservations', 'payments', 'notifications'];
    const createdTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('✅ Tabelas encontradas:');
    createdTables.forEach(table => {
      const isExpected = expectedTables.includes(table);
      console.log(`   ${isExpected ? '✅' : '⚠️'} ${table}`);
    });
    
    console.log('\n📋 Tabelas esperadas:');
    expectedTables.forEach(table => {
      const exists = createdTables.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });
    
    // Verificar estrutura de algumas tabelas principais
    if (createdTables.includes('users')) {
      console.log('\n🔍 Estrutura da tabela users:');
      const usersColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      usersColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    }
    
    if (createdTables.includes('rooms')) {
      console.log('\n🔍 Estrutura da tabela rooms:');
      const roomsColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'rooms'
        ORDER BY ordinal_position;
      `);
      roomsColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    }
    
    // Verificar se há dados
    console.log('\n📈 Contagem de registros:');
    for (const table of createdTables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${countResult.rows[0].count} registros`);
      } catch (err) {
        console.log(`   ${table}: erro ao contar`);
      }
    }
    
    await client.end();
    console.log('\n✅ Verificação concluída!');
    
    // Verificar se todas as tabelas esperadas foram criadas
    const allTablesExist = expectedTables.every(table => createdTables.includes(table));
    if (allTablesExist) {
      console.log('\n🎉 Todas as tabelas foram criadas com sucesso!');
    } else {
      console.log('\n⚠️ Algumas tabelas estão faltando. Verifique os logs do backend.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkDatabase();

