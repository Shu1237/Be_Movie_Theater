import { Transform } from 'class-transformer';
import { BasePaginationDto } from '../basePagination.dto';
import { IsOptional, IsString, IsIn, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MoviePaginationDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Search term to filter results',
    example: 'name',
  })
  @IsOptional()
  @IsString()
  search?: string;
  //
  @ApiPropertyOptional({
    enum: [
      'movie.id',
      'movie.name',
      'movie.nation',
      'genre.genre_name',
      'version.name',
      'movie.created_at',
    ],
  })
  @IsOptional()
  @IsIn([
    'movie.id',
    'movie.name',
    'movie.nation',
    'genre.genre_name',
    'version.name',
    'movie.created_at',
  ])
  sortBy = 'movie.created_at';

 

  @IsOptional()
  @IsString()
  nation?: string;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsString()
  actor_id?: string;

  @IsOptional()
  @IsString()
  gerne_id?: string;

  @IsOptional()
  @IsString()
  version_id?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
