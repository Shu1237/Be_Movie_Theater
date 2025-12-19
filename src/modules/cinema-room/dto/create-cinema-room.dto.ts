import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCinemaRoomDto {
  @ApiProperty({ description: 'Name of the cinema room', example: 'Room A' })
  @IsNotEmpty()
  @IsString()
  cinema_room_name: string;
}
