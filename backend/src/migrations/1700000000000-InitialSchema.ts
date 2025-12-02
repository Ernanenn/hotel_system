import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Esta migration documenta o schema inicial
    // Como o banco já está sincronizado, esta migration serve como baseline
    // Migrations futuras serão criadas a partir deste ponto
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback não aplicável para migration inicial
  }
}

