import { Transform } from 'class-transformer';
import { BasePaginationDto } from '../basePagination.dto';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActorPaginationDto extends BasePaginationDto {
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
      'actor.id',
      'actor.actor_name',
      'actor.stage_name',
      'actor.nationality',
      'actor.gender',
      'actor.created_at',
    ],
    example: 'actor.created_at',
  })
  @IsOptional()
  @IsIn([
    'actor.id',
    'actor.actor_name',
    'actor.stage_name',
    'actor.nationality',
    'actor.gender',
    'actor.created_at',
  ])
  sortBy?= 'actor.created_at'

  @IsOptional()
  @IsIn(['male', 'female'], {
    message: 'Gender must be male or female',
  })
  gender?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
