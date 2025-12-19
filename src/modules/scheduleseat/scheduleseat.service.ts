import { NotFoundException } from '@common/exceptions/not-found.exception';
import { ScheduleSeat } from '@database/entities/cinema/schedule_seat';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm/repository/Repository';



@Injectable()
export class ScheduleSeatService {
  constructor(
    @InjectRepository(ScheduleSeat)
    private scheduleSeatRepository: Repository<ScheduleSeat>,
  ) {}

  async findSeatByScheduleId(scheduleId: number): Promise<ScheduleSeat[]> {
    const schedule = await this.scheduleSeatRepository.find({
      where: {
        schedule: {
          id: scheduleId,
        },
      },
      relations: ['schedule', 'seat', 'seat.seatType'],
    });
    if (!schedule || schedule.length === 0) {
      throw new NotFoundException(
        `No seats found for schedule with ID ${scheduleId}`,
      );
    }
    return schedule;
  }
}
