import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDoctorEntity1753585003134 implements MigrationInterface {
    name = 'UpdateDoctorEntity1753585003134'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."doctors_status_enum" AS ENUM('onTime', 'delayed', 'unavailable')`);
        await queryRunner.query(`ALTER TABLE "doctors" ADD "status" "public"."doctors_status_enum" NOT NULL DEFAULT 'onTime'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "doctors" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."doctors_status_enum"`);
    }

}
