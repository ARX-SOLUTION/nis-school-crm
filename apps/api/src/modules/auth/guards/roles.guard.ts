import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RoleName, hasRoleAtLeast } from '../../../common/enums/role.enum';
import { ALLOW_ANY_ROLE_KEY } from '../decorators/authenticated.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    const allowAnyRole = this.reflector.getAllAndOverride<boolean>(ALLOW_ANY_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowAnyRole) return true;

    const required = this.reflector.getAllAndOverride<RoleName[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      // Default security boundary: routes lacking @Roles() and @Public() default
      // to requiring an authenticated staff member (TEACHER or higher).
      // Unprivileged roles such as PARENT are denied access by default.
      if (!hasRoleAtLeast(user.role, [RoleName.TEACHER])) {
        throw new ForbiddenException('Insufficient role: staff role required');
      }
      return true;
    }

    if (!hasRoleAtLeast(user.role, required)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
