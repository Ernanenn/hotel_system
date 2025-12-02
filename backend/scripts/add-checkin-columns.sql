-- Script para adicionar colunas de check-in digital na tabela reservations
-- Execute este script no banco de dados PostgreSQL

-- Adicionar coluna qrCodeToken (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'qrCodeToken'
    ) THEN
        ALTER TABLE reservations ADD COLUMN "qrCodeToken" VARCHAR;
    END IF;
END $$;

-- Adicionar coluna checkedInAt (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'checkedInAt'
    ) THEN
        ALTER TABLE reservations ADD COLUMN "checkedInAt" TIMESTAMP;
    END IF;
END $$;

-- Adicionar coluna checkedOutAt (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'checkedOutAt'
    ) THEN
        ALTER TABLE reservations ADD COLUMN "checkedOutAt" TIMESTAMP;
    END IF;
END $$;

-- Criar índice único para qrCodeToken apenas quando não for NULL
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_reservations_qrCodeToken_unique" 
ON reservations ("qrCodeToken") 
WHERE "qrCodeToken" IS NOT NULL;

