import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ActorContext } from '../../common/types/actor-context';
import { RoleName } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserResponseDto } from './dto/create-user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto';
import { UsersService } from './users.service';
import { PaginatedResponseDto, PaginationMetaDto } from '../../common/dto/paginated-response.dto';

class UsersListResponseDto extends PaginatedResponseDto<UserResponseDto> {
  declare data: UserResponseDto[];
  declare meta: PaginationMetaDto;
}

const toActor = (user: AuthenticatedUser): ActorContext => ({ id: user.id, role: user.role });

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'users', version: ['1'] })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'Create a user (role hierarchy enforced server-side)' })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreateUserResponseDto> {
    const result = await this.users.create(toActor(actor), dto);
    return {
      user: UserResponseDto.fromEntity(result.user),
      generatedPassword: result.generatedPassword,
      notified: result.user.telegramChatId !== null,
    };
  }

  @Get()
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'List users (paginated, filterable)' })
  async list(@Query() query: UsersQueryDto): Promise<UsersListResponseDto> {
    const page = await this.users.list(query);
    return UsersListResponseDto.of(
      page.data.map((u) => UserResponseDto.fromEntity(u)),
      page.meta,
    ) as UsersListResponseDto;
  }

  @Get(':id')
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'Get a user by id' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(await this.users.getById(id));
  }

  @Patch(':id')
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'Update mutable fields of a user (no role/email changes)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const updated = await this.users.update(toActor(actor), id, dto);
    return UserResponseDto.fromEntity(updated);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'Soft-delete a user (cannot delete self or SUPER_ADMIN)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    await this.users.softDelete(toActor(actor), id);
  }

  @Post(':id/reset-password')
  @Roles(RoleName.MANAGER)
  @ApiOperation({ summary: 'Generate a new random password and notify the user' })
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResetPasswordResponseDto> {
    const { user, password } = await this.users.resetPassword(toActor(actor), id);
    return {
      generatedPassword: password,
      // Whether Telegram delivery succeeded depends on the consumer (Stage 6).
      // For now, signal "notification queued" if a chat is linked.
      notified: user.telegramChatId !== null,
    };
  }
}
