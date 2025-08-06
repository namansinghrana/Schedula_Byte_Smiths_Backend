import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDefaultSlotDurationToDoctor1680000000001 implements MigrationInterface {
    name = 'AddDefaultSlotDurationToDoctor1680000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctors" ADD "defaultSlotDuration" integer NOT NULL DEFAULT 10`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctors" DROP COLUMN "defaultSlotDuration"`);
    }
}
