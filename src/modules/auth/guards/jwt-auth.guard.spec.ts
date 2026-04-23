import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const makeContext = (): ExecutionContext =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  it('should_short_circuit_for_public_handlers', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    expect(guard.canActivate(makeContext())).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [undefined, undefined]);
  });

  it('should_check_metadata_in_handler_and_class_scope', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;
    new JwtAuthGuard(reflector).canActivate(makeContext());
    const args = (reflector.getAllAndOverride as jest.Mock).mock.calls[0];
    expect(args?.[1]).toHaveLength(2);
  });
});
