import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GenreController } from './gerne.controller';

import { Movie } from '@database/entities/cinema/movie';
import { Genre } from '@database/entities/cinema/genre';
import { GenreService } from './gerne.service';

@Module({
  imports: [TypeOrmModule.forFeature([Genre, Movie])],
  controllers: [GenreController],
  providers: [GenreService],
  exports: [GenreService],
})
export class GenreModule {}
