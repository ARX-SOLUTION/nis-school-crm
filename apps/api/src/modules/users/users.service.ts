import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async getById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Case-insensitive lookup by email; returns null when not found. */
  findByEmail(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('u')
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .getOne();
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.users.update({ id: userId }, { passwordHash, mustChangePassword: false });
  }

  async touchLastLogin(userId: string): Promise<void> {
    await this.users.update({ id: userId }, { lastLoginAt: new Date() });
  }
}
