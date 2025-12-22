import { BasePaginationDto } from '../basePagination.dto';
import { IsOptional, IsString, IsNumber, IsBoolean, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SchedulePaginationDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Search term to filter results',
    example: 'name | stage_name | nationality',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: [
      'schedule.id',
      'movie.name',
      'version.id',
      'schedule.created_at',
    ],
    example: 'schedule.created_at',
  })
  @IsOptional()
  @IsIn([
    'schedule.id',
    'movie.name',
    'version.id',
    'schedule.created_at',

  ])
  sortBy? = 'schedule.created_at';

 
  @IsOptional()
  @IsString()
  scheduleStartTime?: string;

  @IsOptional()
  @IsString()
  scheduleEndTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  version_id?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_deleted?: boolean;
}
