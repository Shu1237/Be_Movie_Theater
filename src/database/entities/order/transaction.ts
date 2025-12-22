import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order';
import { PaymentMethod } from './payment-method';
import { StatusOrder } from '@common/enums/status-order.enum';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', nullable: false })
  transaction_code: string;

  @Column({ type: 'date', nullable: false })
  transaction_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  prices: string;

  @Column({
    type: 'enum',
    enum: StatusOrder,
    default: StatusOrder.PENDING,
  })
  status: StatusOrder;

  @ManyToOne(() => Order, (order) => order.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.transactions)
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;
}
