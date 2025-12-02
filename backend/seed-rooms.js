const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'hotel_db',
});

const rooms = [
  {
    number: '101',
    type: 'single',
    pricePerNight: 80.00,
    description: 'Quarto aconchegante para uma pessoa, com cama de solteiro, TV, WiFi e banheiro privativo.',
    amenities: ['WiFi', 'TV', 'Ar Condicionado', 'Banheiro Privativo'],
    maxOccupancy: 1,
    isAvailable: true,
  },
  {
    number: '102',
    type: 'single',
    pricePerNight: 80.00,
    description: 'Quarto aconchegante para uma pessoa, com cama de solteiro, TV, WiFi e banheiro privativo.',
    amenities: ['WiFi', 'TV', 'Ar Condicionado', 'Banheiro Privativo'],
    maxOccupancy: 1,
    isAvailable: true,
  },
  {
    number: '201',
    type: 'double',
    pricePerNight: 120.00,
    description: 'Quarto espaçoso para casal, com cama de casal, TV, WiFi, minibar e banheiro privativo.',
    amenities: ['WiFi', 'TV', 'Ar Condicionado', 'Minibar', 'Banheiro Privativo'],
    maxOccupancy: 2,
    isAvailable: true,
  },
  {
    number: '202',
    type: 'double',
    pricePerNight: 120.00,
    description: 'Quarto espaçoso para casal, com cama de casal, TV, WiFi, minibar e banheiro privativo.',
    amenities: ['WiFi', 'TV', 'Ar Condicionado', 'Minibar', 'Banheiro Privativo'],
    maxOccupancy: 2,
    isAvailable: true,
  },
  {
    number: '203',
    type: 'double',
    pricePerNight: 120.00,
    description: 'Quarto espaçoso para casal, com cama de casal, TV, WiFi, minibar e banheiro privativo.',
    amenities: ['WiFi', 'TV', 'Ar Condicionado', 'Minibar', 'Banheiro Privativo'],
    maxOccupancy: 2,
    isAvailable: true,
  },
  {
    number: '301',
    type: 'suite',
    pricePerNight: 200.00,
    description: 'Suíte luxuosa com sala de estar, cama king size, TV de tela plana, WiFi, minibar completo e banheira.',
    amenities: ['WiFi', 'TV de Tela Plana', 'Ar Condicionado', 'Minibar', 'Banheira', 'Sala de Estar', 'Varanda'],
    maxOccupancy: 2,
    isAvailable: true,
  },
  {
    number: '302',
    type: 'suite',
    pricePerNight: 200.00,
    description: 'Suíte luxuosa com sala de estar, cama king size, TV de tela plana, WiFi, minibar completo e banheira.',
    amenities: ['WiFi', 'TV de Tela Plana', 'Ar Condicionado', 'Minibar', 'Banheira', 'Sala de Estar', 'Varanda'],
    maxOccupancy: 2,
    isAvailable: true,
  },
  {
    number: '401',
    type: 'deluxe',
    pricePerNight: 300.00,
    description: 'Suíte Deluxe premium com vista panorâmica, sala de estar ampla, cama king size, TV 4K, WiFi de alta velocidade, minibar premium e spa.',
    amenities: ['WiFi de Alta Velocidade', 'TV 4K', 'Ar Condicionado', 'Minibar Premium', 'Spa', 'Sala de Estar', 'Varanda com Vista', 'Room Service 24h'],
    maxOccupancy: 3,
    isAvailable: true,
  },
  {
    number: '402',
    type: 'deluxe',
    pricePerNight: 300.00,
    description: 'Suíte Deluxe premium com vista panorâmica, sala de estar ampla, cama king size, TV 4K, WiFi de alta velocidade, minibar premium e spa.',
    amenities: ['WiFi de Alta Velocidade', 'TV 4K', 'Ar Condicionado', 'Minibar Premium', 'Spa', 'Sala de Estar', 'Varanda com Vista', 'Room Service 24h'],
    maxOccupancy: 3,
    isAvailable: true,
  },
];

async function seedRooms() {
  try {
    await client.connect();
    console.log('🔄 Conectado ao banco de dados...\n');
    
    // Verificar se a tabela rooms existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'rooms'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela rooms não existe ainda. O backend precisa iniciar primeiro.');
      await client.end();
      return;
    }
    
    // Verificar quartos existentes
    const existingRooms = await client.query('SELECT number FROM rooms');
    console.log(`📊 Quartos existentes: ${existingRooms.rows.length}\n`);
    
    if (existingRooms.rows.length > 0) {
      console.log('⚠️ Já existem quartos cadastrados:');
      existingRooms.rows.forEach(room => {
        console.log(`   - Quarto ${room.number}`);
      });
      console.log('\n💡 Deseja adicionar mais quartos mesmo assim? (S/N)');
      console.log('   (Execute o script novamente para adicionar)\n');
    }
    
    // Inserir quartos
    console.log('📝 Inserindo quartos...\n');
    let inserted = 0;
    let skipped = 0;
    
    for (const room of rooms) {
      try {
        // Verificar se o quarto já existe
        const exists = await client.query('SELECT id FROM rooms WHERE number = $1', [room.number]);
        
        if (exists.rows.length > 0) {
          console.log(`⏭️  Quarto ${room.number} já existe, pulando...`);
          skipped++;
          continue;
        }
        
        await client.query(`
          INSERT INTO rooms (number, type, "pricePerNight", description, amenities, "maxOccupancy", "isAvailable")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          room.number,
          room.type,
          room.pricePerNight,
          room.description,
          room.amenities,
          room.maxOccupancy,
          room.isAvailable,
        ]);
        
        console.log(`✅ Quarto ${room.number} (${room.type}) - $${room.pricePerNight}/noite`);
        inserted++;
      } catch (error) {
        console.error(`❌ Erro ao inserir quarto ${room.number}:`, error.message);
      }
    }
    
    console.log(`\n📈 Resumo:`);
    console.log(`   ✅ Inseridos: ${inserted}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   📊 Total no banco: ${existingRooms.rows.length + inserted}`);
    
    await client.end();
    console.log('\n✅ Processo concluído!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

seedRooms();

