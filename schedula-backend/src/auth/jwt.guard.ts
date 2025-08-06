import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

// The JwtGuard is a custom guard that extends the AuthGuard for JWT authentication
// It is used to protect routes that require a valid JWT token for access.

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}
