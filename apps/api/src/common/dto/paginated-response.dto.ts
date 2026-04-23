import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedResponseDto<T> {
  data!: T[];
  meta!: PaginationMetaDto;

  static of<T>(data: T[], meta: PaginationMetaDto): PaginatedResponseDto<T> {
    const wrapped = new PaginatedResponseDto<T>();
    wrapped.data = data;
    wrapped.meta = meta;
    return wrapped;
  }

  static buildMeta(total: number, page: number, limit: number): PaginationMetaDto {
    if (total === 0) {
      return { total: 0, page, limit, totalPages: 0 };
    }
    const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
    return { total, page, limit, totalPages };
  }
}
