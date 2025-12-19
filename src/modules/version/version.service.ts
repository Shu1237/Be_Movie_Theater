import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { applySorting } from '@common/pagination/apply_sort';
import { applyCommonFilters } from '@common/pagination/applyCommonFilters';
import { applyPagination } from '@common/pagination/applyPagination';
import { VersionPaginationDto } from '@common/pagination/dto/version/versionPagination.dto';
import { versionFieldMapping } from '@common/pagination/fillters/versionFieldMapping';
import { buildPaginationResponse } from '@common/pagination/pagination-response';
import { ResponseDetail } from '@common/response/response-detail-create-update';
import { ResponseList } from '@common/response/response-list';
import { ResponseMsg } from '@common/response/response-message';
import { Version } from '@database/entities/cinema/version';


@Injectable()
export class VersionService {
  constructor(
    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,
  ) {}

  async createVersion(
    createVersionDto: CreateVersionDto,
  ): Promise<ResponseDetail<Version>> {
    const existingVersion = await this.versionRepository.findOne({
      where: { name: createVersionDto.name },
    });
    if (existingVersion) {
      throw new BadRequestException(
        `Version with name "${createVersionDto.name}" already exists.`,
      );
    }

    const version = this.versionRepository.create(createVersionDto);
    const savedVersion = await this.versionRepository.save(version);
    return ResponseDetail.ok(savedVersion);
  }
  async findAllVersions(
    filters: VersionPaginationDto,
  ): Promise<ResponseList<Version>> {
    const qb = this.versionRepository.createQueryBuilder('version');

    applyCommonFilters(qb, filters, versionFieldMapping);
    const allowedFields = ['version.name', 'version.id'];
    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedFields,
      'version.id',
    );
    applyPagination(qb, {
      page: filters.page,
      take: filters.take,
    });
    const [versions, total] = await qb.getManyAndCount();
    const counts = (await this.versionRepository
      .createQueryBuilder('version')
      .select([
        `SUM(CASE WHEN version.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
        `SUM(CASE WHEN version.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
      ])
      .getRawOne()) || { activeCount: 0, deletedCount: 0 };
    const activeCount = Number(counts.activeCount) || 0;
    const deletedCount = Number(counts.deletedCount) || 0;
    return ResponseList.ok(
      buildPaginationResponse(versions, {
        total,
        take: filters.take,
        page: filters.page,
        activeCount,
        deletedCount,
      }),
    );
  }

  async findOne(id: number): Promise<ResponseDetail<Version>> {
    const version = await this.versionRepository.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }
    return ResponseDetail.ok(version);
  }

  async updateVersion(
    id: number,
    dto: UpdateVersionDto,
  ): Promise<{ message: string }> {
    try {
      const version = await this.versionRepository.preload({
        id,
        ...dto,
        name: dto.name?.trim(),
      });

      if (!version) {
        throw new NotFoundException(`Version with ID ${id} not found`);
      }

      await this.versionRepository.save(version);
      return { message: 'Version updated successfully' };
    } catch (error) {
      if (
        error.code === 'ER_DUP_ENTRY' || // MySQL
        error.code === '23505' // PostgreSQL
      ) {
        throw new BadRequestException(
          `Version with name "${dto.name}" already exists.`,
        );
      }
      throw error;
    }
  }

  async softDeleteVersion(id: number): Promise<ResponseMsg> {
    const version = await this.versionRepository.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }

    version.is_deleted = true;
    await this.versionRepository.save(version);

    return ResponseMsg.ok('Version soft-deleted successfully');
  }

  async restoreVersion(id: number): Promise<ResponseMsg> {
    const version = await this.versionRepository.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }
    if (!version.is_deleted) {
      throw new BadRequestException(
        `Version with ID ${id} is not soft-deleted`,
      );
    }
    version.is_deleted = false;
    await this.versionRepository.save(version);
    return ResponseMsg.ok('Version restored successfully');
  }

  async removeVersion(id: number): Promise<ResponseMsg> {
    const res = await this.findOne(id);

    if (!res.data) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }

    await this.versionRepository.remove(res.data);
    return ResponseMsg.ok('Version deleted successfully');
  }
}
