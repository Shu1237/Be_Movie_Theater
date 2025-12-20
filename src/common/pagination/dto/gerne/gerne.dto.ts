
import { BasePaginationDto } from '../basePagination.dto';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GenrePaginationDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Search term to filter results',
    example: 'name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'gerne.genre_name | gerne.id',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
