import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

// This is a test file for the AuthService in a NestJS application
// It sets up the testing module and checks if the service is defined.
// It is used to ensure that the AuthService can be instantiated correctly.
// It does not test any specific functionality of the service.

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
