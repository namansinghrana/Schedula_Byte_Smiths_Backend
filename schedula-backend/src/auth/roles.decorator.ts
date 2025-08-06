import { SetMetadata } from '@nestjs/common';

// The ROLES_KEY is a constant used to define the metadata key for roles
// The Roles decorator is used to specify the roles required for a route or handler

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
