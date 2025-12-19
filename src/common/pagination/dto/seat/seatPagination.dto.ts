import { BasePaginationDto } from '../basePagination.dto';
import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SeatPaginationDto extends BasePaginationDto {

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'seat.seat_row | seat.seat_column | seatType.seat_type_name |cinemaRoom.cinema_room_name',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsNumber()
  cinema_room_id?: number;

  @IsOptional()
  @IsNumber()
  seat_type_id?: number;

  @IsOptional()
  @IsString()
  seat_row?: string;

  @IsOptional()
  @IsString()
  seat_column?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
