// data-source.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  entities: [
    'src/entities/*.ts',
    'src/availability/*.ts',
    'src/appointment/*.ts',
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
