const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const API_URL = 'http://localhost:3000/api';

async function testLogin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hotel.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  console.log('🔐 Testando login do admin...\n');
  console.log(`Email: ${adminEmail}`);
  console.log(`Senha: ${adminPassword}\n`);
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });
    
    console.log('✅ Login bem-sucedido!');
    console.log('\n📋 Dados do usuário:');
    console.log(JSON.stringify(response.data.user, null, 2));
    console.log('\n🔑 Token gerado:', response.data.access_token.substring(0, 50) + '...');
  } catch (error) {
    if (error.response) {
      console.error('❌ Erro no login:');
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Mensagem: ${error.response.data.message || error.response.data}`);
    } else if (error.request) {
      console.error('❌ Erro: Backend não está respondendo');
      console.error('   Verifique se o backend está rodando em http://localhost:3000');
    } else {
      console.error('❌ Erro:', error.message);
    }
  }
}

testLogin();

