/**
 * Script de backup automático do banco de dados PostgreSQL
 * Executa backup usando pg_dump e salva com timestamp
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
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '30'); // Manter últimos 30 backups

// Criar diretório de backups se não existir
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

// Comando pg_dump
const pgDumpCommand = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USERNAME} -d ${DB_DATABASE} -F c -f "${backupFile}"`;

console.log(`🔄 Iniciando backup do banco de dados ${DB_DATABASE}...`);

exec(pgDumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Erro ao fazer backup: ${error.message}`);
    process.exit(1);
  }

  if (stderr) {
    console.warn(`⚠️  Avisos: ${stderr}`);
  }

  console.log(`✅ Backup criado com sucesso: ${backupFile}`);

  // Limpar backups antigos
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => file.startsWith('backup-') && file.endsWith('.sql'))
    .map((file) => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length > MAX_BACKUPS) {
    const filesToDelete = files.slice(MAX_BACKUPS);
    filesToDelete.forEach((file) => {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Backup antigo removido: ${file.name}`);
    });
  }

  console.log(`✨ Backup concluído! Total de backups: ${files.length}`);
  process.exit(0);
});

