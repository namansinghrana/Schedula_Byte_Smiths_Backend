import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  // The RolesGuard checks if the user has the required roles to access a route
  // It retrieves the roles metadata from the route handler and compares it with the user's role.
  // If the user has one of the required roles, access is granted; otherwise, it is denied.
  // If no roles are specified, access is granted by default.

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;
    const request = context
      .switchToHttp()
      .getRequest<{ user: { role: string } }>();
    const { user } = request;
    return requiredRoles.includes(user.role);
  }
}
