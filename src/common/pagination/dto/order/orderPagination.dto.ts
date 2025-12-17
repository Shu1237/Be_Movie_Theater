import { IsOptional, IsString, IsIn } from 'class-validator';
import  {
  StatusOrderWithAll,
} from 'src/common/enums/status-order.enum';
import { BasePaginationDto } from '../basePagination.dto';

export class OrderPaginationDto extends BasePaginationDto {
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
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
