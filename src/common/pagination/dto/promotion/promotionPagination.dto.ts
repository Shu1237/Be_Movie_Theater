import { BasePaginationDto } from '../basePagination.dto';
import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PromotionPaginationDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Search term to filter results',
    example: 'promotion.detail |promotion.title',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'promotion.exchange | promotionType.id',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exchange?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exchangeFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exchangeTo?: number;

  @IsOptional()
  @IsString()
  promotion_type_id?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: string;
}
