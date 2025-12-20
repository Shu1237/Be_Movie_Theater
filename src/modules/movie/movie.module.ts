import { Module, Version } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { Actor } from '@database/entities/cinema/actor';

import { Movie } from '@database/entities/cinema/movie';
import { Genre } from '@database/entities/cinema/genre';


@Module({
  imports: [TypeOrmModule.forFeature([Movie, Actor, Genre, Version])],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
