import {
  IsOptional,
  IsInt,
  IsString,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateMovieDto } from './createMovie.dto';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {}
