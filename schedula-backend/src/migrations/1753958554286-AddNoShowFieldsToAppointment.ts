import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNoShowFieldsToAppointment1753958554286 implements MigrationInterface {
    name = 'AddNoShowFieldsToAppointment1753958554286'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_3330f054416745deaa2cc130700"`);
        await queryRunner.query(`CREATE TABLE "waitlist_entries" ("id" SERIAL NOT NULL, "doctor_id" integer NOT NULL, "patient_id" integer NOT NULL, "reason" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "status" character varying NOT NULL DEFAULT 'pending', CONSTRAINT "PK_bd0ef66fff81d3be7b7a1568a4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "reporting_time"`);
        await queryRunner.query(`CREATE TYPE "public"."doctors_status_enum" AS ENUM('onTime', 'delayed', 'unavailable')`);
        await queryRunner.query(`ALTER TABLE "doctors" ADD "status" "public"."doctors_status_enum" NOT NULL DEFAULT 'onTime'`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "is_no_show" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "penalty_applied" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "waitlist_entries" ADD CONSTRAINT "FK_6c51eb6187487f747bbd9c6d2e5" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "waitlist_entries" ADD CONSTRAINT "FK_47850a846eddee2db5ff7a85c42" FOREIGN KEY ("patient_id") REFERENCES "patients"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_3330f054416745deaa2cc130700" FOREIGN KEY ("patient_id") REFERENCES "patients"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_3330f054416745deaa2cc130700"`);
        await queryRunner.query(`ALTER TABLE "waitlist_entries" DROP CONSTRAINT "FK_47850a846eddee2db5ff7a85c42"`);
        await queryRunner.query(`ALTER TABLE "waitlist_entries" DROP CONSTRAINT "FK_6c51eb6187487f747bbd9c6d2e5"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "penalty_applied"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "is_no_show"`);
        await queryRunner.query(`ALTER TABLE "doctors" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."doctors_status_enum"`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "reporting_time" TIMESTAMP`);
        await queryRunner.query(`DROP TABLE "waitlist_entries"`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_3330f054416745deaa2cc130700" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
