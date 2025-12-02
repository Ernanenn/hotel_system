/**
 * Script para restaurar backup do banco de dados PostgreSQL
 * Uso: node restore-database.js <arquivo-backup>
 */

require('dotenv').config({ path: '../.env' });
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_DATABASE = process.env.DB_DATABASE || 'hotel_db';

const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ Por favor, forneça o arquivo de backup');
  console.error('Uso: node restore-database.js <arquivo-backup>');
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.error(`❌ Arquivo de backup não encontrado: ${backupFile}`);
  process.exit(1);
}

console.log(`⚠️  ATENÇÃO: Isso irá substituir todos os dados do banco ${DB_DATABASE}!`);
console.log(`🔄 Restaurando backup: ${backupFile}...`);

// Comando pg_restore
const pgRestoreCommand = `PGPASSWORD="${DB_PASSWORD}" pg_restore -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USERNAME} -d ${DB_DATABASE} -c "${backupFile}"`;

exec(pgRestoreCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Erro ao restaurar backup: ${error.message}`);
    process.exit(1);
  }

  if (stderr) {
    console.warn(`⚠️  Avisos: ${stderr}`);
  }

  console.log(`✅ Backup restaurado com sucesso!`);
  process.exit(0);
});

