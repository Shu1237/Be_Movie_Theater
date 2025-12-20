import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { BasePaginationDto } from '../basePagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class VersionPaginationDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Search term to filter results',
    example: 'version.version_name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['version.id', 'version.version_name', 'version.created_at'],
    example: 'version.created_at',
  })
  @IsOptional()
  @IsIn(['version.id', 'version.version_name', 'version.created_at'])
  sortBy? = 'version.created_at';
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
