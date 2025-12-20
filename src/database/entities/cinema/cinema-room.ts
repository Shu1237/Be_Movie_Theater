import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Seat } from './seat';
import { Schedule } from './schedule';

@Entity('cinema_room')
export class CinemaRoom {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;
  @Column({ type: 'varchar', nullable: false, length: 100, unique: true })
  cinema_room_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Seat, (seat) => seat.cinemaRoom)
  seats: Seat[];

  @OneToMany(() => Schedule, (schedule) => schedule.cinemaRoom)
  schedules: Schedule[];
}
