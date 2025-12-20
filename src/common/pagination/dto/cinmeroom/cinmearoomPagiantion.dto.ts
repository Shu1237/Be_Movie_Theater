import { IsOptional, IsBoolean, IsString, IsIn } from 'class-validator';

import { BasePaginationDto } from '../basePagination.dto';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CinemaRoomPaginationDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Search term to filter results',
    example: 'Vip-1',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: [
      'cinemaRoom.id',
      'cinemaRoom.cinema_room_name',
      'cinemaRoom.created_at',
    ],
    example: 'cinemaRoom.created_at',
  })
  @IsOptional()
  @IsIn([
    'cinemaRoom.id',
    'cinemaRoom.cinema_room_name',
    'cinemaRoom.created_at',
  ])
  sortBy? = 'cinemaRoom.created_at';

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
