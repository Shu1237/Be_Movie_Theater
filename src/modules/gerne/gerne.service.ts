import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { applySorting } from '@common/pagination/apply_sort';
import { applyCommonFilters } from '@common/pagination/applyCommonFilters';
import { applyPagination } from '@common/pagination/applyPagination';

import { buildPaginationResponse } from '@common/pagination/pagination-response';
import { Genre } from '@database/entities/cinema/genre';
import { CreateGenreDto } from './dtos/createGerne';
import { GenrePaginationDto } from '@common/pagination/dto/gerne/gerne.dto';
import { genreFieldMapping } from '@common/pagination/fillters/genre-field-mapping';
import { UpdateGenreDto } from './dtos/updateGerne';



@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  async createGenre(
    createGenreDto: CreateGenreDto,
  ): Promise<Genre> {
   const newGenre = this.genreRepository.create(createGenreDto);
   return this.genreRepository.save(newGenre  );
  }

  async findAllGenres(
    filters: GenrePaginationDto,
  ) {
    const qb = this.genreRepository.createQueryBuilder('genre');

    applyCommonFilters(qb, filters, genreFieldMapping);

    const allowedSortFields = ['genre.genre_name', 'genre.id'];
    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedSortFields,
      'gerne.id',
    );

    applyPagination(qb, {
      page: filters.page,
      take: filters.take,
    });

    const [genres, total] = await qb.getManyAndCount();

    const counts = (await this.genreRepository
      .createQueryBuilder('genre')
      .select([
        `SUM(CASE WHEN genre.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
        `SUM(CASE WHEN genre.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
      ])
      .getRawOne()) || { activeCount: 0, deletedCount: 0 };

    const activeCount = Number(counts?.activeCount) || 0;
    const deletedCount = Number(counts?.deletedCount) || 0;

    return buildPaginationResponse<Genre>(genres, {
        total,
        page: filters.page,
        take: filters.take,
        activeCount,
        deletedCount,
    })
  }

  async findGenreById(id: number): Promise<Genre> {
    const genre = await this.genreRepository.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }
    return genre;
  }

  async updateGenre(
  id: number,
  dto: UpdateGenreDto,
): Promise<Genre> {
   await this.genreRepository.update(id, dto);
   return this.findGenreById(id);
}

  async deleteGenre(id: number): Promise<void> {
    await this.genreRepository.delete(id);
   
  }
  async softDeleteGenre(id: number): Promise<void> {
    const genre = await this.genreRepository.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }

    await this.genreRepository.update(id, { is_deleted: true });
  }

  async restoreGenre(id: number): Promise<void> {
    const genre = await this.genreRepository.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException(`Genre with ID ${id} not found`);
    }
    if (!genre.is_deleted) {
      throw new BadRequestException(`Genre with ID ${id} is not soft-deleted`);
    }
    await this.genreRepository.update(id, { is_deleted: false });
  }
}
