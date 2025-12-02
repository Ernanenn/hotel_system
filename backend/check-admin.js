const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'hotel_db',
});

async function checkAdmin() {
  try {
    await client.connect();
    
    // Verificar se a tabela users existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela users não existe ainda. O backend precisa iniciar primeiro.');
      await client.end();
      return;
    }
    
    // Verificar usuários admin
    console.log('🔍 Verificando usuários admin...\n');
    const adminUsers = await client.query(`
      SELECT id, email, "firstName", "lastName", role, "isActive", "createdAt"
      FROM users 
      WHERE role = 'admin';
    `);
    
    if (adminUsers.rows.length === 0) {
      console.log('⚠️ Nenhum usuário admin encontrado!');
      console.log('\n📝 Criando usuário admin...\n');
      
      const bcrypt = require('bcrypt');
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@hotel.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const result = await client.query(`
        INSERT INTO users (email, password, "firstName", "lastName", role, "isActive")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, "firstName", "lastName", role;
      `, [adminEmail, hashedPassword, 'Admin', 'User', 'admin', true]);
      
      console.log('✅ Usuário admin criado com sucesso!');
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Senha: ${adminPassword}`);
      console.log(`   Role: ${result.rows[0].role}`);
    } else {
      console.log('✅ Usuários admin encontrados:');
      adminUsers.rows.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.email}`);
        console.log(`      Nome: ${user.firstName} ${user.lastName}`);
        console.log(`      Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
        console.log(`      Criado em: ${user.createdAt}`);
      });
    }
    
    // Verificar todos os usuários
    console.log('\n📊 Todos os usuários no banco:');
    const allUsers = await client.query(`
      SELECT email, role, "isActive"
      FROM users
      ORDER BY "createdAt";
    `);
    
    allUsers.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.isActive ? 'Ativo' : 'Inativo'}`);
    });
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkAdmin();

