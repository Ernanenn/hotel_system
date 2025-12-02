-- Script para adicionar suporte multi-tenant (hotéis)
-- Execute este script no banco de dados PostgreSQL

-- 1. Criar tabela hotels (se não existir)
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  subdomain VARCHAR UNIQUE,
  address VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  state VARCHAR NOT NULL,
  "zipCode" VARCHAR NOT NULL,
  country VARCHAR NOT NULL,
  phone VARCHAR,
  email VARCHAR,
  website VARCHAR,
  description TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar hotel padrão (se não existir)
INSERT INTO hotels (id, name, subdomain, address, city, state, "zipCode", country, "isActive")
SELECT 
  gen_random_uuid(),
  'Hotel Padrão',
  'default',
  'Endereço não informado',
  'Cidade não informada',
  'Estado não informado',
  '00000-000',
  'Brasil',
  true
WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE subdomain = 'default');

-- 3. Adicionar coluna hotelId na tabela rooms (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'hotelId'
    ) THEN
        ALTER TABLE rooms ADD COLUMN "hotelId" UUID;
        
        -- Preencher com hotel padrão
        UPDATE rooms SET "hotelId" = (SELECT id FROM hotels WHERE subdomain = 'default' LIMIT 1);
        
        -- Tornar obrigatório
        ALTER TABLE rooms ALTER COLUMN "hotelId" SET NOT NULL;
        
        -- Adicionar foreign key
        ALTER TABLE rooms ADD CONSTRAINT "FK_rooms_hotel" 
        FOREIGN KEY ("hotelId") REFERENCES hotels(id) ON DELETE CASCADE;
        
        -- Criar índice
        CREATE INDEX IF NOT EXISTS "IDX_rooms_hotelId" ON rooms("hotelId");
    END IF;
END $$;

-- 4. Adicionar coluna hotelId na tabela reservations (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'hotelId'
    ) THEN
        ALTER TABLE reservations ADD COLUMN "hotelId" UUID;
        
        -- Preencher com hotel padrão
        UPDATE reservations SET "hotelId" = (SELECT id FROM hotels WHERE subdomain = 'default' LIMIT 1);
        
        -- Tornar obrigatório
        ALTER TABLE reservations ALTER COLUMN "hotelId" SET NOT NULL;
        
        -- Adicionar foreign key
        ALTER TABLE reservations ADD CONSTRAINT "FK_reservations_hotel" 
        FOREIGN KEY ("hotelId") REFERENCES hotels(id) ON DELETE CASCADE;
        
        -- Criar índice
        CREATE INDEX IF NOT EXISTS "IDX_reservations_hotelId" ON reservations("hotelId");
    END IF;
END $$;

-- 5. Remover unique constraint do número do quarto (agora é único por hotel)
DO $$
BEGIN
    -- Verificar se existe constraint unique no número
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UQ_rooms_number'
    ) THEN
        ALTER TABLE rooms DROP CONSTRAINT "UQ_rooms_number";
    END IF;
END $$;

-- 6. Criar índice único composto (hotelId + number)
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rooms_hotel_number_unique" 
ON rooms("hotelId", "number");

