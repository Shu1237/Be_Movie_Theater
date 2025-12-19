import { Type } from 'class-transformer';
import { IsOptional, Min, IsString } from 'class-validator';
import { BasePaginationDto } from '../basePagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class HistoryScorePaginationDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'history_score.created_at',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
