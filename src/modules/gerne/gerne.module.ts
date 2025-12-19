import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GerneService } from './gerne.service';
import { GerneController } from './gerne.controller';
import { Gerne } from '@database/entities/cinema/gerne';
import { Movie } from '@database/entities/cinema/movie';

@Module({
  imports: [TypeOrmModule.forFeature([Gerne, Movie])],
  controllers: [GerneController],
  providers: [GerneService],
  exports: [GerneService],
})
export class GerneModule {}
