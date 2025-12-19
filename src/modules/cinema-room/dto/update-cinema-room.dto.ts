import {  PartialType } from '@nestjs/swagger';
import { CreateCinemaRoomDto } from './create-cinema-room.dto';


export class UpdateCinemaRoomDto extends PartialType(CreateCinemaRoomDto) {}
