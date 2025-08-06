import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';

//This is a test file for the AuthController in a NestJS application
// It sets up the testing module and checks if the controller is defined.

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
