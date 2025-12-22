import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { BasePaginationDto } from '../basePagination.dto';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
export class TicketPaginationDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Search term to filter results',
    example: 'movie.name | version.version_name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: [
      'ticketType.id',
      'ticket.is_used',
      'ticket.status',
      'ticket.created_at',
    ],
    example: 'ticket.created_at',
  })
  @IsOptional()
  @IsIn([
    'ticketType.id',
    'ticket.is_used',
    'ticket.status',
    'ticket.created_at',
  ])
  sortBy? = 'ticket.created_at';

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  is_used?: boolean;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
