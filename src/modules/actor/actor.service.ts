import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Actor } from '../../database/entities/cinema/actor';
import { CreateActorDto } from 'src/modules/actor/dtos/createActor.dto';
import { UpdateActorDto } from 'src/modules/actor/dtos/updateActor.dto';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { ActorPaginationDto } from 'src/common/pagination/dto/actor/actor-pagination.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { actorFieldMapping } from 'src/common/pagination/fillters/actor-field-mapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';
import { ResponseList } from 'src/common/response/response-list';
import { ResponseDetail } from 'src/common/response/response-detail-create-update';
import { ResponseMsg } from 'src/common/response/response-message';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(Actor)
    private readonly actorRepository: Repository<Actor>,
  ) {}

  async createActor(
    createActorDto: CreateActorDto,
  ): Promise<ResponseDetail<Actor>> {
    const existingActor = await this.actorRepository.findOneBy({
      name: createActorDto.name,
    });
    if (existingActor) {
      throw new BadRequestException(
        `Actor with name "${createActorDto.name}" already exists`,
      );
    }

    const actor = this.actorRepository.create(createActorDto);
    await this.actorRepository.save(actor);
    return { data: actor };
  }

  async getAllActors(
    filters: ActorPaginationDto,
  ): Promise<ResponseList<Actor>> {
    const qb = this.actorRepository.createQueryBuilder('actor');
    applyCommonFilters(qb, filters, actorFieldMapping);
    const allowedSortFields = [
      'actor.name',
      'actor.stage_name',
      'actor.nationality',
      'actor.date_of_birth',
      'actor.gender',
    ];
    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedSortFields,
      'actor.name',
    );

    // Apply pagination
    applyPagination(qb, {
      page: filters.page,
      take: filters.take,
    });
    const [actors, total] = await qb.getManyAndCount();

    const counts: { activeCount: number; deletedCount: number } =
      (await this.actorRepository
        .createQueryBuilder('actor')
        .select([
          `SUM(CASE WHEN actor.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
          `SUM(CASE WHEN actor.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
        ])
        .getRawOne()) || { activeCount: 0, deletedCount: 0 };

    const activeCount = Number(counts?.activeCount) || 0;
    const deletedCount = Number(counts?.deletedCount) || 0;

    return ResponseList.ok(
      buildPaginationResponse(actors, {
        total,
        page: filters.page,
        take: filters.take,
        activeCount,
        deletedCount,
      }),
    );
  }

  async findActorById(id: number): Promise<ResponseDetail<Actor>> {
    const actor = await this.actorRepository.findOne({
      where: { id },
    });
    if (!actor) {
      throw new NotFoundException(`Actor with ID ${id} not found`);
    }
    return ResponseDetail.ok(actor);
  }

  async updateActor(
    id: number,
    updateActorDto: UpdateActorDto,
  ): Promise<ResponseDetail<Actor | null>> {
    await this.findActorById(id);

    if (updateActorDto.name) {
      const duplicateActor = await this.actorRepository.findOneBy({
        name: updateActorDto.name,
      });

      if (duplicateActor && duplicateActor.id !== id) {
        throw new BadRequestException(
          `Actor with name "${updateActorDto.name}" already exists`,
        );
      }
    }

    await this.actorRepository.update(id, updateActorDto);

    const updatedActor = await this.actorRepository.findOneBy({ id });

    return ResponseDetail.ok(updatedActor);
  }

  async softDeleteActor(id: number): Promise<ResponseMsg> {
    const actor = await this.actorRepository.findOne({ where: { id } });
    if (!actor) {
      throw new NotFoundException(`Actor with ID ${id} not found`);
    }
    if (actor.is_deleted) {
      throw new BadRequestException(
        `Actor with ID ${id} is already soft-deleted`,
      );
    }
    actor.is_deleted = true;
    await this.actorRepository.save(actor);
    return ResponseMsg.ok('Actor soft-deleted successfully');
  }

  async restoreActor(id: number): Promise<ResponseMsg> {
    const actor = await this.actorRepository.findOne({ where: { id } });
    if (!actor) {
      throw new NotFoundException(`Actor with ID ${id} not found`);
    }
    if (!actor.is_deleted) {
      throw new BadRequestException(`Actor with ID ${id} is not soft-deleted`);
    }
    actor.is_deleted = false;
    await this.actorRepository.save(actor);
    return ResponseMsg.ok('Actor restored successfully');
  }

  async removeActor(id: number): Promise<ResponseMsg> {
    const actor = await this.actorRepository.findOne({ where: { id } });
    if (!actor) {
      throw new NotFoundException(`Actor with ID ${id} not found`);
    }
    await this.actorRepository.remove(actor);
    return ResponseMsg.ok('Actor removed successfully');
  }
}
