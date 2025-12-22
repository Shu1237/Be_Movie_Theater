import { IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  transaction_code: string;

  @IsString()
  prices: string;

  @IsInt()
  @Min(1)
  @Max(6)
  payment_method_id: number;
}
