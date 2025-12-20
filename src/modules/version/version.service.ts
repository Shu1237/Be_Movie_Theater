import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async createVersion(createVersionDto: CreateVersionDto): Promise<Version> {
    const version = this.versionRepository.create(createVersionDto);
    return await this.versionRepository.save(version);
  }
  async findAllVersions(filters: VersionPaginationDto) {
    const qb = this.versionRepository.createQueryBuilder('version');

    applyCommonFilters(qb, filters, versionFieldMapping);
    const allowedFields = ['version.name', 'version.id','version.created_at'];
    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedFields,
      'version.created_at',
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
    return buildPaginationResponse(versions, {
      total,
      page: filters.page,
      take: filters.take,
      activeCount,
      deletedCount,
    });
  }

  async findVersionById(id: number): Promise<Version> {
    const version = await this.versionRepository.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }
    return version;
  }

  async updateVersion(id: number, dto: UpdateVersionDto): Promise<Version> {
    await this.versionRepository.update(id, dto);
    return await this.findVersionById(id);
  }

  async softDeleteVersion(id: number): Promise<void> {
    const version = await this.findVersionById(id);
    if(version.is_deleted){
      throw new BadRequestException(`Version with ID ${id} is already soft-deleted`, 'VERSION_ALREADY_DELETED');
    }
    await this.versionRepository.update(id, { is_deleted: true });
  }

  async restoreVersion(id: number): Promise<void> {
    const version = await this.findVersionById(id);
    if(!version.is_deleted){
      throw new BadRequestException(`Version with ID ${id} is not deleted`, 'VERSION_NOT_DELETED');
    }
    await this.versionRepository.update(id, { is_deleted: false });

  }

  async removeVersion(id: number): Promise<void> {
    await this.versionRepository.delete(id);
  }
}
