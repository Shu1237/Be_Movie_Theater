import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGerneDto } from './dtos/createGerne';
import { UpdateGerneDto } from './dtos/updateGerne';
import { applySorting } from '@common/pagination/apply_sort';
import { applyCommonFilters } from '@common/pagination/applyCommonFilters';
import { applyPagination } from '@common/pagination/applyPagination';
import { GernePaginationDto } from '@common/pagination/dto/gerne/gerne.dto';
import { gerneFieldMapping } from '@common/pagination/fillters/gerne-field-mapping';
import { buildPaginationResponse } from '@common/pagination/pagination-response';
import { Gerne } from '@database/entities/cinema/gerne';


@Injectable()
export class GerneService {
  constructor(
    @InjectRepository(Gerne)
    private readonly gerneRepository: Repository<Gerne>,
  ) {}

  async createGerne(
    createGerneDto: CreateGerneDto,
  ): Promise<Gerne> {
   const newGerne = this.gerneRepository.create(createGerneDto);
   return this.gerneRepository.save(newGerne);
  }

  async findAllGernes(
    filters: GernePaginationDto,
  ) {
    const qb = this.gerneRepository.createQueryBuilder('gerne');

    applyCommonFilters(qb, filters, gerneFieldMapping);

    const allowedSortFields = ['gerne.genre_name', 'gerne.id'];
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

    const [gernes, total] = await qb.getManyAndCount();

    // Get counts for active and deleted genres
    const counts = (await this.gerneRepository
      .createQueryBuilder('gerne')
      .select([
        `SUM(CASE WHEN gerne.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
        `SUM(CASE WHEN gerne.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
      ])
      .getRawOne()) || { activeCount: 0, deletedCount: 0 };

    const activeCount = Number(counts?.activeCount) || 0;
    const deletedCount = Number(counts?.deletedCount) || 0;

    return buildPaginationResponse<Gerne>(gernes, {
        total,
        page: filters.page,
        take: filters.take,
        activeCount,
        deletedCount,
    })
  }

  async findGerneById(id: number): Promise<Gerne> {
    const gerne = await this.gerneRepository.findOne({ where: { id } });
    if (!gerne) {
      throw new NotFoundException(`Gerne with ID ${id} not found`);
    }
    return gerne;
  }

  async updateGerne(
  id: number,
  dto: UpdateGerneDto,
): Promise<Gerne> {
   await this.gerneRepository.update(id, dto);
   return this.findGerneById(id);
}

  async deleteGerne(id: number): Promise<void> {
    await this.gerneRepository.delete(id);
   
  }
  async softDeleteGerne(id: number): Promise<void> {
    const gerne = await this.gerneRepository.findOne({ where: { id } });
    if (!gerne) {
      throw new NotFoundException(`Gerne with ID ${id} not found`);
    }

    await this.gerneRepository.update(id, { is_deleted: true });
  }

  async restoreGerne(id: number): Promise<void> {
    const gerne = await this.gerneRepository.findOne({ where: { id } });
    if (!gerne) {
      throw new NotFoundException(`Gerne with ID ${id} not found`);
    }
    if (!gerne.is_deleted) {
      throw new BadRequestException(`Gerne with ID ${id} is not soft-deleted`);
    }
    await this.gerneRepository.update(id, { is_deleted: false });
  }
}
