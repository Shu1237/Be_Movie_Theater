import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ticket } from './ticket';
import { AudienceType } from '@common/enums/audience_type.enum';

@Entity('ticket_type')
export class TicketType {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', nullable: false })
  ticket_name: string;

  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  discount: string;

  @Column({
    type: 'enum',
    enum: AudienceType,
  })
  audience_type: AudienceType;

  @Column({ type: 'varchar', nullable: true })
  ticket_description?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Ticket, (ticket) => ticket.ticketType)
  tickets: Ticket[];
}
