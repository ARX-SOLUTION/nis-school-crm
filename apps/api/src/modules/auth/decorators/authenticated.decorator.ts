import { SetMetadata } from '@nestjs/common';

export const ALLOW_ANY_ROLE_KEY = 'allowAnyRole';

/**
 * Decorator indicating that any authenticated user (regardless of role, including PARENT)
 * is authorized to access the route.
 */
export const Authenticated = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ALLOW_ANY_ROLE_KEY, true);

export const AllowAnyRole = Authenticated;
