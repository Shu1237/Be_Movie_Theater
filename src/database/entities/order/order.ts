import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../user/user';
import { Promotion } from '../promotion/promotion';
import { OrderDetail } from './order-detail';
import { Transaction } from './transaction';
import { HistoryScore } from './history_score';
import { OrderExtra } from './order-extra';
import { StatusOrder } from '@common/enums/status-order.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_prices: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  original_tickets: string;

  @Column({
    type: 'enum',
    enum: StatusOrder,
    default: StatusOrder.PENDING,
  })
  status: StatusOrder;

  @CreateDateColumn({ type: 'datetime' })
  order_date: Date;

  @Column({ type: 'varchar', length: 256, nullable: true })
  qr_code: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  customer_id: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Promotion, (promotion) => promotion.orders, {
    nullable: true,
  })
  @JoinColumn({ name: 'promotion_id' })
  promotion?: Promotion;

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order, {
    cascade: true,
  })
  orderDetails: OrderDetail[];

  @OneToMany(() => OrderExtra, (orderExtra) => orderExtra.order, {
    cascade: true,
  })
  orderExtras: OrderExtra[];

  @OneToMany(() => Transaction, (transaction) => transaction.order)
  transactions: Transaction[];

  @OneToOne(() => HistoryScore, (historyScore) => historyScore.order, {
    nullable: true,
  })
  historyScore: HistoryScore;
}
