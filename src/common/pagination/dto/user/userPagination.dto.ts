import { BasePaginationDto } from '../basePagination.dto';
import { IsOptional, IsBoolean, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserPaginationDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Search term to filter results',
    example: 'user.username | user.email',
  })
  @IsOptional()
  @IsString()
  search?: string;

 
  @ApiPropertyOptional({
     description: 'Field to sort by',
     enum: [ 'user.username', 'user.email', 'user.status', 'role.name', 'user.score', 'user.created_at'],
     example: 'user.created_at',
   })
   @IsOptional()
   @IsIn(['user.username', 'user.email', 'user.status', 'role.name', 'user.score', 'user.created_at'])
   sortBy?: 'user.username' | 'user.email' | 'user.status' | 'role.name' | 'user.score' | 'user.created_at' = 'user.created_at';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsString()
  roleId?: string;
}
