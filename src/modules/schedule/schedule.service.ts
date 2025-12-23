import { applyCommonFilters } from '@common/pagination/applyCommonFilters';
import { applyPagination } from '@common/pagination/applyPagination';
import { SchedulePaginationDto } from '@common/pagination/dto/shedule/schedulePagination.dto';
import { scheduleFieldMapping } from '@common/pagination/fillters/scheduleFieldMapping';
import { buildPaginationResponse } from '@common/pagination/pagination-response';
import { ISchedule } from '@common/utils/type';
import { CinemaRoom } from '@database/entities/cinema/cinema-room';
import { Movie } from '@database/entities/cinema/movie';
import { Schedule } from '@database/entities/cinema/schedule';
import { Version } from '@database/entities/cinema/version';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { applySorting } from '@common/pagination/apply_sort';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,

    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,

    @InjectRepository(CinemaRoom)
    private readonly cinemaRoomRepository: Repository<CinemaRoom>,

    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,
  ) {}
  private getScheduleSummary(schedule: Schedule) {
    return {
      id: schedule.id,
      is_deleted: schedule.is_deleted,
      cinemaRoom: {
        id: schedule.cinemaRoom.id,
        name: schedule.cinemaRoom.cinema_room_name,
      },
      start_movie_time: schedule.start_movie_time,
      end_movie_time: schedule.end_movie_time,
      movie: {
        id: schedule.movie.id,
        name: schedule.movie.name,
      },
      version: schedule.version
        ? {
            id: schedule.version.id,
            name: schedule.version.version_name,
          }
        : null,
    };
  }
  // check version,version of movie, check cinemaroom , check movie time durations
  private async findVersionById(id: number): Promise<Version> {
    const version = await this.versionRepository.findOne({
      where: { id },
    });
    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }
    return version;
  }

  private async findCinemaRoomById(id: number): Promise<CinemaRoom> {
    const cinemaRoom = await this.cinemaRoomRepository.findOne({
      where: { id },
    });
    if (!cinemaRoom) {
      throw new NotFoundException(`Cinema Room with ID ${id} not found`);
    }
    if (cinemaRoom.is_deleted) {
      throw new BadRequestException(
        `Cinema Room with ID ${id} is currently deleted`,
      );
    }
    return cinemaRoom;
  }

  private async findMovieById(id: number): Promise<Movie> {
    const movie = await this.movieRepository.findOne({
      where: { id },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    if (movie.is_deleted) {
      throw new BadRequestException(`Movie with ID ${id} is currently deleted`);
    }
    return movie;
  }

  private async checkScheduleConflict(
    cinemaRoomId: number,
    startTime: Date,
    endTime: Date,
    excludeScheduleId?: number,
  ): Promise<void> {
    const qb = this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.cinemaRoom.id = :cinemaRoomId', { cinemaRoomId })
      .andWhere('schedule.is_deleted = false')
      .andWhere(
        '(schedule.start_movie_time < :endTime AND schedule.end_movie_time > :startTime)',
        { startTime, endTime },
      );

    if (excludeScheduleId) {
      qb.andWhere('schedule.id != :excludeScheduleId', { excludeScheduleId });
    }

    const conflictingSchedule = await qb.getOne();

    if (conflictingSchedule) {
      throw new BadRequestException(
        `Schedule conflict detected. Cinema room is already booked from ${conflictingSchedule.start_movie_time} to ${conflictingSchedule.end_movie_time}`,
      );
    }
  }

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const [version, cinemaRoom, movie] = await Promise.all([
      this.findVersionById(createScheduleDto.version_id),
      this.findCinemaRoomById(createScheduleDto.cinema_room_id),
      this.findMovieById(createScheduleDto.movie_id),
    ]);

    // Validate schedule times
    const startTime = new Date(createScheduleDto.start_movie_time);
    const endTime = new Date(createScheduleDto.end_movie_time);

    if (startTime >= endTime) {
      throw new BadRequestException(
        'Start time must be before end time',
      );
    }

    if (startTime < new Date()) {
      throw new BadRequestException(
        'Start time cannot be in the past',
      );
    }

    // Check for schedule conflicts
    await this.checkScheduleConflict(
      createScheduleDto.cinema_room_id,
      startTime,
      endTime,
    );

    const newSchedule = this.scheduleRepository.create({
      ...createScheduleDto,
      movie,
      cinemaRoom,
      version,
    });

    return await this.scheduleRepository.save(newSchedule);
  }
  async findAllSchedule(
    fillters: SchedulePaginationDto,
  ): Promise<ReturnType<typeof buildPaginationResponse>> {
    const qb = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .leftJoinAndSelect('schedule.cinemaRoom', 'cinemaRoom')
      .leftJoinAndSelect('schedule.version', 'version');

    applyCommonFilters(qb, fillters, scheduleFieldMapping);
    const allowedFields = [
      'schedule.id',
      'movie.name',
      'version.id',
      'schedule.created_at',
    ];
    applySorting(
      qb,
      fillters.sortBy,
      fillters.sortOrder,
      allowedFields,
      'schedule.created_at',
    );

    applyPagination(qb, {
      page: fillters.page,
      take: fillters.take,
    });

    const [schedules, total] = await qb.getManyAndCount();
    const summaries = schedules.map((schedule) =>
      this.getScheduleSummary(schedule),
    );

    const counts: { activeCount: number; deletedCount: number } =
      (await this.scheduleRepository
        .createQueryBuilder('schedule')
        .select([
          `SUM(CASE WHEN schedule.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
          `SUM(CASE WHEN schedule.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
        ])
        .getRawOne()) || { activeCount: 0, deletedCount: 0 };

    const activeCount = Number(counts.activeCount) || 0;
    const deletedCount = Number(counts.deletedCount) || 0;

    // Calculate schedule status counts
    const currentTime = new Date();
    const statusCounts: {
      upcomingCount: number;
      nowPlayingCount: number;
      completedCount: number;
    } = (await this.scheduleRepository
      .createQueryBuilder('schedule')
      .select([
        `SUM(CASE WHEN schedule.start_movie_time > :currentTime AND schedule.is_deleted = false THEN 1 ELSE 0 END) AS upcomingCount`,
        `SUM(CASE WHEN schedule.start_movie_time <= :currentTime AND schedule.end_movie_time >= :currentTime AND schedule.is_deleted = false THEN 1 ELSE 0 END) AS nowPlayingCount`,
        `SUM(CASE WHEN schedule.end_movie_time < :currentTime AND schedule.is_deleted = false THEN 1 ELSE 0 END) AS completedCount`,
      ])
      .setParameters({ currentTime })
      .getRawOne()) || {
      upcomingCount: 0,
      nowPlayingCount: 0,
      completedCount: 0,
    };

    const nowPlayingSchedule = Number(statusCounts.nowPlayingCount) || 0;
    const upComingSchedule = Number(statusCounts.upcomingCount) || 0;
    const completedSchedule = Number(statusCounts.completedCount) || 0;

    return buildPaginationResponse(summaries, {
      total,
      page: fillters.page,
      take: fillters.take,
      activeCount,
      deletedCount,
      nowPlayingSchedule,
      upComingSchedule,
      completedSchedule,
    });
  }

  async findScheduleById(
    id: number,
  ): Promise<ReturnType<typeof this.getScheduleSummary>> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['movie', 'cinemaRoom', 'version'],
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return this.getScheduleSummary(schedule);
  }

  async update(
    id: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<ReturnType<typeof this.getScheduleSummary>> {
    await this.scheduleRepository.update(id, updateScheduleDto);
    return await  this.findScheduleById(id);
   
  }

  async softDelete(id: number): Promise<void> {
    const result = await this.scheduleRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Schedule not found');
    }
  }

  async softDeleteSchedule(id: number): Promise<void> {
    const schedule = await this.findScheduleById(id);
    if (schedule.is_deleted) {
      throw new BadRequestException(`Schedule with ID ${id} is already deleted`, 'SCHEDULE_ALREADY_DELETED');
    }
    await this.scheduleRepository.update(id, { is_deleted: true });
    

   
  }

  async restoreSchedule(
    id: number,
  ): Promise<void> {
    const schedule = await this.findScheduleById(id);
    if (!schedule.is_deleted) {
      throw new BadRequestException(
        `Schedule with ID ${id} is not deleted`,
        'SCHEDULE_NOT_DELETED',
      );
    }
    await this.scheduleRepository.update(id, { is_deleted: false });
  }

  async removeSchedule(id: number): Promise<void> {
    const result = await this.scheduleRepository.delete(id);
  }
}
