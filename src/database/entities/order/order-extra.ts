import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../item/product';
import { Order } from './order';
import { StatusOrder } from '@common/enums/status-order.enum';

@Entity('order_extra')
export class OrderExtra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: string;

  @Column({
    type: 'enum',
    enum: StatusOrder,
    default: StatusOrder.PENDING,
  })
  status: StatusOrder;

  @ManyToOne(() => Order, (order) => order.orderExtras, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
