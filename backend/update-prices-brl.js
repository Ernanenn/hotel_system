const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'hotel_db',
});

// Conversão aproximada USD para BRL (considerando ~5.5)
const rooms = [
  { number: '101', type: 'single', pricePerNight: 150.00 },    // ~$80 * 1.875
  { number: '102', type: 'single', pricePerNight: 150.00 },
  { number: '201', type: 'double', pricePerNight: 220.00 },    // ~$120 * 1.83
  { number: '202', type: 'double', pricePerNight: 220.00 },
  { number: '203', type: 'double', pricePerNight: 220.00 },
  { number: '301', type: 'suite', pricePerNight: 380.00 },     // ~$200 * 1.9
  { number: '302', type: 'suite', pricePerNight: 380.00 },
  { number: '401', type: 'deluxe', pricePerNight: 550.00 },   // ~$300 * 1.83
  { number: '402', type: 'deluxe', pricePerNight: 550.00 },
];

async function updatePrices() {
  try {
    await client.connect();
    console.log('🔄 Conectado ao banco de dados...\n');
    
    console.log('💰 Atualizando preços para Real Brasileiro (R$)...\n');
    
    for (const room of rooms) {
      try {
        await client.query(
          'UPDATE rooms SET "pricePerNight" = $1 WHERE number = $2',
          [room.pricePerNight, room.number]
        );
        console.log(`✅ Quarto ${room.number} (${room.type}): R$ ${room.pricePerNight.toFixed(2)}/noite`);
      } catch (error) {
        console.error(`❌ Erro ao atualizar quarto ${room.number}:`, error.message);
      }
    }
    
    // Verificar preços atualizados
    console.log('\n📊 Preços atualizados:');
    const result = await client.query(`
      SELECT number, type, "pricePerNight"
      FROM rooms
      ORDER BY number
    `);
    
    result.rows.forEach(room => {
      console.log(`   Quarto ${room.number} (${room.type}): R$ ${parseFloat(room.pricePerNight).toFixed(2)}/noite`);
    });
    
    await client.end();
    console.log('\n✅ Preços atualizados para Real Brasileiro!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

updatePrices();

