import { Module, Version } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { Actor } from '@database/entities/cinema/actor';
import { Gerne } from '@database/entities/cinema/gerne';
import { Movie } from '@database/entities/cinema/movie';


@Module({
  imports: [TypeOrmModule.forFeature([Movie, Actor, Gerne, Version])],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
