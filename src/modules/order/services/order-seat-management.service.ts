import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ScheduleSeat } from '@database/entities/cinema/schedule_seat';
import { StatusSeat } from '@common/enums/status_seat.enum';
import { MyGateWay } from '@common/gateways/seat.gateway';

@Injectable()
export class OrderSeatManagementService {
  constructor(
    @InjectRepository(ScheduleSeat)
    private scheduleSeatRepository: Repository<ScheduleSeat>,
    private readonly gateway: MyGateWay,
  ) {}

  async changeStatusScheduleSeatToBooked(
    seatIds: string[],
    scheduleId: number,
  ): Promise<void> {
    if (!seatIds || seatIds.length === 0) {
      throw new NotFoundException('Seat IDs are required');
    }

    const foundSeats = await this.scheduleSeatRepository.find({
      where: {
        schedule: { id: scheduleId },
        seat: { id: In(seatIds) },
      },
      relations: ['seat', 'schedule'],
    });

    if (!foundSeats || foundSeats.length === 0) {
      throw new NotFoundException('Seats not found for the given schedule');
    }

    for (const seat of foundSeats) {
      seat.status = StatusSeat.BOOKED;
      await this.scheduleSeatRepository.save(seat);
    }
  }

  async updateSeatsStatusToHeld(scheduleSeats: ScheduleSeat[]): Promise<ScheduleSeat[]> {
    const updatedSeats: ScheduleSeat[] = [];
    
    for (const seat of scheduleSeats) {
      seat.status = StatusSeat.HELD;
      updatedSeats.push(seat);
    }
    
    return await this.scheduleSeatRepository.save(updatedSeats);
  }

  emitBookSeat(scheduleId: number, seatIds: string[]): void {
    this.gateway.emitBookSeat({
      schedule_id: scheduleId,
      seatIds: seatIds,
    });
  }

  emitHoldSeat(scheduleId: number, seatIds: string[]): void {
    this.gateway.emitHoldSeat({
      schedule_id: scheduleId,
      seatIds: seatIds,
    });
  }

  emitCancelBookSeat(scheduleId: number, seatIds: string[]): void {
    this.gateway.emitCancelBookSeat({
      schedule_id: scheduleId,
      seatIds: seatIds,
    });
  }
}
