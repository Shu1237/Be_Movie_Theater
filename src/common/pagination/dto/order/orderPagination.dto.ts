import { IsOptional, IsString, IsIn, IsEnum } from 'class-validator';

import { BasePaginationDto } from '../basePagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusOrderWithAll } from '@common/enums/status-order.enum';
import { PaymentGateway } from '@common/enums/payment_gatewat.enum';


export class OrderPaginationDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Search term to filter results',
    example: 'movie.name | user.username | order.id',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example:
      'order.order_date | user.username | movie.name |paymentMethod.name | order.status |order.total_prices',
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

  @IsOptional()
  @IsIn(StatusOrderWithAll, {
    message: `status must be one of: ${StatusOrderWithAll.join(', ')}`,
  })
  status?: string;

  @IsOptional()
  @IsEnum(PaymentGateway)
  paymentMethod?: PaymentGateway;

  @IsOptional()
  @IsString()
  email?: string;
}
