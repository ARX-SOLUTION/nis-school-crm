import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth?.token;

    if (!token) {
      this.logger.warn(`No token provided for socket ${client.id}`);
      client.disconnect();
      return false;
    }

    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        algorithms: ['HS256'],
      });

      const user = await this.users.findById(payload.sub);
      if (!user || !user.isActive || user.deletedAt !== null) {
        throw new Error('User inactive');
      }

      // Attach user payload to the socket connection
      (client.data as { user?: { id: string; email: string; role: string } }).user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Invalid WS token for ${client.id}: ${message}`);
      client.disconnect();
      return false;
    }
  }
}
