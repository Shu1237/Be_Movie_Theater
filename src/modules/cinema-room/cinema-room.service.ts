import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CinemaRoom } from '../../database/entities/cinema/cinema-room';
import { CreateCinemaRoomDto } from './dto/create-cinema-room.dto';
import { UpdateCinemaRoomDto } from './dto/update-cinema-room.dto';
import { applySorting } from '@common/pagination/apply_sort';
import { applyCommonFilters } from '@common/pagination/applyCommonFilters';
import { applyPagination } from '@common/pagination/applyPagination';
import { CinemaRoomPaginationDto } from '@common/pagination/dto/cinmeroom/cinmearoomPagiantion.dto';
import { cinemaRoomFieldMapping } from '@common/pagination/fillters/cinmeroom-field-mapping';
import { buildPaginationResponse } from '@common/pagination/pagination-response';
import { ResponseList } from '@common/response/response-list';
import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@common/exceptions/bad-request.exception';
import { NotFoundException } from '@common/exceptions/not-found.exception';

@Injectable()
export class CinemaRoomService {
  constructor(
    @InjectRepository(CinemaRoom)
    private readonly cinemaRoomRepository: Repository<CinemaRoom>,
  ) {}

  async createCinemaRoom(
    createCinemaRoomDto: CreateCinemaRoomDto,
  ): Promise<CinemaRoom> {
    const cinemaRoom = this.cinemaRoomRepository.create(createCinemaRoomDto);
    // check for duplicate name
    const existingRoom = await this.cinemaRoomRepository.findOne({
      where: { cinema_room_name: createCinemaRoomDto.cinema_room_name },
    });
    if (existingRoom) {
      throw new BadRequestException(
        'Cinema room with this name already exists',
        'CINEMA_ROOM_DUPLICATE_NAME',
      );
    }
    return this.cinemaRoomRepository.save(cinemaRoom);
  }

  async findAllCinemaRooms(
    filters: CinemaRoomPaginationDto,
  ) {
    if (!filters) {
      throw new BadRequestException('Filters are required');
    }

    const qb = this.cinemaRoomRepository.createQueryBuilder('cinemaRoom');
    applyCommonFilters(qb, filters, cinemaRoomFieldMapping);
    const allowedSortFields = ['cinemaRoom.id', 'cinemaRoom.cinema_room_name'];
    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedSortFields,
      'cinemaRoom.id',
    );

    applyPagination(qb, {
      take: filters.take,
      page: filters.page,
    });
    const [cinemaRooms, total] = await qb.getManyAndCount();
    const countResult: { activeCount: number; deletedCount: number } =
      (await this.cinemaRoomRepository
        .createQueryBuilder('cinemaRoom')
        .select([
          `SUM(CASE WHEN cinemaRoom.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
          `SUM(CASE WHEN cinemaRoom.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
        ])
        .getRawOne()) || { activeCount: 0, deletedCount: 0 };

    const activeCount = Number(countResult?.activeCount) || 0;
    const deletedCount = Number(countResult?.deletedCount) || 0;
    return ResponseList.ok(
      buildPaginationResponse(cinemaRooms, {
        total,
        page: filters.page,
        take: filters.take,
        activeCount,
        deletedCount,
      }),
    );
  }

  async findCinemaRoomById(id: number): Promise<CinemaRoom> {
    if (
      id === null ||
      id === undefined ||
      isNaN(id) ||
      typeof id !== 'number'
    ) {
      throw new BadRequestException('Valid ID is required');
    }

    const cinemaRoom = await this.cinemaRoomRepository.findOne({
      where: { id },
    });
    if (!cinemaRoom) {
      throw new NotFoundException(
        `Cinema room with ID ${id} not found`,
        'CINEMA_ROOM_NOT_FOUND',
      );
    }
    return cinemaRoom;
  }

  async updateCinemaRoom(
    id: number,
    dto: UpdateCinemaRoomDto,
  ): Promise<CinemaRoom> {
    await this.cinemaRoomRepository.update(id, dto);
    return this.findCinemaRoomById(id);
  }

  async removeCinemaRoom(id: number): Promise<void> {
    const cinemaRoom = await this.cinemaRoomRepository.findOne({
      where: { id },
      relations: ['schedules', 'schedules.tickets'],
    });
    if (!cinemaRoom) {
      throw new NotFoundException(`Cinema room with ID ${id} not found`, "CINEMA_ROOM_NOT_FOUND");
    }

    const hasFutureTickets = cinemaRoom.schedules.some((schedule) =>
      schedule.tickets.some(
        (ticket) => ticket.status && schedule.start_movie_time > new Date(),
      ),
    );
    if (hasFutureTickets) {
      throw new BadRequestException(
        'Cannot delete cinema room with future tickets',
        "CINEMA_ROOM_HAS_FUTURE_TICKETS",
      );
    }

    await this.cinemaRoomRepository.remove(cinemaRoom);
  }

  async softDeleteCinemaRoom(id: number): Promise<void> {
    const cinemaRoom = await this.cinemaRoomRepository.findOne({
      where: { id },
      relations: ['schedules', 'schedules.tickets'],
    });
    if (!cinemaRoom) {
      throw new NotFoundException(`Cinema Room with ID ${id} not found`, "CINEMA_ROOM_NOT_FOUND");
    }

    const hasFutureTickets = cinemaRoom.schedules.some((schedule) =>
      schedule.tickets.some(
        (ticket) => ticket.status && schedule.start_movie_time > new Date(),
      ),
    );
    if (hasFutureTickets) {
      throw new BadRequestException(
        'Cannot delete cinema room with future tickets',
        "CINEMA_ROOM_HAS_FUTURE_TICKETS",
      );
    }


    await this.cinemaRoomRepository.update(id, { is_deleted: true });
  }

  async restoreCinemaRoom(id: number): Promise<void> {
    const cinemaRoom = await this.cinemaRoomRepository.findOne({
      where: { id },
    });
    if (!cinemaRoom) {
      throw new NotFoundException(`Cinema Room with ID ${id} not found`);
    }
    if (!cinemaRoom.is_deleted) {
      throw new BadRequestException(
        `Cinema Room with ID ${id} is not soft-deleted`,
        'CINEMA_ROOM_NOT_DELETED',
      );
    }
    
    await this.cinemaRoomRepository.update(id, { is_deleted: false });
  }
}
