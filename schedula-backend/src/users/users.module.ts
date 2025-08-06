// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // ✅ add this line
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService], // ✅ export if other modules use it
})
export class UsersModule {}
