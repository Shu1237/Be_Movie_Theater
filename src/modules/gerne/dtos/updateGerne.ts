import { PartialType } from '@nestjs/swagger';
import { CreateGerneDto } from './createGerne';

export class UpdateGerneDto extends PartialType(CreateGerneDto) {}
