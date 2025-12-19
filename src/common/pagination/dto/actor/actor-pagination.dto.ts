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
    enum: ['actor.id', 'actor.name', 'actor.stage_name', 'actor.nationality', 'actor.gender'],
    example: 'actor.id',
  })
  @IsOptional()
  @IsIn(['actor.id', 'actor.name', 'actor.stage_name', 'actor.nationality', 'actor.gender'])
  sortBy?: 'actor.id' | 'actor.name' | 'actor.stage_name' | 'actor.nationality' | 'actor.gender' = 'actor.id';


 
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
