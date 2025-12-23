import { applySorting } from '@common/pagination/apply_sort';
import { applyCommonFilters } from '@common/pagination/applyCommonFilters';
import { applyPagination } from '@common/pagination/applyPagination';
import { MoviePaginationDto } from '@common/pagination/dto/movie/moviePagination.dto';
import { movieFieldMapping } from '@common/pagination/fillters/movieFieldMapping';
import { buildPaginationResponse } from '@common/pagination/pagination-response';
import { Actor } from '@database/entities/cinema/actor';

import { Movie } from '@database/entities/cinema/movie';
import { Version } from '@database/entities/cinema/version';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateMovieDto } from './dtos/createMovie.dto';
import { UpdateMovieDto } from './dtos/updateMovie.dto';
import { Genre } from '@database/entities/cinema/genre';


@ApiTags('Movies')
@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Actor)
    private readonly actorRepository: Repository<Actor>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,
  ) {}
  private getMovieSummary(movie: Movie) {
    return {
      id: movie.id,
      name: movie.name,
      content: movie.content,
      director: movie.director,
      duration: movie.duration,
      from_date: movie.from_date,
      limited_age: movie.limited_age,
      trailer: movie.trailer,
      nation: movie.nation,
      to_date: movie.to_date,
      production_company: movie.production_company,
      thumbnail: movie.thumbnail,
      banner: movie.banner,
      is_deleted: movie.is_deleted,
      created_at: movie.created_at,
      actors: movie.actors.map((actor) => ({
        id: actor.id,
        actor_name: actor.actor_name,
      })),
      genres: movie.genres.map((genre) => ({
        id: genre.id,
        genre_name: genre.genre_name,
      })),
      versions: movie.versions.map((version) => ({
        id: version.id,
        version_name: version.version_name,
      })),
    };
  }

  async getAllMovies(
    fillters: MoviePaginationDto,
  ): Promise<ReturnType<typeof buildPaginationResponse>> {
    const qb = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.actors', 'actor')
      .leftJoinAndSelect('movie.genres', 'genre')
      .leftJoinAndSelect('movie.versions', 'version');

    applyCommonFilters(qb, fillters, movieFieldMapping);

    const allowedFields = [
      'movie.id',
      'movie.name',
      'movie.director',
      'movie.nation',
      'genre.genre_name',
      'actor.actor_name',
      'version.version_name',
      'movie.created_at',
    ];
    applySorting(
      qb,
      fillters.sortBy,
      fillters.sortOrder,
      allowedFields,
      'movie.created_at',
    );
    applyPagination(qb, {
      page: fillters.page,
      take: fillters.take,
    });
    const [movies, total] = await qb.getManyAndCount();
    const counts: { activeCount: number; deletedCount: number } =
      (await this.movieRepository
        .createQueryBuilder('movie')
        .select([
          `SUM(CASE WHEN movie.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
          `SUM(CASE WHEN movie.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
        ])
        .getRawOne()) || { activeCount: 0, deletedCount: 0 };

    const activeCount = Number(counts.activeCount) || 0;
    const deletedCount = Number(counts.deletedCount) || 0;
    return buildPaginationResponse(
      movies.map((movie) => this.getMovieSummary(movie)),
      {
        total,
        page: fillters.page,
        take: fillters.take,
        activeCount,
        deletedCount,
      },
    );
  }

  private async findActorbyIds(ids: number[]): Promise<void> {
    if (!ids.length) return;

    const count = await this.actorRepository.count({
      where: { id: In(ids) },
    });

    if (count !== ids.length) {
      throw new NotFoundException('Some actors not found');
    }
  }

  private async findGenreByIds(ids: number[]): Promise<void> {
    if (!ids.length) return;

    const count = await this.genreRepository.count({
      where: { id: In(ids) },
    });

    if (count !== ids.length) {
      throw new NotFoundException('Some genres not found');
    }
  }

  private async findVersionbyIds(ids: number[]): Promise<void> {
    if (!ids.length) return;

    const count = await this.versionRepository.count({
      where: { id: In(ids) },
    });

    if (count !== ids.length) {
      throw new NotFoundException('Some versions not found');
    }
  }

  async createMovie(movieDto: CreateMovieDto) : Promise<Movie> {
    // check actors, gernes, versions existence
    await Promise.all([
      this.findActorbyIds(movieDto.id_Actor || []),
      this.findGenreByIds(movieDto.id_Gerne || []),
      this.findVersionbyIds(movieDto.id_Version || []),
    ]);
    const newMovie = this.movieRepository.create(movieDto);
    return this.movieRepository.save(newMovie);
  }

  async updateMovie(id: number, movieDto: UpdateMovieDto) : Promise<ReturnType<typeof this.getMovieSummary>> {
       await this.movieRepository.update(id, movieDto);
       return await this.findMovieById(id);
  }


  async findMovieById(id: number): Promise<ReturnType<typeof this.getMovieSummary>> {
       const movie = await this.movieRepository.findOne({
         where: { id },
         relations: ['actors', 'gernes', 'versions'],
       });
        if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`, 'MOVIE_NOT_FOUND');
    }
    return this.getMovieSummary(movie);
  }
   

  async restoreMovie(id: number): Promise<void> {
    const movie = await this.findMovieById(id);
    if(!movie.is_deleted){
      throw new BadRequestException(
        `Movie with ID ${id} is not soft-deleted`,
        'MOVIE_NOT_DELETED',
      );
    }
    await this.movieRepository.update(id, { is_deleted: false });
    
  }
    async softDeleteMovie(id: number): Promise<void> {
          const movie = await this.findMovieById(id);
    if(movie.is_deleted){
      throw new BadRequestException(
        `Movie with ID ${id} is already soft-deleted`,
        'MOVIE_ALREADY_DELETED',
      );
    }
    await this.movieRepository.update(id, { is_deleted: true });
  }
  

  async removeMovie(id: number): Promise<void> {
    await this.movieRepository.delete(id);
  }
}


