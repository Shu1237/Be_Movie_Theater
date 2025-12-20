import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Actor } from '@database/entities/cinema/actor';
import { CreateActorDto } from './dtos/createActor.dto';
import { UpdateActorDto } from './dtos/updateActor.dto';

import { ActorPaginationDto } from '@common/pagination/dto/actor/actor-pagination.dto';
import { applySorting } from '@common/pagination/apply_sort';
import { applyCommonFilters } from '@common/pagination/applyCommonFilters';
import { applyPagination } from '@common/pagination/applyPagination';
import { actorFieldMapping } from '@common/pagination/fillters/actor-field-mapping';
import { buildPaginationResponse } from '@common/pagination/pagination-response';

import { NotFoundException } from '@common/exceptions/not-found.exception';
import { BadRequestException } from '@common/exceptions/bad-request.exception';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(Actor)
    private readonly actorRepository: Repository<Actor>,
  ) {}


  async createActor(dto: CreateActorDto): Promise<Actor> {
    const actor = this.actorRepository.create(dto);
    return this.actorRepository.save(actor);
  }


  async getAllActors(filters: ActorPaginationDto) {
    const qb = this.actorRepository.createQueryBuilder('actor');

    applyCommonFilters(qb, filters, actorFieldMapping);

    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      [
        'actor.name',
        'actor.stage_name',
        'actor.nationality',
        'actor.gender',
        'actor.created_at',
      ],
      'actor.created_at',
    );

    applyPagination(qb, {
      page: filters.page,
      take: filters.take,
    });

    const [actors, total] = await qb.getManyAndCount();

    const counts =
      (await this.actorRepository
        .createQueryBuilder('actor')
        .select([
          `SUM(CASE WHEN actor.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
          `SUM(CASE WHEN actor.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
        ])
        .getRawOne()) || {};

    return buildPaginationResponse(actors, {
      total,
      page: filters.page,
      take: filters.take,
      activeCount: Number(counts.activeCount) || 0,
      deletedCount: Number(counts.deletedCount) || 0,
    });
  }


  async findActorById(id: number): Promise<Actor> {
    const actor = await this.actorRepository.findOne({ where: { id } });

    if (!actor) {
      throw new NotFoundException(
        `Actor with ID ${id} not found`,
        'ACTOR_NOT_FOUND',
      );
    }

    return actor;
  }


  async updateActor(id: number, dto: UpdateActorDto): Promise<Actor> {
   await this.actorRepository.update(id,dto)
   return this.findActorById(id);
  }


  async softDeleteActor(id: number): Promise<void> {
    const actor = await this.findActorById(id);

    if (actor.is_deleted) {
      throw new BadRequestException(
        `Actor with ID ${id} is already soft-deleted`,
        'ACTOR_ALREADY_DELETED',
      );
    }

    await this.actorRepository.update(id, { is_deleted: true });
  }


  async restoreActor(id: number): Promise<void> {
    const actor = await this.findActorById(id);

    if (!actor.is_deleted) {
      throw new BadRequestException(
        `Actor with ID ${id} is not soft-deleted`,
        'ACTOR_NOT_DELETED',
      );
    }

    await this.actorRepository.update(id, { is_deleted: false });
  }


  async removeActor(id: number): Promise<void> {
    await this.actorRepository.delete(id);
  }
}
