import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '@database/entities/order/order';
import { OrderDetail } from '@database/entities/order/order-detail';
import { OrderExtra } from '@database/entities/order/order-extra';
import { Ticket } from '@database/entities/order/ticket';
import { HistoryScore } from '@database/entities/order/history_score';
import { Transaction } from '@database/entities/order/transaction';
import { PaymentMethod } from '@database/entities/order/payment-method';
import { User } from '@database/entities/user/user';
import { Promotion } from '@database/entities/promotion/promotion';
import { Schedule } from '@database/entities/cinema/schedule';
import { ScheduleSeat } from '@database/entities/cinema/schedule_seat';
import { TicketType } from '@database/entities/order/ticket-type';
import { Product } from '@database/entities/item/product';
import { StatusOrder } from '@common/enums/status-order.enum';
import { Method } from '@common/enums/payment-menthod.enum';
import { Role } from '@common/enums/roles.enum';
import { OrderBillType, SeatInfo } from '@common/utils/type';
import { AudienceType } from '@common/enums/audience_type.enum';
import { roundUpToNearest } from '@common/utils/helper';
import { ProductWithTotal } from './order-calculation.service';

export interface CreateOrderData {
  user: User;
  customer: User | null;
  promotion: Promotion;
  totalPrices: string;
  originalTickets: number;
  paymentMethodId: number;
}

export interface CreateTicketData {
  seat: ScheduleSeat;
  schedule: Schedule;
  ticketType: TicketType;
  finalPrice: number;
  order: Order;
  isCashPayment: boolean;
}

export interface CreateOrderExtraData {
  productTotals: ProductWithTotal[];
  order: Order;
  productDiscount: number;
  totalProductBeforePromo: number;
  isPercentage: boolean;
  isCashPayment: boolean;
  unitPriceCalculator: (item: ProductWithTotal) => number;
}

@Injectable()
export class OrderCreationService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(OrderExtra)
    private orderExtraRepository: Repository<OrderExtra>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(HistoryScore)
    private historyScoreRepository: Repository<HistoryScore>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createOrder(data: CreateOrderData): Promise<Order> {
    const newOrder = await this.orderRepository.save({
      total_prices: data.totalPrices,
      original_tickets: data.originalTickets.toString(),
      status:
        Number(data.paymentMethodId as Method) === Method.CASH
          ? StatusOrder.SUCCESS
          : StatusOrder.PENDING,
      user: data.user,
      promotion: data.promotion,
      customer_id: data.customer?.id ?? undefined,
    });

    return newOrder;
  }

  async createTransaction(
    order: Order,
    transactionCode: string,
    totalPrices: string,
    paymentMethod: PaymentMethod,
    paymentMethodId: number,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.save({
      transaction_code: transactionCode,
      transaction_date: new Date(),
      prices: totalPrices,
      status:
        Number(paymentMethodId as Method) === Method.CASH
          ? StatusOrder.SUCCESS
          : StatusOrder.PENDING,
      paymentMethod,
      order,
    });

    return transaction;
  }

  async createTicketsAndOrderDetails(
    orderBillSeats: SeatInfo[],
    scheduleSeats: ScheduleSeat[],
    ticketTypes: TicketType[],
    schedule: Schedule,
    order: Order,
    seatPriceMap: Map<string, number>,
    isCashPayment: boolean,
  ): Promise<void> {
    const ticketsToSave: Ticket[] = [];
    const orderDetails: {
      total_each_ticket: string;
      order: Order;
      ticket: Ticket;
      schedule: Schedule;
    }[] = [];

    for (const seatData of orderBillSeats) {
      const seat = scheduleSeats.find((s) => s.seat.id === seatData.id);
      const ticketType = ticketTypes.find(
        (t) =>
          (t.audience_type as AudienceType) ===
          (seatData.audience_type as AudienceType),
      );
      const finalPrice = seatPriceMap.get(seatData.id)!;

      if (!seat) {
        throw new Error(`Seat ${seatData.id} not found in scheduleSeats`);
      }

      const newTicket = this.ticketRepository.create({
        seat: seat.seat,
        schedule,
        ticketType,
        status: isCashPayment,
        is_used: isCashPayment,
      });

      ticketsToSave.push(newTicket);

      orderDetails.push({
        total_each_ticket: roundUpToNearest(finalPrice, 1000).toString(),
        order: order,
        ticket: newTicket,
        schedule,
      });
    }

    const savedTickets = await this.ticketRepository.save(ticketsToSave);
    orderDetails.forEach((detail, index) => {
      detail.ticket = savedTickets[index];
    });

    await this.orderDetailRepository.save(orderDetails);
  }

  async createOrderExtras(data: CreateOrderExtraData): Promise<void> {
    const orderExtrasToSave: OrderExtra[] = [];

    for (const item of data.productTotals) {
      const unit_price_after_discount = data.unitPriceCalculator(item);

      const newOrderExtraForeachProduct = this.orderExtraRepository.create({
        quantity: item.quantity,
        unit_price: unit_price_after_discount.toString(),
        order: data.order,
        product: item.product,
        status: data.isCashPayment ? StatusOrder.SUCCESS : StatusOrder.PENDING,
      });
      orderExtrasToSave.push(newOrderExtraForeachProduct);
    }

    if (orderExtrasToSave.length > 0) {
      await this.orderExtraRepository.save(orderExtrasToSave);
    }
  }

  async addScoreForUser(
    user: User,
    customer: User | null,
    addScore: number,
    order: Order,
  ): Promise<void> {
    if (customer) {
      // if customer is provided, add score to customer
      if ((customer.role.role_id as Role) !== Role.USER) {
        throw new ForbiddenException(
          'Invalid customer for point accumulation',
        );
      }

      customer.score += addScore;
      await this.userRepository.save(customer);

      await this.historyScoreRepository.save({
        score_change: addScore,
        user: customer,
        order: order,
        created_at: new Date(),
      });
    } else if ((user.role.role_id as Role) === Role.USER) {
      // If no customer is provided and user is USER, add score to user
      user.score += addScore;
      await this.userRepository.save(user);

      await this.historyScoreRepository.save({
        score_change: addScore,
        user: user,
        order: order,
        created_at: new Date(),
      });
    }
  }
}
