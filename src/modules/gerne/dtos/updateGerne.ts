import { PartialType } from '@nestjs/swagger';
import { CreateGenreDto } from './createGerne';


export class UpdateGenreDto extends PartialType(CreateGenreDto) {}