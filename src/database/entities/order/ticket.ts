import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Schedule } from '../cinema/schedule';
import { Seat } from '../cinema/seat';
import { OrderDetail } from './order-detail';
import { TicketType } from './ticket-type';

@Entity('ticket')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  status: boolean;

  @Column({ default: false })
  is_used: boolean;
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Schedule, (schedule) => schedule.tickets)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @ManyToOne(() => Seat, (seat) => seat.tickets)
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @ManyToOne(() => TicketType, (ticketType) => ticketType.tickets)
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: TicketType;

  @OneToOne(() => OrderDetail, (orderDetail) => orderDetail.ticket)
  orderDetail: OrderDetail;
}
