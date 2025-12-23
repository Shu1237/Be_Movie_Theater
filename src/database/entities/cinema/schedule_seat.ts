import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Schedule } from './schedule';
import { Seat } from './seat';
import { StatusSeat } from '@common/enums/status_seat.enum';


@Entity('schedule_seat')
export class ScheduleSeat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: StatusSeat, default: StatusSeat.NOT_YET })
  status: StatusSeat;

  @ManyToOne(() => Schedule, (schedule) => schedule.scheduleSeats)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @ManyToOne(() => Seat, (seat) => seat.scheduleSeats)
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;
}
