import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Gerne } from 'src/database/entities/cinema/gerne';
import { Repository } from 'typeorm';
import { CreateGerneDto } from './dtos/createGerne';
import { UpdateGerneDto } from './dtos/updateGerne';
import { Movie } from 'src/database/entities/cinema/movie';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { GernePaginationDto } from 'src/common/pagination/dto/gerne/gerne.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { gerneFieldMapping } from 'src/common/pagination/fillters/gerne-field-mapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';
import { ResponseDetail } from 'src/common/response/response-detail-create-update';
import { ResponseList } from 'src/common/response/response-list';
import { ResponseMsg } from 'src/common/response/response-message';

@Injectable()
export class GerneService {
  constructor(
    @InjectRepository(Gerne)
    private readonly gerneRepository: Repository<Gerne>,
  ) {}

  async createGerne(
    createGerneDto: CreateGerneDto,
  ): Promise<ResponseDetail<Gerne>> {
    const existing = await this.gerneRepository.findOne({
      where: { genre_name: createGerneDto.genre_name },
    });

    if (existing) {
      throw new BadRequestException(
        `Movie with name "${createGerneDto.genre_name}" already exists.`,
      );
    }

    const newGerne = this.gerneRepository.create(createGerneDto);
    await this.gerneRepository.save(newGerne);
    return ResponseDetail.ok(newGerne);
  }

  async findAllGernes(
    filters: GernePaginationDto,
  ): Promise<ResponseList<Gerne>> {
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

    return ResponseList.ok(
      buildPaginationResponse(gernes, {
        total,
        page: filters.page,
        take: filters.take,
        activeCount,
        deletedCount,
      }),
    );
  }

  async findGerneById(id: number): Promise<ResponseDetail<Gerne>> {
    const gerne = await this.gerneRepository.findOne({ where: { id } });
    if (!gerne) {
      throw new NotFoundException(`Gerne with ID ${id} not found`);
    }
    return ResponseDetail.ok(gerne);
  }

  async updateGerne(
    id: number,
    updateGerneDto: UpdateGerneDto,
  ): Promise<ResponseDetail<Gerne | null>> {
    const gerneRes = await this.findGerneById(id);

    if (!gerneRes.data) {
      throw new NotFoundException(`Gerne with ID ${id} not found`);
    }

    if (
      updateGerneDto.genre_name &&
      updateGerneDto.genre_name !== gerneRes.data.genre_name
    ) {
      const existing = await this.gerneRepository.findOne({
        where: { genre_name: updateGerneDto.genre_name },
      });

      if (existing) {
        throw new BadRequestException(
          `Gerne "${updateGerneDto.genre_name}" already exists`,
        );
      }
    }

    await this.gerneRepository.update(id, updateGerneDto);

    const updatedGerne = await this.gerneRepository.findOneBy({ id });

    return ResponseDetail.ok(updatedGerne);
  }

  async deleteGerne(id: number): Promise<ResponseMsg> {
    const result = await this.gerneRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Gerne with ID ${id} not found`);
    }
    return ResponseMsg.ok('Gerne deleted successfully');
  }
  async softDeleteGerne(id: number): Promise<ResponseMsg> {
    const gerne = await this.gerneRepository.findOne({ where: { id } });
    if (!gerne) {
      throw new NotFoundException(`Gerne with ID ${id} not found`);
    }

    gerne.is_deleted = true;
    await this.gerneRepository.save(gerne);

    return ResponseMsg.ok('Gerne soft-deleted successfully');
  }

  async restoreGerne(id: number): Promise<ResponseMsg> {
    const gerne = await this.gerneRepository.findOne({ where: { id } });
    if (!gerne) {
      throw new NotFoundException(`Gerne with ID ${id} not found`);
    }
    if (!gerne.is_deleted) {
      throw new BadRequestException(`Gerne with ID ${id} is not soft-deleted`);
    }
    gerne.is_deleted = false;
    await this.gerneRepository.save(gerne);
    return ResponseMsg.ok('Gerne restored successfully');
  }
}
